"""
LegalMcpClient protocol + MockClient for the TUI MVP.
Shares data with fixtures/ at repo root.
"""
from __future__ import annotations

import asyncio
import copy
import json
import random
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol, runtime_checkable

FIXTURES = Path(__file__).parent.parent.parent / "fixtures"


# ─────────────────────────── data shapes ────────────────────────────


@dataclass
class Case:
    id: str
    name: str
    citation: str
    court: str
    jurisdiction: str
    year: int
    topics: list[str]
    holding: str
    summary: str
    disposition: str
    relevance_score: float
    cites: list[str]


@dataclass
class Statute:
    id: str
    title: str
    jurisdiction: str
    citation: str
    text: str
    enacted: str
    last_amended: str
    history: str
    topics: list[str]


@dataclass
class ContractClause:
    key: str
    label: str
    text: str
    risk: str  # CRITICAL | HIGH | MEDIUM | LOW
    risk_note: str


@dataclass
class Contract:
    id: str
    title: str
    type: str
    risk_level: str
    clauses: list[ContractClause]
    missing_clauses: list[str]
    parties: dict[str, str]
    governing_law: str
    term: str
    liability_cap: str | None


@dataclass
class AnalysisJob:
    id: str
    file: str
    status: str  # queued | processing | complete | error
    queued_at: str
    completed_at: str | None
    risk_level: str | None
    clause_count: int | None
    flags: int | None
    error: str | None = None


@dataclass
class CitationResult:
    citation: str
    valid: bool
    normalized: str
    reporter: str
    reporter_name: str
    issues: list[str]
    integrity: str  # verified | not_found | mismatch


@dataclass
class PrivilegeResult:
    risk: str
    label: str
    provider: str
    indicators: list[str]
    recommendation: str
    notice: str


@dataclass
class WorkflowStep:
    n: int
    tool: str
    desc: str


@dataclass
class Workflow:
    id: str
    mnemonic: str
    title: str
    trigger: str
    steps: list[WorkflowStep]


@dataclass
class AuditEntry:
    id: str
    timestamp: str
    tool: str
    user: str
    category: str
    input: dict[str, Any]
    success: bool
    duration_ms: int


# ─────────────────────────── protocol ────────────────────────────


@runtime_checkable
class LegalMcpClient(Protocol):
    async def search_precedents(self, query: str) -> list[Case]: ...
    async def extract_statute(self, statute_id: str) -> Statute | None: ...
    async def validate_citation(self, citation: str) -> CitationResult: ...
    async def normalize_citation(self, citation: str) -> CitationResult: ...
    async def verify_citation_integrity(self, citation: str) -> CitationResult: ...
    async def analyze_contract(self, contract_id: str) -> Contract | None: ...
    async def list_contracts(self) -> list[Contract]: ...
    async def get_analysis_jobs(self) -> list[AnalysisJob]: ...
    async def queue_document_analysis(self, file: str) -> AnalysisJob: ...
    async def compare_contracts(self, a: str, b: str) -> dict[str, Any]: ...
    async def suggest_alternatives(self, clause_text: str, clause_type: str) -> list[str]: ...
    async def generate_negotiation_guide(self, contract_id: str, party_role: str) -> dict[str, Any]: ...
    async def check_privilege_risk(self, file: str, provider: str) -> PrivilegeResult: ...
    async def get_workflows(self) -> list[Workflow]: ...
    async def get_audit_log(self) -> list[AuditEntry]: ...


# ─────────────────────────── mock client ────────────────────────────


def _load_obj(name: str) -> Any:
    p = FIXTURES / name
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def _load(name: str) -> list[dict[str, Any]]:
    data = _load_obj(name)
    return data if isinstance(data, list) else []


_ZERO_RESULT = ("xyzzy_nomatchwhatsoever", "quantum entanglement liability", "no results expected")


def _make_case(d: dict[str, Any]) -> Case:
    return Case(**{k: d[k] for k in Case.__dataclass_fields__})


