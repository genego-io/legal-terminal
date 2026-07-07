/**
 * Client selector — exports a `client` singleton that is either the
 * MockClient (default, no env needed) or the LiveClient (set VITE_MCP_URL).
 *
 * To connect to a running legal-mcp server:
 *   1. Start the server:
 *        cd legal-mcp && pip install -e . && python main.py --transport sse
 *   2. Add to webterm/.env.local:
 *        VITE_MCP_URL=http://localhost:8000
 *   3. Restart `npm run dev`
 */

import type { LegalMcpClient } from './client'

let _client: LegalMcpClient

if (import.meta.env.VITE_MCP_URL) {
  const { LiveClient } = await import('./liveClient')
  _client = new LiveClient(import.meta.env.VITE_MCP_URL as string)
  console.info(`[legal-terminal] LiveClient → ${import.meta.env.VITE_MCP_URL}`)
} else {
  const { client } = await import('./mockClient')
  _client = client
  console.info('[legal-terminal] MockClient (set VITE_MCP_URL to connect to live server)')
}

export { _client as client }
