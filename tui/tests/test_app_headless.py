"""Headless Textual app smoke tests using run_test()."""
import pytest
from legal_term.app import LegalTermApp


async def test_app_starts_on_help_tab() -> None:
    """App should start on the help tab without errors."""
    app = LegalTermApp()
    async with app.run_test(size=(120, 35)) as pilot:
        await pilot.pause(0.2)
        tabs = app.query_one("#main-tabs")
        assert tabs.active == "tab-help"


async def test_f2_switches_to_prec() -> None:
    app = LegalTermApp()
    async with app.run_test(size=(120, 35)) as pilot:
        await pilot.press("f2")
        await pilot.pause(0.3)
        tabs = app.query_one("#main-tabs")
        assert tabs.active == "tab-prec"


async def test_f4_switches_to_ctrx() -> None:
    app = LegalTermApp()
    async with app.run_test(size=(120, 35)) as pilot:
        await pilot.press("f4")
        await pilot.pause(0.3)
        tabs = app.query_one("#main-tabs")
        assert tabs.active == "tab-ctrx"


async def test_f5_switches_to_jobs() -> None:
    app = LegalTermApp()
    async with app.run_test(size=(120, 35)) as pilot:
        await pilot.press("f5")
        await pilot.pause(0.3)
        tabs = app.query_one("#main-tabs")
        assert tabs.active == "tab-jobs"


async def test_command_bar_mnemonic_navigate() -> None:
    """Typing a mnemonic in the command bar should switch tabs."""
    app = LegalTermApp()
    async with app.run_test(size=(120, 35)) as pilot:
        await pilot.click("#cmd-input")
        for ch in "CITE":
            await pilot.press(ch)
        await pilot.press("enter")
        await pilot.pause(0.2)
        tabs = app.query_one("#main-tabs")
        assert tabs.active == "tab-cite"


async def test_unknown_mnemonic_does_not_crash() -> None:
    """Unknown mnemonics should be silently ignored."""
    app = LegalTermApp()
    async with app.run_test(size=(120, 35)) as pilot:
        await pilot.click("#cmd-input")
        for ch in "ZZZZZ":
            await pilot.press(ch)
        await pilot.press("enter")
        await pilot.pause(0.1)
        # app should still be on help tab
        tabs = app.query_one("#main-tabs")
        assert tabs.active == "tab-help"


async def test_all_tabs_mountable() -> None:
    """All tabs can be activated without raising exceptions."""
    app = LegalTermApp()
    async with app.run_test(size=(120, 40)) as pilot:
        for key, tab_id in [
            ("f2", "tab-prec"), ("f3", "tab-cite"), ("f4", "tab-ctrx"),
            ("f5", "tab-jobs"), ("f6", "tab-wkfl"), ("f7", "tab-audt"),
        ]:
            await pilot.press(key)
            await pilot.pause(0.3)
            tabs = app.query_one("#main-tabs")
            assert tabs.active == tab_id, f"Expected {tab_id} after pressing {key}"
