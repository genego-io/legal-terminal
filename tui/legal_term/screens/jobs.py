"""JOBS — Analysis Queue screen."""
from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal, Vertical
from textual.screen import Screen
from textual.widgets import Button, DataTable, Footer, Input, Label, Static
from textual.timer import Timer

from ..client import AnalysisJob, client


STATUS_STYLE = {
    "complete": "[green]COMPLETE[/]",
    "processing": "[bold #ffb300]● PROC[/]",
    "queued": "[#7a5c00]QUEUED[/]",
    "error": "[bold red]ERROR[/]",
}

RISK_STYLE = {
    "CRITICAL": "[bold red]CRITICAL[/]",
    "HIGH": "[bold #ff6d00]HIGH[/]",
    "MEDIUM": "[#ffb300]MEDIUM[/]",
    "LOW": "[green]LOW[/]",
}


def _ts(s: str | None) -> str:
    if not s:
        return "—"
    try:
        from datetime import datetime, timezone
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt.strftime("%H:%M:%S")
    except Exception:
        return s


class JobsScreen(Screen):
    """Analysis queue — queue_document_analysis · list_analysis_jobs."""

    BINDINGS = [("escape", "app.pop_screen", "Back"), ("r", "refresh", "Refresh")]

    def compose(self) -> ComposeResult:
        yield Static("  [bold #ffb300]JOBS[/]  Analysis Queue  ·  queue_document_analysis · list_analysis_jobs", classes="panel-header")
        with Vertical():
            with Horizontal(id="jobs-queue-row"):
                yield Input(placeholder="filename to queue (e.g. agreement.docx)…", id="jobs-file")
                yield Button("+ QUEUE", id="jobs-queue-btn")
                yield Button("↻ REFRESH", id="jobs-refresh-btn")
            yield Static("", id="jobs-summary")
            yield DataTable(id="jobs-table", cursor_type="row")
        yield Footer()

    def on_mount(self) -> None:
        table = self.query_one("#jobs-table", DataTable)
        table.add_columns("ID", "FILE", "STATUS", "QUEUED", "DONE", "RISK", "FLAGS")
        self.run_worker(self._refresh(), exclusive=True, name="jobs-refresh")
        self._timer = self.set_interval(2, self._auto_refresh)

    def _auto_refresh(self) -> None:
        self.run_worker(self._refresh(), exclusive=False, name="jobs-auto")

    async def _refresh(self) -> None:
        jobs = await client.get_analysis_jobs()
        table = self.query_one("#jobs-table", DataTable)
        table.clear()
        for j in jobs:
            risk = RISK_STYLE.get(j.risk_level or "", "[#3d2e00]—[/]")
            table.add_row(
                j.id,
                j.file[:30] + ("…" if len(j.file) > 30 else ""),
                STATUS_STYLE.get(j.status, j.status),
                _ts(j.queued_at),
                _ts(j.completed_at),
                risk,
                str(j.flags) if j.flags is not None else "—",
                key=j.id,
            )
        counts = {s: sum(1 for j in jobs if j.status == s) for s in ["complete", "processing", "queued", "error"]}
        summary = "  ".join(f"[green]{counts['complete']}[/] DONE" if s == "complete"
                             else f"[#ffb300]{counts['processing']}[/] PROC" if s == "processing"
                             else f"[#7a5c00]{counts['queued']}[/] QUEUED" if s == "queued"
                             else f"[red]{counts['error']}[/] ERR"
                             for s in ["complete", "processing", "queued", "error"])
        self.query_one("#jobs-summary", Static).update(f"  {summary}  [#3d2e00]· auto-refresh 2s[/]")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "jobs-queue-btn":
            fname = self.query_one("#jobs-file", Input).value.strip()
            if fname:
                self.run_worker(client.queue_document_analysis(fname), exclusive=False)
                self.query_one("#jobs-file", Input).value = ""
        elif event.button.id == "jobs-refresh-btn":
            self.run_worker(self._refresh(), exclusive=True, name="jobs-refresh")

    def action_refresh(self) -> None:
        self.run_worker(self._refresh(), exclusive=True, name="jobs-refresh")
