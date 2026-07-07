import { useTerminalStore } from '../store/terminalStore'
import type { Panel } from '../store/terminalStore'
import { PrecPanel } from '../panels/PrecPanel'
import { StatPanel } from '../panels/StatPanel'
import { CitePanel } from '../panels/CitePanel'
import { CtrxPanel } from '../panels/CtrxPanel'
import { DocaPanel } from '../panels/DocaPanel'
import { PrivPanel } from '../panels/PrivPanel'
import { BrfPanel } from '../panels/BrfPanel'
import { JobsPanel } from '../panels/JobsPanel'
import { LivePanel } from '../panels/LivePanel'
import { WkflPanel } from '../panels/WkflPanel'
import { AudtPanel } from '../panels/AudtPanel'

function renderPanel(panel: Panel) {
  const p = { id: panel.id, key: panel.id }
  switch (panel.type) {
    case 'PREC': case 'CASE': return <PrecPanel {...p} query={panel.query} />
    case 'STAT': return <StatPanel {...p} statuteId={panel.statuteId} />
    case 'CITE': return <CitePanel {...p} query={panel.query} />
    case 'CTRX': return <CtrxPanel {...p} contractId={panel.contractId} />
    case 'DOCA': return <DocaPanel {...p} />
    case 'PRIV': return <PrivPanel {...p} />
    case 'BRF':  return <BrfPanel {...p} query={panel.query} />
    case 'JOBS': return <JobsPanel {...p} />
    case 'LIVE': return <LivePanel {...p} />
    case 'WKFL': return <WkflPanel {...p} />
    case 'AUDT': return <AudtPanel {...p} />
    default: return null
  }
}

export function Workspace() {
  const { panels, openPanel } = useTerminalStore()

  const presets = [
    { label: 'RESEARCH', panels: ['PREC', 'STAT', 'CITE'] as const },
    { label: 'CONTRACT', panels: ['CTRX', 'DOCA', 'PRIV'] as const },
    { label: 'BRIEF',    panels: ['BRF', 'PREC', 'CITE'] as const },
    { label: 'QUEUE',    panels: ['JOBS', 'AUDT'] as const },
  ]

  if (panels.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No panels open.</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Type a command, press an F-key, or load a workspace preset:</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {presets.map(pr => (
            <button key={pr.label} onClick={() => pr.panels.forEach(t => openPanel(t))} className="btn">
              {pr.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const cols = panels.length <= 1 ? 1 : panels.length <= 2 ? 2 : panels.length <= 4 ? 2 : 3
  const rows = Math.ceil(panels.length / cols)

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: 2, overflow: 'hidden', minHeight: 0 }}>
      {panels.map(panel => renderPanel(panel))}
    </div>
  )
}
