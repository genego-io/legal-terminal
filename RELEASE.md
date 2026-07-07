# Legal Terminal — v0.1.0-pre.1

**Pre-release · July 7, 2026**

Bloomberg-style keyboard-first terminal over [legal-mcp](https://github.com/agentic-ops/legal-mcp).
Dual-surface MVP: a React web terminal and a Textual TUI, both fully testable out of the box.

---

## What's included

### Web Terminal (`webterm/`)
- React + Vite + TypeScript + Tailwind CSS
- 11 functional panels: PREC, CITE, CTRX, DOCA, PRIV, BRF, JOBS, LIVE, WKFL, AUDT, STAT
- Keyboard-first mnemonic command bar (`cmdk`)
- Zustand state management with panel layout presets
- Professional graphite/slate dark theme, IBM Plex Mono data layer, Inter UI text

### TUI (`tui/`)
- Python + Textual + Rich, installable via `pip install -e .`
- `legal-term` console entry point; F-key and mnemonic navigation
- Six panels: PREC, CITE, CTRX, JOBS, WKFL, AUDT
- Matching graphite/slate Textual CSS theme

### Live MCP connection (new in this release)
- **Web:** set `VITE_MCP_URL=http://localhost:8000` in `webterm/.env.local` — the app
  switches from MockClient to LiveClient automatically via `@modelcontextprotocol/sdk`
- **TUI:** pass `--live [URL]` or set `LEGAL_MCP_URL` — activates `LiveClient` over SSE
  using the `mcp` Python SDK
- Requires a running `legal-mcp` server:
  ```bash
  cd legal-mcp && pip install -e . && python main.py --transport sse
  ```
- Falls back gracefully to mock fixtures when the server is not reachable

### Mock layer
- Shared JSON fixtures (`fixtures/`) — cases, statutes, contracts, jobs, workflows, audit log
- `MockClient` (TypeScript + Python) implements the full `LegalMcpClient` protocol
- No server required; ready to demo offline

### Test suites
- **Web:** 39 Vitest tests — MockClient methods, Zustand store, panel build
- **TUI:** 39 pytest tests — MockClient methods, widget imports, headless app smoke tests
- Run: `npm test` / `python -m pytest tests/`

---

## Quick start

```bash
# Web terminal
cd webterm && npm install && npm run dev

# TUI (mock)
cd tui && pip install -e . && legal-term

# TUI (live — requires legal-mcp running on :8000)
legal-term --live
```

---

## Known limitations

- Workflows and the audit log fall back to fixtures even in live mode
  (no list-all tool on the legal-mcp server)
- No authentication layer on the SSE connection yet
- PACER and CourtListener live adapters are scaffolded but disabled by default
  (upstream feature flags in legal-mcp)

---

## License

Proprietary — All Rights Reserved · Edwin Genego / agentic-ops  
Third-party upstream: [legal-mcp](https://github.com/agentic-ops/legal-mcp) (AGPL-3.0)
