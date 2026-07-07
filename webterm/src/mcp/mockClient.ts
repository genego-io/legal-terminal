import type { LegalMcpClient } from './client'
import type {
  Case, Statute, Contract, AnalysisJob, AuditEntry, Workflow,
  CitationResult, PrivilegeResult, BriefOutline, NegotiationGuide, IntegrationStatus,
} from './types'
import {
  CASES, STATUTES, CONTRACTS, JOBS, AUDIT_LOG, WORKFLOWS,
  NEGOTIATION_GUIDES, CLAUSE_ALTERNATIVES, DOCUMENT_PROFILES, BRIEF_OUTLINES,
} from '../fixtures'

const cases: Case[] = CASES
const statutes: Statute[] = STATUTES
const contracts: Contract[] = CONTRACTS
let jobs: AnalysisJob[] = JSON.parse(JSON.stringify(JOBS)) as AnalysisJob[]
const seedAudit: AuditEntry[] = AUDIT_LOG
let sessionAudit: AuditEntry[] = []
const workflows: Workflow[] = WORKFLOWS

const ZERO_RESULT_QUERIES = [
  'xyzzy_nomatchwhatsoever',
  'quantum entanglement liability',
  'no results expected',
]

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms + Math.random() * 200))

let jobIdCounter = jobs.length + 1
let auditCounter = seedAudit.length + 1

function basename(path: string): string {
  return path.split(/[/\\]/).pop() ?? path
}

