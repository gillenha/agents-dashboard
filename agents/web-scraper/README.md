# web-scraper agent

Polls the devpigh dashboard for tasks and scrapes web pages using BeautifulSoup. Supports full-page text extraction or targeted CSS selector matching.

## Task format

### Full-page extraction (no selector)

```json
{ "url": "https://example.com" }
```

Result:

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "content": "This domain is for use in illustrative examples ...",
  "selector_used": null,
  "content_length": 183,
  "fetched_at": "2026-03-20T12:00:00.000000+00:00"
}
```

Scripts, styles, nav, and footer elements are stripped before text extraction.

### CSS selector (returns list of matched elements)

```json
{ "url": "https://news.ycombinator.com", "selector": ".titleline > a" }
```

Result:

```json
{
  "url": "https://news.ycombinator.com",
  "title": "Hacker News",
  "content": ["Show HN: ...", "Ask HN: ...", "..."],
  "selector_used": ".titleline > a",
  "content_length": 1024,
  "fetched_at": "2026-03-20T12:00:00.000000+00:00"
}
```

`content` is a list of text strings, one per matched element.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DEVPIGH_API_URL` | Yes | Dashboard API base URL |
| `DEVPIGH_AGENT_NAME` | No | Defaults to `web-scraper` in Docker; set explicitly for local dev |
| `DEVPIGH_AGENT_TYPE` | No | Defaults to `web-scraper` in Docker; set explicitly for local dev |

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
cd agents/web-scraper

# Install SDK and deps (first time only)
pip install -e ../../packages/agent-sdk
pip install -r requirements.txt

# Start the agent
DEVPIGH_API_URL=http://localhost:3001 \
DEVPIGH_AGENT_NAME=web-scraper \
DEVPIGH_AGENT_TYPE=web-scraper \
python main.py
```

The agent registers, appears in the dashboard as **idle**, and polls every 5 seconds.

**3. Create a task**

Full-page scrape:

```bash
curl -X POST http://localhost:3001/api/v1/agents/<ID>/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Scrape example.com", "input": {"url": "https://example.com"}}'
```

CSS selector (HN headlines):

```bash
curl -X POST http://localhost:3001/api/v1/agents/<ID>/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "HN headlines", "input": {"url": "https://news.ycombinator.com", "selector": ".titleline > a"}}'
```

The agent picks it up within 5 seconds, scrapes the page, and reports results. The task appears as **completed** in the dashboard with full output.

## Docker (local)

The Dockerfile must be built from the **repo root** so it can access `packages/agent-sdk`:

```bash
# From repo root
docker build -f agents/web-scraper/Dockerfile -t web-scraper .

docker run --rm \
  -e DEVPIGH_API_URL=http://host.docker.internal:3001 \
  web-scraper
```

Use `host.docker.internal` (Mac/Windows) or `172.17.0.1` (Linux) to reach the host network from inside Docker.

## Cloud Run deployment

**Build and push** (from repo root, amd64 required for Cloud Run):

```bash
IMAGE=us-east1-docker.pkg.dev/harry-gillen-builder/devpigh/web-scraper

docker buildx build \
  --platform linux/amd64 \
  -f agents/web-scraper/Dockerfile \
  -t $IMAGE:latest \
  --push \
  .
```

**Deploy:**

```bash
gcloud run deploy web-scraper \
  --image=$IMAGE:latest \
  --region=us-east1 \
  --set-env-vars="DEVPIGH_API_URL=https://devpigh-368754647823.us-east1.run.app,DEVPIGH_AGENT_NAME=web-scraper,DEVPIGH_AGENT_TYPE=web-scraper" \
  --service-account=devpigh-runner@harry-gillen-builder.iam.gserviceaccount.com \
  --min-instances=1 \
  --max-instances=1 \
  --no-allow-unauthenticated
```

`--min-instances=1` keeps the poll loop alive so the agent always picks up new tasks.
