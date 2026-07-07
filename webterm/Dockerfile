# Legal Terminal — web UI (static SPA)
# Build: docker build -t legal-terminal-web .
# Run:   docker run -p 8080:8080 legal-terminal-web

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .

# Optional — set at build time to start in live MCP mode
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
