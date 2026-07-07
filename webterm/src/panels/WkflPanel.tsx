import { useEffect, useState } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import type { PanelType } from '../store/terminalStore'
import type { Workflow } from '../mcp/types'

const MNEMONIC_TO_PANEL: Record<string, PanelType> = {
  CTRX: 'CTRX', NEGO: 'CTRX', META: 'DOCA', PRIV: 'PRIV',
  PREC: 'PREC', BRF: 'BRF', CITE: 'CITE', JOBS: 'JOBS',
}

export function WkflPanel({ id }: { id: string }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selected, setSelected] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const { navigate, pushActivity } = useTerminalStore()

  useEffect(() => {
    client.getWorkflows().then(w => { setWorkflows(w); setSelected(w[0] ?? null); setLoading(false) })
  }, [])

  function launch(w: Workflow) {
    const p = MNEMONIC_TO_PANEL[w.mnemonic]
    if (p) { pushActivity(`WKFL launched "${w.title}"`); navigate(p) }
  }

  return (
    <PanelChrome id={id} mnemonic="WKFL" title="Workflow Launcher" subtitle="legal-mcp SKILL.md playbooks" panelType="WKFL">
      {loading && <LoadingDots />}
      {!loading && (
        <div className="panel-split">
          <div className="panel-split-list panel-split-list--history">
            {workflows.map(w => (
              <button key={w.id} onClick={() => setSelected(w)} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                width: '100%', padding: '10px 14px',
                background: selected?.id === w.id ? 'var(--bg-selected)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <span className="mnemonic-badge" style={{ marginTop: 1 }}>{w.mnemonic}</span>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{w.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, lineHeight: 1.4 }}>{w.trigger}</div>
                </div>
              </button>
            ))}
            {workflows.length === 0 && (
              <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>No workflows loaded.</div>
            )}
          </div>

          {/* Detail */}
          <div className="panel-split-detail info-pane" style={{ padding: '20px 24px' }}>
            {selected ? (
              <>
                <h3 style={{ marginBottom: 5, fontSize: 15 }}>{selected.title}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20, fontStyle: 'italic' }}>
                  Trigger: "{selected.trigger}"
                </div>

                <div className="section-label">Tool call sequence</div>
                {selected.steps.map(step => (
                  <div key={step.n} style={{ display: 'flex', gap: 14, marginBottom: 10, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, minWidth: 20, fontFamily: "'IBM Plex Mono', monospace", paddingTop: 1 }}>
                      {step.n}.
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--accent)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>{step.tool}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button onClick={() => launch(selected)} className="btn-primary">
                    Open {selected.mnemonic} →
                  </button>
                </div>

                <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  Source: <code>legal-mcp/SKILL.md</code>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a workflow to view its playbook.</div>
            )}
          </div>
        </div>
      )}
    </PanelChrome>
  )
}
