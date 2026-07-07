import type { LegalMcpClient } from './client'
import type {
  Case, Statute, Contract, AnalysisJob, AuditEntry, Workflow,
  CitationResult, PrivilegeResult, BriefOutline, NegotiationGuide, IntegrationStatus
} from './types'
import { CASES, STATUTES, CONTRACTS, JOBS, AUDIT_LOG, WORKFLOWS } from '../fixtures'

const cases: Case[] = CASES
const statutes: Statute[] = STATUTES
const contracts: Contract[] = CONTRACTS
let jobs: AnalysisJob[] = JSON.parse(JSON.stringify(JOBS)) as AnalysisJob[]
const auditLog: AuditEntry[] = AUDIT_LOG
const workflows: Workflow[] = WORKFLOWS

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms + Math.random() * 200))

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

let jobIdCounter = 6

export class MockClient implements LegalMcpClient {
  async searchPrecedents(query: string): Promise<Case[]> {
    await delay()
    return rankByQuery(cases, query)
  }

  async searchCaseLaw(query: string): Promise<Case[]> {
    await delay()
    return rankByQuery(cases, query)
  }

  async extractStatute(id: string): Promise<Statute | null> {
    await delay()
    return statutes.find(s => s.id === id || s.citation.includes(id)) ?? null
  }

  async researchLegalIssue(issue: string): Promise<{ cases: Case[]; statutes: Statute[]; summary: string }> {
    await delay(600)
    const foundCases = rankByQuery(cases, issue).slice(0, 3)
    const foundStatutes = statutes.filter(s => s.topics.some(t => issue.toLowerCase().includes(t.split(' ')[0])))
    return {
      cases: foundCases,
      statutes: foundStatutes,
      summary: `Research across local precedents and statutes identified ${foundCases.length} relevant case(s) and ${foundStatutes.length} statute(s) for the issue: "${issue}". Local results returned; CourtListener/PACER integration disabled by default.`,
    }
  }

  async validateCitation(citation: string): Promise<CitationResult> {
    await delay(200)
    const matched = cases.find(c => c.citation === citation.trim())
    const reporters = ['Cal.App.4th', 'Cal.4th', 'F.3d', 'F. Supp. 3d', 'U.S.', 'Eng. Rep.']
    const reporter = reporters.find(r => citation.includes(r)) ?? ''
    const valid = !!reporter && !!citation.match(/\d{4}/)
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
    return contracts.find(c => c.id === contractId) ?? null
  }

  async listContracts(): Promise<Contract[]> {
    await delay(100)
    return contracts
  }

  async compareContracts(a: string, b: string): Promise<{ base: Contract; compare: Contract; diffs: { key: string; change: string }[] }> {
    await delay(500)
    const base = contracts.find(c => c.id === a) ?? contracts[0]
    const compare = contracts.find(c => c.id === b) ?? contracts[1]
    const diffs = compare.clauses
      .filter(cc => {
        const bc = base.clauses.find(x => x.key === cc.key)
        return !bc || bc.text !== cc.text
      })
      .map(cc => ({
        key: cc.key,
        change: `Risk changed to ${cc.risk}: ${cc.risk_note}`,
      }))
    return { base, compare, diffs }
  }

  async suggestAlternatives(_clauseText: string, clauseType: string): Promise<string[]> {
    await delay(400)
    const alts: Record<string, string[]> = {
      indemnification: [
        'Recipient\'s aggregate liability for indemnification claims shall not exceed the greater of fees paid or $500,000.',
        'Each party shall indemnify the other only for direct damages caused by its own gross negligence or willful misconduct.',
        'Indemnification obligations shall be capped at the liability limit set forth in Section 8.',
      ],
      confidentiality_scope: [
        'Recipient shall hold in confidence all information disclosed by Disclosing Party, whether or not marked Confidential, that a reasonable person would deem confidential.',
        'Recipient shall hold in confidence all written, oral, and electronic information disclosed by Disclosing Party, including information disclosed in meetings and designated as confidential within five (5) business days.',
      ],
      term_duration: [
        'Confidentiality obligations shall survive for five (5) years following termination.',
        'Confidentiality obligations shall survive in perpetuity for trade secrets and for three (3) years for all other Confidential Information.',
      ],
    }
    return alts[clauseType] ?? [
      `Alternative 1 for ${clauseType}: Balanced market-standard language.`,
      `Alternative 2 for ${clauseType}: Pro-disclosing-party language.`,
      `Alternative 3 for ${clauseType}: Neutral mutual language.`,
    ]
  }

