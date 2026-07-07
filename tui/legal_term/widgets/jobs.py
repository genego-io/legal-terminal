"""JOBS widget — analysis queue."""
from __future__ import annotations

from datetime import datetime

from textual.app import ComposeResult
from textual.containers import Horizontal
from textual.widget import Widget
from textual.widgets import Button, DataTable, Input, Static

from ..client import get_client as _get_client

STATUS_STYLE = {
    "complete":   "[#6fa370]complete[/]",
    "processing": "[#b3a44f]processing[/]",
    "queued":     "[#4d5563]queued[/]",
    "error":      "[#c25b5b]error[/]",
}

RISK_STYLE = {
    "CRITICAL": "[#c25b5b]CRITICAL[/]",
    "HIGH":     "[#c2854f]HIGH[/]",
    "MEDIUM":   "[#b3a44f]MEDIUM[/]",
    "LOW":      "[#6fa370]LOW[/]",
}


def _ts(s: str | None) -> str:
    if not s:
        return "—"
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt.strftime("%H:%M:%S")
    except Exception:
        return s[:19]


class JobsWidget(Widget):
    """Analysis queue — queue_document_analysis · list_analysis_jobs."""

    def compose(self) -> ComposeResult:
        yield Static(
            "  [bold #8a9099]JOBS[/]  Analysis Queue  ·  queue_document_analysis · list_analysis_jobs",
            classes="panel-header"
        )
        with Horizontal(id="jobs-controls"):
            yield Input(placeholder="filename to queue…", id="jobs-file")
            yield Button("+ Queue", id="jobs-queue-btn")
            yield Button("↻ Refresh", id="jobs-refresh-btn")
        yield Static("", id="jobs-summary")
        yield DataTable(id="jobs-table", cursor_type="row")

    def on_mount(self) -> None:
        table = self.query_one("#jobs-table", DataTable)
        table.add_columns("ID", "File", "Status", "Queued", "Done", "Risk", "Flags")
        self.run_worker(self._refresh(), exclusive=True, name="jobs-init")
        self.set_interval(2, self._auto_refresh)

    def _auto_refresh(self) -> None:
        self.run_worker(self._refresh(), exclusive=False, name="jobs-auto")

    async def _refresh(self) -> None:
        jobs = await _get_client().get_analysis_jobs()
        table = self.query_one("#jobs-table", DataTable)
        table.clear()
        for j in jobs:
            risk = RISK_STYLE.get(j.risk_level or "", "[#4d5563]—[/]")
            file_str = j.file[:32] + ("…" if len(j.file) > 32 else "")
            table.add_row(
                j.id, file_str,
                STATUS_STYLE.get(j.status, j.status),
                _ts(j.queued_at), _ts(j.completed_at),
                risk, str(j.flags) if j.flags is not None else "—",
                key=j.id,
            )
        counts = {s: sum(1 for j in jobs if j.status == s) for s in ["complete", "processing", "queued", "error"]}
        self.query_one("#jobs-summary", Static).update(
            f"  [#6fa370]{counts['complete']}[/] done  "
            f"[#b3a44f]{counts['processing']}[/] processing  "
            f"[#4d5563]{counts['queued']}[/] queued  "
            f"[#c25b5b]{counts['error']}[/] error  "
            f"[#4d5563]· auto-refresh 2s[/]"
        )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "jobs-queue-btn":
            fname = self.query_one("#jobs-file", Input).value.strip()
            if fname:
                self.run_worker(_get_client().queue_document_analysis(fname), exclusive=False, name="jobs-queue")
                self.query_one("#jobs-file", Input).value = ""
        elif event.button.id == "jobs-refresh-btn":
            self.run_worker(self._refresh(), exclusive=True, name="jobs-refresh")