function logAudit(tool: string, category: string, input: Record<string, unknown>, success = true, duration_ms = 50) {
  sessionAudit.unshift({
    id: `a-${String(++auditCounter).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
    tool,
    user: 'attorney',
    category,
    input,
    success,
    duration_ms,
  })
  if (sessionAudit.length > 50) sessionAudit = sessionAudit.slice(0, 50)
}

function rankByQuery(items: Case[], query: string): Case[] {
  const q = query.toLowerCase()
  return items
    .map(c => ({
      ...c,
      relevance_score: c.topics.some(t => t.includes(q)) || c.name.toLowerCase().includes(q) || c.holding.toLowerCase().includes(q)
        ? c.relevance_score
        : c.relevance_score * 0.4,
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score)
}

function docProfile(file: string) {
  return DOCUMENT_PROFILES[basename(file)]
}

export class MockClient implements LegalMcpClient {
  async searchPrecedents(query: string): Promise<Case[]> {
    await delay()
    const q = query.toLowerCase().trim()
    if (ZERO_RESULT_QUERIES.some(z => q.includes(z))) {
      logAudit('search_precedents', 'search', { query }, true, 88)
      return []
    }
    const results = rankByQuery(cases, query)
    logAudit('search_precedents', 'search', { query }, true, 88)
    return results
  }

  async searchCaseLaw(query: string): Promise<Case[]> {
    await delay()
    const q = query.toLowerCase().trim()
    if (ZERO_RESULT_QUERIES.some(z => q.includes(z))) return []
    const appellate = cases.filter(c =>
      /appeal|supreme|circuit|chancery|exchequer/i.test(c.court)
    )
    logAudit('search_case_law', 'search', { query }, true, 95)
    return rankByQuery(appellate, query)
  }

  async extractStatute(id: string): Promise<Statute | null> {
    await delay()
    const s = statutes.find(s => s.id === id || s.citation.includes(id)) ?? null
    logAudit('extract_statute', 'research', { statute_id: id }, !!s, 120)
    return s
  }

  async researchLegalIssue(issue: string): Promise<{ cases: Case[]; statutes: Statute[]; summary: string }> {
    await delay(600)
    const foundCases = rankByQuery(cases, issue).slice(0, 3)
    const foundStatutes = statutes.filter(s =>
      s.topics.some(t => issue.toLowerCase().includes(t.split(' ')[0])) ||
      issue.toLowerCase().split(/\s+/).some(w => w.length > 4 && s.text.toLowerCase().includes(w))
    )
    logAudit('research_legal_issue', 'search', { issue }, true, 620)
    return {
      cases: foundCases,
      statutes: foundStatutes,
      summary: foundCases.length || foundStatutes.length
        ? `Research identified ${foundCases.length} case(s) and ${foundStatutes.length} statute(s) for: "${issue}". Local results returned; CourtListener/PACER integration disabled by default.`
        : `No local matches for "${issue}". Try broader terms or connect live MCP for CourtListener search.`,
    }
  }

  async validateCitation(citation: string): Promise<CitationResult> {
    await delay(200)
    const matched = cases.find(c => c.citation === citation.trim())
    const reporters = ['Cal.App.4th', 'Cal.App.5th', 'Cal.4th', 'Cal.5th', 'F.3d', 'F. Supp. 3d', 'U.S.', 'Eng. Rep.', 'Del. Ch.']
    const reporter = reporters.find(r => citation.includes(r)) ?? ''
    const valid = !!reporter && !!citation.match(/\d{4}/)
    logAudit('validate_citation', 'validation', { citation }, true, 14)
    return {
      citation,
      valid,
      normalized: citation.replace(/\s+/g, ' ').trim(),
      reporter,
      reporter_name: reporter || 'Unknown reporter',
      issues: valid ? [] : ['Unrecognized reporter', 'Missing year'],
      integrity: matched ? 'verified' : (valid ? 'not_found' : 'mismatch'),
    }
  }

  async normalizeCitation(citation: string): Promise<CitationResult> {
    await delay(150)
    const normalized = citation
      .replace(/Corporation/g, 'Corp.').replace(/Incorporated/g, 'Inc.')
      .replace(/Industries/g, 'Indus.').replace(/Solutions/g, 'Sols.')
      .replace(/\s+/g, ' ').trim()
    return { ...(await this.validateCitation(normalized)), citation, normalized }
  }

  async verifyCitationIntegrity(citation: string): Promise<CitationResult> {
    await delay(300)
    return this.validateCitation(citation)
  }

  async analyzeContract(contractId: string): Promise<Contract | null> {
    await delay()
    const c = contracts.find(c => c.id === contractId) ?? null
    logAudit('analyze_clauses', 'contract', { contract_id: contractId }, !!c, 310)
    return c
  }

  async listContracts(): Promise<Contract[]> {
    await delay(100)
    return contracts
  }

  async compareContracts(a: string, b: string): Promise<{ base: Contract; compare: Contract; diffs: { key: string; change: string }[] }> {
    await delay(500)
    const base = contracts.find(c => c.id === a) ?? contracts[0]
    const compare = contracts.find(c => c.id === b) ?? contracts[1]
    const allKeys = new Set([...base.clauses.map(c => c.key), ...compare.clauses.map(c => c.key)])
    const diffs: { key: string; change: string }[] = []

    for (const key of allKeys) {
      const bc = base.clauses.find(c => c.key === key)
      const cc = compare.clauses.find(c => c.key === key)
      if (!bc && cc) {
        diffs.push({ key, change: `Added in compare contract (${cc.risk}): "${cc.text.slice(0, 100)}…"` })
      } else if (bc && !cc) {
        diffs.push({ key, change: `Removed in compare contract — was (${bc.risk}): "${bc.text.slice(0, 100)}…"` })
      } else if (bc && cc) {
        if (bc.text !== cc.text) {
          diffs.push({ key, change: `Text changed — base (${bc.risk}): "${bc.text.slice(0, 60)}…" → compare (${cc.risk}): "${cc.text.slice(0, 60)}…"` })
        } else if (bc.risk !== cc.risk) {
          diffs.push({ key, change: `Same text but risk changed: ${bc.risk} → ${cc.risk}. ${cc.risk_note}` })
        }
      }
    }

    logAudit('compare_contracts', 'contract', { contract_id_1: a, contract_id_2: b }, true, 412)
    return { base, compare, diffs }
  }

  async suggestAlternatives(_clauseText: string, clauseType: string): Promise<string[]> {
    await delay(400)
    const alts = CLAUSE_ALTERNATIVES[clauseType] ?? CLAUSE_ALTERNATIVES['confidentiality_scope']
    logAudit('suggest_clause_alternatives', 'contract', { clause_type: clauseType }, true, 195)
    return alts.slice(0, 3)
  }

  async generateNegotiationGuide(contractId: string, partyRole: string): Promise<NegotiationGuide> {
    await delay(500)
    const role = (['buyer', 'seller', 'mutual'].includes(partyRole) ? partyRole : 'buyer') as 'buyer' | 'seller' | 'mutual'
    const contract = contracts.find(c => c.id === contractId) ?? contracts[1]
    const guideData = NEGOTIATION_GUIDES[contractId]?.[role]

    if (guideData) {
      logAudit('generate_negotiation_guide', 'contract', { contract_id: contractId, party_role: role }, true, 241)
      return {
        contract_id: contractId,
        party_role: role,
        clauses: guideData.clauses,
        missing_clauses: guideData.missing_clauses,
        notice: guideData.notice,
      }
    }

    // Fallback: role-aware derivation
    const invert = role === 'seller'
    const clauses = contract.clauses.map(cl => {
      let pos: 'accept' | 'negotiate' | 'reject' =
        cl.risk === 'CRITICAL' ? 'reject' : cl.risk === 'HIGH' ? 'negotiate' : 'accept'
      if (invert) {
        if (pos === 'reject') pos = 'accept'
        else if (pos === 'accept' && cl.risk === 'HIGH') pos = 'negotiate'
      }
      if (role === 'mutual' && pos === 'reject') pos = 'negotiate'
      return {
        key: cl.key,
        label: cl.label,
        recommended_position: pos,
        rationale: cl.risk_note,
        fallback_text: `As ${role}, propose balanced revision to ${cl.label} aligned with market standards.`,
      }
    })

    logAudit('generate_negotiation_guide', 'contract', { contract_id: contractId, party_role: role }, true, 241)
    return {
      contract_id: contractId,
      party_role: role,
      clauses,
      missing_clauses: contract.missing_clauses,
      notice: 'This guide is a scaffold for attorney review, not legal advice. ABA Rule 1.6 applies.',
    }
  }

  async analyzeDocument(filePath: string): Promise<{ metadata: Record<string, string | null>; risk_level: string; clauses: Contract['clauses'] }> {
    await delay(700)
    const file = basename(filePath)
    const profile = docProfile(file)
    const contract = profile?.contract_id
      ? contracts.find(c => c.id === profile.contract_id)
      : contracts.find(c => c.id === 'client_proposed_nda')

    const c = contract ?? contracts[0]
    logAudit('analyze_document', 'analysis', { file }, true, 680)
    return {
      metadata: {
        file,
        document_type: profile?.document_type ?? c.type,
        summary: profile?.summary ?? null,
        snippet: profile?.snippet ?? null,
        page_count: profile?.page_count != null ? String(profile.page_count) : null,
        parties: Object.values(c.parties).join(' / '),
        governing_law: c.governing_law,
        term: c.term,
        liability_cap: c.liability_cap,
        payment_terms: profile?.payment_terms ?? 'Net 30',
      },
      risk_level: profile?.contract_id ? c.risk_level : (profile?.privilege?.risk_override ?? c.risk_level),
      clauses: profile?.contract_id ? c.clauses : [],
    }
  }

  async getAnalysisJobs(): Promise<AnalysisJob[]> {
    await delay(100)
    return jobs
  }

  async queueDocumentAnalysis(file: string): Promise<AnalysisJob> {
    await delay(200)
    const profile = docProfile(file)
    const job: AnalysisJob = {
      id: `job-${String(jobIdCounter++).padStart(3, '0')}`,
      file,
      status: 'queued',
      queued_at: new Date().toISOString(),
      completed_at: null,
      risk_level: null,
      clause_count: null,
      flags: null,
    }
    jobs = [job, ...jobs]
    logAudit('queue_document_analysis', 'analysis', { file }, true, 42)

    if (profile?.queue_fail || file === 'fail_me.docx') {
      setTimeout(() => {
        const j = jobs.find(x => x.id === job.id)
        if (j) {
          j.status = 'error'
          j.completed_at = new Date().toISOString()
          j.error = 'File parse error: unsupported encryption format'
          logAudit('queue_document_analysis', 'analysis', { file, job_id: job.id }, false, 3200)
        }
      }, 2000)
      return job
    }

    setTimeout(() => {
      const j = jobs.find(x => x.id === job.id)
      if (j) j.status = 'processing'
      setTimeout(() => {
        const j2 = jobs.find(x => x.id === job.id)
        if (j2) {
          const contract = profile?.contract_id
            ? contracts.find(c => c.id === profile.contract_id)
            : contracts[Math.floor(Math.random() * contracts.length)]
          j2.status = 'complete'
          j2.completed_at = new Date().toISOString()
          j2.risk_level = contract?.risk_level ?? 'MEDIUM'
          j2.clause_count = contract?.clauses.length ?? 5
          j2.flags = contract?.clauses.filter(cl => cl.risk === 'HIGH' || cl.risk === 'CRITICAL').length ?? 0
          j2.result_summary = `Analysis complete — ${j2.clause_count} clauses, ${j2.flags} flagged`
          logAudit('get_analysis_result', 'analysis', { job_id: job.id }, true, 18)
        }
      }, 4000)
    }, 1500)
    return job
  }

  async checkPrivilegeRisk(file: string, provider: string): Promise<PrivilegeResult> {
    await delay(400)
    const profile = docProfile(file)
    const riskMap: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
      openai: 'HIGH', anthropic: 'HIGH', openrouter: 'HIGH',
      azure_openai: 'MEDIUM', vertex_ai: 'MEDIUM', ollama: 'LOW',
    }
    let risk = riskMap[provider.toLowerCase()] ?? 'HIGH'
    if (profile?.privilege.risk_override === 'CRITICAL') risk = 'CRITICAL'
    else if (profile?.privilege.risk_override && risk !== 'CRITICAL') {
      const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
      if (order.indexOf(profile.privilege.risk_override) > order.indexOf(risk)) {
        risk = profile.privilege.risk_override
      }
    }

    const indicators = profile?.privilege.indicators ?? [
      'Attorney-client communication detected',
      'Work product markers present',
      'Litigation strategy referenced',
    ]

    logAudit('check_privilege_risk', 'privilege', { file: basename(file), provider }, true, 54)
    return {
      risk,
      label: `${risk} — ${provider}`,
      provider,
      indicators,
      recommendation: risk === 'LOW'
        ? 'Proceed with caution. Local inference — no data transmitted externally.'
        : risk === 'CRITICAL'
          ? `Do NOT route "${basename(file)}" to ${provider}. Use local Ollama with Confidential Mode enabled.`
          : `Do not route to ${provider} without attorney authorization. Use enterprise zero-retention terms or local inference.`,
      notice: 'Risk assessment per United States v. Heppner (S.D.N.Y. Feb. 2026) and ABA Model Rule 1.6.',
    }
  }

  async generateBriefOutline(caseType: string, facts: string): Promise<BriefOutline> {
    await delay(600)
    const key = Object.keys(BRIEF_OUTLINES)
      .sort((a, b) => b.length - a.length)
      .find(k => caseType.toLowerCase().includes(k)) ?? 'default'
    const template = BRIEF_OUTLINES[key]
    logAudit('generate_brief_outline', 'brief', { case_type: caseType }, true, 280)
    return {
      case_type: template.case_type,
      sections: template.sections.map(s =>
        s.title.includes('FACTS') && facts
          ? { ...s, content: facts }
          : s
      ),
      argument_structure: template.argument_structure,
      issue_statement: template.issue_statement,
    }
  }

  async getWorkflows(): Promise<Workflow[]> {
    await delay(100)
    return workflows
  }

  async getAuditLog(): Promise<AuditEntry[]> {
    await delay(100)
    return [...sessionAudit, ...seedAudit]
  }

  async getIntegrationStatus(): Promise<IntegrationStatus> {
    await delay(150)
    return {
      courtlistener: { enabled: false, url: 'https://www.courtlistener.com/api/rest/v4' },
      pacer: { enabled: false, environment: 'qa', fee_warning: 'PACER bills per page. Enable only in production when needed.' },
      server_config: {
        transport: 'SSE',
        port: 8000,
        categories_enabled: ['research', 'citation', 'contract', 'document', 'privilege', 'brief', 'analysis_queue', 'integrations'],
      },
    }
  }
}

export const client: LegalMcpClient = new MockClient()
