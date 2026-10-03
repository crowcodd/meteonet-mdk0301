# syntax=docker/dockerfile:1

ARG BUN_VERSION=1.4.2

# все зависимости вместе с dev, без них не запустится prisma generate
FROM oven/bun:${BUN_VERSION}-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# генерируем prisma client
FROM deps AS build
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
RUN bunx --bun prisma generate

# только то, что нужно в проде
FROM oven/bun:${BUN_VERSION}-slim AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# итоговый образ
FROM oven/bun:${BUN_VERSION}-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_URL=file:/app/data/meteonet.db

COPY --from=prod-deps --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun package.json tsconfig.json prisma.config.ts docker-entrypoint.sh ./
COPY --chown=bun:bun prisma ./prisma
COPY --chown=bun:bun src ./src
COPY --from=build --chown=bun:bun /app/src/generated ./src/generated
RUN mkdir -p /app/data && chown bun:bun /app/data

USER bun
EXPOSE 3001
VOLUME ["/app/data"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD bun -e "fetch('http://127.0.0.1:3001/api/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "src/main.ts"]