def _make_statute(d: dict[str, Any]) -> Statute:
    return Statute(**{k: d[k] for k in Statute.__dataclass_fields__})


def _make_contract(d: dict[str, Any]) -> Contract:
    clauses = [ContractClause(**c) for c in d["clauses"]]
    return Contract(
        id=d["id"], title=d["title"], type=d["type"], risk_level=d["risk_level"],
        clauses=clauses, missing_clauses=d["missing_clauses"],
        parties=d["parties"], governing_law=d["governing_law"],
        term=d["term"], liability_cap=d["liability_cap"],
    )


def _make_workflow(d: dict[str, Any]) -> Workflow:
    steps = [WorkflowStep(**s) for s in d["steps"]]
    return Workflow(id=d["id"], mnemonic=d["mnemonic"], title=d["title"],
                    trigger=d["trigger"], steps=steps)


_REPORTERS = ["Cal.App.4th", "Cal.4th", "F.3d", "F. Supp. 3d", "U.S.", "Eng. Rep.",
               "Del. Ch.", "Cal.5th"]


class MockClient:
    def __init__(self) -> None:
        self._cases = [_make_case(c) for c in _load("cases.json")]
        self._statutes = [_make_statute(s) for s in _load("statutes.json")]
        self._contracts = [_make_contract(c) for c in _load("contracts.json")]
        raw_jobs = _load("jobs.json")
        self._jobs: list[AnalysisJob] = [
            AnalysisJob(**{k: j.get(k) for k in AnalysisJob.__dataclass_fields__})
            for j in raw_jobs
        ]
        self._seed_audit = [
            AuditEntry(
                id=e["id"], timestamp=e["timestamp"], tool=e["tool"],
                user=e["user"], category=e["category"], input=e["input"],
                success=e["success"], duration_ms=e["duration_ms"],
            )
            for e in _load("audit_log.json")
        ]
        self._session_audit: list[AuditEntry] = []
        self._workflows = [_make_workflow(w) for w in _load("workflows.json")]
        self._negotiation_guides = _load_obj("negotiation_guides.json")
        self._clause_alternatives = _load_obj("clause_alternatives.json")
        self._document_profiles = _load_obj("document_profiles.json")
        self._job_counter = len(self._jobs) + 1
        self._audit_counter = len(self._seed_audit) + 1

    def _log_audit(self, tool: str, category: str, inp: dict[str, Any], success: bool = True, ms: int = 50) -> None:
        self._audit_counter += 1
        self._session_audit.insert(0, AuditEntry(
            id=f"a-{self._audit_counter:03d}",
            timestamp=datetime.now(timezone.utc).isoformat(),
            tool=tool, user="attorney", category=category, input=inp,
            success=success, duration_ms=ms,
        ))
        self._session_audit = self._session_audit[:50]

    @staticmethod
    def _basename(path: str) -> str:
        return path.replace("\\", "/").split("/")[-1]

    @staticmethod
    async def _delay(ms: float = 300) -> None:
        await asyncio.sleep((ms + random.uniform(0, 150)) / 1000)

    def _rank(self, query: str) -> list[Case]:
        q = query.lower()
        scored = []
        for c in self._cases:
            boost = any(q in t for t in c.topics) or q in c.name.lower() or q in c.holding.lower()
            scored.append((c.relevance_score if boost else c.relevance_score * 0.4, c))
        return [c for _, c in sorted(scored, key=lambda x: -x[0])]

    async def search_precedents(self, query: str) -> list[Case]:
        await self._delay(400)
        q = query.lower().strip()
        if any(z in q for z in _ZERO_RESULT):
            self._log_audit("search_precedents", "search", {"query": query})
            return []
        self._log_audit("search_precedents", "search", {"query": query})
        return self._rank(query)

    async def extract_statute(self, statute_id: str) -> Statute | None:
        await self._delay(250)
        return next((s for s in self._statutes
                     if s.id == statute_id or statute_id in s.citation), None)

    def _build_cite_result(self, citation: str) -> CitationResult:
        matched = next((c for c in self._cases if c.citation == citation.strip()), None)
        reporter = next((r for r in _REPORTERS if r in citation), "")
        valid = bool(reporter and any(ch.isdigit() for ch in citation))
        issues = [] if valid else (
            ["Unrecognized reporter"] + (["Missing year"] if not any(ch.isdigit() for ch in citation) else [])
        )
        integrity = "verified" if matched else ("not_found" if valid else "mismatch")
        return CitationResult(
            citation=citation,
            valid=valid,
            normalized=citation.replace("  ", " ").strip(),
            reporter=reporter,
            reporter_name=reporter or "Unknown reporter",
            issues=issues,
            integrity=integrity,
        )

    async def validate_citation(self, citation: str) -> CitationResult:
        await self._delay(200)
        return self._build_cite_result(citation)

    async def normalize_citation(self, citation: str) -> CitationResult:
        await self._delay(150)
        norm = (citation.replace("Corporation", "Corp.").replace("Incorporated", "Inc.")
                        .replace("Industries", "Indus.").replace("Solutions", "Sols.").strip())
        return self._build_cite_result(norm)

    async def verify_citation_integrity(self, citation: str) -> CitationResult:
        await self._delay(300)
        return self._build_cite_result(citation)

    async def analyze_contract(self, contract_id: str) -> Contract | None:
        await self._delay(350)
        return next((c for c in self._contracts if c.id == contract_id), None)

    async def list_contracts(self) -> list[Contract]:
        await self._delay(100)
        return self._contracts

    async def compare_contracts(self, a: str, b: str) -> dict[str, Any]:
        await self._delay(500)
        base = next((c for c in self._contracts if c.id == a), self._contracts[0])
        compare = next((c for c in self._contracts if c.id == b), self._contracts[1])
        all_keys = {cl.key for cl in base.clauses} | {cl.key for cl in compare.clauses}
        diffs: list[dict[str, str]] = []
        for key in all_keys:
            bc = next((c for c in base.clauses if c.key == key), None)
            cc = next((c for c in compare.clauses if c.key == key), None)
            if bc and cc and bc.text != cc.text:
                diffs.append({"key": key, "change": f"Text changed ({bc.risk} → {cc.risk})"})
            elif bc and not cc:
                diffs.append({"key": key, "change": f"Removed in compare ({bc.risk})"})
            elif cc and not bc:
                diffs.append({"key": key, "change": f"Added in compare ({cc.risk})"})
        self._log_audit("compare_contracts", "contract", {"contract_id_1": a, "contract_id_2": b})
        return {"base": base, "compare": compare, "diffs": diffs}

    async def suggest_alternatives(self, clause_text: str, clause_type: str) -> list[str]:
        await self._delay(400)
        alts = self._clause_alternatives.get(clause_type, self._clause_alternatives.get("confidentiality_scope", []))
        self._log_audit("suggest_clause_alternatives", "contract", {"clause_type": clause_type})
        return alts[:3]

    async def generate_negotiation_guide(self, contract_id: str, party_role: str) -> dict[str, Any]:
        await self._delay(500)
        role = party_role if party_role in ("buyer", "seller", "mutual") else "buyer"
        guide = self._negotiation_guides.get(contract_id, {}).get(role)
        self._log_audit("generate_negotiation_guide", "contract", {"contract_id": contract_id, "party_role": role})
        if guide:
            return {"contract_id": contract_id, "party_role": role, **guide}
        contract = next((c for c in self._contracts if c.id == contract_id), self._contracts[0])
        clauses = [{
            "key": cl.key, "label": cl.label,
            "recommended_position": "reject" if cl.risk == "CRITICAL" else ("negotiate" if cl.risk in ("HIGH", "MEDIUM") else "accept"),
            "rationale": cl.risk_note,
            "fallback_text": f"Propose revision to {cl.label} from {role} perspective.",
        } for cl in contract.clauses]
        return {
            "contract_id": contract_id, "party_role": role,
            "clauses": clauses, "missing_clauses": contract.missing_clauses,
            "notice": "Scaffold for attorney review only.",
        }

    async def get_analysis_jobs(self) -> list[AnalysisJob]:
        await self._delay(80)
        return list(self._jobs)

    async def queue_document_analysis(self, file: str) -> AnalysisJob:
        await self._delay(150)
        self._job_counter += 1
        job = AnalysisJob(
            id=f"job-{self._job_counter:03d}",
            file=file,
            status="queued",
            queued_at=datetime.now(timezone.utc).isoformat(),
            completed_at=None,
            risk_level=None,
            clause_count=None,
            flags=None,
        )
        self._jobs.insert(0, job)
        profile = self._document_profiles.get(self._basename(file), {})

        async def _progress() -> None:
            await asyncio.sleep(1.5)
            if profile.get("queue_fail") or file == "fail_me.docx":
                job.status = "error"
                job.completed_at = datetime.now(timezone.utc).isoformat()
                job.error = "File parse error: unsupported encryption format"
                return
            job.status = "processing"
            await asyncio.sleep(3.5)
            job.status = "complete"
            job.completed_at = datetime.now(timezone.utc).isoformat()
            job.risk_level = random.choice(["LOW", "MEDIUM", "HIGH"])
            job.clause_count = random.randint(5, 15)
            job.flags = random.randint(0, 4)

        asyncio.create_task(_progress())
        self._log_audit("queue_document_analysis", "analysis", {"file": file})
        return job

    async def check_privilege_risk(self, file: str, provider: str) -> PrivilegeResult:
        await self._delay(350)
        profile = self._document_profiles.get(self._basename(file), {})
        priv = profile.get("privilege", {})
        risk_map = {
            "openai": "HIGH", "anthropic": "HIGH", "openrouter": "HIGH",
            "azure_openai": "MEDIUM", "vertex_ai": "MEDIUM", "ollama": "LOW",
        }
        risk = risk_map.get(provider.lower(), "HIGH")
        if priv.get("risk_override") == "CRITICAL":
            risk = "CRITICAL"
        indicators = priv.get("indicators", [
            "Attorney-client communication detected",
            "Work product markers present",
            "Litigation strategy referenced",
        ])
        self._log_audit("check_privilege_risk", "privilege", {"file": self._basename(file), "provider": provider})
        return PrivilegeResult(
            risk=risk,
            label=f"{risk} — {provider}",
            provider=provider,
            indicators=indicators,
            recommendation=(
                "Proceed with caution. Local inference — no data transmitted externally."
                if risk == "LOW"
                else f"Do not route to {provider} without attorney authorization. Use ollama for zero-retention local inference."
            ),
            notice="Risk assessment per United States v. Heppner (S.D.N.Y. Feb. 2026) and ABA Model Rule 1.6.",
        )

    async def get_workflows(self) -> list[Workflow]:
        await self._delay(80)
        return self._workflows

    async def get_audit_log(self) -> list[AuditEntry]:
        await self._delay(80)
        return list(self._session_audit) + list(self._seed_audit)


# ─────────────────────────── runtime client selector ────────────────────────

_active: LegalMcpClient = MockClient()


def get_client() -> LegalMcpClient:
    """Return the currently active client (mock or live)."""
    return _active


def set_client(c: LegalMcpClient) -> None:
    """Replace the active client (called by LegalTermApp before first mount)."""
    global _active
    _active = c


# Legacy module-level alias — widgets do `from ..client import client`.
# This is a reference to the proxy function; widgets should call client() instead.
# For backward-compat, keep the old `client` name pointing at the default mock.
client: LegalMcpClient = _active
