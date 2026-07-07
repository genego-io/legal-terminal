"""
LiveClient — connects to a running legal-mcp SSE server.

Usage:
  Set  LEGAL_MCP_URL=http://localhost:8000  in your environment (or a .env
  file loaded before starting the TUI), then run:

      legal-term --live

  Or import and pass directly:
      from legal_term.live_client import LiveClient
      app = LegalTermApp(client=LiveClient())

The server must already be running:
    cd legal-mcp && pip install -e . && python main.py --transport sse
"""
from __future__ import annotations

import json
from typing import Any

from mcp import ClientSession
from mcp.client.sse import sse_client

from .client import (
    AnalysisJob, AuditEntry, Case, CitationResult, Contract, ContractClause,
    LegalMcpClient, PrivilegeResult, Statute, Workflow, WorkflowStep,
)

FIXTURES_WORKFLOWS = None  # lazy-loaded fallback for get_workflows


async def _call(session: ClientSession, name: str, **kwargs: Any) -> Any:
    """Call an MCP tool and parse the JSON text result."""
    result = await session.call_tool(name, arguments=kwargs)
    for part in result.content:
        if hasattr(part, "text"):
            return json.loads(part.text)
    raise RuntimeError(f"Tool {name!r} returned no text content")


# ─── normalisers ─────────────────────────────────────────────────────────────

def _case(d: dict[str, Any]) -> Case:
    return Case(
        id=d.get("id", ""),
        name=d.get("name", d.get("caseName", "")),
        citation=d.get("citation", ""),
        court=d.get("court", ""),
        jurisdiction=d.get("jurisdiction", ""),
        year=int(d.get("year", 0)),
        topics=d.get("topics", []),
        holding=d.get("holding", ""),
        summary=d.get("summary", ""),
        disposition=d.get("disposition", ""),
        relevance_score=float(d.get("relevance_score", 0.5)),
        cites=d.get("cites", []),
    )


def _statute(d: dict[str, Any]) -> Statute:
    return Statute(
        id=d.get("id", ""),
        title=d.get("title", ""),
        jurisdiction=d.get("jurisdiction", ""),
        citation=d.get("citation", ""),
        text=d.get("text", ""),
        enacted=d.get("enacted", ""),
        last_amended=d.get("last_amended", ""),
        history=d.get("history", ""),
        topics=d.get("topics", []),
    )


def _clause(d: dict[str, Any]) -> ContractClause:
    return ContractClause(
        key=d.get("key", d.get("clause_type", "")),
        label=d.get("label", d.get("name", d.get("clause_type", ""))),
        text=d.get("text", d.get("content", "")),
        risk=str(d.get("risk", d.get("risk_level", "MEDIUM"))).upper(),
        risk_note=d.get("risk_note", d.get("note", d.get("rationale", ""))),
    )


def _contract(contract_id: str, d: dict[str, Any]) -> Contract:
    raw_clauses = d.get("clauses", [])
    clauses = [_clause(c) for c in raw_clauses] if isinstance(raw_clauses, list) else []
    return Contract(
        id=contract_id,
        title=d.get("title", d.get("contract_id", contract_id)),
        type=d.get("type", d.get("contract_type", "Unknown")),
        risk_level=str(d.get("risk_level", "MEDIUM")).upper(),
        clauses=clauses,
        missing_clauses=d.get("missing_clauses", []),
        parties=d.get("parties", {}),
        governing_law=d.get("governing_law", ""),
        term=d.get("term", ""),
        liability_cap=d.get("liability_cap"),
    )


def _cite_result(citation: str, d: dict[str, Any]) -> CitationResult:
    return CitationResult(
        citation=citation,
        valid=bool(d.get("valid", d.get("is_valid", True))),
        normalized=str(d.get("normalized", d.get("normal", citation))),
        reporter=str(d.get("reporter", "")),
        reporter_name=str(d.get("reporter_name", d.get("reporter", ""))),
        issues=list(d.get("issues", d.get("errors", []))),
        integrity=str(d.get("integrity", "not_found" if not d.get("in_database") else "verified")),
    )


