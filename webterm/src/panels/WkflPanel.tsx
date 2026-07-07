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
  const { openPanel } = useTerminalStore()

  useEffect(() => {
    client.getWorkflows().then(w => { setWorkflows(w); setSelected(w[0] ?? null); setLoading(false) })
  }, [])

  return (
    <PanelChrome id={id} mnemonic="WKFL" title="Workflow Launcher" subtitle="legal-mcp-toolkit SKILL.md — 8 playbooks">
      {loading && <LoadingDots />}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Workflow list */}
        <div style={{ width: 200, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
          {workflows.map(w => (
            <button key={w.id} onClick={() => setSelected(w)} style={{
              display: 'flex', gap: 8, alignItems: 'center',
              width: '100%', padding: '8px 12px',
              background: selected?.id === w.id ? 'var(--bg-selected)' : 'transparent',
              border: 'none', borderBottom: '1px solid var(--border)',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <span className="mnemonic-badge" style={{ fontSize: 9, padding: '1px 5px' }}>{w.mnemonic}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{w.title}</span>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="info-pane">
          {selected && (
            <>
              <h3 style={{ marginBottom: 4 }}>{selected.title}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16, fontStyle: 'italic' }}>
                Trigger: "{selected.trigger}"
              </div>

              <div className="section-label">Tool call sequence</div>
              {selected.steps.map(step => (
                <div key={step.n} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, minWidth: 16, fontFamily: "'IBM Plex Mono', monospace" }}>{step.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--accent)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", marginBottom: 3 }}>{step.tool}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => { const p = MNEMONIC_TO_PANEL[selected.mnemonic]; if (p) openPanel(p) }}
                className="btn-primary" style={{ marginTop: 10 }}
              >
                Open {selected.mnemonic} →
              </button>

              <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                Source: <code>legal-mcp-toolkit/SKILL.md</code> — MCP execution + skill methodology layers
              </div>
            </>
          )}
        </div>
      </div>
    </PanelChrome>
  )
}
