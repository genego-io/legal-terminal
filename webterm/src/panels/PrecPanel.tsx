import { useState, useEffect } from 'react'
import { PanelChrome, RelevanceBar, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/mockClient'
import { useTerminalStore } from '../store/terminalStore'
import type { Case } from '../mcp/types'

interface Props { id: string; query?: string }

export function PrecPanel({ id, query: initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Case[]>([])
  const [selected, setSelected] = useState<Case | null>(null)
  const [loading, setLoading] = useState(false)
  const { setSelectedCase, openPanel } = useTerminalStore()

  async function search(q: string) {
    if (!q.trim()) return
    setLoading(true)
    const res = await client.searchPrecedents(q)
    setResults(res)
    setLoading(false)
    if (res.length) { setSelected(res[0]); setSelectedCase(res[0].id) }
  }

  useEffect(() => { if (initialQuery) search(initialQuery) }, [])

  return (
    <PanelChrome id={id} mnemonic="PREC" title="Precedent Search" subtitle="search_precedents · search_case_law">
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search(query)}
          placeholder="Keyword query…"
          className="field-input"
          style={{ flex: 1 }}
        />
        <button onClick={() => search(query)} className="btn-primary">Search</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* results list */}
        <div style={{ width: 260, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
          {loading && <LoadingDots />}
          {!loading && results.length === 0 && (
            <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>Enter a query to search precedents.</div>
          )}
          {results.map((c, i) => (
            <button
              key={c.id}
              onClick={() => { setSelected(c); setSelectedCase(c.id) }}
              style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                width: '100%', padding: '8px 12px',
                background: selected?.id === c.id ? 'var(--bg-selected)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", minWidth: 14, marginTop: 1 }}>{i + 1}</span>
                <span style={{ color: 'var(--text-heading)', fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}>{c.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 22 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{c.citation}</span>
                <RelevanceBar score={c.relevance_score} />
              </div>
            </button>
          ))}
        </div>

        {/* detail pane */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="info-pane">
          {selected ? (
            <>
              <h3>{selected.name}</h3>
              <div className="citation" style={{ marginBottom: 4 }}>{selected.citation}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 16 }}>
                {selected.court} · {selected.year} · {selected.jurisdiction} · {selected.disposition}
              </div>

              <div className="section-label">Holding</div>
              <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.7, borderLeft: '2px solid var(--accent-dim)', paddingLeft: 12, marginBottom: 16 }}>
                {selected.holding}
              </div>

              <div className="section-label">Summary</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>
                {selected.summary}
              </div>

              <div className="section-label">Topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                {selected.topics.map(t => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>

              {selected.cites.length > 0 && (
                <>
                  <div className="section-label">Cites</div>
                  {selected.cites.map(citeId => (
                    <button
                      key={citeId}
                      onClick={() => { setQuery(citeId); search(citeId) }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0, display: 'block', marginBottom: 4 }}
                    >
                      → {citeId}
                    </button>
                  ))}
                </>
              )}

              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button onClick={() => openPanel('CITE', { query: selected.citation })} className="btn">
                  Validate citation →
                </button>
                <button onClick={() => openPanel('BRF')} className="btn">
                  Brief outline →
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a case to view details.</div>
          )}
        </div>
      </div>
    </PanelChrome>
  )
}
