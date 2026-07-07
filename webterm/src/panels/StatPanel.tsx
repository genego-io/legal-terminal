import { useState } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/mockClient'
import type { Statute } from '../mcp/types'

const QUICK = [
  { label: 'Cal. Civ. Code § 1657', id: 'Cal.Civ.Code.1657' },
  { label: 'Cal. Com. Code § 2106', id: 'Cal.Com.Code.2106' },
  { label: '18 U.S.C. § 1030', id: '18.USC.1030' },
  { label: 'GDPR Art. 28', id: 'GDPR.Art.28' },
]

interface Props { id: string; statuteId?: string }

export function StatPanel({ id, statuteId }: Props) {
  const [query, setQuery] = useState(statuteId ?? '')
  const [statute, setStatute] = useState<Statute | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function load(q: string) {
    setLoading(true); setNotFound(false)
    const res = await client.extractStatute(q)
    setStatute(res); setNotFound(!res); setLoading(false)
  }

  return (
    <PanelChrome id={id} mnemonic="STAT" title="Statute Viewer" subtitle="extract_statute">
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(query)}
          placeholder="Section ID or citation fragment…"
          className="field-input" style={{ flex: 1 }}
        />
        <button onClick={() => load(query)} className="btn-primary">Retrieve</button>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {QUICK.map(q => (
          <button key={q.id} onClick={() => { setQuery(q.id); load(q.id) }} className="btn" style={{ fontSize: 11 }}>
            {q.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }} className="info-pane">
        {loading && <LoadingDots />}
        {notFound && <div style={{ color: 'var(--risk-medium)' }}>Statute not found in local library.</div>}
        {statute && !loading && (
          <>
            <h3>{statute.title}</h3>
            <div className="citation" style={{ marginBottom: 4 }}>{statute.citation}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 16 }}>
              {statute.jurisdiction} · Enacted {statute.enacted} · Amended {statute.last_amended}
            </div>
            <div className="section-label">Statutory text</div>
            <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.8, background: 'var(--bg)', padding: '10px 14px', border: '1px solid var(--border)', marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace" }}>
              {statute.text}
            </div>
            <div className="section-label">Legislative history</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>{statute.history}</div>
            <div className="section-label">Topics</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {statute.topics.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </>
        )}
        {!statute && !loading && !notFound && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Enter a statute ID or select a quick link above.</div>
        )}
      </div>
    </PanelChrome>
  )
}
