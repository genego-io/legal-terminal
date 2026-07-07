import { describe, it, expect, beforeEach } from 'vitest'
import { MockClient } from './mockClient'

let c: MockClient

beforeEach(() => {
  c = new MockClient()
})

// ── searchPrecedents ─────────────────────────────────────────────────────────

describe('searchPrecedents', () => {
  it('returns an array of cases', async () => {
    const results = await c.searchPrecedents('breach of contract')
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
  })

  it('each case has required fields', async () => {
    const [first] = await c.searchPrecedents('delivery')
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('name')
    expect(first).toHaveProperty('citation')
    expect(first).toHaveProperty('relevance_score')
    expect(typeof first.relevance_score).toBe('number')
  })

  it('ranks results so higher-relevance cases come first', async () => {
    const results = await c.searchPrecedents('contract breach')
    const scores = results.map(c => c.relevance_score)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i])
    }
  })

  it('returns empty array for zero-result queries', async () => {
    const results = await c.searchPrecedents('no results expected')
    expect(results.length).toBe(0)
  })

  it('returns ranked results for normal queries', async () => {
    const results = await c.searchPrecedents('contract breach')
    expect(results.length).toBeGreaterThan(0)
  })
})

// ── validateCitation ─────────────────────────────────────────────────────────

describe('validateCitation', () => {
  it('marks a well-formed citation as valid', async () => {
    const r = await c.validateCitation('2022 Cal.App.4th 1234')
    expect(r.valid).toBe(true)
    expect(r.issues).toHaveLength(0)
  })

  it('marks a bare string with no reporter as invalid', async () => {
    const r = await c.validateCitation('not a real citation')
    expect(r.valid).toBe(false)
    expect(r.issues.length).toBeGreaterThan(0)
  })

  it('returns the input as citation field', async () => {
    const input = '2020 Cal.4th 567'
    const r = await c.validateCitation(input)
    expect(r.citation).toBe(input)
  })

  it('returns a normalized form', async () => {
    const r = await c.validateCitation('2022 Cal.App.4th 1234')
    expect(typeof r.normalized).toBe('string')
    expect(r.normalized.length).toBeGreaterThan(0)
  })

  it('sets integrity to "verified" for a known case citation', async () => {
    const r = await c.validateCitation('2022 Cal.App.4th 1234')
    expect(r.integrity).toBe('verified')
  })

  it('sets integrity to "not_found" for a valid but unknown citation', async () => {
    const r = await c.validateCitation('2099 Cal.App.4th 9999')
    expect(r.integrity).toBe('not_found')
  })
})

// ── normalizeCitation ────────────────────────────────────────────────────────

describe('normalizeCitation', () => {
  it('expands abbreviations', async () => {
    const r = await c.normalizeCitation('2022 Corporation v. XYZ Cal.App.4th 1234')
    expect(r.normalized).toContain('Corp.')
  })
})

// ── extractStatute ────────────────────────────────────────────────────────────

describe('extractStatute', () => {
  it('returns a statute when given a known ID', async () => {
    const s = await c.extractStatute('Cal.Civ.Code.1657')
    expect(s).not.toBeNull()
    expect(s?.title).toBeTruthy()
    expect(s?.text).toBeTruthy()
  })

  it('returns null for an unknown statute ID', async () => {
    const s = await c.extractStatute('UNKNOWN.STATUTE.9999')
    expect(s).toBeNull()
  })
})

// ── analyzeContract ───────────────────────────────────────────────────────────

describe('analyzeContract', () => {
  it('returns a contract for a known ID', async () => {
    const contract = await c.analyzeContract('client_proposed_nda')
    expect(contract).not.toBeNull()
    expect(contract?.clauses.length).toBeGreaterThan(0)
  })

  it('every clause has risk field in expected set', async () => {
    const contract = await c.analyzeContract('client_proposed_nda')
    const VALID_RISKS = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
    contract?.clauses.forEach(cl => {
      expect(VALID_RISKS.has(cl.risk)).toBe(true)
    })
  })

  it('returns null for an unknown contract ID', async () => {
    const c2 = await c.analyzeContract('does_not_exist')
    expect(c2).toBeNull()
  })
})

// ── getAnalysisJobs ───────────────────────────────────────────────────────────

describe('getAnalysisJobs', () => {
  it('returns a list of jobs', async () => {
    const jobs = await c.getAnalysisJobs()
    expect(Array.isArray(jobs)).toBe(true)
    expect(jobs.length).toBeGreaterThan(0)
  })

  it('each job has id, file, and status', async () => {
    const jobs = await c.getAnalysisJobs()
    jobs.forEach(j => {
      expect(j).toHaveProperty('id')
      expect(j).toHaveProperty('file')
      expect(['queued', 'processing', 'complete', 'error']).toContain(j.status)
    })
  })
})

// ── queueDocumentAnalysis ──────────────────────────────────────────────────────

describe('queueDocumentAnalysis', () => {
  it('creates a new job with queued status', async () => {
    const job = await c.queueDocumentAnalysis('my_contract.pdf')
    expect(job.file).toBe('my_contract.pdf')
    expect(job.status).toBe('queued')
    expect(job.id).toBeTruthy()
  })

  it('new job appears in getAnalysisJobs', async () => {
    const job = await c.queueDocumentAnalysis('new_doc.docx')
    const jobs = await c.getAnalysisJobs()
    const found = jobs.find(j => j.id === job.id)
    expect(found).toBeDefined()
  })
})

// ── checkPrivilegeRisk ─────────────────────────────────────────────────────────

