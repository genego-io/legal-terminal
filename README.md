# Legal Terminal

> A Bloomberg-style keyboard-first terminal for legal practice, built on top of [legal-mcp](https://github.com/agentic-ops/legal-mcp).
> Two front-ends — a React web terminal and a Python TUI — both powered by the same mocked MCP client.

---

**Showcase repository** · All rights reserved · See [LICENSE](./LICENSE)

---

## Screenshots

### Web Terminal

| Home Dashboard | Paralegal — digital assistant |
|----------------|-------------------------------|
| ![Home](docs/screenshots/web-01-home.png) | ![Paralegal empty](docs/screenshots/web-02-chat-empty.png) |

| Paralegal — research conversation with case cards | Precedent Search — master-detail |
|---------------------------------------------------|----------------------------------|
| ![Paralegal research](docs/screenshots/web-03-chat-research.png) | ![PREC](docs/screenshots/web-04-prec.png) |

| Contract Workbench — clause analysis | Privilege Check — provider comparison |
|---------------------------------------|---------------------------------------|
| ![CTRX](docs/screenshots/web-05-ctrx.png) | ![PRIV](docs/screenshots/web-06-priv.png) |

| Document Analyzer — upload zone + risk summary | Ctrl+K Command Palette |
|------------------------------------------------|------------------------|
| ![DOCA](docs/screenshots/web-07-doca.png) | ![Palette](docs/screenshots/web-08-palette.png) |

| Docket Watch — entity monitoring (under consideration) | Privacy Settings — Confidential Mode active |
|--------------------------------------------------------|---------------------------------------------|
| ![Docket Watch](docs/screenshots/web-10-docket-watch.png) | ![CONF active](docs/screenshots/web-12-conf-on.png) |

---

### TUI (Terminal UI)

| Help / Home | Precedent Search |
|-------------|-----------------|
| ![TUI Help](docs/screenshots/tui-01-help.svg) | ![TUI PREC](docs/screenshots/tui-02-prec.svg) |

| Contract Workbench | Analysis Queue |
|--------------------|----------------|
| ![TUI CTRX](docs/screenshots/tui-03-ctrx.svg) | ![TUI JOBS](docs/screenshots/tui-04-jobs.svg) |

---

## What is this?

Legal Terminal is a keyboard-first, multi-panel terminal interface for legal work,
inspired by Bloomberg Terminal's density and workflow philosophy. It wraps the
[legal-mcp](https://github.com/agentic-ops/legal-mcp) Model Context Protocol server
in a professional-grade UI — both a browser-based web terminal and a native Python TUI.

**Current state:** Full hybrid UI with sidebar navigation, home dashboard, Ctrl+K command palette,
and full-viewport module views. Features a **Paralegal chat** (F1) for conversational legal research,
citation validation, contract review, and brief outlining. Runtime mock/live toggle in the status bar.
Local document upload and folder picker in DOCA and JOBS. Playfair Display legal serif typography.
Includes both a `MockClient` (works offline) and a `LiveClient` that connects to a running `legal-mcp`
server over SSE — see the Quick Start below.

---

## Panels & Mnemonics

| Key | Panel | MCP Tool(s) |
|-----|-------|-------------|
| `CHAT` | Paralegal (chat assistant) | `research_legal_issue`, `validate_citation`, `generate_brief_outline`, `list_contracts` |
| `PREC` | Precedent & Case Search | `search_precedents`, `search_case_law` |
| `STAT` | Statute Viewer | `extract_statute` |
| `CITE` | Citation Console | `validate_citation`, `normalize_citation`, `verify_citation_integrity` |
| `CTRX` | Contract Workbench | `analyze_clauses`, `suggest_clause_alternatives`, `generate_negotiation_guide`, `compare_contracts` |
| `DOCA` | Document Analyzer | `analyze_document`, `extract_contract_metadata` |
| `PRIV` | Privilege Risk Check | `check_privilege_risk` (Heppner / ABA Rule 1.6) |
| `BRF`  | Brief Builder | `generate_brief_outline`, `create_argument_structure`, `generate_issue_statement` |
| `JOBS` | Analysis Queue | `queue_document_analysis`, `list_analysis_jobs`, `get_analysis_status` |
| `WKFL` | Workflows & Builder | Browse playbooks · build custom tool sequences |
| `AUTM` | Automations | Schedule workflows · event triggers (F8) |
| `TRIG` | Triggers | Paralegal inbox · POP3 config · category rules |
| `AUDT` | Audit Log | `utils.audit` — all tool invocations |
| `LIVE` | Integration Status | `integration_status` — CourtListener, PACER |
| `WTCH` | Docket Watch *(under consideration)* | PACER docket monitoring — requires PACER API |
| `CONF` | Settings | Privacy · General · Integrations · Notifications |

Operations walkthrough: [docs/OPERATIONS.md](./docs/OPERATIONS.md)

---

## Architecture

```
legal-terminal/
├── webterm/              React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── mcp/          LegalMcpClient interface + MockClient
│       ├── store/        Zustand state (panels, history)
│       ├── components/   Shell chrome (header, command bar, status bar)
│       └── panels/       11 panel components (PREC, STAT, CITE, …)
├── tui/                  Python + Textual + Rich
│   └── legal_term/
│       ├── client.py     LegalMcpClient protocol + MockClient
│       ├── app.py        LegalTermApp — tabs, command bar, key bindings
│       ├── widgets/      6 embedded tab widgets (PREC, CITE, CTRX, JOBS, WKFL, AUDT)
│       └── theme.tcss    Graphite/slate Textual CSS
├── fixtures/             Shared mock JSON (cases, statutes, contracts, jobs, audit, workflows)
├── docs/screenshots/     Web PNGs + TUI SVGs
└── LICENSE               Proprietary — viewing only, contact for permission
```

---

## Quick Start

### Web terminal

```bash
cd webterm
npm install
npm run dev          # http://localhost:5173
```

Keyboard shortcuts: `F1`–`F10` open modules. Type mnemonics in the command bar (e.g. `PREC breach of contract`, `CITE 2022 Cal.App.4th 1234`).

### Deploy to Railway

See [docs/DEPLOY.md](./docs/DEPLOY.md) for full instructions. Quick version:

1. Railway → **New Project** → deploy from this GitHub repo
2. Generate a public domain under **Networking** (no root directory config needed)

Runs in mock mode by default — no backend required for the live demo.

### TUI

```bash
cd tui
pip install -e .
legal-term
```

Or `python -m legal_term`. Same mnemonics in the command bar; `F1`–`F7` for tabs.

---

## Backend wiring plan

Replace `MockClient` in:
- `webterm/src/mcp/mockClient.ts` → a `LiveClient` using the MCP TypeScript SDK over SSE (`http://localhost:8000/sse`)
- `tui/legal_term/client.py` → a `LiveClient` using the `mcp` Python SDK over stdio or SSE

The `legal-mcp` server exposes the same tool names used throughout this codebase.
Clone and run it separately: [agentic-ops/legal-mcp](https://github.com/agentic-ops/legal-mcp)

> **Note:** `legal-mcp` is licensed under AGPL-3.0 and is not included in this repository.

---

## License

Copyright © 2026 Edwin Genego / agentic-ops. All rights reserved.

This is a showcase repository. Viewing is permitted for personal evaluation.
Any use, copying, modification, or distribution requires prior written permission.
See [LICENSE](./LICENSE) for full terms. Contact: edwin@genego.io
