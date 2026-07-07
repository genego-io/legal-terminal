import { useState, useEffect } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import type { CitationResult } from '../mcp/types'

interface Props { id: string; query?: string }
type Mode = 'validate' | 'normalize' | 'integrity'

const EXAMPLES = [
  '2022 Cal.App.4th 1234',
  'Smith v. ABC Corp., 2022 Cal.App.4th 1234',
  '156 Eng. Rep. 145',
  '2021 Cal.4th 567',
]

export function CitePanel({ id, query: initialQuery = '' }: Props) {
  const [citation, setCitation] = useState(initialQuery)
  const [mode, setMode] = useState<Mode>('validate')
  const [history, setHistory] = useState<{ citation: string; result: CitationResult; mode: Mode }[]>([])
  const [loading, setLoading] = useState(false)
  const { pushActivity } = useTerminalStore()

  async function run(cit = citation) {
    if (!cit.trim()) return
    setLoading(true)
    const res = mode === 'validate' ? await client.validateCitation(cit)
              : mode === 'normalize' ? await client.normalizeCitation(cit)
              : await client.verifyCitationIntegrity(cit)
    setHistory(h => [{ citation: cit, result: res, mode }, ...h].slice(0, 20))
    setLoading(false)
    pushActivity(`CITE ${mode} "${cit}" → ${res.valid ? 'valid' : 'invalid'}`)
  }

  useEffect(() => { if (initialQuery) run(initialQuery) }, [])

  const latest = history[0]

  const integrityColor = (integrity: string) =>
    integrity === 'verified' ? 'var(--risk-low)'
    : integrity === 'not_found' ? 'var(--risk-medium)'
    : 'var(--risk-critical)'

  return (
    <PanelChrome id={id} mnemonic="CITE" title="Citation Console" subtitle="validate · normalize · verify_integrity" panelType="CITE">
      {/* Input row */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={citation}
          onChange={e => setCitation(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="e.g. 2022 Cal.App.4th 1234"
          className="field-input"
          style={{ flex: 1 }}
          autoFocus
        />
        <button onClick={() => run()} className="btn-primary">Run</button>
      </div>

      {/* Mode tabs */}
      <div className="tab-bar">
        {(['validate', 'normalize', 'integrity'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`tab-btn ${mode === m ? 'active' : ''}`}>
            {m === 'validate' ? 'Validate' : m === 'normalize' ? 'Normalize' : 'Verify integrity'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Result pane */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }} className="info-pane">
          {loading && <LoadingDots />}

          {!latest && !loading && (
            <div className="empty-state">
              <div className="empty-state-title">Citation console</div>
              <div className="empty-state-desc">
                Validate format, normalize to Bluebook, or verify against the local case database.
              </div>
              <div className="empty-state-examples">
                {EXAMPLES.map(ex => (
                  <button key={ex} className="quick-action" onClick={() => { setCitation(ex); run(ex) }}>
                    <span className="qa-label">CITE</span>
                    <span>{ex}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {latest && !loading && (() => {
            const { result } = latest
            return (
              <>
                {/* Verdict row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{
                    background: result.valid ? 'rgba(111,163,112,0.12)' : 'rgba(194,91,91,0.12)',
                    color: result.valid ? 'var(--risk-low)' : 'var(--risk-critical)',
                    border: '1px solid ' + (result.valid ? 'var(--risk-low)' : 'var(--risk-critical)'),
                    fontWeight: 700, padding: '3px 12px', fontSize: 12, letterSpacing: '0.04em',
                  }}>
                    {result.valid ? 'Valid' : 'Invalid'}
                  </span>
                  <span style={{ color: integrityColor(result.integrity), fontSize: 12, fontWeight: 500 }}>
                    {result.integrity === 'verified' ? '✓ Verified in database'
                      : result.integrity === 'not_found' ? '— Not in local database'
                      : '⚠ Mismatch detected'}
                  </span>
                </div>

                {/* Parsed breakdown */}
                <div className="section-label" style={{ marginBottom: 8 }}>Parsed components</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
                  <tbody>
                    {[
                      ['Input', result.citation],
                      ['Normalized', result.normalized],
                      ['Reporter', result.reporter || '—'],
                      ['Reporter name', result.reporter_name || '—'],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ color: 'var(--text-muted)', padding: '6px 0', width: 140, fontSize: 11 }}>{k}</td>
                        <td style={{ color: 'var(--text)', padding: '6px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, wordBreak: 'break-all' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {result.issues.length > 0 && (
                  <>
                    <div className="section-label" style={{ marginBottom: 6 }}>Issues</div>
                    {result.issues.map((issue, i) => (
                      <div key={i} style={{ color: 'var(--risk-critical)', fontSize: 12, marginBottom: 4, display: 'flex', gap: 8 }}>
                        <span>↳</span><span>{issue}</span>
                      </div>
                    ))}
                  </>
                )}

                <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  Tool: {latest.mode === 'validate' ? 'validate_citation' : latest.mode === 'normalize' ? 'normalize_citation' : 'verify_citation_integrity'}
                </div>
              </>
            )
          })()}
        </div>

        {/* History sidebar */}
        {history.length > 1 && (
          <div style={{ width: 240, borderLeft: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              History
            </div>
            {history.slice(1).map((h, i) => (
              <button
                key={i}
                onClick={() => { setCitation(h.citation); setHistory([h, ...history.filter((_, j) => j !== i + 1)]) }}
                style={{
                  display: 'block', width: '100%', padding: '7px 12px', textAlign: 'left',
                  background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 2 }}>{h.citation}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: h.result.valid ? 'var(--risk-low)' : 'var(--risk-critical)', fontSize: 10 }}>
                    {h.result.valid ? 'valid' : 'invalid'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{h.mode}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PanelChrome>
  )
}
