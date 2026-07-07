# Deploying Legal Terminal (Web)

The web terminal is a static Vite SPA served by `serve`. It ships with a Dockerfile and Railway config under `webterm/`.

**Default behaviour on deploy:** runs in **mock mode** with offline fixtures — no legal-mcp server required. Perfect for a public demo.

---

## Railway (recommended)

### 1. Create project

1. Go to [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo**
2. Select `genego-io/legal-terminal` (or your fork)
3. In the service **Settings → Source**, set **Root Directory** to `webterm`
4. Railway reads `webterm/railway.toml` and builds via `webterm/Dockerfile`

### 2. Deploy

Push to `master` — Railway redeploys automatically on each push.

Or trigger manually from the Railway dashboard (**Deploy**).

### 3. Public URL

Railway assigns a domain under **Settings → Networking → Generate Domain**.

Example: `https://legal-terminal-production.up.railway.app`

### 4. Optional — connect to live legal-mcp

If you also deploy `legal-mcp` (separate service), set a **build-time** variable on the web service:

| Variable | When | Example |
|----------|------|---------|
| `VITE_MCP_URL` | Build | `https://your-legal-mcp.up.railway.app` |

Users can also switch to live mode at runtime via the **mock/live** pill in the status bar (no rebuild needed).

> `VITE_MCP_URL` is baked in at build time. Runtime toggle uses the URL from the popover (defaults to `http://localhost:8000` unless set at build).

---

## Docker (local or any host)

```bash
cd webterm
docker build -t legal-terminal-web .
docker run -p 8080:8080 legal-terminal-web
# → http://localhost:8080
```

With live MCP URL at build time:

```bash
docker build --build-arg VITE_MCP_URL=https://your-mcp.example.com -t legal-terminal-web .
```

---

## Nixpacks (Railway fallback)

If you prefer Nixpacks over Docker, remove or rename `railway.toml` and Railway will detect Node automatically:

- **Build command:** `npm ci && npm run build`
- **Start command:** `npm run start` (uses `serve` on `$PORT`)

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Auto (Railway) | HTTP port — set by Railway, defaults to `8080` locally |
| `VITE_MCP_URL` | No | Build-time MCP SSE URL; omit for mock-only demo |

---

## Health check

- **Path:** `/`
- Docker and Railway configs both probe the root URL

---

## What is not deployed

This deploy config covers **webterm only**. The TUI (`tui/`) is a local Python app — not containerised here. The `legal-mcp` server is a separate AGPL project and must be deployed independently if you want live tool calls.
