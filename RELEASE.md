# Legal Terminal — v0.2.0-pre.3

**Pre-release · July 7, 2026**

Bloomberg-style keyboard-first terminal over [legal-mcp](https://github.com/agentic-ops/legal-mcp).
Dual-surface interface: a React web terminal and a Python TUI, both fully testable offline or connected live.

See [FEATURES.md](./FEATURES.md) for a detailed breakdown of terminal-native capabilities.

---

## What's new since v0.2.0-pre.2

### Settings redesign (`CONF`)
- Tabbed layout: **Privacy**, **General**, **Integrations**, **Notifications**
- Persisted app settings in `localStorage` (`legal-term-settings`)
- Provider trust as card grid (tablet-friendly)

### Workflow Builder (`WKFL`)
- **Browse** tab — system playbooks with **Run workflow** when `executable_steps` exist
- **Builder** tab — create/save/test-run custom tool sequences from the MCP catalog

### Automations (`AUTM` · F8)
- Schedule workflows once, daily, weekly, or on events (`job_complete`, `email_received`, etc.)
- Enable/disable toggles, run history, manual **Run now**

### Triggers (`TRIG`)
- **Paralegal inbox** queue with category badges
- **POP3 configuration** (saved locally; simulated connection test)
- **Category rules** — match inbound mail → automation + Paralegal prompt templates
- **Simulate inbound** demo using seed messages

### Execution engine
- `workflowRunner`, `automationScheduler`, `triggerRouter` services
- User data in localStorage: workflows, automations, triggers, inbox, settings
- New fixtures: `tool_catalog.json`, `trigger_categories.json`, `inbox_seed.json`, `automations_seed.json`

### Contract Workbench clarity (pre.2 patch)
- Fixture library label, Viewing banner, clause breadcrumbs

### Docs
- [docs/OPERATIONS.md](./docs/OPERATIONS.md) — end-to-end WKFL → AUTM → TRIG guide

---

## What's new since v0.1.0-pre.1

### Web UI — hybrid refactor
- Persistent left sidebar with grouped modules (Assistant, Research, Contracts, Drafting, Operations)
- Home dashboard with quick-action cards, backend status, and live activity feed
- Full-viewport module views replacing the old multi-panel grid
- Optional split view — pin a second module alongside the primary view (desktop only, ≥1025px)
- Ctrl+K command palette (`cmdk`) with fuzzy search across all modules and recent commands
- Playfair Display serif typography for legal headings; Inter UI + IBM Plex Mono data layer

### Light mode (default)
- Light theme on first visit; dark mode available via sidebar toggle
- Preference persisted in `localStorage` (`legal-term-theme`)
- All showcase screenshots re-shot in light mode (`docs/screenshots/`)

### Pre-release welcome overlay
- First-visit modal (`v0.2.0-pre.1`) with links to GitHub repos and feature summary
- Dismissal stored in `localStorage`; does not reappear on return visits

### Paralegal chat (`CHAT` · F1)
- Conversational interface with intent routing (research, citation check, contracts, brief outline, privilege)
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
- Filename-deterministic analysis and privilege checks via `document_profiles.json`

### Mock data expansion
- **Canonical fixtures** in `fixtures/*.json` — single source of truth for web and TUI
- **`scripts/sync-fixtures.mjs`** generates `webterm/src/fixtures.ts` at build time
- **7 contracts** with `party_roles`; role-aware negotiation guides (buyer / seller / mutual)
- **18 cases**, **9 statutes**, full brief outlines for all BRF case types
- Document profiles (summaries, snippets, privilege indicators), clause alternatives, panel meta
- Session audit log appends entries on each mock tool call
- Zero-result precedent search for empty-state demos (`no results expected`)

### Tablet-responsive layout (≤1024px)
- Master-detail panels stack vertically (PREC, CTRX, CITE, WKFL, JOBS)
- Sidebar auto-collapses; split view disabled on tablet
- Status bar and command line adapt; touch-friendly sidebar targets
- Desktop layout (≥1025px) unchanged

### Docket Watch (`WTCH`) — under consideration
- Product preview panel for ongoing federal docket entity monitoring
- Mock watch list, alert channel spec, PACER requirements note, "I want this" vote button
- Marked **Soon** in sidebar — no backend integration yet

### Screenshots
- 10 web PNGs (light mode) + 4 TUI SVGs in `docs/screenshots/`

### Deploy (Railway)
- Root `Dockerfile` mirrors monorepo layout (`fixtures/`, `scripts/`, `webterm/`) for fixture sync at build
- `.dockerignore` updated so `fixtures/` is included in Docker build context
- Mock-mode demo deploys without a legal-mcp server — see [docs/DEPLOY.md](./docs/DEPLOY.md)

---

## What's included

### Web Terminal (`webterm/`)
- React 19 + Vite + TypeScript + Tailwind CSS v4
- **15 modules:** HOME, CHAT, PREC, STAT, CITE, CTRX, DOCA, PRIV, BRF, JOBS, WKFL, AUDT, LIVE, WTCH, CONF
- Zustand store: view/splitView navigation, activity feed, client mode, confidential mode, theme
- `LegalMcpClient` proxy — runtime-switchable MockClient / LiveClient
- Vitest test suite: **56 tests** (MockClient, store, build)

### TUI (`tui/`)
- Python 3.10+ · Textual + Rich · `pip install -e .`
- `legal-term` console entry point; F1–F7 tab navigation
- **7 tabs:** HELP, PREC, CITE, CTRX, JOBS, WKFL, AUDT
- MockClient + LiveClient (`--live [URL]` or `LEGAL_MCP_URL`) — reads same `fixtures/` as web
- pytest suite: **41 tests** (MockClient, imports, headless smoke)

### Live MCP connection
- **Web:** status-bar toggle or `VITE_MCP_URL` in `.env.local` → `@modelcontextprotocol/sdk` over SSE
- **TUI:** `legal-term --live [URL]` → `mcp` Python SDK over SSE
- Server: `cd legal-mcp && python main.py --transport sse`
- Graceful fallback to mock fixtures when server is unreachable

### Mock layer
- Shared JSON fixtures in `fixtures/` — cases, statutes, contracts, jobs, workflows, audit log, negotiation guides, brief outlines, document profiles, clause alternatives, panel meta
- `scripts/sync-fixtures.mjs` → `webterm/src/fixtures.ts` (run automatically on `npm run build`)
- `MockClient` (TypeScript + Python) implements the full `LegalMcpClient` protocol with session audit append, role-aware CTRX guides, and filename-based DOCA/PRIV routing
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

# Sync fixtures manually (optional — also runs on build)
node scripts/sync-fixtures.mjs

# Deploy to Railway — see docs/DEPLOY.md
# Uses repo-root Dockerfile; mock mode demo out of the box

# TUI (mock)
cd tui && pip install -e . && legal-term

# TUI (live)
legal-term --live http://localhost:8000

# Tests
cd webterm && npm test          # 66 Vitest
cd tui && python -m pytest tests/  # 41 pytest
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
| `F8` | Automations |
| `F9` | Privilege Check |
| `F10` | Integrations |
| `Ctrl+K` | Command palette |
| Command bar | Type mnemonic + query (e.g. `PREC breach of contract`) |

---

## Known limitations

- **Mock inbox** — POP3 is configured and saved locally; inbound mail is simulated (no real polling from the browser)
- **Automations/triggers** run while the terminal tab is open; no background scheduler when closed
- User workflows, automations, triggers, and inbox data are **localStorage-only** (per browser)
- Live MCP has no server-side workflow/automation/inbox tools yet (web falls back to local stores)
- Docket Watch is a UI preview only — no PACER integration yet
- Confidential Mode is a client-side posture toggle; does not yet re-route inference to Ollama automatically
- Workflows and audit log fall back to fixtures even in live mode (no list-all tool on legal-mcp server)
- No authentication layer on the SSE connection
- PACER and CourtListener live adapters are scaffolded but disabled by default in legal-mcp
- Split view is disabled below 1024px viewport width
- TUI does not yet include CHAT, DOCA, PRIV, BRF, STAT, WTCH, CONF, AUTM, or TRIG modules (web only)

---

## License

Proprietary — All Rights Reserved · Edwin Genego / agentic-ops  
Third-party upstream: [legal-mcp](https://github.com/agentic-ops/legal-mcp) (AGPL-3.0)
