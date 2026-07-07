"""CITE — Citation Console screen."""
from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Vertical
from textual.screen import Screen
from textual.widgets import Button, Footer, Input, Label, RadioButton, RadioSet, Static

from ..client import CitationResult, client


class CiteScreen(Screen):
    """Citation validation, normalization, and integrity checking."""

    BINDINGS = [("escape", "app.pop_screen", "Back")]

    def compose(self) -> ComposeResult:
        yield Static("  [bold #ffb300]CITE[/]  Citation Console  ·  validate · normalize · integrity", classes="panel-header")
        with Vertical(id="cite-main"):
            yield Input(placeholder="e.g. 2022 Cal.App.4th 1234", id="cite-input")
            with RadioSet(id="cite-mode"):
                yield RadioButton("Validate", value=True, id="mode-validate")
                yield RadioButton("Normalize", id="mode-normalize")
                yield RadioButton("Integrity", id="mode-integrity")
            yield Button("RUN", variant="primary", id="cite-run")
            yield Static("Enter a citation above and press RUN.", id="cite-result", classes="info-pane")
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "cite-run":
            citation = self.query_one("#cite-input", Input).value.strip()
            if citation:
                self.query_one("#cite-result", Static).update("[#7a5c00]Querying…[/]")
                self.run_worker(self._run(citation), exclusive=True)

    async def _run(self, citation: str) -> None:
        mode_set = self.query_one("#cite-mode", RadioSet)
        mode = str(mode_set.pressed_index)  # 0=validate, 1=normalize, 2=integrity
        if mode == "1":
            result = await client.normalize_citation(citation)
        elif mode == "2":
            result = await client.verify_citation_integrity(citation)
        else:
            result = await client.validate_citation(citation)
        self._show(result)

    def _show(self, r: CitationResult) -> None:
        valid_tag = "[bold green] ✓ VALID [/]" if r.valid else "[bold red] ✗ INVALID [/]"
        integrity_colors = {"verified": "green", "not_found": "yellow", "mismatch": "red"}
        ic = integrity_colors.get(r.integrity, "white")
        integrity_tag = f"[{ic}]{r.integrity.upper().replace('_', ' ')}[/]"
        issues_text = "\n".join(f"  [red]⚠ {i}[/]" for i in r.issues) if r.issues else "  [green]None[/]"
        text = (
            f"{valid_tag}  {integrity_tag}\n\n"
            f"[#c47f00]Input      [/] [#d4a017]{r.citation}[/]\n"
            f"[#c47f00]Normalized [/] [#d4a017]{r.normalized}[/]\n"
            f"[#c47f00]Reporter   [/] [#d4a017]{r.reporter or '—'}[/]\n"
            f"[#c47f00]Name       [/] [#7a5c00]{r.reporter_name}[/]\n\n"
            f"[bold #c47f00]ISSUES[/]\n{issues_text}\n\n"
            f"[#3d2e00]tool: validate_citation / normalize_citation / verify_citation_integrity[/]"
        )
        self.query_one("#cite-result", Static).update(text)
