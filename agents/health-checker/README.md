# health-checker agent

Polls the devpigh dashboard for tasks and performs HTTP health checks against a list of URLs. Reports back per-URL status code, response time, and whether the endpoint is healthy (2xx).

## Task format

Create a task assigned to this agent with the following input:

```json
{
  "urls": [
    "https://google.com",
    "https://httpstat.us/500",
    "https://httpstat.us/200?sleep=2000"
  ]
}
```

Result stored in `task.output`:

```json
{
  "results": [
    { "url": "https://google.com",             "status_code": 200, "response_time_ms": 87,  "healthy": true  },
    { "url": "https://httpstat.us/500",         "status_code": 500, "response_time_ms": 210, "healthy": false },
    { "url": "https://httpstat.us/200?sleep=2000", "status_code": 200, "response_time_ms": 2103, "healthy": true  }
  ]
}
```

On connection error or timeout, `status_code` is `null` and an `error` field is included.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DEVPIGH_API_URL` | Yes | Dashboard API base URL |
| `DEVPIGH_AGENT_NAME` | No | Defaults to `health-checker` in Docker; set explicitly for local dev |
| `DEVPIGH_AGENT_TYPE` | No | Defaults to `health-checker` in Docker; set explicitly for local dev |

## Running locally

**1. Start the dashboard**

```bash
# From repo root — with postgres:
pnpm db:up && pnpm db:init && pnpm dev

# Or with in-memory store (no Docker needed):
USE_DB=memory pnpm --filter api dev
```

**2. Run the agent**

```bash
cd agents/health-checker

# Install SDK and deps (first time only)
pip install -e ../../packages/agent-sdk
pip install -r requirements.txt

# Start the agent
DEVPIGH_API_URL=http://localhost:3001 \
DEVPIGH_AGENT_NAME=health-checker \
DEVPIGH_AGENT_TYPE=health-checker \
python main.py
```

The agent registers, appears in the dashboard as **idle**, and polls every 5 seconds.

**3. Create a task**

In the dashboard UI, navigate to the health-checker agent and create a task with input:

```json
{ "urls": ["https://google.com", "https://httpstat.us/500"] }
```

The agent picks it up within 5 seconds, runs the checks, and reports results. The task appears as **completed** in the dashboard with full results in `output`.

## Docker (local)

The Dockerfile must be built from the **repo root** so it can access `packages/agent-sdk`:

```bash
# From repo root
docker build -f agents/health-checker/Dockerfile -t health-checker .

docker run --rm \
  -e DEVPIGH_API_URL=http://host.docker.internal:3001 \
  health-checker
```

Use `host.docker.internal` (Mac/Windows) or `172.17.0.1` (Linux) to reach the host network from inside Docker.

## Cloud Run deployment

**Build and push** (from repo root, amd64 required for Cloud Run):

```bash
IMAGE=us-east1-docker.pkg.dev/harry-gillen-builder/devpigh/health-checker

docker buildx build \
  --platform linux/amd64 \
  -f agents/health-checker/Dockerfile \
  -t $IMAGE:latest \
  --push \
  .
```

**Deploy:**

```bash
gcloud run deploy health-checker \
  --image=$IMAGE:latest \
  --region=us-east1 \
  --set-env-vars="DEVPIGH_API_URL=https://devpigh-368754647823.us-east1.run.app,DEVPIGH_AGENT_NAME=health-checker,DEVPIGH_AGENT_TYPE=health-checker" \
  --service-account=devpigh-runner@harry-gillen-builder.iam.gserviceaccount.com \
  --min-instances=1 \
  --max-instances=1 \
  --no-allow-unauthenticated
```

**`--min-instances=1` is important.** This agent runs a persistent poll loop — if the instance scales to zero, it stops polling and never picks up tasks. Two options:

| Approach | Tradeoff |
|---|---|
| `--min-instances=1` | Always-on, small cost (~$5–10/month for the minimum instance) |
| Cloud Run Jobs (triggered externally) | Scales to zero, but requires a separate scheduler (Cloud Scheduler) to trigger polling batches — more complex |

For a single low-traffic agent, `--min-instances=1` is the simplest and most reliable choice.
