"""HTTP client for the devpigh dashboard API.

Wraps requests with automatic retry on connection errors and 5xx responses
(exponential backoff: 1s, 2s, 4s). 4xx responses are returned immediately —
callers should call raise_for_status() if needed.
"""
import time
import logging
from typing import Any

import requests

logger = logging.getLogger("devpigh.agent")

_BACKOFF = [1, 2, 4]  # seconds between retries
_MAX_RETRIES = 3
_TIMEOUT = 10  # seconds per request


class DevpighClient:
    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})

    def _request(self, method: str, path: str, **kwargs: Any) -> requests.Response:
        url = f"{self._base_url}{path}"
        resp: requests.Response | None = None

        for attempt in range(_MAX_RETRIES):
            try:
                resp = self._session.request(method, url, timeout=_TIMEOUT, **kwargs)
            except (requests.ConnectionError, requests.Timeout) as exc:
                if attempt < _MAX_RETRIES - 1:
                    wait = _BACKOFF[attempt]
                    logger.warning(
                        "Connection error (attempt %d/%d), retrying in %ds: %s",
                        attempt + 1, _MAX_RETRIES, wait, exc,
                    )
                    time.sleep(wait)
                    continue
                raise

            if resp.status_code < 500:
                # Success or 4xx — return immediately, no retry
                return resp

            # 5xx — retry if attempts remain
            if attempt < _MAX_RETRIES - 1:
                wait = _BACKOFF[attempt]
                logger.warning(
                    "Server error %d (attempt %d/%d), retrying in %ds",
                    resp.status_code, attempt + 1, _MAX_RETRIES, wait,
                )
                time.sleep(wait)

        # All retries exhausted on 5xx — return so caller can raise_for_status()
        assert resp is not None
        return resp

    def register(self, name: str, agent_type: str, metadata: dict | None = None) -> dict:
        """POST /api/v1/agents/register — upserts by name, returns the agent dict."""
        payload: dict[str, Any] = {"name": name, "type": agent_type}
        if metadata:
            payload["metadata"] = metadata
        resp = self._request("POST", "/api/v1/agents/register", json=payload)
        resp.raise_for_status()
        return resp.json()  # type: ignore[no-any-return]

    def heartbeat(self, agent_id: str, status: str = "idle") -> None:
        """POST /api/v1/agents/{id}/heartbeat — keeps the agent alive."""
        resp = self._request(
            "POST", f"/api/v1/agents/{agent_id}/heartbeat", json={"status": status}
        )
        resp.raise_for_status()

    def poll_task(self, agent_id: str) -> dict | None:
        """POST /api/v1/agents/{id}/tasks/poll — returns next queued task or None."""
        resp = self._request("POST", f"/api/v1/agents/{agent_id}/tasks/poll")
        if resp.status_code == 204:
            return None
        resp.raise_for_status()
        return resp.json()  # type: ignore[no-any-return]

    def report_result(
        self,
        agent_id: str,
        task_id: str,
        status: str,
        result: dict | None = None,
        error: str | None = None,
    ) -> dict:
        """POST /api/v1/agents/{id}/tasks/{taskId}/result — report task outcome."""
        payload: dict[str, Any] = {"status": status}
        if result is not None:
            payload["result"] = result
        if error is not None:
            payload["error"] = error
        resp = self._request(
            "POST", f"/api/v1/agents/{agent_id}/tasks/{task_id}/result", json=payload
        )
        resp.raise_for_status()
        return resp.json()  # type: ignore[no-any-return]
