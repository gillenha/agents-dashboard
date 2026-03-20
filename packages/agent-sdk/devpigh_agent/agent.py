"""DevpighAgent base class.

Subclass this and implement process_task(). Call run() to start.

Required environment variables:
    DEVPIGH_API_URL      Base URL of the dashboard API (e.g. http://localhost:3001)
    DEVPIGH_AGENT_NAME   Unique name for this agent instance
    DEVPIGH_AGENT_TYPE   Agent type identifier
"""
import abc
import logging
import os
import signal
import threading
import types

from dotenv import load_dotenv

from .client import DevpighClient

load_dotenv()

logger = logging.getLogger("devpigh.agent")

_LOG_FORMAT = "%(asctime)s %(levelname)s %(message)s"
_LOG_DATE_FMT = "%Y-%m-%dT%H:%M:%S"

_LEVEL_MAP = {
    logging.WARNING: "warn",
    logging.ERROR: "error",
    logging.CRITICAL: "error",
}


class DashboardHandler(logging.Handler):
    """Forwards log records to the dashboard API via send_log().

    Minimum level is INFO — DEBUG records are not forwarded.
    A reentrant guard prevents infinite loops if the HTTP client itself logs.
    """

    def __init__(self, client: "DevpighClient", agent_id: str) -> None:  # noqa: F821
        super().__init__(level=logging.INFO)
        self._client = client
        self._agent_id = agent_id
        self._emitting = False

    def emit(self, record: logging.LogRecord) -> None:
        if self._emitting:
            return
        self._emitting = True
        try:
            level = _LEVEL_MAP.get(record.levelno, "info")
            self._client.send_log(self._agent_id, level, record.getMessage())
        finally:
            self._emitting = False


class DevpighAgent(abc.ABC):
    """Abstract base class for devpigh agents.

    On construction:
    - Reads DEVPIGH_API_URL, DEVPIGH_AGENT_NAME, DEVPIGH_AGENT_TYPE from env
    - Registers with the dashboard (upsert by name) and stores the agent ID

    Call run() to start the heartbeat thread and poll loop. Block until
    SIGINT/SIGTERM is received.
    """

    def __init__(self) -> None:
        # Set up default logging format if no handlers have been configured yet
        if not logging.root.handlers:
            logging.basicConfig(format=_LOG_FORMAT, datefmt=_LOG_DATE_FMT)

        api_url = os.environ["DEVPIGH_API_URL"]
        name = os.environ["DEVPIGH_AGENT_NAME"]
        agent_type = os.environ["DEVPIGH_AGENT_TYPE"]

        self._client = DevpighClient(api_url)
        self._processing = threading.Event()   # set while a task is in process_task()
        self._stop_event = threading.Event()   # set to cleanly exit the poll loop

        logger.info("Registering agent '%s' (type=%s) at %s", name, agent_type, api_url)
        agent = self._client.register(name, agent_type)
        self._agent_id: str = agent["id"]
        logger.info("Registered — agent ID: %s", self._agent_id)

        # Forward future log records to the dashboard in real time
        logging.getLogger("devpigh.agent").addHandler(
            DashboardHandler(self._client, self._agent_id)
        )

    @abc.abstractmethod
    def process_task(self, task: dict) -> dict:
        """Process a queued task and return a result dict.

        Args:
            task: The full task object from the dashboard API.
                  Use task["input"] for the task payload.
                  Use task["id"] to identify the task in logs.

        Returns:
            A dict that will be stored as the task result (task.output).

        Raises:
            Any exception — the base class catches it, reports the task as
            "failed" with str(exception) as the error, and continues polling.
        """

    def run(self) -> None:
        """Start the heartbeat thread and poll loop. Blocks until shutdown."""
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

        heartbeat_thread = threading.Thread(
            target=self._heartbeat_loop,
            daemon=True,
            name="devpigh-heartbeat",
        )
        heartbeat_thread.start()

        logger.info("Entering poll loop (agent %s)", self._agent_id)

        while not self._stop_event.is_set():
            # ── Poll for next task ─────────────────────────────────────────────
            try:
                task = self._client.poll_task(self._agent_id)
            except Exception as exc:
                logger.error("Poll error: %s", exc)
                self._stop_event.wait(timeout=5)
                continue

            if task is None:
                logger.debug("No task queued, sleeping 5s")
                self._stop_event.wait(timeout=5)
                continue

            # ── Process task ───────────────────────────────────────────────────
            logger.info("Task received: %s", task["id"])
            self._processing.set()
            try:
                result = self.process_task(task)
                self._client.report_result(
                    self._agent_id, task["id"], "completed", result=result
                )
                logger.info("Task %s completed", task["id"])
            except Exception as exc:
                logger.error("Task %s failed: %s", task["id"], exc)
                try:
                    self._client.report_result(
                        self._agent_id, task["id"], "failed", error=str(exc)
                    )
                except Exception as report_exc:
                    logger.error(
                        "Failed to report task %s failure: %s", task["id"], report_exc
                    )
            finally:
                self._processing.clear()

        logger.info("Agent stopped")

    # ── Internal ───────────────────────────────────────────────────────────────

    def _heartbeat_loop(self) -> None:
        """Runs in a daemon thread. Sends a heartbeat every 30s."""
        # _stop_event.wait(30) returns True if the event is set (time to stop),
        # False if it timed out (send heartbeat and continue).
        while not self._stop_event.wait(timeout=30):
            status = "busy" if self._processing.is_set() else "idle"
            try:
                self._client.heartbeat(self._agent_id, status=status)
                logger.debug("Heartbeat sent (status=%s)", status)
            except Exception as exc:
                logger.error("Heartbeat error: %s", exc)

    def _handle_signal(
        self, signum: int, frame: types.FrameType | None
    ) -> None:
        logger.info("Signal %d received, stopping poll loop", signum)
        self._stop_event.set()
