import type { InboxMessage, TriggerCategory, TriggerRule } from '../mcp/types'
import { TRIGGER_CATEGORIES, INBOX_SEED } from '../fixtures'
import { inboxStore, triggerStore } from './stores'
import { eventBus } from './eventBus'
import { pushChatPrompt } from '../store/chatStore'
import { automationScheduler } from './automationScheduler'

function domainFromEmail(from: string): string {
  const m = from.match(/@([^>]+)/)
  return m ? m[1].toLowerCase() : ''
}

function ext(name: string): string {
  const p = name.split('.')
  return (p[p.length - 1] ?? '').toLowerCase()
}

function categorizeMessage(msg: Omit<InboxMessage, 'categoryId' | 'status'>): string {
  const subject = msg.subject.toLowerCase()
  const domain = domainFromEmail(msg.from)
  if (/nda|contract|msa|agreement|vendor/.test(subject) || /vendor|counterparty/.test(domain)) return 'contract'
  if (/privileged|attorney|work product|confidential memo/.test(subject)) return 'privilege'
  if (/deposition|litigation|motion|discovery|pleading/.test(subject)) return 'litigation'
  if (/employment|hr|termination|offer letter/.test(subject)) return 'hr'
  return 'general'
}

function matchesRule(msg: InboxMessage, rule: TriggerRule): boolean {
  if (!rule.enabled || rule.categoryId !== msg.categoryId) return false
  const { conditions } = rule
  if (conditions.fromDomains?.length) {
    const domain = domainFromEmail(msg.from)
    if (!conditions.fromDomains.some(d => domain.endsWith(d.toLowerCase()))) return false
  }
  if (conditions.subjectKeywords?.length) {
    const subj = msg.subject.toLowerCase()
    if (!conditions.subjectKeywords.some(k => subj.includes(k.toLowerCase()))) return false
  }
  if (conditions.attachmentTypes?.length) {
    const exts = msg.attachments.map(ext)
    if (!conditions.attachmentTypes.some(t => exts.includes(t.toLowerCase()))) return false
  }
  if (conditions.minAttachments && msg.attachments.length < conditions.minAttachments) return false
  return true
}

export function renderPromptTemplate(template: string, msg: InboxMessage, category: TriggerCategory | undefined): string {
  return template
    .replace(/\{\{subject\}\}/g, msg.subject)
    .replace(/\{\{from\}\}/g, msg.from)
    .replace(/\{\{category\}\}/g, category?.label ?? msg.categoryId)
    .replace(/\{\{filename\}\}/g, msg.attachments[0] ?? 'none')
    .replace(/\{\{attachmentCount\}\}/g, String(msg.attachments.length))
}

export const triggerRouter = {
  getCategories(): TriggerCategory[] {
    return TRIGGER_CATEGORIES
  },

  async processMessage(msgId: string, runWorkflowFn: (workflowId: string, source: 'builtin' | 'user') => Promise<void>): Promise<InboxMessage | null> {
    const msg = inboxStore.list().find(m => m.id === msgId)
    if (!msg || msg.status === 'processed' || msg.status === 'dismissed') return null

    const processing: InboxMessage = { ...msg, status: 'processing' }
    inboxStore.save(processing)

    const rules = triggerStore.listRules().filter(r => matchesRule(processing, r))
    const rule = rules[0]
    const category = TRIGGER_CATEGORIES.find(c => c.id === processing.categoryId)

    let result: InboxMessage = processing
    if (rule) {
      result = { ...processing, matchedRuleId: rule.id }
      if (rule.action.automationId) {
        await automationScheduler.runById(rule.action.automationId)
      } else if (rule.action.workflowId) {
        await runWorkflowFn(rule.action.workflowId, rule.action.workflowSource)
      }
      if (rule.action.autoRunChat && rule.action.agentPromptTemplate) {
        pushChatPrompt(renderPromptTemplate(rule.action.agentPromptTemplate, result, category))
      }
    }

    result = { ...result, status: 'processed' }
    inboxStore.save(result)
    return result
  },

  deliverInbound(msg: Omit<InboxMessage, 'categoryId' | 'status'>): InboxMessage {
    const full: InboxMessage = {
      ...msg,
      categoryId: categorizeMessage(msg),
      status: 'pending',
    }
    inboxStore.save(full)
    eventBus.emit('email_received', { messageId: full.id, categoryId: full.categoryId, file: full.attachments[0] })
    return full
  },

  simulateInbound(seedId?: string): InboxMessage {
    const seed = seedId
      ? INBOX_SEED.find(m => m.id === seedId)
      : INBOX_SEED[Math.floor(Math.random() * INBOX_SEED.length)]
    if (!seed) throw new Error('No seed message')
    const msg = triggerRouter.deliverInbound({
      id: `inbox-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      from: seed.from,
      subject: seed.subject,
      attachments: [...seed.attachments],
    })
    return msg
  },
}
