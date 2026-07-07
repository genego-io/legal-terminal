import { describe, it, expect, beforeEach } from 'vitest'
import { computeNextRunAt, scheduleSummary } from './automationScheduler'
import { renderPromptTemplate } from './triggerRouter'
import { runWorkflow } from './workflowRunner'
import { MockClient } from '../mcp/mockClient'
import type { InboxMessage } from '../mcp/types'

describe('computeNextRunAt', () => {
  it('computes next daily run', () => {
    const from = new Date('2026-07-07T08:00:00Z')
    const next = computeNextRunAt({ type: 'daily', time: '09:00' }, from)
    expect(next).toBeTruthy()
    expect(new Date(next!).getHours()).toBe(9)
  })

  it('returns null for past once schedule', () => {
    const next = computeNextRunAt({ type: 'once', dateTime: '2020-01-01T09:00:00Z' })
    expect(next).toBeNull()
  })
})

describe('scheduleSummary', () => {
  it('formats event schedule', () => {
    expect(scheduleSummary({ type: 'event', event: 'job_complete' })).toContain('job complete')
  })
})

describe('renderPromptTemplate', () => {
  const msg: InboxMessage = {
    id: '1', receivedAt: '', from: 'a@b.com', subject: 'NDA review',
    categoryId: 'contract', attachments: ['file.docx'], status: 'pending',
  }
  it('substitutes tokens', () => {
    const out = renderPromptTemplate('From {{from}}: {{subject}} ({{filename}})', msg, undefined)
    expect(out).toContain('a@b.com')
    expect(out).toContain('NDA review')
    expect(out).toContain('file.docx')
  })
})

describe('runWorkflow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('runs builtin citation cleanup', async () => {
    const client = new MockClient()
    const run = await runWorkflow(client, 'citation-cleanup', 'builtin')
    expect(run.status).toBe('success')
    expect(run.steps.length).toBe(3)
  })

  it('fails when no executable steps', async () => {
    const client = new MockClient()
    const run = await runWorkflow(client, 'negotiation-prep', 'builtin')
    expect(run.status).toBe('error')
  })
})
