# Legal Terminal — Features

This document describes capabilities **native to the Legal Terminal interface** — the web app and TUI shell, navigation, controls, and UX patterns built in this repository.

It does not cover upstream [legal-mcp](https://github.com/agentic-ops/legal-mcp) tool logic (citation parsing, clause scoring, privilege heuristics, etc.). Those are backend concerns; the terminal exposes them through modules and controls described below.

---

## Surfaces

| Surface | Stack | Entry point |
|---------|-------|-------------|
| **Web Terminal** | React, Vite, TypeScript, Tailwind, Zustand | `cd webterm && npm run dev` |
| **TUI** | Python, Textual, Rich | `legal-term` |

Both surfaces share the same conceptual model: mnemonic commands, F-key shortcuts, a mock/live client layer, and JSON fixtures for offline use.

---

## Navigation & layout (web)

### Hybrid sidebar
Persistent left navigation grouped by workflow:
- **Assistant** — Paralegal chat
- **Research** — Precedent Search, Statutes, Citations
- **Contracts** — Contract Workbench, Document Analyzer, Privilege Check
- **Drafting** — Brief Builder
- **Operations** — Analysis Queue, Workflows, Audit Log, Integrations, Docket Watch

Collapses to an icon-only rail. Active module is highlighted. Docket Watch shows a **Soon** badge.

### Home dashboard
Default landing view with:
- Quick-action cards grouped by Research, Contracts, Privilege & Risk, Operations
- Backend connection status (mock vs live)
- **Ask the Paralegal** entry point (F1)
- Recent activity feed (last 30 events)

### Full-viewport modules
Each module occupies the main workspace at full height — no cramped grid tiles. Every module has a consistent header (mnemonic badge, title, MCP tool subtitle) and rich empty states with clickable examples.

### Split view
Pin a second module alongside the primary view from any module header. Close split with the × control. Useful for research + citation, or contract + privilege check side by side.

---

## Command interface

### Mnemonic command bar
Top-of-screen input accepting Bloomberg-style commands:

```
PREC breach of contract
CITE 2022 Cal.App.4th 1234
CTRX client_proposed_nda
```

Tab completes mnemonics; Enter executes and navigates to the target module with the query pre-filled. Command history (last 50) is stored in Zustand.

### Command palette (Ctrl+K)
Fuzzy-search overlay (`cmdk`) listing all modules, their descriptions, and recent commands. Escape closes; selecting an item navigates and logs the command.

### F-key shortcuts (web)

| Key | Module |
|-----|--------|
| F1 | Paralegal |
| F2 | Precedent Search |
| F3 | Citations |
| F4 | Contract Workbench |
| F5 | Analysis Queue |
| F6 | Workflows |
| F7 | Audit Log |
| F9 | Privilege Check |
| F10 | Integrations |

### F-key shortcuts (TUI)

| Key | Tab |
|-----|-----|
| F1 | Help |
| F2 | Precedent Search |
| F3 | Citations |
| F4 | Contract Workbench |
| F5 | Analysis Queue |
| F6 | Workflows |
| F7 | Audit Log |

TUI also supports `Ctrl+P` for a command palette and `q` to quit.

---

## Paralegal chat (web only)

A conversational layer on top of the MCP client — not a separate LLM, but an intent router that calls the appropriate tools and renders results as chat.

**Capabilities:**
- Plain-language questions routed to research, citation validation, contract listing, or brief outlining
- Structured attachment cards: case cards, statute cards, citation validation, contract list, brief outline
- Cards are clickable — jump directly to the relevant module with context pre-loaded
- Suggested prompts on empty state (research, citation, contracts, brief)
- Conversation persists in a dedicated Zustand store across module navigation
- "New conversation" clears history
- Thinking indicator during tool calls

**Mnemonic:** `CHAT` · **Shortcut:** F1

---

## Backend connection controls

### Runtime mock ↔ live toggle (web)
Status-bar pill showing `mock` or `live`. Click to switch:
- **Mock → live:** popover for server URL (default `http://localhost:8000`), then connect
- **Live → mock:** instant switch back

Implemented via a proxy-based `LegalMcpClient` — all modules import one `client` singleton that delegates to the active implementation without page reload.

Env var `VITE_MCP_URL` sets the initial mode at build time.

### Live connection (TUI)
```bash
legal-term --live http://localhost:8000
# or
LEGAL_MCP_URL=http://localhost:8000 legal-term
```

Widgets retrieve the active client via `get_client()` — no widget changes needed when switching.

### Mock layer (both surfaces)
- Shared JSON fixtures in `fixtures/` (canonical source of truth)
- `scripts/sync-fixtures.mjs` generates `webterm/src/fixtures.ts` at build time — web and TUI read the same JSON
- Full offline demo with no server
- Identical data shapes in TypeScript interfaces and Python dataclasses

**Mock coverage (v0.2):**
- **7 contracts** with `party_roles` maps; buyer / seller / mutual negotiation guides per contract with clause-specific rationales and redline fallback text (`negotiation_guides.json`)
- **21+ clause keys** with realistic alternatives (`clause_alternatives.json`)
- **Document profiles** with summaries, snippets, and page counts (`document_profiles.json`); DOCA/PRIV panels share fixture-backed file lists
- **18 cases**, **9 statutes**, full brief outlines for all BRF case types (multi-paragraph sections), expanded jobs with `result_summary`
- **Panel constants** in `fixtures/panel_meta.json` — search examples, citation examples, statute quick links, AI providers
- **Zero-result search** queries for PREC empty-state demos; session audit log appends on tool calls
- **Single build script:** `scripts/sync-fixtures.mjs` generates `webterm/src/fixtures.ts` (no separate enrich scripts)

---

## Confidential Mode (web only)

A client-side privacy posture for handling privileged material.

### Sidebar footer toggle
One-click switch between **Standard mode** and **Confidential**. When active:
- Sidebar footer turns amber with a lock icon
- Status bar shows an amber **CONF** badge
- Status bar and sidebar border tint amber

### Privacy Settings panel (`CONF`)
Full settings view accessible via the sidebar **Settings** link:
- Master enable/disable toggle with explanation
- Six enforced rules listed (local inference only, no cloud MCP, no telemetry, ABA Rule 1.6, etc.)
- Ollama endpoint and model configuration fields
- AI provider trust table — same matrix as Privilege Check; non-local providers dim when confidential mode is active

**Note:** Confidential Mode is currently a UI posture toggle. Automatic re-routing of inference to Ollama is planned but not yet wired.

---

## Document upload (web only)

Reusable `FileUploadZone` component:
- **Drag and drop** files onto the zone
- **Browse file(s)** — standard multi-file picker
- **Select folder** — ingests all files in a directory via `webkitdirectory`

Used in:
- **Document Analyzer (DOCA)** — uploaded files appear as chips; clicking one auto-analyzes
- **Analysis Queue (JOBS)** — uploaded files are immediately queued for background processing

Accepts `.pdf`, `.docx`, `.doc`, `.txt`, `.md`. Text content is read client-side for text-readable formats.

---

## Status bar (web)

Consolidated bottom strip showing:
- Confidential Mode badge (when active)
- Mock/live connection toggle
- Integration placeholders (CourtListener, PACER)
- Current view (and split view if active)
- Latest activity event
- Clock (24h)

---

## Activity feed

Every significant action pushes an event to `recentActivity` in the Zustand store (last 30 events):
- Module searches and queries
- Paralegal responses
- Client mode switches
- Confidential mode toggles
- Document uploads and queue operations

Visible on the Home dashboard and as the latest event in the status bar.

---

## Module reference

Each module is a full-viewport view with consistent chrome, empty states, and activity logging. Modules call the MCP client; the terminal adds navigation, layout, and interaction patterns on top.

| Mnemonic | Name | Web | TUI | Terminal-native highlights |
|----------|------|-----|-----|---------------------------|
| — | Home | ✓ | — | Quick actions, activity feed, backend status |
| `CHAT` | Paralegal | ✓ | — | Conversational UI, intent router, result cards |
| `PREC` | Precedent Search | ✓ | ✓ | Master-detail layout, example queries, case detail pane |
| `STAT` | Statutes | ✓ | — | Statute viewer with quick links |
| `CITE` | Citations | ✓ | ✓ | History sidebar, parsed component display |
| `CTRX` | Contract Workbench | ✓ | ✓ | Analyze / Compare / Negotiate tabs, clause risk list, alternatives |
| `DOCA` | Document Analyzer | ✓ | — | Upload zone, example files, metadata + clause risk table |
| `PRIV` | Privilege Check | ✓ | — | All-providers comparison table, document selector |
| `BRF` | Brief Builder | ✓ | — | Outline generation with example prompts |
| `JOBS` | Analysis Queue | ✓ | ✓ | Upload zone, auto-refresh table, job detail side panel |
| `WKFL` | Workflows | ✓ | ✓ | Playbook list with step detail |
| `AUDT` | Audit Log | ✓ | ✓ | Filterable invocation log |
| `LIVE` | Integrations | ✓ | — | CourtListener / PACER / server config status |
| `WTCH` | Docket Watch | ✓ | — | **Under consideration** — preview UI only |
| `CONF` | Privacy Settings | ✓ | — | Confidential Mode, Ollama config, provider trust |

---

## Docket Watch — under consideration (web only)

**Mnemonic:** `WTCH` · Marked **Soon** in sidebar

A product preview for ongoing federal litigation monitoring — not yet connected to PACER.

**Preview includes:**
- Product pitch distinguishing one-time party search from continuous monitoring
- Three-step explainer (add entity → nightly PACER scan → alert)
- Alert channel spec (email, webhook active; RSS and in-app soon)
- Interactive mock watch list (add, remove, pause entities)
- "▲ I want this" vote button
- PACER credential and cost requirements note

---

## Visual design (web)

- **Graphite/slate dark theme** — restrained, professional palette for legal work
- **Playfair Display** — serif font for module titles, case names, holdings, chat headings
- **Inter** — UI chrome and body text
- **IBM Plex Mono** — data cells, citations, metadata, status bar
- **Risk indicators** — desaturated CRITICAL / HIGH / MEDIUM / LOW badges
- **Empty states** — icon, title, description, and clickable example actions in every module
- **Focus rings and card tokens** — consistent spacing, borders, hover states

TUI uses a matching graphite/slate Textual CSS theme (`theme.tcss`).

---

## Testing

| Surface | Framework | Count | Scope |
|---------|-----------|-------|-------|
| Web | Vitest + Testing Library | 44 | MockClient methods, Zustand store navigation/split/confidential mode |
| TUI | pytest + pytest-asyncio | 39 | MockClient, widget imports, headless `run_test()` smoke |

```bash
cd webterm && npm test
cd tui && python -m pytest tests/
```

---

## What is not in this repository

These are upstream or planned — not terminal-native today:

- **legal-mcp server** — AGPL-3.0, run separately; provides the actual tool implementations
- **PACER / CourtListener live data** — scaffolded in legal-mcp, disabled by default
- **Docket Watch backend** — UI preview only; no nightly scan or alert delivery
- **Ollama inference routing** — Confidential Mode sets posture but does not yet call Ollama
- **Authentication** — no login or session management on the SSE connection
- **TUI parity** — CHAT, DOCA, PRIV, BRF, STAT, WTCH, CONF are web-only for now
