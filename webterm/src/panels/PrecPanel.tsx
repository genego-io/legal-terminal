import { useState, useEffect } from 'react'
import { PanelChrome, RelevanceBar, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import type { Case } from '../mcp/types'

interface Props { id: string; query?: string }

const EXAMPLES = [
  'breach of contract delivery',
  'attorney-client privilege waiver',
  'indemnification limitation of liability',
  'time is of the essence',
]

export function PrecPanel({ id, query: initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Case[]>([])
  const [selected, setSelected] = useState<Case | null>(null)
  const [loading, setLoading] = useState(false)
  const { setSelectedCase, navigate, pushActivity } = useTerminalStore()

  async function search(q: string) {
    if (!q.trim()) return
    setLoading(true)
    const res = await client.searchPrecedents(q)
    setResults(res)
    setLoading(false)
    if (res.length) { setSelected(res[0]); setSelectedCase(res[0].id) }
    pushActivity(`PREC "${q}" → ${res.length} result${res.length !== 1 ? 's' : ''}`)
  }

  useEffect(() => { if (initialQuery) search(initialQuery) }, [])

  return (
    <PanelChrome id={id} mnemonic="PREC" title="Precedent Search" subtitle="search_precedents · search_case_law" panelType="PREC">
      {/* Search bar */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search(query)}
          placeholder="e.g. breach of contract delivery"
          className="field-input"
          style={{ flex: 1 }}
          autoFocus
        />
        <button onClick={() => search(query)} className="btn-primary">Search</button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Results list */}
        <div style={{ width: 320, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
          {loading && <LoadingDots />}
          {!loading && results.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-title">Search precedents</div>
              <div className="empty-state-desc">Enter keywords to find relevant cases from the local library.</div>
              <div className="empty-state-examples">
                {EXAMPLES.map(ex => (
                  <button key={ex} className="quick-action" onClick={() => { setQuery(ex); search(ex) }}>
                    <span className="qa-label">PREC</span>
                    <span>{ex}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {results.map((c, i) => (
            <button
              key={c.id}
              onClick={() => { setSelected(c); setSelectedCase(c.id) }}
              style={{
                display: 'flex', flexDirection: 'column', gap: 5,
                width: '100%', padding: '10px 14px',
                background: selected?.id === c.id ? 'var(--bg-selected)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", minWidth: 16, marginTop: 2, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ color: 'var(--text-heading)', fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{c.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingLeft: 24 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{c.citation}</span>
                <RelevanceBar score={c.relevance_score} />
              </div>
              <div style={{ paddingLeft: 24, color: 'var(--text-muted)', fontSize: 10 }}>
                {c.court} · {c.year}
              </div>
            </button>
          ))}
        </div>

        {/* Detail pane */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }} className="info-pane">
          {selected ? (
            <>
              <h3 style={{ marginBottom: 4, fontSize: 15 }}>{selected.name}</h3>
              <div className="citation" style={{ marginBottom: 6, fontSize: 12 }}>{selected.citation}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span>{selected.court}</span>
                <span>·</span>
                <span>{selected.year}</span>
                <span>·</span>
                <span>{selected.jurisdiction}</span>
                <span>·</span>
                <span style={{ fontStyle: 'italic' }}>{selected.disposition}</span>
              </div>

              <div className="section-label">Holding</div>
              <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.75, borderLeft: '2px solid var(--accent-dim)', paddingLeft: 14, marginBottom: 20 }}>
                {selected.holding}
              </div>

              <div className="section-label">Summary</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.75, marginBottom: 20 }}>
                {selected.summary}
              </div>

              <div className="section-label">Topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {selected.topics.map(t => <span key={t} className="tag">{t}</span>)}
              </div>

              {selected.cites.length > 0 && (
                <>
                  <div className="section-label">Cites</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                    {selected.cites.map(citeId => (
                      <button
                        key={citeId}
                        onClick={() => { setQuery(citeId); search(citeId) }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'left' }}
                      >
                        → {citeId}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button onClick={() => navigate('CITE', { query: selected.citation })} className="btn">Validate citation →</button>
                <button onClick={() => navigate('BRF', { query: selected.name })} className="btn">Brief outline →</button>
              </div>
            </>
          ) : (
            !loading && (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, paddingTop: 8 }}>
                Select a case from the list to view details.
              </div>
            )
          )}
        </div>
      </div>
    </PanelChrome>
  )
}
