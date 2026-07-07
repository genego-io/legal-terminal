import { useTerminalStore } from '../store/terminalStore'
import type { ViewState } from '../store/terminalStore'
import { HomePanel } from '../panels/HomePanel'
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

function renderView(v: ViewState) {
  const id = `view-${v.type}`
  switch (v.type) {
    case 'HOME': return <HomePanel />
    case 'PREC': case 'CASE': return <PrecPanel id={id} query={v.query} />
    case 'STAT': return <StatPanel id={id} statuteId={v.statuteId ?? v.query} />
    case 'CITE': return <CitePanel id={id} query={v.query} />
    case 'CTRX': return <CtrxPanel id={id} contractId={v.contractId} />
    case 'DOCA': return <DocaPanel id={id} />
    case 'PRIV': return <PrivPanel id={id} />
    case 'BRF':  return <BrfPanel id={id} query={v.query} />
    case 'JOBS': return <JobsPanel id={id} />
    case 'LIVE': return <LivePanel id={id} />
    case 'WKFL': return <WkflPanel id={id} />
    case 'AUDT': return <AudtPanel id={id} />
    default: return <HomePanel />
  }
}

export function Workspace() {
  const { view, splitView, closeSplit } = useTerminalStore()

  if (!splitView) {
    return (
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderView(view)}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
      {/* Primary pane */}
      <div style={{ flex: 1, overflow: 'hidden', borderRight: '2px solid var(--border-bright)', display: 'flex', flexDirection: 'column' }}>
        {renderView(view)}
      </div>
      {/* Split pane */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <button
          onClick={closeSplit}
          style={{
            position: 'absolute', top: 8, right: 12, zIndex: 10,
            background: 'var(--bg-panel2)', border: '1px solid var(--border-bright)',
            color: 'var(--text-muted)', fontSize: 11, padding: '2px 8px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          title="Close split view"
        >
          × split
        </button>
        {renderView(splitView)}
      </div>
    </div>
  )
}
