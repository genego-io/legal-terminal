import { useState, useEffect } from 'react'
import { PanelChrome } from '../components/PanelChrome'
import { client } from '../mcp/mockClient'
import type { AnalysisJob } from '../mcp/types'

const STATUS_COLOR: Record<string, string> = {
  complete: 'var(--risk-low)', processing: 'var(--risk-medium)',
  queued: 'var(--text-muted)', error: 'var(--risk-critical)',
}

const RISK_COLOR: Record<string, string> = {
  CRITICAL: 'var(--risk-critical)', HIGH: 'var(--risk-high)',
  MEDIUM: 'var(--risk-medium)', LOW: 'var(--risk-low)',
}

function ts(s: string | null) {
  return s ? new Date(s).toLocaleTimeString('en-US', { hour12: false }) : '—'
}

export function JobsPanel({ id }: { id: string }) {
  const [jobs, setJobs] = useState<AnalysisJob[]>([])
  const [newFile, setNewFile] = useState('')
  const [selected, setSelected] = useState<AnalysisJob | null>(null)

  async function refresh() {
    const j = await client.getAnalysisJobs()
    setJobs(j)
  }

  useEffect(() => {
    refresh()
    const iv = setInterval(refresh, 2000)
    return () => clearInterval(iv)
  }, [])

  async function queue() {
    if (!newFile.trim()) return
    await client.queueDocumentAnalysis(newFile.trim())
    setNewFile(''); refresh()
  }

  return (
    <PanelChrome id={id} mnemonic="JOBS" title="Analysis Queue" subtitle="queue_document_analysis · list_analysis_jobs"
      actions={
        <button onClick={refresh} className="btn" style={{ fontSize: 10 }}>↻ Refresh</button>
      }
    >
      <div style={{ padding: '7px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <input value={newFile} onChange={e => setNewFile(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && queue()}
          placeholder="Filename to queue…"
          className="field-input" style={{ flex: 1 }}
        />
        <button onClick={queue} className="btn">+ Queue</button>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 16, padding: '4px 12px', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
        {['complete', 'processing', 'queued', 'error'].map(s => (
          <span key={s} style={{ color: STATUS_COLOR[s] }}>
            {jobs.filter(j => j.status === s).length} {s}
          </span>
        ))}
        <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', fontSize: 10 }}>auto-refresh 2s</span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['ID', 'File', 'Status', 'Queued', 'Done', 'Risk', 'Flags'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} onClick={() => setSelected(j)} className={selected?.id === j.id ? 'selected' : ''} style={{ cursor: 'pointer' }}>
                  <td className="mono-cell">{j.id}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.file}</td>
                  <td style={{ color: STATUS_COLOR[j.status], fontWeight: 500 }}>{j.status}</td>
                  <td className="mono-cell">{ts(j.queued_at)}</td>
                  <td className="mono-cell">{ts(j.completed_at)}</td>
                  <td style={{ color: RISK_COLOR[j.risk_level ?? ''] ?? 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{j.risk_level ?? '—'}</td>
                  <td className="num">{j.flags ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected && (
          <div style={{ width: 180, borderLeft: '1px solid var(--border)', padding: 12, overflowY: 'auto', flexShrink: 0, fontSize: 12 }}>
            <div style={{ color: 'var(--text-heading)', fontWeight: 600, marginBottom: 10 }}>Job detail</div>
            {[['ID', selected.id], ['File', selected.file], ['Status', selected.status],
              ['Risk', selected.risk_level ?? '—'], ['Clauses', String(selected.clause_count ?? '—')],
              ['Flags', String(selected.flags ?? '—')]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 1 }}>{k}</div>
                <div style={{ color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{v}</div>
              </div>
            ))}
            {selected.error && <div style={{ color: 'var(--risk-critical)', fontSize: 11, marginTop: 6 }}>↳ {selected.error}</div>}
          </div>
        )}
      </div>
    </PanelChrome>
  )
}
