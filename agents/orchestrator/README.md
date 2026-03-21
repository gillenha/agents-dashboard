# orchestrator agent

Chains the three other agents together in sequence. Given a URL and an instruction, it:

1. **Health-checks** the URL via the `health-checker` agent — aborts if the site is down
2. **Scrapes** the page via the `web-scraper` agent — aborts if content is too short (<50 chars)
3. **Analyzes** the scraped text via the `content-analyzer` agent — returns Claude's response

This agent does no work itself. It delegates every step using `DevpighAgent.delegate_task()`.

## Prerequisites

All three target agents must be running and registered with the dashboard before giving the orchestrator a task:

```bash
# Terminal 2 — health-checker
cd agents/health-checker
DEVPIGH_API_URL=http://localhost:3001 DEVPIGH_AGENT_NAME=health-checker DEVPIGH_AGENT_TYPE=health-checker python main.py

# Terminal 3 — web-scraper
cd agents/web-scraper
DEVPIGH_API_URL=http://localhost:3001 DEVPIGH_AGENT_NAME=web-scraper DEVPIGH_AGENT_TYPE=web-scraper python main.py

# Terminal 4 — content-analyzer
cd agents/content-analyzer
DEVPIGH_API_URL=http://localhost:3001 DEVPIGH_AGENT_NAME=content-analyzer DEVPIGH_AGENT_TYPE=content-analyzer ANTHROPIC_API_KEY=sk-ant-... python main.py
```

The orchestrator has no API keys of its own. The `content-analyzer` holds the `ANTHROPIC_API_KEY`.

## Task format

```json
{
  "url": "https://example.com",
  "instruction": "Summarize this page in 3 bullet points."
}
```

Both fields are required.

### Result (all steps succeeded)

```json
{
  "url": "https://example.com",
  "instruction": "Summarize this page in 3 bullet points.",
  "steps": {
    "health_check": {
      "healthy": true,
      "status_code": 200,
      "response_time_ms": 87
    },
    "scrape": {
      "title": "Example Domain",
      "content_length": 1256,
      "fetched_at": "2026-03-20T12:00:00+00:00"
    },
    "analysis": {
      "response": "• Example Domain is a placeholder domain...",
      "model": "claude-sonnet-4-20250514",
      "usage": { "input_tokens": 312, "output_tokens": 128 }
    }
  },
  "final_response": "• Example Domain is a placeholder domain..."
}
```

### Result (partial failure — content-analyzer stopped)

If a step fails, it gets an `"error"` key instead of its normal fields. Completed steps are still returned.

```json
{
  "url": "https://example.com",
  "instruction": "Summarize this page in 3 bullet points.",
  "steps": {
    "health_check": { "healthy": true, "status_code": 200, "response_time_ms": 87 },
    "scrape": { "title": "Example Domain", "content_length": 1256, "fetched_at": "..." },
    "analysis": { "error": "Agent 'content-analyzer' is not ready (status=offline)" }
  }
}
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DEVPIGH_API_URL` | Yes | Dashboard API base URL |
| `DEVPIGH_AGENT_NAME` | No | Defaults to `orchestrator` in Docker; set explicitly for local dev |
| `DEVPIGH_AGENT_TYPE` | No | Defaults to `orchestrator` in Docker; set explicitly for local dev |

## Running locally

**1. Start the dashboard**

```bash
# From repo root (in-memory store, no Docker needed):
USE_DB=memory pnpm --filter api dev
```

**2. Start all four agents** (separate terminals — see Prerequisites above)

**3. Start the orchestrator**

```bash
cd agents/orchestrator

# Install SDK (first time only)
pip install -e ../../packages/agent-sdk

# Start the agent (no extra deps needed)
DEVPIGH_API_URL=http://localhost:3001 \
DEVPIGH_AGENT_NAME=orchestrator \
DEVPIGH_AGENT_TYPE=orchestrator \
python main.py
```

**4. Create a task**

```bash
curl -X POST http://localhost:3001/api/v1/agents/<ID>/tasks \
  -H "Content-Type: application/json" \
  -d '{"input": {"url": "https://example.com", "instruction": "Summarize this page in 3 bullet points."}}'
```

The orchestrator picks it up, delegates all three steps in order (~10–30s total), and reports the combined result.

**Testing partial failure:** Stop the `content-analyzer` and create another task. The orchestrator will complete the health-check and scrape steps, then return an error for the analysis step instead of crashing.

## Docker (local)

```bash
# From repo root
docker build -f agents/orchestrator/Dockerfile -t orchestrator .

docker run --rm \
  -e DEVPIGH_API_URL=http://host.docker.internal:3001 \
  orchestrator
```

## Cloud Run deployment

**Build and push** (from repo root, amd64 required for Cloud Run):

```bash
IMAGE=us-east1-docker.pkg.dev/harry-gillen-builder/devpigh/orchestrator

docker buildx build \
  --platform linux/amd64 \
  -f agents/orchestrator/Dockerfile \
  -t $IMAGE:latest \
  --push \
  .
```

**Deploy:**

```bash
gcloud run deploy orchestrator \
  --image=$IMAGE:latest \
  --region=us-east1 \
  --set-env-vars="DEVPIGH_API_URL=https://devpigh-368754647823.us-east1.run.app,DEVPIGH_AGENT_NAME=orchestrator,DEVPIGH_AGENT_TYPE=orchestrator" \
  --service-account=devpigh-runner@harry-gillen-builder.iam.gserviceaccount.com \
  --min-instances=1 \
  --max-instances=1 \
  --no-allow-unauthenticated
```
