import { create } from 'zustand'

export type PanelType =
  | 'PREC' | 'CASE' | 'STAT' | 'CITE'
  | 'CTRX' | 'DOCA' | 'PRIV' | 'BRF'
  | 'JOBS' | 'LIVE' | 'WKFL' | 'AUDT'

export interface Panel {
  id: string
  type: PanelType
  query?: string
  contractId?: string
  statuteId?: string
}

interface TerminalStore {
  panels: Panel[]
  activePanel: string | null
  commandHistory: string[]
  selectedCase: string | null
  selectedContract: string | null

  openPanel: (type: PanelType, opts?: Partial<Panel>) => void
  closePanel: (id: string) => void
  setActivePanel: (id: string | null) => void
  pushCommand: (cmd: string) => void
  setSelectedCase: (id: string | null) => void
  setSelectedContract: (id: string | null) => void
  resetPanels: () => void
}

const defaultPanels: Panel[] = [
  { id: 'panel-prec', type: 'PREC' },
  { id: 'panel-cite', type: 'CITE' },
  { id: 'panel-ctrx', type: 'CTRX' },
  { id: 'panel-jobs', type: 'JOBS' },
]

let counter = 100

export const useTerminalStore = create<TerminalStore>((set) => ({
  panels: defaultPanels,
  activePanel: 'panel-prec',
  commandHistory: [],
  selectedCase: null,
  selectedContract: null,

  openPanel: (type, opts) => set(s => {
    const existing = s.panels.find(p => p.type === type)
    if (existing) return { activePanel: existing.id }
    const panel: Panel = { id: `panel-${++counter}`, type, ...opts }
    return { panels: [...s.panels, panel], activePanel: panel.id }
  }),

  closePanel: (id) => set(s => ({
    panels: s.panels.filter(p => p.id !== id),
    activePanel: s.activePanel === id ? (s.panels[0]?.id ?? null) : s.activePanel,
  })),

  setActivePanel: (id) => set({ activePanel: id }),

  pushCommand: (cmd) => set(s => ({ commandHistory: [cmd, ...s.commandHistory].slice(0, 50) })),

  setSelectedCase: (id) => set({ selectedCase: id }),
  setSelectedContract: (id) => set({ selectedContract: id }),

  resetPanels: () => set({ panels: defaultPanels, activePanel: 'panel-prec' }),
}))
