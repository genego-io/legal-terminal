"""CTRX widget — contract workbench."""
from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal, VerticalScroll
from textual.widget import Widget
from textual.widgets import Button, DataTable, Select, Static

from ..client import Contract, client

RISK_STYLE = {
    "CRITICAL": "[#c25b5b]CRITICAL[/]",
    "HIGH":     "[#c2854f]HIGH[/]",
    "MEDIUM":   "[#b3a44f]MEDIUM[/]",
    "LOW":      "[#6fa370]LOW[/]",
}

CONTRACT_OPTIONS = [
    ("Standard NDA", "standard_nda_template"),
    ("Client NDA (Proposed)", "client_proposed_nda"),
    ("Tech MSA", "master_services_agreement_tech"),
]


class CtrxWidget(Widget):
    """Contract workbench — analyze_clauses · suggest_alternatives."""

    def compose(self) -> ComposeResult:
        yield Static(
            "  [bold #8a9099]CTRX[/]  Contract Workbench  ·  analyze_clauses · suggest_alternatives · negotiate",
            classes="panel-header"
        )
        with Horizontal(id="ctrx-controls"):
            yield Select(options=CONTRACT_OPTIONS, id="ctrx-select", value="client_proposed_nda")
            yield Button("Analyze", variant="primary", id="ctrx-analyze")
        with Horizontal(id="ctrx-body"):
            yield DataTable(id="ctrx-clauses", cursor_type="row")
            yield VerticalScroll(
                Static(
                    "[#4d5563]Select a contract and press Analyze, then choose a clause.[/]",
                    id="ctrx-detail"
                ),
                id="ctrx-right",
            )

    def on_mount(self) -> None:
        table = self.query_one("#ctrx-clauses", DataTable)
        table.add_columns("Risk", "Clause")
        self._contract: Contract | None = None

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "ctrx-analyze":
            cid = str(self.query_one("#ctrx-select", Select).value)
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
        missing = ", ".join(contract.missing_clauses) if contract.missing_clauses else "none"
        self.query_one("#ctrx-detail", Static).update(
            f"[bold #e8eaf0]{contract.title}[/]\n"
            f"[#8a9099]Type: {contract.type} · Risk: {RISK_STYLE[contract.risk_level]}[/]\n"
            f"[#8a9099]Law: {contract.governing_law} · Term: {contract.term}[/]\n"
            f"[#8a9099]Cap: {contract.liability_cap or '—'}[/]\n\n"
            f"[#b3a44f]Missing:[/] [#8a9099]{missing}[/]\n\n"
            f"[#4d5563]Select a clause to view risk notes.[/]"
        )

    def on_data_table_row_selected(self, event: DataTable.RowSelected) -> None:
        if not self._contract:
            return
        cl = next((c for c in self._contract.clauses if c.key == str(event.row_key.value)), None)
        if cl:
            self.query_one("#ctrx-detail", Static).update(
                f"[bold #e8eaf0]{cl.label}[/]  {RISK_STYLE[cl.risk]}\n\n"
                f"[bold #8a9099]Clause text[/]\n[#d4d8df]{cl.text}[/]\n\n"
                f"[bold #8a9099]Risk note[/]\n[#c2854f]↳ {cl.risk_note}[/]\n\n"
                f"[#4d5563]suggest_clause_alternatives → rewrite options[/]\n"
                f"[#4d5563]deep_analyze_clause → MCP-sampling reasoning[/]"
            )
