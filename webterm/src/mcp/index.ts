/**
 * Runtime-switchable client.
 *
 * Exports a `client` proxy that always delegates to the currently active
 * implementation (MockClient or LiveClient). Switch modes at runtime via
 * `setClientMode('live', url)` or `setClientMode('mock')` — no page reload needed.
 *
 * The env var VITE_MCP_URL sets the initial mode at build time.
 */

import type { LegalMcpClient } from './client'
import { MockClient } from './mockClient'

// Active delegate — swapped by setClientMode()
let _active: LegalMcpClient = new MockClient()

// Transparent proxy — all panels import `client` once and always get the
// current implementation without needing to re-import.
export const client = new Proxy({} as LegalMcpClient, {
  get(_target, prop: string) {
    return (_active as unknown as Record<string, unknown>)[prop]
  },
})

export type ClientMode = 'mock' | 'live'

let _mode: ClientMode = 'mock'
let _liveUrl = import.meta.env.VITE_MCP_URL ?? 'http://localhost:8000'

export function getClientMode(): ClientMode { return _mode }
export function getLiveUrl(): string { return _liveUrl }

export async function setClientMode(mode: ClientMode, url?: string): Promise<void> {
  if (url) _liveUrl = url
  if (mode === 'live') {
    const { LiveClient } = await import('./liveClient')
    _active = new LiveClient(_liveUrl)
    _mode = 'live'
    console.info(`[legal-terminal] LiveClient → ${_liveUrl}`)
  } else {
    _active = new MockClient()
    _mode = 'mock'
    console.info('[legal-terminal] MockClient')
  }
}

// Honour VITE_MCP_URL env var on startup
if (import.meta.env.VITE_MCP_URL) {
  setClientMode('live', import.meta.env.VITE_MCP_URL as string)
}
