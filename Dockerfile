# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Enable corepack so pnpm is available
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json  ./packages/shared/package.json
COPY packages/api/package.json     ./packages/api/package.json
COPY packages/dashboard/package.json ./packages/dashboard/package.json

# Install all dependencies (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared   ./packages/shared
COPY packages/api      ./packages/api
COPY packages/dashboard ./packages/dashboard

# Build shared → api → dashboard (root build script already does this in order)
RUN pnpm run build

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json  ./packages/shared/package.json
COPY packages/api/package.json     ./packages/api/package.json

# Install production dependencies only (no dashboard — it's served as static files)
RUN pnpm install --frozen-lockfile --prod --filter api... && \
    pnpm install --frozen-lockfile --prod --filter @devpigh/shared

# Copy compiled artifacts
COPY --from=builder /app/packages/shared/dist  ./packages/shared/dist
COPY --from=builder /app/packages/api/dist     ./packages/api/dist
COPY --from=builder /app/packages/dashboard/dist ./packages/dashboard/dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "packages/api/dist/index.js"]
