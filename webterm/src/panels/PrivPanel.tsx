import { useState } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import type { PrivilegeResult } from '../mcp/types'

const PROVIDERS = ['openai', 'anthropic', 'azure_openai', 'vertex_ai', 'openrouter', 'ollama', 'unknown']
const MOCK_FILES = ['vendor_nda_2026.docx', 'litigation_memo.docx', 'client_strategy.pdf', 'deposition_notes.docx']

const RISK_LABELS: Record<string, string> = {
  CRITICAL: 'Critical risk — do not route',
  HIGH: 'High risk — attorney authorization required',
  MEDIUM: 'Medium risk — review provider terms',
  LOW: 'Low risk — proceed with caution',
}

export function PrivPanel({ id }: { id: string }) {
  const [file, setFile] = useState('litigation_memo.docx')
  const [provider, setProvider] = useState('openai')
  const [result, setResult] = useState<PrivilegeResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function check() {
    setLoading(true)
    const res = await client.checkPrivilegeRisk(file, provider)
    setResult(res); setLoading(false)
  }

  const RISK_COLOR: Record<string, string> = {
    CRITICAL: 'var(--risk-critical)', HIGH: 'var(--risk-high)',
    MEDIUM: 'var(--risk-medium)', LOW: 'var(--risk-low)',
  }

  function btn(active: boolean) {
    return {
      background: active ? 'var(--bg-selected)' : 'var(--bg-panel2)',
      border: '1px solid ' + (active ? 'var(--accent-dim)' : 'var(--border)'),
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      fontFamily: 'inherit', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
    } as const
  }

  return (
    <PanelChrome id={id} mnemonic="PRIV" title="Privilege Risk Check" subtitle="check_privilege_risk · ABA Rule 1.6 · Heppner">
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <div className="section-label" style={{ marginBottom: 5 }}>File</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {MOCK_FILES.map(f => <button key={f} onClick={() => setFile(f)} style={btn(file === f)}>{f}</button>)}
        </div>
        <div className="section-label" style={{ marginBottom: 5 }}>Inference provider</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          {PROVIDERS.map(p => <button key={p} onClick={() => setProvider(p)} style={btn(provider === p)}>{p}</button>)}
        </div>
        <button onClick={check} className="btn-primary">Assess risk</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="info-pane">
        {loading && <LoadingDots />}
        {result && !loading && (
          <>
            {/* Risk verdict — plain indicator, no emoji */}
            <div style={{
              borderLeft: `3px solid ${RISK_COLOR[result.risk] ?? 'var(--text-muted)'}`,
              paddingLeft: 14, marginBottom: 16,
            }}>
              <div style={{ color: RISK_COLOR[result.risk] ?? 'var(--text-muted)', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                {result.risk}
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{RISK_LABELS[result.risk]}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                Provider: {result.provider}
              </div>
            </div>

            <div className="section-label">Privilege indicators detected</div>
            {result.indicators.map((ind, i) => (
              <div key={i} style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 4, display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>·</span><span>{ind}</span>
              </div>
            ))}

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px 14px', marginTop: 14, marginBottom: 10 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>Recommendation</div>
              <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.7 }}>{result.recommendation}</div>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              {result.notice}
            </div>
          </>
        )}
        {!result && !loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <p style={{ marginTop: 0 }}>Assess whether a document is safe to route through an AI inference provider.</p>
            <p>Based on <em>United States v. Heppner</em> (S.D.N.Y. Feb. 2026) and ABA Model Rule 1.6.</p>
          </div>
        )}
      </div>
    </PanelChrome>
  )
}
