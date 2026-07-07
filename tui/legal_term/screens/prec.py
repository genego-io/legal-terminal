"""PREC — Precedent Search screen."""
from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal, Vertical, VerticalScroll
from textual.screen import Screen
from textual.widgets import Button, DataTable, Footer, Input, Label, RichLog, Static

from ..client import Case, client


class PrecScreen(Screen):
    """Precedent search — search_precedents / search_case_law."""

    BINDINGS = [("escape", "app.pop_screen", "Back")]

    def compose(self) -> ComposeResult:
        yield Static("  [bold #ffb300]PREC[/]  Precedent & Case Search  ·  search_precedents · search_case_law", classes="panel-header")
        with Horizontal():
            with Vertical(id="prec-left"):
                with Horizontal(id="prec-search-row"):
                    yield Input(placeholder="keyword query…", id="prec-query")
                    yield Button("GO", variant="primary", id="prec-go")
                yield DataTable(id="prec-table", cursor_type="row")
            yield VerticalScroll(Static("Select a case to view details.", id="prec-detail"), id="prec-right")
        yield Footer()

    def on_mount(self) -> None:
        table = self.query_one("#prec-table", DataTable)
        table.add_columns("", "CASE", "CITATION", "YEAR", "REL%")
        # load all cases on mount
        self.run_worker(self._load("contract breach"), exclusive=True, name="prec-load")

    async def _load(self, query: str) -> None:
        cases = await client.search_precedents(query)
        table = self.query_one("#prec-table", DataTable)
        table.clear()
        for i, c in enumerate(cases, 1):
            pct = f"{int(c.relevance_score * 100)}%"
            table.add_row(str(i), c.name, c.citation, str(c.year), pct, key=c.id)
        self._cases = {c.id: c for c in cases}

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "prec-go":
            q = self.query_one("#prec-query", Input).value.strip()
            if q:
                table = self.query_one("#prec-table", DataTable)
                table.clear()
                self.query_one("#prec-detail", Static).update("Searching…")
                self.run_worker(self._load(q), exclusive=True, name="prec-load")

    def on_data_table_row_selected(self, event: DataTable.RowSelected) -> None:
        case = getattr(self, "_cases", {}).get(str(event.row_key.value))
        if case:
            self._show_detail(case)

    def _show_detail(self, c: Case) -> None:
        text = (
            f"[bold #ffb300]{c.name}[/]\n"
            f"[#7a5c00]{c.citation} · {c.court} · {c.year}[/]\n"
            f"[#3d2e00]{c.jurisdiction} · {c.disposition}[/]\n\n"
            f"[bold #c47f00]HOLDING[/]\n"
            f"[#d4a017]{c.holding}[/]\n\n"
            f"[bold #c47f00]SUMMARY[/]\n"
            f"[#7a5c00]{c.summary}[/]\n\n"
            f"[bold #c47f00]TOPICS[/]\n"
            + "  ".join(f"[#c47f00 on #1a1400] {t} [/]" for t in c.topics)
        )
        self.query_one("#prec-detail", Static).update(text)
