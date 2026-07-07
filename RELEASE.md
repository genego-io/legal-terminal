# Legal Terminal — v0.2.0-pre.1

**Pre-release · July 7, 2026**

Bloomberg-style keyboard-first terminal over [legal-mcp](https://github.com/agentic-ops/legal-mcp).
Dual-surface interface: a React web terminal and a Python TUI, both fully testable offline or connected live.

See [FEATURES.md](./FEATURES.md) for a detailed breakdown of terminal-native capabilities.

---

## What's new since v0.1.0-pre.1

### Web UI — hybrid refactor
- Persistent left sidebar with grouped modules (Assistant, Research, Contracts, Drafting, Operations)
- Home dashboard with quick-action cards, backend status, and live activity feed
- Full-viewport module views replacing the old multi-panel grid
- Optional split view — pin a second module alongside the primary view
- Ctrl+K command palette (`cmdk`) with fuzzy search across all modules and recent commands
- Playfair Display serif typography for legal headings; Inter UI + IBM Plex Mono data layer

### Paralegal chat (`CHAT` · F1)
- Conversational interface with intent routing (research, citation check, contracts, brief outline)
- Structured result cards (cases, statutes, citations, contracts) with jump-to-module actions
- Persistent conversation store — chat survives navigation
- Suggested prompts on empty state

### Runtime controls
- **Mock ↔ live toggle** in the status bar — switch MCP backend at runtime without reload
- **Confidential Mode** (`CONF`) — sidebar footer toggle + full privacy settings panel
  - Forces local-inference posture; Ollama endpoint/model configuration
  - Provider trust matrix (ABA Rule 1.6 / *Heppner*) with dimmed non-local providers when active
  - Amber `CONF` badge in status bar when enabled

### Document handling
- Drag-and-drop file upload zone with browse and folder picker (`webkitdirectory`)
- Wired into Document Analyzer (DOCA) and Analysis Queue (JOBS)

### Docket Watch (`WTCH`) — under consideration
- Product preview panel for ongoing federal docket entity monitoring
- Mock watch list, alert channel spec, PACER requirements note, "I want this" vote button
- Marked **Soon** in sidebar — no backend integration yet

### Screenshots
- 10 web PNGs + 4 TUI SVGs in `docs/screenshots/` reflecting the current UI

---

## What's included

### Web Terminal (`webterm/`)
- React 19 + Vite + TypeScript + Tailwind CSS v4
- **15 modules:** HOME, CHAT, PREC, STAT, CITE, CTRX, DOCA, PRIV, BRF, JOBS, WKFL, AUDT, LIVE, WTCH, CONF
- Zustand store: view/splitView navigation, activity feed, client mode, confidential mode
- `LegalMcpClient` proxy — runtime-switchable MockClient / LiveClient
- Vitest test suite: **44 tests** (MockClient, store, build)

### TUI (`tui/`)
- Python 3.10+ · Textual + Rich · `pip install -e .`
- `legal-term` console entry point; F1–F7 tab navigation
- **7 tabs:** HELP, PREC, CITE, CTRX, JOBS, WKFL, AUDT
- MockClient + LiveClient (`--live [URL]` or `LEGAL_MCP_URL`)
- pytest suite: **39 tests** (MockClient, imports, headless smoke)

### Live MCP connection
- **Web:** status-bar toggle or `VITE_MCP_URL` in `.env.local` → `@modelcontextprotocol/sdk` over SSE
- **TUI:** `legal-term --live [URL]` → `mcp` Python SDK over SSE
- Server: `cd legal-mcp && python main.py --transport sse`
- Graceful fallback to mock fixtures when server is unreachable

### Mock layer
- Shared JSON fixtures in `fixtures/` — cases, statutes, contracts, jobs, workflows, audit log
- `MockClient` (TypeScript + Python) implements the full `LegalMcpClient` protocol
- No server required; ready to demo offline

---

## Quick start

```bash
# Web terminal (local)
cd webterm && npm install && npm run dev
# → http://localhost:5173

# Web terminal (production preview)
cd webterm && npm run build && npm start
# → http://localhost:8080

# Deploy to Railway — see docs/DEPLOY.md
# Root Directory: webterm · mock mode demo out of the box

# TUI (mock)
cd tui && pip install -e . && legal-term

# TUI (live)
legal-term --live http://localhost:8000

# Tests
cd webterm && npm test          # 44 Vitest
cd tui && python -m pytest tests/  # 39 pytest
```

---

## Keyboard shortcuts (web)

| Key | Action |
|-----|--------|
| `F1` | Paralegal chat |
| `F2` | Precedent Search |
| `F3` | Citations |
| `F4` | Contract Workbench |
| `F5` | Analysis Queue |
| `F6` | Workflows |
| `F7` | Audit Log |
| `F9` | Privilege Check |
| `F10` | Integrations |
| `Ctrl+K` | Command palette |
| Command bar | Type mnemonic + query (e.g. `PREC breach of contract`) |

---

## Known limitations

- Docket Watch is a UI preview only — no PACER integration yet
- Confidential Mode is a client-side posture toggle; does not yet re-route inference to Ollama automatically
- Workflows and audit log fall back to fixtures even in live mode (no list-all tool on legal-mcp server)
- No authentication layer on the SSE connection
- PACER and CourtListener live adapters are scaffolded but disabled by default in legal-mcp
- TUI does not yet include CHAT, DOCA, PRIV, BRF, STAT, WTCH, or CONF modules (web only)

---

## License

Proprietary — All Rights Reserved · Edwin Genego / agentic-ops  
Third-party upstream: [legal-mcp](https://github.com/agentic-ops/legal-mcp) (AGPL-3.0)
