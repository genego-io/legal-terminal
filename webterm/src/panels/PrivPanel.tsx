import { useState } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import { MOCK_DOCUMENT_FILES, AI_PROVIDERS, PRIVILEGE_RISK_LABELS, PRIVILEGE_DEMO_FILES } from '../fixtureMeta'
import type { PrivilegeResult } from '../mcp/types'

const PROVIDERS = AI_PROVIDERS

const MOCK_FILES = MOCK_DOCUMENT_FILES.filter(f => PRIVILEGE_DEMO_FILES.includes(f))

const RISK_LABELS = PRIVILEGE_RISK_LABELS

const RISK_COLOR: Record<string, string> = {
  CRITICAL: 'var(--risk-critical)', HIGH: 'var(--risk-high)',
  MEDIUM: 'var(--risk-medium)', LOW: 'var(--risk-low)',
}

export function PrivPanel({ id }: { id: string }) {
  const [file, setFile] = useState('litigation_memo.docx')
  const [results, setResults] = useState<(PrivilegeResult & { providerId: string })[]>([])
  const [loading, setLoading] = useState(false)
  const { pushActivity } = useTerminalStore()

  async function checkAll() {
    setLoading(true)
    const res = await Promise.all(
      PROVIDERS.map(async p => {
        const r = await client.checkPrivilegeRisk(file, p.id)
        return { ...r, providerId: p.id }
      })
    )
    setResults(res)
    setLoading(false)
    const high = res.filter(r => r.risk === 'HIGH' || r.risk === 'CRITICAL').length
    pushActivity(`PRIV "${file}" → ${high} high-risk providers`)
  }

  async function checkOne(providerId: string) {
    setLoading(true)
    const r = await client.checkPrivilegeRisk(file, providerId)
    setResults(prev => {
      const next = prev.filter(p => p.providerId !== providerId)
      return [...next, { ...r, providerId }].sort((a, b) =>
        ['CRITICAL','HIGH','MEDIUM','LOW'].indexOf(a.risk) - ['CRITICAL','HIGH','MEDIUM','LOW'].indexOf(b.risk)
      )
    })
    setLoading(false)
    pushActivity(`PRIV "${file}" vs ${providerId} → ${r.risk}`)
  }

  const sortedResults = results.slice().sort((a, b) =>
    ['CRITICAL','HIGH','MEDIUM','LOW'].indexOf(a.risk) - ['CRITICAL','HIGH','MEDIUM','LOW'].indexOf(b.risk)
  )

  return (
    <PanelChrome id={id} mnemonic="PRIV" title="Privilege Risk Check" subtitle="check_privilege_risk · ABA Rule 1.6 · Heppner" panelType="PRIV">
      {/* File selector */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div className="section-label" style={{ marginBottom: 6 }}>Document</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {MOCK_FILES.map(f => (
            <button key={f} onClick={() => setFile(f)} style={{
              background: file === f ? 'var(--bg-selected)' : 'var(--bg-panel2)',
              border: '1px solid ' + (file === f ? 'var(--accent-dim)' : 'var(--border)'),
              color: file === f ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: '4px 10px', cursor: 'pointer',
            }}>{f}</button>
          ))}
        </div>
        <button onClick={checkAll} className="btn-primary">
          Assess all providers
        </button>
      </div>

      {loading && <LoadingDots />}

      {/* Provider comparison table */}
      {!loading && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-title">Privilege risk assessment</div>
          <div className="empty-state-desc">
            Evaluate whether it is safe to route a privileged document through an AI inference provider.
            Based on <em>US v. Heppner</em> (S.D.N.Y. Feb. 2026) and ABA Model Rule 1.6.
          </div>
          <button className="btn-primary" onClick={checkAll} style={{ marginTop: 4 }}>
            Assess all providers
          </button>
        </div>
      )}

      {!loading && sortedResults.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Risk</th>
                <th style={{ textAlign: 'center' }}>ZDR</th>
                <th style={{ textAlign: 'center' }}>No training</th>
                <th style={{ textAlign: 'center' }}>HIPAA</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDERS.map(p => {
                const res = sortedResults.find(r => r.providerId === p.id)
                return (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => !res && checkOne(p.id)}>
                    <td style={{ fontWeight: 500 }}>{p.label}</td>
                    <td>
                      {res ? (
                        <span style={{ color: RISK_COLOR[res.risk], fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                          {res.risk}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', color: p.zdr ? 'var(--risk-low)' : 'var(--text-muted)' }}>
                      {p.zdr ? '✓' : '—'}
                    </td>
                    <td style={{ textAlign: 'center', color: !p.training ? 'var(--risk-low)' : 'var(--risk-medium)' }}>
                      {!p.training ? '✓' : '✗'}
                    </td>
                    <td style={{ textAlign: 'center', color: p.hipaa ? 'var(--risk-low)' : 'var(--text-muted)' }}>
                      {p.hipaa ? '✓' : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11, maxWidth: 280 }}>
                      {res ? RISK_LABELS[res.risk] : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Indicators from first result */}
          {sortedResults[0]?.indicators.length > 0 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Privilege indicators detected in document</div>
              {sortedResults[0].indicators.map((ind, i) => (
                <div key={i} style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 5, display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>·</span><span>{ind}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 11 }}>
                {sortedResults[0].notice}
              </div>
            </div>
          )}
        </div>
      )}
    </PanelChrome>
  )
}
