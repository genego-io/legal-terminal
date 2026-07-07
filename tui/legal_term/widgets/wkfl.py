"""WKFL widget — workflow launcher."""
from __future__ import annotations

from textual.app import ComposeResult
from textual.containers import Horizontal, VerticalScroll
from textual.widget import Widget
from textual.widgets import ListItem, ListView, Static

from ..client import Workflow, get_client as _get_client


class WkflWidget(Widget):
    """Workflow launcher — legal-mcp-toolkit SKILL.md playbooks."""

    def compose(self) -> ComposeResult:
        yield Static(
            "  [bold #8a9099]WKFL[/]  Workflow Launcher  ·  legal-mcp-toolkit SKILL.md — 8 playbooks",
            classes="panel-header"
        )
        with Horizontal(id="wkfl-body"):
            yield ListView(id="wkfl-list")
            yield VerticalScroll(
                Static(
                    "[#4d5563]Select a workflow to view its tool-call sequence.[/]",
                    id="wkfl-detail"
                ),
                id="wkfl-right",
            )

    def on_mount(self) -> None:
        self._workflows: dict[str, Workflow] = {}
        self.run_worker(self._load(), exclusive=True, name="wkfl-load")

    async def _load(self) -> None:
        workflows = await _get_client().get_workflows()
        self._workflows = {w.id: w for w in workflows}
        lv = self.query_one("#wkfl-list", ListView)
        for w in workflows:
            lv.append(ListItem(
                Static(f"[bold #5b8dbe on #1a1f2a] {w.mnemonic} [/] [#8a9099]{w.title}[/]"),
                id=f"w-{w.id}",
            ))

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        raw_id = event.item.id or ""
        wid = raw_id.removeprefix("w-")
        w = self._workflows.get(wid)
        if w:
            steps_text = "\n\n".join(
                f"[#4d5563]{s.n}.[/] [bold #5b8dbe]{s.tool}[/]\n   [#8a9099]{s.desc}[/]"
                for s in w.steps
            )
            self.query_one("#wkfl-detail", Static).update(
                f"[bold #e8eaf0]{w.title}[/]  [#5b8dbe on #1a1f2a] {w.mnemonic} [/]\n"
                f'[#4d5563]Trigger: "{w.trigger}"[/]\n\n'
                f"[bold #8a9099]Tool call sequence (legal-mcp-toolkit SKILL.md)[/]\n\n"
                f"{steps_text}\n\n"
                f"[#4d5563]Playbook from legal-mcp-toolkit/SKILL.md · legal-mcp v1[/]\n"
                f"[#4d5563]MCP execution layer + skill methodology layer[/]"
            )
