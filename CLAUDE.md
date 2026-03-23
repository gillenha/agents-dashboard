# devpigh - AI Agent Management Dashboard

## Architecture
- pnpm monorepo: packages/shared, packages/api, packages/dashboard
- API: Express + TypeScript, repository pattern for data access
- Dashboard: React 18 + Vite + CSS Modules (NO component libraries, NO Tailwind)
- Shared types imported by both api and dashboard

## Design System (STRICT)
- Sidebar: #0A0A0A | Content bg: #FAFAFA | Cards: #FFFFFF
- Accent (only one): #2A9D8F — used for active states, primary buttons, links
- Borders: #E5E5E5 | Text: #111 primary, #555 secondary, #999 tertiary
- Font: Inter | Body 14px, labels 12px, page titles 20px, table headers 11px uppercase tracking-wide
- Card shadow: 0 1px 3px rgba(0,0,0,0.08) with 1px border
- Status badges: subtle pastel backgrounds, never saturated

## Component Rules
- ALL reusable UI lives in packages/dashboard/src/components/ with barrel export from components/index.ts
- Import shared components via: import { ComponentName } from '@/components'
- Path alias @ maps to packages/dashboard/src/ (configured in vite.config.ts and tsconfig.json)
- Shared components: Layout (with Sidebar, TopBar), StatusBadge, MetricCard
- Every shared component exports a named props interface (e.g., StatusBadgeProps)
- Every component gets its own directory: ComponentName/index.tsx + ComponentName.module.css
- Page-specific components go in packages/dashboard/src/pages/<PageName>/components/
- Page files live at packages/dashboard/src/pages/<PageName>/index.tsx
- Before creating any new component, check components/index.ts to see if one exists that can be extended

## CSS Rules
- CSS Modules only. No inline styles. No global styles except variables and resets.
- All design tokens defined in src/styles/variables.css (120+ custom properties)
- Global resets in src/styles/reset.css
- Both imported in main.tsx before any other styles
- NEVER hardcode hex values, px font sizes, spacing, shadows, or border-radius in .module.css files — always use var()
- Spacing scale: --space-0-5 (2px) through --space-12 (48px) in 4px increments
- Color tokens organized by role: sidebar, surface, accent, border, text hierarchy, status badges

## Real-time Layer
- Socket.io server attached to Express http server in packages/api
- Event types defined in packages/shared/src/events.ts
- Server events: agent:status, task:update, log:new, dashboard:summary (every 5s)
- Client events: agent:subscribe, agent:unsubscribe (room-based filtering)
- Repositories emit events on data changes via setIO() injection
- simulation.ts runs random state changes every 3-8s for dev — disabled when NODE_ENV=production (guarded in index.ts)

## Dashboard Hooks
- useSocket() — from SocketContext, returns socket instance + connection status
- useAgentUpdates(agentId?) — live agent status map
- useTaskUpdates(agentId?) — live task updates
- useLogStream(agentId?) — buffered last 100 logs
- useDashboardSummary() — REST seed + WebSocket live updates
- All hooks in packages/dashboard/src/hooks/