describe('checkPrivilegeRisk', () => {
  it('returns HIGH risk for openai provider', async () => {
    const r = await c.checkPrivilegeRisk('memo.docx', 'openai')
    expect(r.risk).toBe('HIGH')
  })

  it('returns LOW risk for ollama provider', async () => {
    const r = await c.checkPrivilegeRisk('memo.docx', 'ollama')
    expect(r.risk).toBe('LOW')
  })

  it('result has indicators and recommendation', async () => {
    const r = await c.checkPrivilegeRisk('memo.docx', 'anthropic')
    expect(Array.isArray(r.indicators)).toBe(true)
    expect(r.indicators.length).toBeGreaterThan(0)
    expect(typeof r.recommendation).toBe('string')
    expect(r.recommendation.length).toBeGreaterThan(0)
  })
})

// ── getWorkflows ───────────────────────────────────────────────────────────────

describe('getWorkflows', () => {
  it('returns at least one workflow', async () => {
    const wf = await c.getWorkflows()
    expect(wf.length).toBeGreaterThan(0)
  })

  it('each workflow has steps', async () => {
    const wf = await c.getWorkflows()
    wf.forEach(w => {
      expect(w.steps.length).toBeGreaterThan(0)
    })
  })
})

// ── getAuditLog ────────────────────────────────────────────────────────────────

describe('getAuditLog', () => {
  it('returns audit entries', async () => {
    const log = await c.getAuditLog()
    expect(log.length).toBeGreaterThan(0)
  })

  it('each entry has required fields', async () => {
    const log = await c.getAuditLog()
    log.forEach(e => {
      expect(e).toHaveProperty('id')
      expect(e).toHaveProperty('tool')
      expect(e).toHaveProperty('timestamp')
      expect(typeof e.success).toBe('boolean')
    })
  })

  it('appends session entries after tool calls', async () => {
    const before = (await c.getAuditLog()).length
    await c.searchPrecedents('breach')
    const after = (await c.getAuditLog()).length
    expect(after).toBeGreaterThan(before)
  })
})

describe('generateNegotiationGuide', () => {
  it('returns different guides for buyer vs seller', async () => {
    const buyer = await c.generateNegotiationGuide('client_proposed_nda', 'buyer')
    const seller = await c.generateNegotiationGuide('client_proposed_nda', 'seller')
    expect(buyer.party_role).toBe('buyer')
    expect(seller.party_role).toBe('seller')
    const buyerInd = buyer.clauses.find(cl => cl.key === 'indemnification')
    const sellerInd = seller.clauses.find(cl => cl.key === 'indemnification')
    expect(buyerInd?.recommended_position).not.toBe(sellerInd?.recommended_position)
  })

  it('mutual differs from buyer on critical clauses', async () => {
    const buyer = await c.generateNegotiationGuide('vendor_saas_agreement_v2', 'buyer')
    const mutual = await c.generateNegotiationGuide('vendor_saas_agreement_v2', 'mutual')
    const bInd = buyer.clauses.find(cl => cl.key === 'indemnification')
    const mInd = mutual.clauses.find(cl => cl.key === 'indemnification')
    expect(bInd?.recommended_position).toBe('reject')
    expect(mInd?.fallback_text).not.toBe(bInd?.fallback_text)
  })
})

describe('suggestAlternatives', () => {
  it('returns non-generic alternatives for governing_law', async () => {
    const alts = await c.suggestAlternatives('', 'governing_law')
    expect(alts.length).toBe(3)
    expect(alts[0]).not.toMatch(/^Alternative 1 for/)
  })
})

describe('compareContracts', () => {
  it('finds diffs between NDA templates', async () => {
    const { diffs } = await c.compareContracts('standard_nda_template', 'client_proposed_nda')
    expect(diffs.length).toBeGreaterThan(0)
  })
})

describe('analyzeDocument', () => {
  it('maps vendor_nda_2026.docx to client_proposed_nda risk', async () => {
    const res = await c.analyzeDocument('vendor_nda_2026.docx')
    expect(res.risk_level).toBe('HIGH')
    expect(res.metadata.file).toBe('vendor_nda_2026.docx')
  })
})

describe('checkPrivilegeRisk by file', () => {
  it('returns CRITICAL for litigation_memo.docx', async () => {
    const r = await c.checkPrivilegeRisk('litigation_memo.docx', 'openai')
    expect(r.risk).toBe('CRITICAL')
    expect(r.indicators.some(i => i.includes('Work product'))).toBe(true)
  })
})

describe('generateBriefOutline', () => {
  it('returns distinct outline for motion to dismiss', async () => {
    const outline = await c.generateBriefOutline('motion to dismiss', 'facts here')
    expect(outline.case_type.toLowerCase()).toContain('dismiss')
    expect(outline.sections.length).toBeGreaterThan(3)
  })
})

describe('workflow & automation ops', () => {
  beforeEach(() => { localStorage.clear() })

  it('saves and lists user workflows', async () => {
    const wf = await c.saveUserWorkflow({
      id: 'test-wf', title: 'Test', trigger: 'test', steps: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'user',
    })
    const list = await c.getUserWorkflows()
    expect(list.some(x => x.id === wf.id)).toBe(true)
  })

  it('runs builtin workflow with executable steps', async () => {
    const run = await c.runWorkflow('metadata-lookup', 'builtin')
    expect(run.steps.length).toBeGreaterThan(0)
  })

  it('simulates inbound inbox message', async () => {
    const msg = await c.simulateInboundMessage('inbox-001')
    expect(msg.subject).toBeTruthy()
    const inbox = await c.getInboxMessages()
    expect(inbox.some(m => m.id === msg.id)).toBe(true)
  })

  it('returns tool catalog', async () => {
    const cat = await c.getToolCatalog()
    expect(cat.length).toBeGreaterThan(5)
  })
})
