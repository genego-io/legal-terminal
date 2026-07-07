import { useEffect, useState } from 'react'
import { PanelChrome } from '../components/PanelChrome'
import { client } from '../mcp/index'
import type { AuditEntry } from '../mcp/types'

const CATEGORY_COLOR: Record<string, string> = {
  search: 'var(--accent)', analysis: 'var(--risk-medium)', validation: 'var(--risk-low)',
  review: 'var(--risk-high)', metadata: 'var(--text-muted)', system: 'var(--text-muted)',
  contract: 'var(--risk-high)', privilege: 'var(--risk-critical)',
}

function ts(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
}

export function AudtPanel({ id }: { id: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [category, setCategory] = useState<string | null>(null)
  const categories = Array.from(new Set(entries.map(e => e.category)))

  useEffect(() => { client.getAuditLog().then(setEntries) }, [])

  const filtered = category ? entries.filter(e => e.category === category) : entries

  return (
    <PanelChrome id={id} mnemonic="AUDT" title="Audit Log" subtitle="utils.audit — all tool invocations">
      <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <button onClick={() => setCategory(null)} style={{
          background: !category ? 'var(--bg-selected)' : 'var(--bg-panel2)',
          border: '1px solid ' + (!category ? 'var(--accent-dim)' : 'var(--border)'),
          color: !category ? 'var(--accent)' : 'var(--text-muted)',
          fontFamily: 'inherit', fontSize: 10, padding: '2px 8px', cursor: 'pointer',
        }}>All</button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            background: category === cat ? 'var(--bg-selected)' : 'var(--bg-panel2)',
            border: '1px solid ' + (category === cat ? 'var(--accent-dim)' : 'var(--border)'),
            color: category === cat ? CATEGORY_COLOR[cat] ?? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'inherit', fontSize: 10, padding: '2px 8px', cursor: 'pointer',
          }}>{cat}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {['Time', 'Tool', 'User', 'Input (truncated)', 'Success', 'ms'].map(h => (
                <th key={h} style={h === 'ms' ? { textAlign: 'right' } : {}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td className="mono-cell">{ts(e.timestamp)}</td>
                <td style={{ color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: CATEGORY_COLOR[e.category] ?? 'var(--text-muted)', marginRight: 6, verticalAlign: 'middle' }} />
                  {e.tool}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{e.user}</td>
                <td style={{ color: 'var(--text-dim)', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {JSON.stringify(e.input).slice(0, 80)}…
                </td>
                <td style={{ color: e.success ? 'var(--risk-low)' : 'var(--risk-critical)', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace' " }}>
                  {e.success ? 'ok' : 'err'}
                </td>
                <td className="num">{e.duration_ms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelChrome>
  )
}
