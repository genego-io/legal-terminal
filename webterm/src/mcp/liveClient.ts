/**
 * LiveClient — wires the webterm to a running legal-mcp server via the
 * official MCP TypeScript SDK over SSE (default: http://localhost:8000/sse).
 *
 * Usage: set  VITE_MCP_URL=http://localhost:8000  in a .env.local file,
 * then swap the exported `client` singleton in this file for the one in
 * mockClient.ts inside src/mcp/index.ts.
 *
 * The server must be running:
 *   cd legal-mcp && pip install -e . && python main.py --transport sse
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import type { LegalMcpClient } from './client'
import type {
  Case, Statute, Contract, ContractClause,
  AnalysisJob, AuditEntry, Workflow,
  CitationResult, PrivilegeResult, BriefOutline,
  NegotiationGuide, IntegrationStatus,
} from './types'

// ─── helpers ────────────────────────────────────────────────────────────────

function parse<T>(raw: unknown): T {
  if (typeof raw === 'string') return JSON.parse(raw) as T
  return raw as T
}

async function call<T>(c: Client, name: string, args: Record<string, unknown> = {}): Promise<T> {
  const result = await c.callTool({ name, arguments: args })
  const content = (result.content as { type: string; text?: string }[])[0]
  if (!content || content.type !== 'text' || !content.text) {
    throw new Error(`Tool ${name} returned no text content`)
  }
  return parse<T>(content.text)
}

// ─── client ─────────────────────────────────────────────────────────────────

export class LiveClient implements LegalMcpClient {
  private _client: Client | null = null
  private _url: string

  constructor(url = import.meta.env.VITE_MCP_URL ?? 'http://localhost:8000') {
    this._url = url
  }

  private async _connect(): Promise<Client> {
    if (this._client) return this._client
    const transport = new SSEClientTransport(new URL(`${this._url}/sse`))
    const client = new Client({ name: 'legal-terminal-webterm', version: '0.1.0' })
    await client.connect(transport)
    this._client = client
    return client
  }

  async searchPrecedents(query: string): Promise<Case[]> {
    const c = await this._connect()
    const data = await call<{ results: Case[] }>(c, 'search_precedents', { query })
    return data.results ?? []
  }

  async extractStatute(statuteId: string): Promise<Statute | null> {
    const c = await this._connect()
    const data = await call<Statute & { error?: string }>(c, 'extract_statute', { statute_id: statuteId })
    return data.error ? null : data
  }

  async validateCitation(citation: string): Promise<CitationResult> {
    const c = await this._connect()
    const data = await call<Record<string, unknown>>(c, 'validate_citation', { citation })
    return _normaliseCiteResult(citation, data)
  }

  async normalizeCitation(citation: string): Promise<CitationResult> {
    const c = await this._connect()
    const data = await call<Record<string, unknown>>(c, 'normalize_citation', { citation })
    return _normaliseCiteResult(citation, data)
  }

  async verifyCitationIntegrity(citation: string): Promise<CitationResult> {
    const c = await this._connect()
    const data = await call<Record<string, unknown>>(c, 'verify_citation_integrity', { citation })
    return _normaliseCiteResult(citation, data)
  }

  async analyzeContract(contractId: string): Promise<Contract | null> {
    const c = await this._connect()
    try {
      const data = await call<Record<string, unknown>>(c, 'analyze_clauses', { contract_id: contractId })
      return _normaliseContract(contractId, data)
    } catch {
      return null
    }
  }

  async searchCaseLaw(query: string): Promise<Case[]> {
    return this.searchPrecedents(query)
  }

  async researchLegalIssue(issue: string): Promise<{ cases: Case[]; statutes: Statute[]; summary: string }> {
    const c = await this._connect()
    try {
      const data = await call<{ cases?: Case[]; statutes?: Statute[]; summary?: string }>(
        c, 'research_legal_issue', { issue }
      )
      return { cases: data.cases ?? [], statutes: data.statutes ?? [], summary: data.summary ?? '' }
    } catch {
      const cases = await this.searchPrecedents(issue)
      return { cases, statutes: [], summary: '' }
    }
  }

  async listContracts(): Promise<Contract[]> {
    return []  // no dedicated list-all tool on the server
  }

  async compareContracts(id1: string, id2: string): Promise<{ base: Contract; compare: Contract; diffs: { key: string; change: string }[] }> {
    const c = await this._connect()
    const [base, cmp] = await Promise.all([
      this.analyzeContract(id1),
      this.analyzeContract(id2),
    ])
    const baseContract = base ?? _emptyContract(id1)
    const cmpContract = cmp ?? _emptyContract(id2)
    try {
      const data = await call<Record<string, unknown>>(c, 'compare_contracts', { contract_id_1: id1, contract_id_2: id2 })
      const diffs = (data.differences as { clause: string; change: string }[] | undefined) ?? []
      return { base: baseContract, compare: cmpContract, diffs: diffs.map(d => ({ key: d.clause ?? '', change: d.change ?? '' })) }
    } catch {
      return { base: baseContract, compare: cmpContract, diffs: [] }
    }
  }

  async suggestAlternatives(_clauseText: string, clauseType: string): Promise<string[]> {
    const c = await this._connect()
    const data = await call<{ alternatives: { text: string }[] }>(c, 'suggest_clause_alternatives', { clause_type: clauseType })
    return (data.alternatives ?? []).map(a => a.text)
  }

  async generateNegotiationGuide(contractId: string, partyRole: string): Promise<NegotiationGuide> {
    const c = await this._connect()
    const data = await call<NegotiationGuide>(c, 'generate_negotiation_guide', { contract_id: contractId, party_role: partyRole })
    return data
  }

  async analyzeDocument(file: string): Promise<{ metadata: Record<string, string | null>; risk_level: string; clauses: Contract['clauses'] }> {
    const c = await this._connect()
    const data = await call<Record<string, unknown>>(c, 'analyze_document', { file_path: file })
    const contract = _normaliseContract(file, data)
    return {
      metadata: { title: contract.title, type: contract.type, governing_law: contract.governing_law ?? null },
      risk_level: contract.risk_level,
      clauses: contract.clauses,
    }
  }

  async queueDocumentAnalysis(file: string): Promise<AnalysisJob> {
    const c = await this._connect()
    const data = await call<{ job_id: string; status: string; created_at: string }>(c, 'queue_document_analysis', { file_path: file })
    return {
      id: data.job_id,
      file,
      status: 'queued',
      queued_at: data.created_at,
      completed_at: null,
      risk_level: null,
      clause_count: null,
      flags: null,
    }
  }

  async getAnalysisJobs(): Promise<AnalysisJob[]> {
    const c = await this._connect()
    const data = await call<{ jobs: Record<string, unknown>[] }>(c, 'list_analysis_jobs', {})
    return (data.jobs ?? []).map(_normaliseJob)
  }

  async checkPrivilegeRisk(_file: string, provider: string): Promise<PrivilegeResult> {
    const c = await this._connect()
    const data = await call<Record<string, unknown>>(c, 'check_privilege_risk', { provider })
    return {
      risk: (data.risk_level as string ?? 'HIGH').toUpperCase() as PrivilegeResult['risk'],
      label: (data.risk_level as string ?? 'HIGH'),
      provider,
      indicators: (data.privilege_indicators as string[]) ?? [],
      recommendation: (data.recommendation as string) ?? '',
      notice: (data.notice as string) ?? '',
    }
  }

  async generateBriefOutline(caseType: string, facts?: string): Promise<BriefOutline> {
    const c = await this._connect()
    const data = await call<BriefOutline>(c, 'generate_brief_outline', { case_type: caseType, ...(facts ? { facts } : {}) })
    return data
  }

  async getWorkflows(): Promise<Workflow[]> {
    // Workflows come from the SKILL.md layer — no dedicated server tool.
    // Fall back to the static list from fixtures.
    const { WORKFLOWS } = await import('../fixtures')
    return WORKFLOWS as unknown as Workflow[]
  }

  async getAuditLog(): Promise<AuditEntry[]> {
    // The server's audit log is local-only. No tool exposes it remotely.
    return []
  }

  async getIntegrationStatus(): Promise<IntegrationStatus> {
    const c = await this._connect()
    const data = await call<IntegrationStatus>(c, 'integration_status', {})
    return data
  }
}

// ─── normalizers — map server JSON shapes → our TypeScript types ─────────────

function _normaliseCiteResult(citation: string, data: Record<string, unknown>): CitationResult {
  return {
    citation,
    valid: Boolean(data.valid ?? data.is_valid ?? true),
    normalized: (data.normalized ?? data.normal ?? citation) as string,
    reporter: (data.reporter ?? '') as string,
    reporter_name: (data.reporter_name ?? data.reporter ?? '') as string,
    issues: (data.issues ?? data.errors ?? []) as string[],
    integrity: (data.integrity ?? (data.in_database ? 'verified' : 'not_found')) as CitationResult['integrity'],
  }
}

function _normaliseContract(id: string, data: Record<string, unknown>): Contract {
  const rawClauses = (data.clauses as Record<string, unknown>[] | undefined) ?? []
  const clauses: ContractClause[] = rawClauses.map(cl => ({
    key: (cl.key ?? cl.clause_type ?? '') as string,
    label: (cl.label ?? cl.name ?? cl.clause_type ?? '') as string,
    text: (cl.text ?? cl.content ?? '') as string,
    risk: ((cl.risk ?? cl.risk_level ?? 'MEDIUM') as string).toUpperCase() as ContractClause['risk'],
    risk_note: (cl.risk_note ?? cl.note ?? cl.rationale ?? '') as string,
  }))

  const riskLevel = (() => {
    const hasCritical = clauses.some(c => c.risk === 'CRITICAL')
    const hasHigh = clauses.some(c => c.risk === 'HIGH')
    if (hasCritical) return 'CRITICAL'
    if (hasHigh) return 'HIGH'
    return (data.risk_level as string | undefined)?.toUpperCase() ?? 'MEDIUM'
  })() as Contract['risk_level']

  return {
    id,
    title: (data.title ?? data.contract_id ?? id) as string,
    type: (data.type ?? data.contract_type ?? 'Unknown') as string,
    risk_level: riskLevel,
    clauses,
    missing_clauses: (data.missing_clauses ?? []) as string[],
    parties: (data.parties ?? {}) as Record<string, string>,
    governing_law: (data.governing_law ?? '') as string,
    term: (data.term ?? '') as string,
    liability_cap: (data.liability_cap ?? null) as string | null,
  }
}

function _normaliseJob(raw: Record<string, unknown>): AnalysisJob {
  return {
    id: (raw.job_id ?? raw.id ?? '') as string,
    file: (raw.file_path ?? raw.file ?? '') as string,
    status: (raw.status ?? 'queued') as AnalysisJob['status'],
    queued_at: (raw.created_at ?? raw.queued_at ?? '') as string,
    completed_at: (raw.updated_at ?? raw.completed_at ?? null) as string | null,
    risk_level: (raw.risk_level ?? null) as string | null,
    clause_count: (raw.clause_count ?? null) as number | null,
    flags: (raw.flags ?? null) as number | null,
    error: (raw.error ?? undefined) as string | undefined,
  }
}

function _emptyContract(id: string): Contract {
  return { id, title: id, type: '', risk_level: 'MEDIUM', clauses: [], missing_clauses: [], parties: {}, governing_law: '', term: '', liability_cap: null }
}
