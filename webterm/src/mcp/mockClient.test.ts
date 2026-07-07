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

  it('returns results for an unmatched query (fallback ranking)', async () => {
    const results = await c.searchPrecedents('xyzzy_nomatchwhatsoever')
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
})
