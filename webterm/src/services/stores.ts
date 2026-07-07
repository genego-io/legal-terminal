import type { UserWorkflow, Automation, TriggerRule, ParalegalInboxConfig, InboxMessage, AppSettings } from '../mcp/types'
import { AUTOMATIONS_SEED, INBOX_SEED, TRIGGER_RULES_SEED } from '../fixtures'

const KEYS = {
  workflows: 'legal-term-user-workflows',
  automations: 'legal-term-automations',
  triggerRules: 'legal-term-trigger-rules',
  inboxConfig: 'legal-term-inbox-config',
  inboxMessages: 'legal-term-inbox-messages',
  settings: 'legal-term-settings',
  seeded: 'legal-term-ops-seeded',
} as const

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage unavailable */ }
}

export function ensureOpsSeeded(): void {
  if (localStorage.getItem(KEYS.seeded) === '1') return
  writeJson(KEYS.automations, AUTOMATIONS_SEED)
  writeJson(KEYS.inboxMessages, INBOX_SEED)
  writeJson(KEYS.triggerRules, TRIGGER_RULES_SEED)
  writeJson<ParalegalInboxConfig>(KEYS.inboxConfig, {
    address: 'paralegal@firm.example.com',
    displayName: 'Paralegal Inbox',
    pop3: {
      host: 'mail.firm.example.com',
      port: 995,
      username: 'paralegal@firm.example.com',
      password: '',
      useTls: true,
      pollIntervalMin: 5,
      enabled: false,
    },
  })
  localStorage.setItem(KEYS.seeded, '1')
}

export const workflowStore = {
  list(): UserWorkflow[] {
    return readJson<UserWorkflow[]>(KEYS.workflows, [])
  },
  save(w: UserWorkflow): UserWorkflow {
    const list = workflowStore.list()
    const idx = list.findIndex(x => x.id === w.id)
    const next = { ...w, updatedAt: new Date().toISOString() }
    if (idx >= 0) list[idx] = next
    else list.push(next)
    writeJson(KEYS.workflows, list)
    return next
  },
  delete(id: string): void {
    writeJson(KEYS.workflows, workflowStore.list().filter(w => w.id !== id))
  },
}

export const automationStore = {
  list(): Automation[] {
    ensureOpsSeeded()
    return readJson<Automation[]>(KEYS.automations, [])
  },
  save(a: Automation): Automation {
    const list = automationStore.list()
    const idx = list.findIndex(x => x.id === a.id)
    if (idx >= 0) list[idx] = a
    else list.push(a)
    writeJson(KEYS.automations, list)
    return a
  },
  delete(id: string): void {
    writeJson(KEYS.automations, automationStore.list().filter(a => a.id !== id))
  },
  get(id: string): Automation | undefined {
    return automationStore.list().find(a => a.id === id)
  },
}

export const triggerStore = {
  listRules(): TriggerRule[] {
    ensureOpsSeeded()
    return readJson<TriggerRule[]>(KEYS.triggerRules, [])
  },
  saveRule(r: TriggerRule): TriggerRule {
    const list = triggerStore.listRules()
    const idx = list.findIndex(x => x.id === r.id)
    if (idx >= 0) list[idx] = r
    else list.push(r)
    writeJson(KEYS.triggerRules, list)
    return r
  },
  deleteRule(id: string): void {
    writeJson(KEYS.triggerRules, triggerStore.listRules().filter(r => r.id !== id))
  },
  getInboxConfig(): ParalegalInboxConfig {
    ensureOpsSeeded()
    return readJson<ParalegalInboxConfig>(KEYS.inboxConfig, {
      address: 'paralegal@firm.example.com',
      displayName: 'Paralegal Inbox',
      pop3: { host: '', port: 995, username: '', password: '', useTls: true, pollIntervalMin: 5, enabled: false },
    })
  },
  saveInboxConfig(cfg: ParalegalInboxConfig): ParalegalInboxConfig {
    writeJson(KEYS.inboxConfig, cfg)
    return cfg
  },
}

export const inboxStore = {
  list(): InboxMessage[] {
    ensureOpsSeeded()
    return readJson<InboxMessage[]>(KEYS.inboxMessages, [])
  },
  save(msg: InboxMessage): InboxMessage {
    const list = inboxStore.list()
    const idx = list.findIndex(x => x.id === msg.id)
    if (idx >= 0) list[idx] = msg
    else list.unshift(msg)
    writeJson(KEYS.inboxMessages, list)
    return msg
  },
  delete(id: string): void {
    writeJson(KEYS.inboxMessages, inboxStore.list().filter(m => m.id !== id))
  },
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultPanel: 'HOME',
  jobsRefreshIntervalSec: 2,
  sidebarDefaultCollapsed: false,
  theme: 'light',
  liveMcpUrl: 'http://localhost:8000',
  courtListenerToken: '',
  pacerUsername: '',
  emailDigestEnabled: false,
  webhookUrl: '',
  categoryNotifications: {},
  confidentialMode: false,
  localModelUrl: 'http://localhost:11434',
  localModel: 'llama3.2:latest',
}

export const settingsStore = {
  get(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(KEYS.settings, {}) }
  },
  save(partial: Partial<AppSettings>): AppSettings {
    const next = { ...settingsStore.get(), ...partial }
    writeJson(KEYS.settings, next)
    return next
  },
}

export { KEYS as storageKeys }