def _job(d: dict[str, Any]) -> AnalysisJob:
    return AnalysisJob(
        id=str(d.get("job_id", d.get("id", ""))),
        file=str(d.get("file_path", d.get("file", ""))),
        status=str(d.get("status", "queued")),
        queued_at=str(d.get("created_at", d.get("queued_at", ""))),
        completed_at=d.get("updated_at", d.get("completed_at")),
        risk_level=d.get("risk_level"),
        clause_count=d.get("clause_count"),
        flags=d.get("flags"),
        error=d.get("error"),
    )


# ─── LiveClient ──────────────────────────────────────────────────────────────

class LiveClient:
    """LegalMcpClient implementation that calls the live SSE server."""

    def __init__(self, url: str = "http://localhost:8000") -> None:
        self._url = url

    # Every public method opens a fresh SSE connection for simplicity.
    # For production, maintain a long-lived session instead.

    async def _session(self):  # type: ignore[return]
        """Async context manager yielding an active ClientSession."""
        async with sse_client(f"{self._url}/sse") as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                yield session

    async def search_precedents(self, query: str) -> list[Case]:
        async with self._session() as s:
            data = await _call(s, "search_precedents", query=query)
            return [_case(c) for c in data.get("results", [])]

    async def extract_statute(self, statute_id: str) -> Statute | None:
        async with self._session() as s:
            data = await _call(s, "extract_statute", statute_id=statute_id)
            return None if data.get("error") else _statute(data)

    async def validate_citation(self, citation: str) -> CitationResult:
        async with self._session() as s:
            data = await _call(s, "validate_citation", citation=citation)
            return _cite_result(citation, data)

    async def normalize_citation(self, citation: str) -> CitationResult:
        async with self._session() as s:
            data = await _call(s, "normalize_citation", citation=citation)
            return _cite_result(citation, data)

    async def verify_citation_integrity(self, citation: str) -> CitationResult:
        async with self._session() as s:
            data = await _call(s, "verify_citation_integrity", citation=citation)
            return _cite_result(citation, data)

    async def analyze_contract(self, contract_id: str) -> Contract | None:
        try:
            async with self._session() as s:
                data = await _call(s, "analyze_clauses", contract_id=contract_id)
                return _contract(contract_id, data)
        except Exception:
            return None

    async def list_contracts(self) -> list[Contract]:
        return []  # no list-all tool on the server

    async def get_analysis_jobs(self) -> list[AnalysisJob]:
        async with self._session() as s:
            data = await _call(s, "list_analysis_jobs")
            return [_job(j) for j in data.get("jobs", [])]

    async def queue_document_analysis(self, file: str) -> AnalysisJob:
        async with self._session() as s:
            data = await _call(s, "queue_document_analysis", file_path=file)
            return AnalysisJob(
                id=str(data.get("job_id", "")),
                file=file,
                status="queued",
                queued_at=str(data.get("created_at", "")),
                completed_at=None,
                risk_level=None,
                clause_count=None,
                flags=None,
            )

    async def check_privilege_risk(self, _file: str, provider: str) -> PrivilegeResult:
        async with self._session() as s:
            data = await _call(s, "check_privilege_risk", provider=provider)
            risk = str(data.get("risk_level", "HIGH")).upper()
            return PrivilegeResult(
                risk=risk,
                label=f"{risk} — {provider}",
                provider=provider,
                indicators=data.get("privilege_indicators", []),
                recommendation=str(data.get("recommendation", "")),
                notice=str(data.get("notice", "")),
            )

    async def get_workflows(self) -> list[Workflow]:
        # Server has no list-all-workflows tool; fall back to fixtures.
        import json
        from pathlib import Path
        p = Path(__file__).parent.parent.parent / "fixtures" / "workflows.json"
        raw = json.loads(p.read_text(encoding="utf-8")) if p.exists() else []
        return [
            Workflow(
                id=w["id"], mnemonic=w["mnemonic"], title=w["title"],
                trigger=w["trigger"],
                steps=[WorkflowStep(**s) for s in w["steps"]],
            )
            for w in raw
        ]

    async def get_audit_log(self) -> list[AuditEntry]:
        # Audit log is local-only on the server side; not exposed via tool.
        return []


# Confirm the class satisfies the protocol
assert isinstance(LiveClient(), LegalMcpClient), "LiveClient does not satisfy LegalMcpClient protocol"
