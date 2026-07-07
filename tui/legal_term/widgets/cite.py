"""CITE widget — citation console."""
from __future__ import annotations

from textual.app import ComposeResult
from textual.widget import Widget
from textual.widgets import Button, Input, RadioButton, RadioSet, Static

from ..client import CitationResult, client


class CiteWidget(Widget):
    """Citation validation, normalization, and integrity checking."""

    def compose(self) -> ComposeResult:
        yield Static(
            "  [bold #8a9099]CITE[/]  Citation Console  ·  validate · normalize · integrity",
            classes="panel-header"
        )
        yield Input(placeholder="e.g. 2022 Cal.App.4th 1234", id="cite-input")
        with RadioSet(id="cite-mode"):
            yield RadioButton("Validate", value=True, id="mode-validate")
            yield RadioButton("Normalize", id="mode-normalize")
            yield RadioButton("Integrity", id="mode-integrity")
        yield Button("Run", variant="primary", id="cite-run")
        yield Static("[#4d5563]Enter a citation above and press Run.[/]", id="cite-result", classes="detail-pane")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "cite-run":
            citation = self.query_one("#cite-input", Input).value.strip()
            if citation:
                self.query_one("#cite-result", Static).update("[#4d5563]Querying…[/]")
                self.run_worker(self._run(citation), exclusive=True, name="cite-run")

    async def _run(self, citation: str) -> None:
        mode_set = self.query_one("#cite-mode", RadioSet)
        idx = mode_set.pressed_index
        if idx == 1:
            result = await client.normalize_citation(citation)
        elif idx == 2:
            result = await client.verify_citation_integrity(citation)
        else:
            result = await client.validate_citation(citation)
        self._show(result)

    def _show(self, r: CitationResult) -> None:
        valid_color = "#6fa370" if r.valid else "#c25b5b"
        valid_label = "Valid" if r.valid else "Invalid"
        ic = {"verified": "#6fa370", "not_found": "#b3a44f", "mismatch": "#c25b5b"}.get(r.integrity, "#8a9099")
        integrity_label = r.integrity.replace("_", " ")
        issues = "\n".join(f"  [#c25b5b]↳ {i}[/]" for i in r.issues) if r.issues else "  [#6fa370]None[/]"
        self.query_one("#cite-result", Static).update(
            f"[bold {valid_color}]{valid_label}[/]  [{ic}]{integrity_label}[/]\n\n"
            f"[#8a9099]Input      [/] [#d4d8df]{r.citation}[/]\n"
            f"[#8a9099]Normalized [/] [#d4d8df]{r.normalized}[/]\n"
            f"[#8a9099]Reporter   [/] [#d4d8df]{r.reporter or '—'}[/]\n"
            f"[#8a9099]Name       [/] [#8a9099]{r.reporter_name}[/]\n\n"
            f"[bold #8a9099]Issues[/]\n{issues}\n\n"
            f"[#4d5563]tool: validate_citation / normalize_citation / verify_citation_integrity[/]"
        )
