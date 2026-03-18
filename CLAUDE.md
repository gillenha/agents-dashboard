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
- ALL reusable UI lives in packages/dashboard/src/components/
- Before creating any new component, check if one exists that can be extended
- Shared components: DataTable, StatusBadge, MetricCard, Card, Tabs, PageHeader, FilterPills
- Page-specific components go in packages/dashboard/src/pages/<PageName>/components/
- Every component gets its own directory: ComponentName/index.tsx + ComponentName.module.css

## CSS Rules
- CSS Modules only. No inline styles. No global styles except variables and resets.
- All color values come from CSS custom properties defined in src/styles/variables.css
- Never hardcode hex values in component CSS files
- Spacing scale: 4px increments (4, 8, 12, 16, 24, 32, 48)

## API Patterns
- All routes versioned under /api/v1/
- Data access only through repository interfaces (never direct store access in routes)
- Pagination: { page, limit } query params, response wraps in { data, total, page, limit }

## Commands
- `pnpm dev` — starts both API (3001) and dashboard (5173)
- `pnpm --filter api dev` / `pnpm --filter dashboard dev` — individual
