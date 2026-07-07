# Legal Terminal — web UI
# Builds webterm/ from monorepo root (Railway default context).

FROM node:22-alpine AS build
WORKDIR /app

COPY webterm/package.json webterm/package-lock.json ./
# npm install (not ci) — lockfile is generated on Windows; Linux optional
# deps (@emnapi/*) are resolved at build time on Alpine.
RUN npm install --no-audit --no-fund

COPY webterm/ .

ARG VITE_MCP_URL=""
ENV VITE_MCP_URL=$VITE_MCP_URL

RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

RUN npm install -g serve@14.2.4

COPY --from=build /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" > /dev/null || exit 1

CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT}"]
