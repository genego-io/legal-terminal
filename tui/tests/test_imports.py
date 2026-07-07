"""Smoke tests — verify all modules import and instantiate cleanly."""
import pytest


def test_app_imports() -> None:
    from legal_term.app import LegalTermApp
    assert LegalTermApp is not None


def test_mock_client_imports() -> None:
    from legal_term.client import MockClient, LegalMcpClient
    assert MockClient is not None
    assert LegalMcpClient is not None


def test_mock_client_is_protocol_compliant() -> None:
    from legal_term.client import MockClient, LegalMcpClient
    c = MockClient()
    assert isinstance(c, LegalMcpClient)


def test_widget_imports() -> None:
    from legal_term.widgets.prec import PrecWidget
    from legal_term.widgets.cite import CiteWidget
    from legal_term.widgets.ctrx import CtrxWidget
    from legal_term.widgets.jobs import JobsWidget
    from legal_term.widgets.wkfl import WkflWidget
    from legal_term.widgets.audt import AudtWidget
    for cls in (PrecWidget, CiteWidget, CtrxWidget, JobsWidget, WkflWidget, AudtWidget):
        assert cls is not None


def test_singleton_client() -> None:
    from legal_term.client import client, LegalMcpClient
    assert isinstance(client, LegalMcpClient)


def test_dataclasses_have_fields() -> None:
    from legal_term.client import (
        Case, Statute, ContractClause, Contract, AnalysisJob,
        CitationResult, PrivilegeResult, WorkflowStep, Workflow, AuditEntry,
    )
    import dataclasses
    for cls in (Case, Statute, ContractClause, Contract, AnalysisJob,
                CitationResult, PrivilegeResult, WorkflowStep, Workflow, AuditEntry):
        assert dataclasses.is_dataclass(cls), f"{cls.__name__} is not a dataclass"
        assert len(dataclasses.fields(cls)) > 0
