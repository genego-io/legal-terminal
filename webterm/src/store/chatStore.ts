import { create } from 'zustand'
import type { Case, Statute, Contract, CitationResult, BriefOutline } from '../mcp/types'

export type Attachment =
  | { kind: 'cases'; cases: Case[] }
  | { kind: 'statutes'; statutes: Statute[] }
  | { kind: 'citation'; result: CitationResult }
  | { kind: 'contracts'; contracts: Contract[] }
  | { kind: 'brief'; outline: BriefOutline }

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  ts: number
  attachments?: Attachment[]
}

interface ChatStore {
  messages: ChatMessage[]
  thinking: boolean
  pendingPrompt: string | null
  push(m: Omit<ChatMessage, 'id' | 'ts'>): void
  setThinking(v: boolean): void
  clear(): void
  queuePrompt(text: string): void
  consumePendingPrompt(): string | null
}

let _msgCounter = 0

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  thinking: false,
  pendingPrompt: null,
  push(m) {
    const msg: ChatMessage = { ...m, id: `msg-${++_msgCounter}`, ts: Date.now() }
    set(s => ({ messages: [...s.messages, msg] }))
  },
  setThinking(v) { set({ thinking: v }) },
  clear() { set({ messages: [] }) },
  queuePrompt(text) { set({ pendingPrompt: text }) },
  consumePendingPrompt() {
    const p = get().pendingPrompt
    if (p) set({ pendingPrompt: null })
    return p
  },
}))

export function pushChatPrompt(text: string): void {
  useChatStore.getState().queuePrompt(text)
}
