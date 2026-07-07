import type { Automation, AutomationEventType, AutomationSchedule } from '../mcp/types'
import { automationStore } from './stores'
import { eventBus } from './eventBus'

function parseTime(time: string): { h: number; m: number } {
  const [h, m] = time.split(':').map(Number)
  return { h: h ?? 0, m: m ?? 0 }
}

export function computeNextRunAt(schedule: AutomationSchedule, from = new Date()): string | null {
  if (schedule.type === 'event') return null
  const d = new Date(from)
  if (schedule.type === 'once') {
    const target = new Date(schedule.dateTime)
    return target > from ? target.toISOString() : null
  }
  const { h, m } = parseTime(schedule.time)
  if (schedule.type === 'daily') {
    const next = new Date(d)
    next.setHours(h, m, 0, 0)
    if (next <= d) next.setDate(next.getDate() + 1)
    return next.toISOString()
  }
  if (schedule.type === 'weekly') {
    const next = new Date(d)
    next.setHours(h, m, 0, 0)
    const diff = (schedule.dayOfWeek - next.getDay() + 7) % 7
    next.setDate(next.getDate() + (diff === 0 && next <= d ? 7 : diff))
    return next.toISOString()
  }
  return null
}

export function scheduleSummary(schedule: AutomationSchedule): string {
  if (schedule.type === 'once') return `Once at ${new Date(schedule.dateTime).toLocaleString()}`
  if (schedule.type === 'daily') return `Daily at ${schedule.time}`
  if (schedule.type === 'weekly') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `${days[schedule.dayOfWeek]} at ${schedule.time}`
  }
  if (schedule.type === 'event') {
    const extra = schedule.categoryId ? ` (${schedule.categoryId})` : ''
    return `On ${schedule.event.replace(/_/g, ' ')}${extra}`
  }
  return 'Unknown'
}

type RunHandler = (automation: Automation) => Promise<void>

let tickInterval: ReturnType<typeof setInterval> | null = null
let runHandler: RunHandler | null = null
const unsubscribers: (() => void)[] = []

type SchedulerApi = {
  setRunHandler(handler: RunHandler): void
  start(): void
  stop(): void
  tick(): Promise<void>
  fireEvent(event: AutomationEventType, payload?: Record<string, unknown>): Promise<void>
  runAutomation(a: Automation): Promise<void>
  runById(id: string): Promise<void>
}

export const automationScheduler: SchedulerApi = {
  setRunHandler(handler: RunHandler): void {
    runHandler = handler
  },

  start(): void {
    if (tickInterval) return
    automationStore.list().forEach(a => {
      if (a.enabled && !a.nextRunAt && a.schedule.type !== 'event') {
        automationStore.save({ ...a, nextRunAt: computeNextRunAt(a.schedule) })
      }
    })
    tickInterval = setInterval(() => automationScheduler.tick(), 30_000)
    unsubscribers.push(
      eventBus.on('job_complete', () => automationScheduler.fireEvent('job_complete', {})),
      eventBus.on('document_upload', p => automationScheduler.fireEvent('document_upload', p)),
      eventBus.on('contract_selected', p => automationScheduler.fireEvent('contract_selected', p)),
      eventBus.on('email_received', p => automationScheduler.fireEvent('email_received', p)),
    )
    setTimeout(() => automationScheduler.fireEvent('app_open', {}), 500)
  },

  stop(): void {
    if (tickInterval) clearInterval(tickInterval)
    tickInterval = null
    unsubscribers.forEach(u => u())
    unsubscribers.length = 0
  },

  async tick(): Promise<void> {
    const now = Date.now()
    for (const a of automationStore.list()) {
      if (!a.enabled || a.schedule.type === 'event') continue
      if (a.nextRunAt && new Date(a.nextRunAt).getTime() <= now) {
        await automationScheduler.runAutomation(a)
      }
    }
  },

  async fireEvent(event: AutomationEventType, payload: Record<string, unknown> = {}): Promise<void> {
    for (const a of automationStore.list()) {
      if (!a.enabled || a.schedule.type !== 'event' || a.schedule.event !== event) continue
      if (a.schedule.filter && payload.file && !String(payload.file).includes(a.schedule.filter)) continue
      if (a.schedule.categoryId && payload.categoryId && a.schedule.categoryId !== payload.categoryId) continue
      await automationScheduler.runAutomation(a)
    }
  },

  async runAutomation(a: Automation): Promise<void> {
    if (!runHandler) return
    try {
      await runHandler(a)
      automationStore.save({
        ...a,
        lastRunAt: new Date().toISOString(),
        lastStatus: 'success',
        nextRunAt: a.schedule.type !== 'event' ? computeNextRunAt(a.schedule) : null,
      })
    } catch {
      automationStore.save({
        ...a,
        lastRunAt: new Date().toISOString(),
        lastStatus: 'error',
        nextRunAt: a.schedule.type !== 'event' ? computeNextRunAt(a.schedule) : null,
      })
    }
  },

  async runById(id: string): Promise<void> {
    const a = automationStore.get(id)
    if (a) await automationScheduler.runAutomation(a)
  },
}
