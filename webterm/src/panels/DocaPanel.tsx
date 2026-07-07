import { useState } from 'react'
import { PanelChrome, RiskBadge, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'

const MOCK_FILES = ['vendor_nda_2026.docx', 'saas_msa_draft.docx', 'dpa_addendum_eu.pdf', 'hipaa_baa_template.docx']

export function DocaPanel({ id }: { id: string }) {
  const [file, setFile] = useState('')
  const [customFile, setCustomFile] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof client.analyzeDocument>> | null>(null)
  const [loading, setLoading] = useState(false)

  async function analyze(f: string) {
    if (!f) return
    setLoading(true)
    const res = await client.analyzeDocument(f)
    setResult(res); setLoading(false)
  }

  async function queue(f: string) {
    await client.queueDocumentAnalysis(f)
    alert(`"${f}" queued for background analysis. Check the JOBS panel.`)
  }

  return (
    <PanelChrome id={id} mnemonic="DOCA" title="Document Analyzer" subtitle="analyze_document · extract_contract_metadata" panelType="DOCA">
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <div className="section-label">Select file</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {MOCK_FILES.map(f => (
            <button key={f} onClick={() => { setFile(f); analyze(f) }} style={{
              background: file === f ? 'var(--accent-faint)' : 'var(--bg-panel2)',
              border: '1px solid ' + (file === f ? 'var(--accent-dim)' : 'var(--border)'),
              color: file === f ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'inherit', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
            }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={customFile} onChange={e => setCustomFile(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (setFile(customFile), analyze(customFile))}
            placeholder="Or enter a filename…"
            className="field-input" style={{ flex: 1 }}
          />
          <button onClick={() => { setFile(customFile); analyze(customFile) }} className="btn-primary">Analyze</button>
          <button onClick={() => queue(file || customFile)} className="btn">Queue →</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="info-pane">
        {loading && <LoadingDots />}
        {result && !loading && (
          <>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <RiskBadge risk={result.risk_level} />
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{result.metadata.file}</span>
            </div>

            <div className="section-label">Contract metadata</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
              <tbody>
                {Object.entries(result.metadata).filter(([k]) => k !== 'file').map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ color: 'var(--text-muted)', padding: '5px 0', width: 130, fontSize: 11, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</td>
                    <td style={{ color: v ? 'var(--text)' : 'var(--text-muted)', padding: '5px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                      {v ?? 'null — confirm manually'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="section-label">Clause risk summary</div>
            {result.clauses.map(cl => (
              <div key={cl.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <RiskBadge risk={cl.risk} />
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{cl.label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{cl.risk_note}</div>
                </div>
              </div>
            ))}
            <button style={{ marginTop: 14 }} className="btn">↓ Export risk report</button>
          </>
        )}
        {!result && !loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a file above to analyze it.</div>
        )}
      </div>
    </PanelChrome>
  )
}
