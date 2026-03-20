# Build context must be the repo root, not this directory.
# Run: docker build -f agents/web-scraper/Dockerfile -t web-scraper .

FROM python:3.12-slim

WORKDIR /app

# Install the devpigh-agent SDK from the monorepo source.
# The build context (repo root) provides access to packages/agent-sdk.
COPY packages/agent-sdk /tmp/agent-sdk
RUN pip install --no-cache-dir /tmp/agent-sdk

# Install agent-specific dependencies
COPY agents/web-scraper/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent source
COPY agents/web-scraper/main.py .

# Static config — DEVPIGH_API_URL must be provided at runtime
ENV DEVPIGH_AGENT_NAME=web-scraper
ENV DEVPIGH_AGENT_TYPE=web-scraper

CMD ["python", "main.py"]