  async generateNegotiationGuide(contractId: string, partyRole: string): Promise<NegotiationGuide> {
    await delay(500)
    const contract = contracts.find(c => c.id === contractId) ?? contracts[1]
    return {
      contract_id: contractId,
      party_role: partyRole,
      clauses: contract.clauses.map(cl => ({
        key: cl.key,
        label: cl.label,
        recommended_position: cl.risk === 'CRITICAL' ? 'reject' : cl.risk === 'HIGH' ? 'negotiate' : 'accept',
        rationale: cl.risk_note,
        fallback_text: `Negotiate: "${cl.text.substring(0, 80)}…" — propose capped liability or narrower scope.`,
      })),
      missing_clauses: contract.missing_clauses,
      notice: 'This guide is a scaffold for attorney review, not legal advice. ABA Rule 1.6 applies.',
    }
  }

  async analyzeDocument(filePath: string): Promise<{ metadata: Record<string, string | null>; risk_level: string; clauses: Contract['clauses'] }> {
    await delay(700)
    const c = contracts[Math.floor(Math.random() * contracts.length)]
    return {
      metadata: {
        file: filePath,
        parties: Object.values(c.parties).join(' / '),
        governing_law: c.governing_law,
        term: c.term,
        liability_cap: c.liability_cap,
        payment_terms: 'Net 30',
      },
      risk_level: c.risk_level,
      clauses: c.clauses,
    }
  }

  async getAnalysisJobs(): Promise<AnalysisJob[]> {
    await delay(100)
    return jobs
  }

  async queueDocumentAnalysis(file: string): Promise<AnalysisJob> {
    await delay(200)
    const job: AnalysisJob = {
      id: `job-00${jobIdCounter++}`,
      file,
      status: 'queued',
      queued_at: new Date().toISOString(),
      completed_at: null,
      risk_level: null,
      clause_count: null,
      flags: null,
    }
    jobs = [job, ...jobs]
    setTimeout(() => {
      const j = jobs.find(x => x.id === job.id)
      if (j) { j.status = 'processing' }
      setTimeout(() => {
        const j2 = jobs.find(x => x.id === job.id)
        if (j2) {
          j2.status = 'complete'
          j2.completed_at = new Date().toISOString()
          j2.risk_level = ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)]
          j2.clause_count = 5 + Math.floor(Math.random() * 10)
          j2.flags = Math.floor(Math.random() * 4)
        }
      }, 4000)
    }, 1500)
    return job
  }

  async checkPrivilegeRisk(_file: string, provider: string): Promise<PrivilegeResult> {
    await delay(400)
    const riskMap: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
      openai: 'HIGH', anthropic: 'HIGH', openrouter: 'HIGH',
      azure_openai: 'MEDIUM', vertex_ai: 'MEDIUM',
      ollama: 'LOW',
    }
    const risk = riskMap[provider.toLowerCase()] ?? 'HIGH'
    return {
      risk,
      label: `${risk} — ${provider}`,
      provider,
      indicators: ['Attorney-client communication detected', 'Work product markers present', 'Litigation strategy referenced'],
      recommendation: risk === 'LOW'
        ? 'Proceed with caution. Local inference — no data transmitted externally.'
        : `Do not route to ${provider} without attorney authorization. Use a local model (ollama) or enterprise-contracted cloud with zero data retention.`,
      notice: 'Risk assessment per United States v. Heppner (S.D.N.Y. Feb. 2026) and ABA Model Rule 1.6.',
    }
  }

  async generateBriefOutline(caseType: string, facts: string): Promise<BriefOutline> {
    await delay(600)
    return {
      case_type: caseType,
      sections: [
        { title: 'I. INTRODUCTION', content: 'Introduce the parties and the nature of the dispute.' },
        { title: 'II. STATEMENT OF FACTS', content: facts || 'Set forth the operative facts in chronological order.' },
        { title: 'III. LEGAL STANDARD', content: 'Identify the governing standard of review and applicable burden of proof.' },
        { title: 'IV. ARGUMENT', content: 'Organize arguments by descending strength. Lead with your best issue.' },
        { title: 'V. CONCLUSION', content: 'State precisely the relief requested.' },
      ],
      argument_structure: {
        issue: `Whether ${caseType.toLowerCase()} warrants the relief requested under applicable law.`,
        rule: 'Under controlling authority, a party must demonstrate [element 1], [element 2], and [element 3].',
        analysis: 'Applying the rule to the facts: [analysis of element 1]…',
        conclusion: 'Therefore, Plaintiff is entitled to [relief].',
      },
      issue_statement: `Whether, under [governing law], a party who [key fact] is entitled to [relief] when [legal hook].`,
    }
  }

  async getWorkflows(): Promise<Workflow[]> {
    await delay(100)
    return workflows
  }

  async getAuditLog(): Promise<AuditEntry[]> {
    await delay(100)
    return auditLog
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