## Database
- PostgreSQL 16 via Docker Compose (docker-compose.yml at root)
- Connection pool in packages/api/src/db/pool.ts (reads DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
- Schema: packages/api/src/db/schema.sql | Seed: packages/api/src/db/seed.sql
- Postgres repos in packages/api/src/repositories/postgres/
- In-memory repos still in packages/api/src/repositories/in-memory/
- Composition root: packages/api/src/repositories/index.ts — USE_DB env var (default: "postgres", fallback: "memory")
- simulation.ts uses repository interfaces, works with both backends

## Dev Commands
- pnpm dev — starts API (3001) + dashboard (5173)
- pnpm db:up / db:down — start/stop postgres container
- pnpm db:init — run schema + seed
- pnpm db:reset — full teardown and reseed
- USE_DB=memory pnpm --filter api dev — bypass postgres

## API Patterns
- All routes versioned under /api/v1/
- Data access only through repository interfaces (never direct store access in routes)
- Pagination: { page, limit } query params, response wraps in { data, total, page, limit }
- Repositories receive Socket.io server via setIO() to emit events on data changes
- Vite proxy forwards both /api and /socket.io (with ws: true) to port 3001

## Agent API (agent-facing endpoints)
- Routes in packages/api/src/routes/v1/agentApi.ts, mounted before CRUD router
- POST /api/v1/agents/register — upsert by name, returns full agent object
- POST /api/v1/agents/:id/heartbeat — refreshes last_heartbeat, optional status
- POST /api/v1/agents/:id/tasks/poll — atomic dequeue (FOR UPDATE SKIP LOCKED in postgres), 204 if empty
- POST /api/v1/agents/:id/tasks/:taskId/result — updates task + resets agent to idle
- Heartbeat monitor: 30s interval, marks agents offline after 90s no heartbeat, uses repo interface
- Shared types: AgentRegisterRequest/Response, HeartbeatRequest/Response, TaskPollResponse, TaskResultRequest/Response
- Repository additions: findByName(name), findStale(olderThan) on IAgentRepository; pollNext(agentId) on ITaskRepository

## Agent SDK (packages/agent-sdk/)
- Python package: devpigh-agent (pip-installable from local path)
- DevpighAgent ABC: auto-registers, heartbeat thread (30s), task poll loop (5s idle sleep)
- Heartbeat sends "busy" during process_task via threading.Event flag
- Subclasses implement process_task(task) -> dict
- DevpighClient: retry 3x with backoff on 5xx/connection errors, no retry on 4xx
- Config via env vars: DEVPIGH_API_URL, DEVPIGH_AGENT_NAME, DEVPIGH_AGENT_TYPE
- SIGINT/SIGTERM: sets stop event, poll loop exits next iteration

## Health Checker Agent (agents/health-checker/)
- First agent, subclasses DevpighAgent from packages/agent-sdk
- Processes tasks with input: { urls: string[] }
- Returns: { results: [{ url, status_code, response_time_ms, healthy }] }
- Dockerfile builds from repo root: docker build -f agents/health-checker/Dockerfile -t health-checker .
- Deployed to Cloud Run as `health-checker` service (us-east1)
  - Service URL: https://health-checker-368754647823.us-east1.run.app
  - --min-instances=1 (persistent poll loop, can't scale to zero)
  - --max-instances=1 (prevents duplicate agent registrations)
  - --no-allow-unauthenticated (outbound-only worker, no inbound HTTP traffic)
  - Uses devpigh-runner SA
- Manual deploy: build from repo root, push, deploy:
  docker buildx build --platform linux/amd64 -f agents/health-checker/Dockerfile -t us-east1-docker.pkg.dev/harry-gillen-builder/devpigh/health-checker:latest .
  docker push us-east1-docker.pkg.dev/harry-gillen-builder/devpigh/health-checker:latest
  gcloud run deploy health-checker --region=us-east1 --image=us-east1-docker.pkg.dev/harry-gillen-builder/devpigh/health-checker:latest- Task creation: POST /api/v1/agents/:id/tasks with { title, input }

## Web Scraper Agent (agents/web-scraper/)
- Second agent, subclasses DevpighAgent from packages/agent-sdk
- Processes tasks with input: { url: string, selector?: string }
- Without selector: returns page title + full visible text (scripts/styles/nav/footer stripped)
- With selector: returns list of matched element text
- Returns: { url, title, content, selector_used, content_length, fetched_at }
- Uses verify=False for SSL (Cloud Run cert bundle issue with outbound HTTPS)
- Deployed to Cloud Run as `web-scraper` service (us-east1), same config as health-checker

## Content Analyzer Agent (agents/content-analyzer/)
- Third agent, Claude-powered via Anthropic Python SDK
- Processes tasks with input: { text: string, instruction: string }
- Returns: { instruction, input_length, response, response_length, model, usage }
- Uses claude-sonnet-4-20250514, ANTHROPIC_API_KEY from Secret Manager
- Deployed to Cloud Run as `content-analyzer` service with --set-secrets=ANTHROPIC_API_KEY=anthropic-api-key:latest

## Orchestrator Agent (agents/orchestrator/)
- Fourth agent, chains health-checker → web-scraper → content-analyzer
- Processes tasks with input: { url: string, instruction: string }
- Delegates to each agent in sequence using SDK's delegate_task() method
- Returns combined result with steps.health_check, steps.scrape, steps.analysis, and final_response
- Graceful partial failure: if any step fails, returns what it has with error details
- No API keys of its own — delegates to content-analyzer for Claude access
- Deployed to Cloud Run as `orchestrator` service, same config as health-checker

## Worker Agent Pattern (Cloud Run)
- Cloud Run requires containers to listen on an HTTP port for startup health checks
- Worker agents (poll-loop, no inbound traffic) must run a minimal HTTP server on $PORT
- Pattern: start a background thread with http.server.HTTPServer returning 200 on GET, before calling agent.run()
- Without this, Cloud Run deploy hangs waiting for the port and eventually times out
- All agents using outbound HTTPS to external sites need verify=False on requests.get() (Cloud Run cert bundle issue)
- Suppress warnings with: urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

## Agent Delegation (inter-agent communication)
- SDK methods: delegate_task(agent_name, task_input, timeout, poll_interval)
- Client methods: find_agent_by_name(name), create_task(agent_id, input), get_task(task_id)
- API endpoints: GET /api/v1/agents/by-name/:name, GET /api/v1/tasks/:taskId
- Agents look up other agents by name, create tasks, poll for completion
- No Pub/Sub needed yet — delegation is synchronous via API polling

## Production / Docker
- Dockerfile at repo root: multi-stage build (node:20-alpine builder → lean production image)
- Builder installs all deps, runs `pnpm run build` (shared → api → dashboard)
- Production stage: prod deps only for api, copies compiled dist artifacts
- `NODE_ENV=production` causes Express to serve `packages/dashboard/dist` via express.static
- Catch-all GET route returns `index.html` for client-side routing (after all /api routes)
- Static files path resolved via `path.join(__dirname, '../../dashboard/dist')` from api dist
- Port: 8080 (Cloud Run default, set via PORT env var)
- Cloud SQL Unix socket: if `DB_HOST` starts with `/`, pool omits the port (node-postgres handles natively)
- `.dockerignore` excludes node_modules, dist, .env files — does NOT exclude packages/*/src/ (builder stage needs source to compile)
- Cross-platform build (required on M-series Macs — arm64 by default, Cloud Run needs amd64):
  `docker buildx build --platform linux/amd64 -t devpigh --load .`
- buildx requires `"cliPluginsExtraDirs": ["/opt/homebrew/lib/docker/cli-plugins"]` in `~/.docker/config.json`
- Run locally: `docker run -p 8080:8080 -e DB_HOST=... -e DB_USER=... -e DB_PASSWORD=... -e DB_NAME=... devpigh`

## GCP Infrastructure
- Stack: Cloud Run (service) + Cloud SQL Postgres 16 (devpigh-db, us-east1) + Artifact Registry (devpigh repo) + Cloud Build (CI) + Secret Manager
- Cloud SQL instance connection name: `harry-gillen-builder:us-east1:devpigh-db`
- Cloud Run connects via Unix socket: `DB_HOST=/cloudsql/harry-gillen-builder:us-east1:devpigh-db`
- Service account: `devpigh-runner@harry-gillen-builder.iam.gserviceaccount.com`
  - roles/cloudsql.client — Unix socket access to Cloud SQL
  - roles/run.invoker — invoke other Cloud Run services
  - roles/secretmanager.secretAccessor — read DB password secret
- Cloud SQL created with `--assign-ip --edition=enterprise` (not `--no-assign-ip`; private-only IP requires VPC peering which isn't set up)
- Cloud Run reserves the `PORT` env var — do NOT include it in `--set-env-vars` (causes deploy error)
- Service URL: https://devpigh-368754647823.us-east1.run.app
- DB password stored in Secret Manager as `devpigh-db-password`, mounted via `--set-secrets`
- Local Cloud SQL access: Cloud SQL Auth Proxy on localhost:5432, then psql normally
  - Prerequisite: `gcloud auth application-default login` before first proxy use
  - psql: `brew install libpq` (adds psql without full Postgres)
- Full setup reference: `infra/gcp-setup.sh` (read section by section — not a blind-run script)
- psql path (brew install libpq): /opt/homebrew/opt/libpq/bin/psql (add to PATH or use full path)

## CI / CD
- Pipeline config: `cloudbuild.yaml` at repo root — triggered on every push to `main`
- Step 1 **build**: `docker buildx build --platform linux/amd64 --load` — tags `:$COMMIT_SHA` and `:latest`
- Step 2 **push**: pushes both tags to Artifact Registry (`--all-tags`)
- Step 3 **deploy**: `gcloud run deploy` using the immutable `:$COMMIT_SHA` tag (never `:latest` for deploys)
- Substitution variable defaults (override per-trigger or per-manual-run):
  - `_REGION`: us-east1
  - `_SERVICE_NAME`: devpigh
  - `_INSTANCE_CONNECTION_NAME`: harry-gillen-builder:us-east1:devpigh-db
  - `_REPO`: devpigh/dashboard (full registry path: `us-east1-docker.pkg.dev/$PROJECT_ID/$_REPO`)
- Trigger setup: `infra/setup-trigger.sh` — requires one-time GitHub OAuth in GCP console before running
- Trigger manually: `gcloud builds submit --config cloudbuild.yaml .`
- View build logs: GCP console → Cloud Build → History, or `gcloud builds list --region=us-east1`
- Cloud Build SA needs `roles/run.admin` and `roles/iam.serviceAccountUser` on `devpigh-runner` to deploy
- Build trigger: `ai-agents-dash-build-trigger` (region: global, autodetect: true)
- Trigger SA: `github-deployer@harry-gillen-builder.iam.gserviceaccount.com`
  - roles/artifactregistry.writer on devpigh repo
  - roles/run.admin on devpigh service
  - roles/iam.serviceAccountUser on devpigh-runner SA
- Manual submit requires COMMIT_SHA: `gcloud builds submit --config cloudbuild.yaml --region=us-east1 --substitutions=COMMIT_SHA=$(git rev-parse HEAD) .`

## Commands
- `pnpm dev` — starts both API (3001) and dashboard (5173)
- `pnpm --filter api dev` / `pnpm --filter dashboard dev` — individual
