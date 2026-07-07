import { useState, useEffect } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/mockClient'
import type { CitationResult } from '../mcp/types'

interface Props { id: string; query?: string }
type Mode = 'validate' | 'normalize' | 'integrity'

export function CitePanel({ id, query: initialQuery = '' }: Props) {
  const [citation, setCitation] = useState(initialQuery)
  const [mode, setMode] = useState<Mode>('validate')
  const [result, setResult] = useState<CitationResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    if (!citation.trim()) return
    setLoading(true)
    const res = mode === 'validate' ? await client.validateCitation(citation)
              : mode === 'normalize' ? await client.normalizeCitation(citation)
              : await client.verifyCitationIntegrity(citation)
    setResult(res); setLoading(false)
  }

  useEffect(() => { if (initialQuery) run() }, [])

  const integrityColor = result?.integrity === 'verified'
    ? 'var(--risk-low)' : result?.integrity === 'not_found'
    ? 'var(--risk-medium)' : 'var(--risk-critical)'

  return (
    <PanelChrome id={id} mnemonic="CITE" title="Citation Console" subtitle="validate · normalize · integrity">
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <input value={citation} onChange={e => setCitation(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="e.g. 2022 Cal.App.4th 1234"
          className="field-input" style={{ flex: 1 }}
        />
        <button onClick={run} className="btn-primary">Run</button>
      </div>

      <div className="tab-bar">
        {(['validate', 'normalize', 'integrity'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`tab-btn ${mode === m ? 'active' : ''}`}>
            {m === 'validate' ? 'Validate' : m === 'normalize' ? 'Normalize' : 'Integrity'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="info-pane">
        {loading && <LoadingDots />}
        {result && !loading && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{
                background: result.valid ? 'var(--risk-low)' : 'var(--risk-critical)',
                color: '#fff', fontWeight: 600, padding: '3px 10px', fontSize: 11, borderRadius: 2,
              }}>
                {result.valid ? 'Valid' : 'Invalid'}
              </span>
              <span style={{ color: integrityColor, fontSize: 11, fontWeight: 600 }}>
                {result.integrity === 'verified' ? 'Verified in database'
                  : result.integrity === 'not_found' ? 'Not found in local database'
                  : 'Mismatch detected'}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
              <tbody>
                {[
                  ['Input', result.citation],
                  ['Normalized', result.normalized],
                  ['Reporter', result.reporter || '—'],
                  ['Reporter name', result.reporter_name || '—'],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ color: 'var(--text-muted)', padding: '5px 0', width: 130, fontSize: 11 }}>{k}</td>
                    <td style={{ color: 'var(--text)', padding: '5px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, wordBreak: 'break-all' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {result.issues.length > 0 && (
              <div>
                <div className="section-label">Issues</div>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ color: 'var(--risk-critical)', fontSize: 12, marginBottom: 4, display: 'flex', gap: 8 }}>
                    <span>↳</span><span>{issue}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              Tool: {mode === 'validate' ? 'validate_citation' : mode === 'normalize' ? 'normalize_citation' : 'verify_citation_integrity'}
            </div>
          </>
        )}
        {!result && !loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Enter a legal citation and press Run.</div>
        )}
      </div>
    </PanelChrome>
  )
}
