import { create } from 'zustand'
import { setClientMode as _setClientMode, getClientMode, getLiveUrl } from '../mcp/index'
import type { ClientMode } from '../mcp/index'

export type PanelType =
  | 'CHAT'
  | 'PREC' | 'CASE' | 'STAT' | 'CITE'
  | 'CTRX' | 'DOCA' | 'PRIV' | 'BRF'
  | 'JOBS' | 'LIVE' | 'WKFL' | 'AUDT'
  | 'WTCH' | 'CONF'

export type ViewType = PanelType | 'HOME'

export interface ViewState {
  type: ViewType
  query?: string
  contractId?: string
  statuteId?: string
}

export interface ActivityEvent {
  id: string
  text: string
  ts: number
}

interface TerminalStore {
  // Navigation
  view: ViewState
  splitView: ViewState | null
  sidebarCollapsed: boolean

  // Client mode
  clientMode: ClientMode
  liveUrl: string
  switchClientMode(mode: ClientMode, url?: string): Promise<void>

  // Confidential mode
  confidentialMode: boolean
  localModelUrl: string
  localModel: string
  toggleConfidentialMode(): void
  setLocalModelUrl(url: string): void
  setLocalModel(m: string): void

  // Context
  commandHistory: string[]
  selectedCase: string | null
  selectedContract: string | null
  recentActivity: ActivityEvent[]

  // Actions
  navigate(type: ViewType, opts?: Partial<ViewState>): void
  pinSplit(type: PanelType): void
  closeSplit(): void
  setSidebarCollapsed(v: boolean): void
  pushCommand(cmd: string): void
  pushActivity(text: string): void
  setSelectedCase(id: string | null): void
  setSelectedContract(id: string | null): void

  // Backward-compat shims used by panels
  openPanel(type: PanelType, opts?: Partial<ViewState>): void
  closePanel(id: string): void
  setActivePanel(id: string | null): void
  activePanel: string | null
  resetPanels(): void

  // panels[] kept for any code that reads it
  panels: { id: string; type: ViewType }[]
}

let _activityCounter = 0

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  view: { type: 'HOME' },
  splitView: null,
  sidebarCollapsed: false,

  clientMode: getClientMode(),
  liveUrl: getLiveUrl(),
  async switchClientMode(mode, url) {
    await _setClientMode(mode, url)
    set({ clientMode: mode, liveUrl: url ?? get().liveUrl })
    get().pushActivity(`Client switched to ${mode}${mode === 'live' ? ` — ${url ?? get().liveUrl}` : ''}`)
  },

  confidentialMode: false,
  localModelUrl: 'http://localhost:11434',
  localModel: 'llama3.2:latest',
  toggleConfidentialMode() {
    const next = !get().confidentialMode
    set({ confidentialMode: next })
    get().pushActivity(next ? 'Confidential mode enabled — local inference only' : 'Confidential mode disabled')
  },
  setLocalModelUrl(url) { set({ localModelUrl: url }) },
  setLocalModel(m) { set({ localModel: m }) },

  commandHistory: [],
  selectedCase: null,
  selectedContract: null,
  recentActivity: [],

  // Derived — panels[] is a synthetic list for any legacy code
  panels: [{ id: 'view-home', type: 'HOME' }],
  activePanel: 'view-home',

  navigate(type, opts) {
    const view: ViewState = { type, ...opts }
    set({ view, panels: [{ id: `view-${type}`, type }], activePanel: `view-${type}` })
  },

  pinSplit(type) {
    set({ splitView: { type } })
  },

  closeSplit() {
    set({ splitView: null })
  },

  setSidebarCollapsed(v) {
    set({ sidebarCollapsed: v })
  },

  pushCommand(cmd) {
    set(s => ({ commandHistory: [cmd, ...s.commandHistory].slice(0, 50) }))
  },

  pushActivity(text) {
    const event: ActivityEvent = { id: `act-${++_activityCounter}`, text, ts: Date.now() }
    set(s => ({ recentActivity: [event, ...s.recentActivity].slice(0, 30) }))
  },

  setSelectedCase(id) { set({ selectedCase: id }) },
  setSelectedContract(id) { set({ selectedContract: id }) },

  // Shims
  openPanel(type, opts) { get().navigate(type, opts) },
  closePanel(_id) { get().navigate('HOME') },
  setActivePanel(id) { set({ activePanel: id }) },
  resetPanels() {
    set({ view: { type: 'HOME' }, splitView: null, panels: [{ id: 'view-home', type: 'HOME' }], activePanel: 'view-home' })
  },
}))
