"""CTRX — Contract Workbench screen."""
from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal, Vertical, VerticalScroll
from textual.screen import Screen
from textual.widgets import Button, DataTable, Footer, Input, Label, Select, Static

from ..client import Contract, client

RISK_STYLE = {
    "CRITICAL": "[bold red]CRITICAL[/]",
    "HIGH": "[bold #ff6d00]HIGH[/]",
    "MEDIUM": "[#ffb300]MEDIUM[/]",
    "LOW": "[green]LOW[/]",
}

CONTRACT_IDS = [
    ("standard_nda_template", "Standard NDA"),
    ("client_proposed_nda", "Client NDA (Proposed)"),
    ("master_services_agreement_tech", "Tech MSA"),
]


class CtrxScreen(Screen):
    """Contract clause analysis — analyze_clauses · suggest_clause_alternatives · negotiate."""

    BINDINGS = [("escape", "app.pop_screen", "Back")]

    def compose(self) -> ComposeResult:
        yield Static("  [bold #ffb300]CTRX[/]  Contract Workbench  ·  analyze_clauses · suggest_alternatives · negotiate", classes="panel-header")
        with Horizontal():
            with Vertical(id="ctrx-left"):
                yield Select(
                    options=[(label, cid) for cid, label in CONTRACT_IDS],
                    id="ctrx-select",
                    value="client_proposed_nda",
                )
                yield Button("ANALYZE", variant="primary", id="ctrx-analyze")
                yield DataTable(id="ctrx-clauses", cursor_type="row")
            yield VerticalScroll(Static("Select a contract and press ANALYZE, then choose a clause.", id="ctrx-detail"), id="ctrx-right")
        yield Footer()

    def on_mount(self) -> None:
        table = self.query_one("#ctrx-clauses", DataTable)
        table.add_columns("RISK", "CLAUSE")
        self._contract: Contract | None = None

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "ctrx-analyze":
            sel = self.query_one("#ctrx-select", Select)
            cid = str(sel.value)
            self.run_worker(self._load(cid), exclusive=True, name="ctrx-load")

    async def _load(self, contract_id: str) -> None:
        contract = await client.analyze_contract(contract_id)
        if not contract:
            return
        self._contract = contract
        table = self.query_one("#ctrx-clauses", DataTable)
        table.clear()
        risk_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        sorted_clauses = sorted(contract.clauses, key=lambda c: risk_order.index(c.risk))
        for cl in sorted_clauses:
            table.add_row(RISK_STYLE[cl.risk], cl.label, key=cl.key)
        # show contract summary
        missing = ", ".join(contract.missing_clauses) if contract.missing_clauses else "none"
        summary = (
            f"[bold #ffb300]{contract.title}[/]\n"
            f"[#7a5c00]Type: {contract.type} · Risk: {RISK_STYLE[contract.risk_level]}[/]\n"
            f"[#7a5c00]Governing law: {contract.governing_law} · Term: {contract.term}[/]\n"
            f"[#7a5c00]Liability cap: {contract.liability_cap or 'none'}[/]\n\n"
            f"[bold red]⚠ Missing clauses:[/] [#ff6d00]{missing}[/]\n\n"
            f"[#3d2e00]Select a clause below to view risk notes.[/]"
        )
        self.query_one("#ctrx-detail", Static).update(summary)

    def on_data_table_row_selected(self, event: DataTable.RowSelected) -> None:
        if not self._contract:
            return
        cl = next((c for c in self._contract.clauses if c.key == str(event.row_key.value)), None)
        if cl:
            text = (
                f"[bold #ffb300]{cl.label}[/]  {RISK_STYLE[cl.risk]}\n\n"
                f"[bold #c47f00]CLAUSE TEXT[/]\n[#d4a017]{cl.text}[/]\n\n"
                f"[bold #c47f00]RISK NOTE[/]\n[#ff6d00]⚠ {cl.risk_note}[/]\n\n"
                f"[#3d2e00]Use suggest_clause_alternatives to get rewrite options.[/]\n"
                f"[#3d2e00]Use deep_analyze_clause for MCP-sampling-powered reasoning.[/]"
            )
            self.query_one("#ctrx-detail", Static).update(text)
