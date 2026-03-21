# Build context must be the repo root, not this directory.
# Run: docker build -f agents/orchestrator/Dockerfile -t orchestrator .

FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install the devpigh-agent SDK from the monorepo source.
# The build context (repo root) provides access to packages/agent-sdk.
COPY packages/agent-sdk /tmp/agent-sdk
RUN pip install --no-cache-dir /tmp/agent-sdk

# Install agent-specific dependencies (none beyond the SDK)
COPY agents/orchestrator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent source
COPY agents/orchestrator/main.py .

# Static config — DEVPIGH_API_URL must be provided at runtime
ENV DEVPIGH_AGENT_NAME=orchestrator
ENV DEVPIGH_AGENT_TYPE=orchestrator

CMD ["python", "main.py"]
