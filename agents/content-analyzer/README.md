# content-analyzer agent

Polls the devpigh dashboard for tasks and analyzes text using Claude (`claude-sonnet-4-20250514`). Accepts arbitrary text and a natural-language instruction — summarize, extract, classify, translate, or anything else Claude can do.

## Task format

```json
{
  "text": "The quick brown fox jumps over the lazy dog.",
  "instruction": "Analyze the sentiment of this text."
}
```

Both fields are required. The agent raises an error if either is missing or empty.

Result stored in `task.output`:

```json
{
  "instruction": "Analyze the sentiment of this text.",
  "input_length": 44,
  "response": "The sentiment of this text is neutral to slightly positive...",
  "response_length": 312,
  "model": "claude-sonnet-4-20250514",
  "usage": {
    "input_tokens": 52,
    "output_tokens": 87
  }
}
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DEVPIGH_API_URL` | Yes | Dashboard API base URL |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — mounted via Secret Manager in prod |
| `DEVPIGH_AGENT_NAME` | No | Defaults to `content-analyzer` in Docker; set explicitly for local dev |
| `DEVPIGH_AGENT_TYPE` | No | Defaults to `content-analyzer` in Docker; set explicitly for local dev |

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
cd agents/content-analyzer

# Install SDK and deps (first time only)
pip install -e ../../packages/agent-sdk
pip install -r requirements.txt

# Start the agent
DEVPIGH_API_URL=http://localhost:3001 \
DEVPIGH_AGENT_NAME=content-analyzer \
DEVPIGH_AGENT_TYPE=content-analyzer \
ANTHROPIC_API_KEY=sk-ant-... \
python main.py
```

The agent registers, appears in the dashboard as **idle**, and polls every 5 seconds.

**3. Create a task**

```bash
curl -X POST http://localhost:3001/api/v1/agents/<ID>/tasks \
  -H "Content-Type: application/json" \
  -d '{"input": {"text": "The quick brown fox jumps over the lazy dog.", "instruction": "Analyze the sentiment of this text."}}'
```

The agent picks it up within 5 seconds, calls Claude, and reports results. The task appears as **completed** in the dashboard with the full Claude response in `output`.

## Docker (local)

The Dockerfile must be built from the **repo root** so it can access `packages/agent-sdk`:

```bash
# From repo root
docker build -f agents/content-analyzer/Dockerfile -t content-analyzer .

docker run --rm \
  -e DEVPIGH_API_URL=http://host.docker.internal:3001 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  content-analyzer
```

Use `host.docker.internal` (Mac/Windows) or `172.17.0.1` (Linux) to reach the host network from inside Docker.

## Cloud Run deployment

**Build and push** (from repo root, amd64 required for Cloud Run):

```bash
IMAGE=us-east1-docker.pkg.dev/harry-gillen-builder/devpigh/content-analyzer

docker buildx build \
  --platform linux/amd64 \
  -f agents/content-analyzer/Dockerfile \
  -t $IMAGE:latest \
  --push \
  .
```

**Store the API key in Secret Manager** (one-time setup):

```bash
echo -n "sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-
# Grant the runner SA access:
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:devpigh-runner@harry-gillen-builder.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Deploy:**

```bash
gcloud run deploy content-analyzer \
  --image=$IMAGE:latest \
  --region=us-east1 \
  --set-env-vars="DEVPIGH_API_URL=https://devpigh-368754647823.us-east1.run.app,DEVPIGH_AGENT_NAME=content-analyzer,DEVPIGH_AGENT_TYPE=content-analyzer" \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest" \
  --service-account=devpigh-runner@harry-gillen-builder.iam.gserviceaccount.com \
  --min-instances=1 \
  --max-instances=1 \
  --no-allow-unauthenticated
```

`--min-instances=1` keeps the poll loop alive so the agent always picks up new tasks.
