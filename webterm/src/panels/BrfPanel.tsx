import { useState } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import { BRIEF_CASE_TYPES } from '../fixtureMeta'
import type { BriefOutline } from '../mcp/types'

const CASE_TYPES = BRIEF_CASE_TYPES

export function BrfPanel({ id, query }: { id: string; query?: string }) {
  const [caseType, setCaseType] = useState(query ?? 'contract breach')
  const { pushActivity } = useTerminalStore()
  const [facts, setFacts] = useState('')
  const [outline, setOutline] = useState<BriefOutline | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const res = await client.generateBriefOutline(caseType, facts)
    setOutline(res); setLoading(false)
    pushActivity(`BRF "${caseType}" → ${res.sections.length} sections`)
  }

  function btn(active: boolean) {
    return {
      background: active ? 'var(--accent-faint)' : 'var(--bg-panel2)',
      border: '1px solid ' + (active ? 'var(--accent-dim)' : 'var(--border)'),
      color: active ? 'var(--accent)' : 'var(--text-muted)',
      fontFamily: 'inherit', fontSize: 11, padding: '3px 10px', cursor: 'pointer',
    } as const
  }

  return (
    <PanelChrome id={id} mnemonic="BRF" title="Brief Builder" subtitle="generate_brief_outline · IRAC · issue statement" panelType="BRF">
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <div className="section-label" style={{ marginBottom: 5 }}>Case type</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
          {CASE_TYPES.map(t => <button key={t} onClick={() => setCaseType(t)} style={btn(caseType === t)}>{t}</button>)}
        </div>
        <textarea value={facts} onChange={e => setFacts(e.target.value)}
          placeholder="Key facts (optional)…"
          rows={2}
          style={{ width: '100%', background: 'var(--bg-panel2)', border: '1px solid var(--border-bright)', color: 'var(--text-dim)', fontFamily: 'inherit', fontSize: 12, padding: '6px 10px', outline: 'none', resize: 'none', marginBottom: 8 }}
        />
        <button onClick={generate} className="btn-primary">Generate outline</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="info-pane">
        {loading && <LoadingDots />}
        {outline && !loading && (
          <>
            <h3 style={{ marginBottom: 14 }}>
              Brief outline — {outline.case_type}
            </h3>
            {outline.sections.map((s, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ color: 'var(--text-heading)', fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{s.title}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.7, paddingLeft: 12 }}>{s.content}</div>
              </div>
            ))}

            <div style={{ border: '1px solid var(--border)', padding: '12px 14px', marginTop: 16 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>IRAC argument structure</div>
              {[
                { k: 'Issue', v: outline.argument_structure.issue },
                { k: 'Rule', v: outline.argument_structure.rule },
                { k: 'Analysis', v: outline.argument_structure.analysis },
                { k: 'Conclusion', v: outline.argument_structure.conclusion },
              ].map(row => (
                <div key={row.k} style={{ marginBottom: 10 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{row.k}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.6 }}>{row.v}</div>
                </div>
              ))}
            </div>

            <div style={{ border: '1px solid var(--border)', padding: '12px 14px', marginTop: 12 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>Issue statement</div>
              <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.7, fontStyle: 'italic' }}>{outline.issue_statement}</div>
            </div>
          </>
        )}
        {!outline && !loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a case type and press Generate outline.</div>
        )}
      </div>
    </PanelChrome>
  )
}
