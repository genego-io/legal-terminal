import { useState } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import { STATUTE_QUICK_LINKS } from '../fixtureMeta'
import type { Statute } from '../mcp/types'

const QUICK = STATUTE_QUICK_LINKS

interface Props { id: string; statuteId?: string }

export function StatPanel({ id, statuteId }: Props) {
  const [query, setQuery] = useState(statuteId ?? '')
  const [statute, setStatute] = useState<Statute | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const { pushActivity } = useTerminalStore()

  async function load(q: string) {
    setLoading(true); setNotFound(false)
    const res = await client.extractStatute(q)
    setStatute(res); setNotFound(!res); setLoading(false)
    pushActivity(`STAT "${q}" → ${res ? res.title : 'not found'}`)
  }

  return (
    <PanelChrome id={id} mnemonic="STAT" title="Statute Viewer" subtitle="extract_statute" panelType="STAT">
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(query)}
          placeholder="Section ID or citation fragment…"
          className="field-input" style={{ flex: 1 }}
          autoFocus
        />
        <button onClick={() => load(query)} className="btn-primary">Retrieve</button>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
        {QUICK.map(q => (
          <button key={q.id} onClick={() => { setQuery(q.id); load(q.id) }} className="btn">
            {q.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }} className="info-pane">
        {loading && <LoadingDots />}
        {notFound && <div style={{ color: 'var(--risk-medium)', fontSize: 12 }}>Statute not found in local library.</div>}
        {statute && !loading && (
          <>
            <h3 style={{ fontSize: 15, marginBottom: 5 }}>{statute.title}</h3>
            <div className="citation" style={{ marginBottom: 6 }}>{statute.citation}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 20, display: 'flex', gap: 8 }}>
              <span>{statute.jurisdiction}</span>
              <span>·</span>
              <span>Enacted {statute.enacted}</span>
              <span>·</span>
              <span>Amended {statute.last_amended}</span>
            </div>
            <div className="section-label">Statutory text</div>
            <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.85, background: 'var(--bg)', padding: '14px 18px', border: '1px solid var(--border)', marginBottom: 20, fontFamily: "'IBM Plex Mono', monospace" }}>
              {statute.text}
            </div>
            <div className="section-label">Legislative history</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.75, marginBottom: 20 }}>{statute.history}</div>
            <div className="section-label">Topics</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {statute.topics.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </>
        )}
        {!statute && !loading && !notFound && (
          <div className="empty-state">
            <div className="empty-state-title">Statute viewer</div>
            <div className="empty-state-desc">Retrieve statutory text with legislative history. Select a quick link or enter a section ID.</div>
            <div className="empty-state-examples" style={{ marginTop: 4 }}>
              {QUICK.map(q => (
                <button key={q.id} className="quick-action" onClick={() => { setQuery(q.id); load(q.id) }}>
                  <span className="qa-label">STAT</span>
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PanelChrome>
  )
}
