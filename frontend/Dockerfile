# syntax=docker/dockerfile:1

ARG BUN_VERSION=1.4.2

# зависимости
FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# сборка в режиме standalone
FROM deps AS build
# rewrites вшиваются на этапе сборки, поэтому адрес бэкенда из сети compose передаём сюда
ARG API_ORIGIN=http://backend:3001
ENV API_ORIGIN=${API_ORIGIN} \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN bun --bun next build

# итоговый образ
FROM oven/bun:${BUN_VERSION}-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=bun:bun /app/.next/standalone ./
COPY --from=build --chown=bun:bun /app/.next/static ./.next/static
COPY --from=build --chown=bun:bun /app/public ./public

USER bun
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD bun -e "fetch('http://127.0.0.1:3000/login').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "server.js"]
