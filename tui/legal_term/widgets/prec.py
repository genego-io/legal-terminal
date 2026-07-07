"""PREC widget — precedent & case search."""
from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal, VerticalScroll
from textual.widget import Widget
from textual.widgets import Button, DataTable, Input, Static

from ..client import Case, get_client as _get_client


class PrecWidget(Widget):
    """Precedent search — search_precedents · search_case_law."""

    def compose(self) -> ComposeResult:
        yield Static(
            "  [bold #8a9099]PREC[/]  Precedent & Case Search  ·  search_precedents",
            classes="panel-header"
        )
        with Horizontal(id="prec-search-row"):
            yield Input(placeholder="keyword query…", id="prec-query")
            yield Button("Search", variant="primary", id="prec-go")
        with Horizontal(id="prec-body"):
            yield DataTable(id="prec-table", cursor_type="row")
            yield VerticalScroll(
                Static("[#4d5563]Select a case to view details.[/]", id="prec-detail"),
                id="prec-right",
            )

    def on_mount(self) -> None:
        table = self.query_one("#prec-table", DataTable)
        table.add_columns("#", "Case", "Citation", "Year", "Rel%")
        self._cases: dict[str, Case] = {}
        self.run_worker(self._search("contract breach"), exclusive=True, name="prec-init")

    async def _search(self, query: str) -> None:
        cases = await _get_client().search_precedents(query)
        table = self.query_one("#prec-table", DataTable)
        table.clear()
        self._cases = {}
        for i, c in enumerate(cases, 1):
            pct = f"{int(c.relevance_score * 100)}%"
            table.add_row(str(i), c.name[:30], c.citation[:22], str(c.year), pct, key=c.id)
            self._cases[c.id] = c

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "prec-go":
            q = self.query_one("#prec-query", Input).value.strip()
            if q:
                self.run_worker(self._search(q), exclusive=True, name="prec-search")

    def on_data_table_row_selected(self, event: DataTable.RowSelected) -> None:
        c = self._cases.get(str(event.row_key.value))
        if c:
            topics = "  ".join(f"[#4d5563 on #1a1f2a] {t} [/]" for t in c.topics)
            text = (
                f"[bold #e8eaf0]{c.name}[/]\n"
                f"[#5b8dbe]{c.citation}[/]  [#4d5563]{c.court} · {c.year}[/]\n"
                f"[#4d5563]{c.jurisdiction} · {c.disposition}[/]\n\n"
                f"[bold #8a9099]Holding[/]\n[#d4d8df]{c.holding}[/]\n\n"
                f"[bold #8a9099]Summary[/]\n[#8a9099]{c.summary}[/]\n\n"
                f"[bold #8a9099]Topics[/]\n{topics}"
            )
            self.query_one("#prec-detail", Static).update(text)
