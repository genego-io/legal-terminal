"""Tests for the TUI MockClient — mirrors the webterm Vitest suite."""
import pytest
from legal_term.client import MockClient


@pytest.fixture
def client() -> MockClient:
    return MockClient()


# ── search_precedents ────────────────────────────────────────────────────────


class TestSearchPrecedents:
    async def test_returns_list(self, client: MockClient) -> None:
        results = await client.search_precedents("breach of contract")
        assert isinstance(results, list)
        assert len(results) > 0

    async def test_case_has_required_fields(self, client: MockClient) -> None:
        results = await client.search_precedents("delivery")
        first = results[0]
        assert first.id
        assert first.name
        assert first.citation
        assert isinstance(first.relevance_score, float)

    async def test_results_sorted_by_relevance(self, client: MockClient) -> None:
        """Boosted cases should rank at or above unboosted ones on average."""
        results = await client.search_precedents("contract breach")
        assert len(results) > 0
        # top result should have a high relevance score (boosted by topic match)
        assert results[0].relevance_score >= 0.7

    async def test_zero_result_query_returns_empty(self, client: MockClient) -> None:
        results = await client.search_precedents("no results expected")
        assert results == []


# ── generate_negotiation_guide ───────────────────────────────────────────────


class TestGenerateNegotiationGuide:
    async def test_buyer_seller_differ(self, client: MockClient) -> None:
        buyer = await client.generate_negotiation_guide("client_proposed_nda", "buyer")
        seller = await client.generate_negotiation_guide("client_proposed_nda", "seller")
        buyer_ind = next(c for c in buyer["clauses"] if c["key"] == "indemnification")
        seller_ind = next(c for c in seller["clauses"] if c["key"] == "indemnification")
        assert buyer_ind["recommended_position"] != seller_ind["recommended_position"]

    async def test_privilege_by_file(self, client: MockClient) -> None:
        r = await client.check_privilege_risk("litigation_memo.docx", "openai")
        assert r.risk == "CRITICAL"


# ── validate_citation ────────────────────────────────────────────────────────


class TestValidateCitation:
    async def test_known_reporter_is_valid(self, client: MockClient) -> None:
        r = await client.validate_citation("2022 Cal.App.4th 1234")
        assert r.valid is True
        assert r.issues == []

    async def test_garbage_string_is_invalid(self, client: MockClient) -> None:
        r = await client.validate_citation("not a real citation")
        assert r.valid is False
        assert len(r.issues) > 0

    async def test_returns_input_as_citation(self, client: MockClient) -> None:
        r = await client.validate_citation("2020 Cal.4th 567")
        assert r.citation == "2020 Cal.4th 567"

    async def test_returns_normalized(self, client: MockClient) -> None:
        r = await client.validate_citation("2022 Cal.App.4th 1234")
        assert isinstance(r.normalized, str)
        assert len(r.normalized) > 0

    async def test_verified_for_known_case(self, client: MockClient) -> None:
        r = await client.validate_citation("2022 Cal.App.4th 1234")
        assert r.integrity == "verified"

    async def test_not_found_for_unknown_but_valid(self, client: MockClient) -> None:
        r = await client.validate_citation("2099 Cal.App.4th 9999")
        assert r.integrity == "not_found"


# ── extract_statute ───────────────────────────────────────────────────────────


class TestExtractStatute:
    async def test_known_id_returns_statute(self, client: MockClient) -> None:
        s = await client.extract_statute("Cal.Civ.Code.1657")
        assert s is not None
        assert s.title
        assert s.text

    async def test_unknown_id_returns_none(self, client: MockClient) -> None:
        s = await client.extract_statute("UNKNOWN.STATUTE.9999")
        assert s is None


# ── analyze_contract ──────────────────────────────────────────────────────────


class TestAnalyzeContract:
    async def test_known_id_returns_contract(self, client: MockClient) -> None:
        c = await client.analyze_contract("client_proposed_nda")
        assert c is not None
        assert len(c.clauses) > 0

    async def test_clause_risk_values_valid(self, client: MockClient) -> None:
        c = await client.analyze_contract("client_proposed_nda")
        assert c is not None
        valid_risks = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
        for cl in c.clauses:
            assert cl.risk in valid_risks

    async def test_unknown_id_returns_none(self, client: MockClient) -> None:
        c = await client.analyze_contract("does_not_exist")
        assert c is None


# ── get_analysis_jobs ─────────────────────────────────────────────────────────


class TestGetAnalysisJobs:
    async def test_returns_jobs(self, client: MockClient) -> None:
        jobs = await client.get_analysis_jobs()
        assert isinstance(jobs, list)
        assert len(jobs) > 0

    async def test_job_has_required_fields(self, client: MockClient) -> None:
        jobs = await client.get_analysis_jobs()
        for j in jobs:
            assert j.id
            assert j.file
            assert j.status in {"queued", "processing", "complete", "error"}


# ── queue_document_analysis ───────────────────────────────────────────────────


class TestQueueDocumentAnalysis:
    async def test_creates_queued_job(self, client: MockClient) -> None:
        job = await client.queue_document_analysis("my_contract.pdf")
        assert job.file == "my_contract.pdf"
        assert job.status == "queued"
        assert job.id

    async def test_new_job_visible_in_list(self, client: MockClient) -> None:
        job = await client.queue_document_analysis("new_doc.docx")
        jobs = await client.get_analysis_jobs()
        ids = [j.id for j in jobs]
        assert job.id in ids


# ── check_privilege_risk ──────────────────────────────────────────────────────


class TestCheckPrivilegeRisk:
    async def test_openai_is_high(self, client: MockClient) -> None:
        r = await client.check_privilege_risk("memo.docx", "openai")
        assert r.risk == "HIGH"

    async def test_ollama_is_low(self, client: MockClient) -> None:
        r = await client.check_privilege_risk("memo.docx", "ollama")
        assert r.risk == "LOW"

    async def test_result_has_indicators(self, client: MockClient) -> None:
        r = await client.check_privilege_risk("memo.docx", "anthropic")
        assert isinstance(r.indicators, list)
        assert len(r.indicators) > 0
        assert isinstance(r.recommendation, str)
        assert len(r.recommendation) > 0


# ── get_workflows ─────────────────────────────────────────────────────────────


class TestGetWorkflows:
    async def test_returns_workflows(self, client: MockClient) -> None:
        wf = await client.get_workflows()
        assert len(wf) > 0

    async def test_each_workflow_has_steps(self, client: MockClient) -> None:
        wf = await client.get_workflows()
        for w in wf:
            assert len(w.steps) > 0


# ── get_audit_log ─────────────────────────────────────────────────────────────


class TestGetAuditLog:
    async def test_returns_entries(self, client: MockClient) -> None:
        log = await client.get_audit_log()
        assert len(log) > 0

    async def test_entry_has_required_fields(self, client: MockClient) -> None:
        log = await client.get_audit_log()
        for e in log:
            assert e.id
            assert e.tool
            assert e.timestamp
            assert isinstance(e.success, bool)
