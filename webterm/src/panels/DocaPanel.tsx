import { useState } from 'react'
import { PanelChrome, RiskBadge, LoadingDots } from '../components/PanelChrome'
import { FileUploadZone } from '../components/FileUploadZone'
import type { UploadedFile } from '../components/FileUploadZone'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import { MOCK_DOCUMENT_FILES } from '../fixtureMeta'

export function DocaPanel({ id }: { id: string }) {
  const { pushActivity } = useTerminalStore()
  const [file, setFile] = useState('')
  const [customFile, setCustomFile] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof client.analyzeDocument>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  async function analyze(f: string) {
    if (!f) return
    setLoading(true)
    setResult(null)
    const res = await client.analyzeDocument(f)
    setResult(res)
    setLoading(false)
    pushActivity(`Analyzed: ${f}`)
  }

  async function queue(f: string) {
    if (!f) return
    await client.queueDocumentAnalysis(f)
    pushActivity(`Queued for background analysis: ${f}`)
  }

  function onUpload(files: UploadedFile[]) {
    setUploadedFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...files.filter(f => !existing.has(f.name))]
    })
    // Auto-analyze the first newly uploaded file
    if (files.length > 0) {
      setFile(files[0].name)
      analyze(files[0].name)
    }
  }

  function removeUploaded(name: string) {
    setUploadedFiles(prev => prev.filter(f => f.name !== name))
    if (file === name) { setFile(''); setResult(null) }
  }

  return (
    <PanelChrome id={id} mnemonic="DOCA" title="Document Analyzer" subtitle="analyze_document · extract_contract_metadata" panelType="DOCA">
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>

        {/* ── Upload zone ── */}
        <div className="section-label" style={{ marginBottom: 6 }}>Upload documents</div>
        <FileUploadZone
          allowFolder
          accept=".pdf,.docx,.doc,.txt,.md"
          onFiles={onUpload}
          style={{ marginBottom: uploadedFiles.length > 0 ? 8 : 0 }}
        />

        {/* Uploaded file chips */}
        {uploadedFiles.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6, marginBottom: 8 }}>
            {uploadedFiles.map(f => (
              <button key={f.name}
                onClick={() => { setFile(f.name); analyze(f.name) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: file === f.name ? 'var(--accent-faint)' : 'var(--bg-panel2)',
                  border: '1px solid ' + (file === f.name ? 'var(--accent-dim)' : 'var(--border)'),
                  color: file === f.name ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 8px', cursor: 'pointer',
                }}
              >
                {f.path ? `${f.path}` : f.name}
                <span
                  onClick={e => { e.stopPropagation(); removeUploaded(f.name) }}
                  style={{ opacity: 0.5, marginLeft: 2, fontSize: 11, lineHeight: 1 }}
                  title="Remove"
                >×</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Example files ── */}
        <div className="section-label" style={{ marginTop: 8, marginBottom: 6 }}>Example files</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {MOCK_DOCUMENT_FILES.map(f => (
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
              <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{result.metadata.file}</span>
            </div>

            <div className="section-label">Contract metadata</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
              <tbody>
                {Object.entries(result.metadata).filter(([k]) => k !== 'file').map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ color: 'var(--text-muted)', padding: '5px 0', width: 130, fontSize: 11, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</td>
                    <td style={{ color: v ? 'var(--text)' : 'var(--text-muted)', padding: '5px 0', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
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
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>⬆</div>
            <div style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-dim)' }}>Upload a document to analyze</div>
            <div style={{ fontSize: 11 }}>Drop a PDF, DOCX, or select a folder containing contracts</div>
          </div>
        )}
      </div>
    </PanelChrome>
  )
}
