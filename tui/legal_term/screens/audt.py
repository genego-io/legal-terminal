"""AUDT — Audit Log screen."""
from __future__ import annotations

import json

from textual.app import ComposeResult
from textual.containers import Vertical
from textual.screen import Screen
from textual.widgets import Footer, Input, RichLog, Static

from ..client import client


class AudtScreen(Screen):
    """Streaming audit log viewer — utils.audit."""

    BINDINGS = [("escape", "app.pop_screen", "Back")]

    def compose(self) -> ComposeResult:
        yield Static("  [bold #ffb300]AUDT[/]  Audit Log  ·  utils.audit — all tool calls", classes="panel-header")
        with Vertical():
            yield Input(placeholder="filter by tool or arg…", id="audt-filter")
            yield RichLog(id="audt-log", markup=True, highlight=False)
        yield Footer()

    def on_mount(self) -> None:
        self.run_worker(self._load(), exclusive=True, name="audt-load")

    async def _load(self) -> None:
        entries = await client.get_audit_log()
        log = self.query_one("#audt-log", RichLog)
        log.clear()
        self._entries = entries
        for e in entries:
            self._write(e.ts, e.tool, e.args, e.extra)

    def _write(self, ts: str, tool: str, args: dict, extra: dict) -> None:
        log = self.query_one("#audt-log", RichLog)
        time_part = ts[11:19] if len(ts) >= 19 else ts
        args_str = json.dumps(args, separators=(",", ":"))
        extra_parts = "  ".join(f"[#c47f00]{k}:[/][#7a5c00]{v}[/]" for k, v in extra.items())
        log.write(
            f"[#3d2e00]{time_part}[/]  [bold #ffb300]{tool}[/]  [#7a5c00]{args_str}[/]"
            + (f"  {extra_parts}" if extra_parts else "")
        )

    def on_input_changed(self, event: Input.Changed) -> None:
        if not hasattr(self, "_entries"):
            return
        q = event.value.lower().strip()
        log = self.query_one("#audt-log", RichLog)
        log.clear()
        for e in self._entries:
            if not q or q in e.tool or q in json.dumps(e.args).lower():
                self._write(e.ts, e.tool, e.args, e.extra)
