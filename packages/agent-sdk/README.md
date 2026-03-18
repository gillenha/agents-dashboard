# devpigh-agent

Python base class for agents that connect to the devpigh dashboard. Handles registration, heartbeats, task polling, and result reporting — subclass it and implement `process_task()`.

## Installation

```bash
pip install -e packages/agent-sdk
```

## Usage

```python
from devpigh_agent import DevpighAgent

class MyAgent(DevpighAgent):
    def process_task(self, task: dict) -> dict:
        payload = task["input"]
        # ... do work ...
        return {"message": "done", "processed": payload}

if __name__ == "__main__":
    agent = MyAgent()
    agent.run()  # blocks; Ctrl-C or SIGTERM to stop
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DEVPIGH_API_URL` | Yes | Base URL of the dashboard API (e.g. `http://localhost:3001`) |
| `DEVPIGH_AGENT_NAME` | Yes | Unique name for this agent instance (used for upsert on restart) |
| `DEVPIGH_AGENT_TYPE` | Yes | Agent type identifier shown in the dashboard |

Variables can be set in a `.env` file in the working directory — `python-dotenv` loads it automatically.

## Behaviour

- **Registration**: on `__init__`, the agent registers with the dashboard. If an agent with the same name already exists, it is reactivated (status reset to `idle`).
- **Heartbeat**: a daemon thread sends a heartbeat every 30 seconds. Status is `busy` while `process_task()` is executing, `idle` otherwise.
- **Poll loop**: `run()` polls for queued tasks every 5 seconds. When a task is received it is processed synchronously; the loop resumes immediately after (no sleep).
- **Retry**: HTTP requests retry up to 3 times on connection errors or 5xx responses (1s → 2s → 4s backoff). 4xx responses are not retried.
- **Shutdown**: SIGINT or SIGTERM stops the poll loop cleanly. The heartbeat monitor in the dashboard marks the agent offline after 90 seconds with no heartbeat.

## Logging

Uses the standard `logging` module under the `devpigh.agent` logger. Configure with `logging.basicConfig()` before creating the agent, or let the agent apply the default format (`timestamp level message`).
