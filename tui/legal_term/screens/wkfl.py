"""WKFL — Workflow Launcher screen."""
from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal, VerticalScroll
from textual.screen import Screen
from textual.widgets import DataTable, Footer, Label, ListItem, ListView, Static

from ..client import Workflow, client


class WkflScreen(Screen):
    """Workflow launcher — legal-mcp-toolkit SKILL.md playbooks."""

    BINDINGS = [("escape", "app.pop_screen", "Back")]

    def compose(self) -> ComposeResult:
        yield Static("  [bold #ffb300]WKFL[/]  Workflow Launcher  ·  legal-mcp-toolkit SKILL.md", classes="panel-header")
        with Horizontal():
            yield ListView(id="wkfl-list")
            yield VerticalScroll(Static("Select a workflow to view its tool-call sequence.", id="wkfl-detail"), id="wkfl-right")
        yield Footer()

    def on_mount(self) -> None:
        self.run_worker(self._load(), exclusive=True, name="wkfl-load")

    async def _load(self) -> None:
        workflows = await client.get_workflows()
        self._workflows = {w.id: w for w in workflows}
        lv = self.query_one("#wkfl-list", ListView)
        for w in workflows:
            lv.append(ListItem(
                Static(f"[bold #ffb300 on #1a1400] {w.mnemonic} [/] [#c47f00]{w.title}[/]"),
                id=f"wkfl-{w.id}",
            ))

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        wid = event.item.id or ""
        wid = wid.removeprefix("wkfl-")
        w = getattr(self, "_workflows", {}).get(wid)
        if w:
            self._show(w)

    def _show(self, w: Workflow) -> None:
        steps_text = "\n".join(
            f"[#3d2e00]{s.n}.[/] [bold #ffb300]{s.tool}[/]\n   [#7a5c00]{s.desc}[/]"
            for s in w.steps
        )
        text = (
            f"[bold #ffb300]{w.title}[/]  [bold #ffb300 on #1a1400] {w.mnemonic} [/]\n"
            f'[#7a5c00]Trigger: "{w.trigger}"[/]\n\n'
            f"[bold #c47f00]TOOL CALL SEQUENCE (legal-mcp-toolkit SKILL.md)[/]\n\n"
            f"{steps_text}\n\n"
            f"[#3d2e00]Playbook from legal-mcp-toolkit/SKILL.md · legal-mcp v1[/]"
        )
        self.query_one("#wkfl-detail", Static).update(text)
