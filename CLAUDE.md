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
- src/simulation.ts runs random state changes every 3-8s for dev (disable for production)

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

## Commands
- `pnpm dev` — starts both API (3001) and dashboard (5173)
- `pnpm --filter api dev` / `pnpm --filter dashboard dev` — individual
