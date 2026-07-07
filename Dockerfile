# Legal Terminal — web UI
# Builds webterm/ from monorepo root (Railway default context).
# Preserves repo layout so `node ../scripts/sync-fixtures.mjs` resolves fixtures/*.json.

FROM node:22-alpine AS build
WORKDIR /repo

COPY webterm/package.json webterm/package-lock.json ./webterm/
WORKDIR /repo/webterm
# npm install (not ci) — lockfile is generated on Windows; Linux optional
# deps (@emnapi/*) are resolved at build time on Alpine.
RUN npm install --no-audit --no-fund

COPY fixtures /repo/fixtures
COPY scripts /repo/scripts
COPY webterm /repo/webterm

ARG VITE_MCP_URL=""
ENV VITE_MCP_URL=$VITE_MCP_URL

RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

RUN npm install -g serve@14.2.4

COPY --from=build /repo/webterm/dist ./dist

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" > /dev/null || exit 1

CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT}"]
