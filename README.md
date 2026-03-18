# devpigh

One-sentence description: AI agent management dashboard.

## Prerequisites
- Node.js 18+
- pnpm
- Docker + Docker Compose

## Setup
The exact 5-command sequence from clone to running dashboard.

## Development
- pnpm dev starts both services
- pnpm db:reset for a full database teardown and reseed
- USE_DB=memory pnpm --filter api dev to bypass postgres

## Architecture
Link to CLAUDE.md for full architecture docs. One-paragraph summary: pnpm monorepo, three packages (shared types, Express API with repository pattern, React + Vite dashboard), Postgres via Docker, Socket.io for real-time updates.

