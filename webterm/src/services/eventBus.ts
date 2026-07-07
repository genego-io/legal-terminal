import type { AutomationEventType } from '../mcp/types'

type EventHandler = (payload: Record<string, unknown>) => void

const handlers = new Map<AutomationEventType, Set<EventHandler>>()

export const eventBus = {
  on(event: AutomationEventType, handler: EventHandler): () => void {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(handler)
    return () => handlers.get(event)?.delete(handler)
  },
  emit(event: AutomationEventType, payload: Record<string, unknown> = {}): void {
    handlers.get(event)?.forEach(h => {
      try { h(payload) } catch { /* ignore */ }
    })
  },
}
