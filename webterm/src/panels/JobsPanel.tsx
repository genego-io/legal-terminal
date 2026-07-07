import { useState, useEffect } from 'react'
import { PanelChrome } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import type { AnalysisJob } from '../mcp/types'

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
  const { pushActivity } = useTerminalStore()

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
    pushActivity(`JOBS queued "${newFile.trim()}"`)
    setNewFile('')
    refresh()
  }

  const counts = ['complete', 'processing', 'queued', 'error'].reduce((acc, s) => {
    acc[s] = jobs.filter(j => j.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <PanelChrome id={id} mnemonic="JOBS" title="Analysis Queue" subtitle="queue_document_analysis · list_analysis_jobs" panelType="JOBS"
      actions={
        <button onClick={refresh} className="btn" style={{ fontSize: 10 }}>↻ Refresh</button>
      }
    >
      {/* Queue toolbar */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input value={newFile} onChange={e => setNewFile(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && queue()}
          placeholder="Filename to queue for analysis…"
          className="field-input" style={{ flex: 1 }}
        />
        <button onClick={queue} className="btn">+ Queue</button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
        {['complete', 'processing', 'queued', 'error'].map(s => (
          <span key={s} className={`status-chip ${s}`}>
            {counts[s]} {s}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", alignSelf: 'center' }}>
          auto-refresh 2s
        </span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>File</th>
                <th>Status</th>
                <th>Queued</th>
                <th>Completed</th>
                <th>Risk</th>
                <th style={{ textAlign: 'right' }}>Flags</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} onClick={() => setSelected(j)}
                  className={selected?.id === j.id ? 'selected' : ''}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="mono-cell">{j.id}</td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.file}</td>
                  <td>
                    <span className={`status-chip ${j.status}`}>{j.status}</span>
                  </td>
                  <td className="mono-cell">{ts(j.queued_at)}</td>
                  <td className="mono-cell">{ts(j.completed_at)}</td>
                  <td style={{ color: RISK_COLOR[j.risk_level ?? ''] ?? 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                    {j.risk_level ?? '—'}
                  </td>
                  <td className="num">{j.flags ?? '—'}</td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                    No jobs in queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail side */}
        {selected && (
          <div style={{ width: 220, borderLeft: '1px solid var(--border)', padding: '16px 14px', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: 12, marginBottom: 14 }}>Job detail</div>
            {[
              ['ID', selected.id],
              ['File', selected.file],
              ['Status', selected.status],
              ['Risk', selected.risk_level ?? '—'],
              ['Clauses', String(selected.clause_count ?? '—')],
              ['Flags', String(selected.flags ?? '—')],
              ['Queued', ts(selected.queued_at)],
              ['Completed', ts(selected.completed_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{k}</div>
                <div style={{ color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}
            {selected.error && (
              <div style={{ color: 'var(--risk-critical)', fontSize: 11, marginTop: 6 }}>↳ {selected.error}</div>
            )}
          </div>
        )}
      </div>
    </PanelChrome>
  )
}
