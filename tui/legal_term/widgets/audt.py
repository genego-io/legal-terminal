"""AUDT widget — audit log."""
from __future__ import annotations

import json

from textual.app import ComposeResult
from textual.widget import Widget
from textual.widgets import Input, RichLog, Static

from ..client import get_client as _get_client


class AudtWidget(Widget):
    """Streaming audit log viewer — utils.audit."""

    def compose(self) -> ComposeResult:
        yield Static(
            "  [bold #8a9099]AUDT[/]  Audit Log  ·  utils.audit — all tool calls",
            classes="panel-header"
        )
        yield Input(placeholder="filter by tool or input…", id="audt-filter")
        yield RichLog(id="audt-log", markup=True, highlight=False)

    def on_mount(self) -> None:
        self._entries: list = []
        self.run_worker(self._load(), exclusive=True, name="audt-load")

    async def _load(self) -> None:
        self._entries = await _get_client().get_audit_log()
        self._render(self._entries)

    def _render(self, entries: list) -> None:
        log = self.query_one("#audt-log", RichLog)
        log.clear()
        for e in entries:
            ts = e.timestamp[11:19] if hasattr(e, "timestamp") and len(e.timestamp) >= 19 else getattr(e, "ts", "")[:19]
            input_str = json.dumps(getattr(e, "input", {}), separators=(",", ":"))
            success = getattr(e, "success", True)
            ok_tag = "[#6fa370]ok[/]" if success else "[#c25b5b]err[/]"
            ms = getattr(e, "duration_ms", "")
            log.write(
                f"[#4d5563]{ts}[/]  [bold #5b8dbe]{e.tool}[/]  "
                f"[#8a9099]{input_str[:80]}[/]"
                f"  {ok_tag}"
                + (f"  [#4d5563]{ms}ms[/]" if ms else "")
            )

    def on_input_changed(self, event: Input.Changed) -> None:
        if event.input.id != "audt-filter" or not self._entries:
            return
        q = event.value.lower().strip()
        filtered = [e for e in self._entries
                    if not q or q in e.tool or q in json.dumps(getattr(e, "input", {})).lower()]
        self._render(filtered)
