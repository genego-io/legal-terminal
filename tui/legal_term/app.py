"""Legal Terminal — Bloomberg-style TUI over legal-mcp."""
from __future__ import annotations

from pathlib import Path
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.widgets import Input, Label, Static, TabbedContent, TabPane

from .widgets.prec import PrecWidget
from .widgets.cite import CiteWidget
from .widgets.ctrx import CtrxWidget
from .widgets.jobs import JobsWidget
from .widgets.wkfl import WkflWidget
from .widgets.audt import AudtWidget

CSS_PATH = Path(__file__).parent / "theme.tcss"

HELP_TEXT = """\
[bold #e8eaf0]Legal Terminal[/]  ·  Bloomberg-style keyboard-first terminal over legal-mcp

[bold #8a9099]Mnemonics[/] (type in command bar + Enter):
  [bold #5b8dbe]PREC[/]  Precedent & case search       [bold #5b8dbe]CITE[/]  Citation validate / normalize
  [bold #5b8dbe]CTRX[/]  Contract workbench             [bold #5b8dbe]JOBS[/]  Background analysis queue
  [bold #5b8dbe]WKFL[/]  Workflow / playbook launcher   [bold #5b8dbe]AUDT[/]  Audit log

[bold #8a9099]Keyboard shortcuts[/]:
  F1  This help             F2  PREC  ·  Precedent search
  F3  CITE  ·  Citations    F4  CTRX  ·  Contract workbench
  F5  JOBS  ·  Analysis Q   F6  WKFL  ·  Skill playbooks
  F7  AUDT  ·  Audit log    Ctrl+P  Command palette   q  Quit

[bold #8a9099]Command bar[/]:
  Type a mnemonic (e.g. [#5b8dbe]PREC breach of contract[/]) and press Enter.
  Supported: PREC / CASE / CITE / CTRX / JOBS / WKFL / AUDT / HELP

[bold #8a9099]Backend[/]:
  Running with [#4d5563]MockClient[/] (fixtures/). Replace with [#4d5563]LiveClient[/]
  in legal_term/client.py using the official mcp SDK over stdio/SSE.

[#4d5563]Not legal advice. Output is a scaffold for attorney review.
ABA Model Rule 1.6 · United States v. Heppner (S.D.N.Y. Feb. 2026)[/]
"""

TAB_MAP = {
    "PREC": "tab-prec", "CASE": "tab-prec",
    "CITE": "tab-cite",
    "CTRX": "tab-ctrx",
    "JOBS": "tab-jobs",
    "WKFL": "tab-wkfl",
    "AUDT": "tab-audt",
    "HELP": "tab-help",
}


class LegalTermApp(App):
    """Bloomberg-style legal terminal TUI."""

    CSS_PATH = str(CSS_PATH)

    BINDINGS = [
        Binding("f1", "open('tab-help')", "Help"),
        Binding("f2", "open('tab-prec')", "PREC"),
        Binding("f3", "open('tab-cite')", "CITE"),
        Binding("f4", "open('tab-ctrx')", "CTRX"),
        Binding("f5", "open('tab-jobs')", "JOBS"),
        Binding("f6", "open('tab-wkfl')", "WKFL"),
        Binding("f7", "open('tab-audt')", "AUDT"),
        Binding("ctrl+p", "command_palette", "Palette"),
        Binding("q", "quit", "Quit"),
    ]

    def compose(self) -> ComposeResult:
        yield Static(
            "[bold #e8eaf0]Legal Terminal[/]"
            "  [#252b38]│[/]  "
            "[#4d5563]legal-mcp[/]  [#6fa370]●[/] SSE :8000"
            "  [#252b38]│[/]  "
            "[#4d5563]○ CourtListener off[/]"
            "  [#252b38]│[/]  "
            "[#b3a44f]○ PACER off[/]"
            "  [#252b38]│[/]  "
            "[#4d5563]mock mode[/]",
            id="app-header",
        )

        with Static(id="cmd-bar"):
            yield Label("[#5b8dbe]›[/] ", id="cmd-prompt")
            yield Input(
                placeholder="PREC breach of contract  ·  CITE 2022 Cal.App.4th 1234  ·  CTRX",
                id="cmd-input",
            )

        with TabbedContent(id="main-tabs", initial="tab-help"):
            with TabPane("F1 Help", id="tab-help"):
                yield Static(HELP_TEXT, id="help-content", classes="detail-pane")
            with TabPane("F2 PREC", id="tab-prec"):
                yield PrecWidget()
            with TabPane("F3 CITE", id="tab-cite"):
                yield CiteWidget()
            with TabPane("F4 CTRX", id="tab-ctrx"):
                yield CtrxWidget()
            with TabPane("F5 JOBS", id="tab-jobs"):
                yield JobsWidget()
            with TabPane("F6 WKFL", id="tab-wkfl"):
                yield WkflWidget()
            with TabPane("F7 AUDT", id="tab-audt"):
                yield AudtWidget()

        yield Static(
            "  [#4d5563]F1[/] Help  [#4d5563]F2[/] PREC  [#4d5563]F3[/] CITE  "
            "[#4d5563]F4[/] CTRX  [#4d5563]F5[/] JOBS  [#4d5563]F6[/] WKFL  "
            "[#4d5563]F7[/] AUDT  [#4d5563]Ctrl+P[/] Palette  [#4d5563]q[/] Quit",
            id="status-bar",
        )

    def on_input_submitted(self, event: Input.Submitted) -> None:
        if event.input.id != "cmd-input":
            return
        raw = event.value.strip().upper()
        event.input.value = ""
        if not raw:
            return
        mnemonic = raw.split()[0]
        tab = TAB_MAP.get(mnemonic)
        if tab:
            self._switch(tab)

    def action_open(self, tab_id: str) -> None:
        self._switch(tab_id)

    def _switch(self, tab_id: str) -> None:
        try:
            self.query_one("#main-tabs", TabbedContent).active = tab_id
        except Exception:
            pass
