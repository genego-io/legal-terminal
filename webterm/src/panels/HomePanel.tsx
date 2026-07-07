import { useTerminalStore } from '../store/terminalStore'
import type { PanelType } from '../store/terminalStore'
import { Search, FileText, ShieldAlert, ClockIcon } from 'lucide-react'

interface QuickAction {
  cmd: string
  label: string
  panel: PanelType
  opts?: { query?: string; contractId?: string }
}

interface GroupDef {
  title: string
  icon: React.ReactNode
  accent: string
  actions: QuickAction[]
}

const GROUPS: GroupDef[] = [
  {
    title: 'Research',
    icon: <Search size={13} />,
    accent: 'var(--accent)',
    actions: [
      { cmd: 'PREC breach of contract',         label: 'Breach of contract precedents', panel: 'PREC', opts: { query: 'breach of contract' } },
      { cmd: 'PREC attorney-client privilege',  label: 'Attorney-client privilege',     panel: 'PREC', opts: { query: 'attorney-client privilege' } },
      { cmd: 'CITE 2022 Cal.App.4th 1234',      label: 'Validate a citation',           panel: 'CITE', opts: { query: '2022 Cal.App.4th 1234' } },
      { cmd: 'STAT Cal.Civ.Code.1657',          label: 'Cal. Civ. Code § 1657',         panel: 'STAT', opts: { query: 'Cal.Civ.Code.1657' } },
    ],
  },
  {
    title: 'Contracts',
    icon: <FileText size={13} />,
    accent: 'var(--risk-medium)',
    actions: [
      { cmd: 'CTRX client_proposed_nda',         label: 'Analyze client NDA',         panel: 'CTRX', opts: { contractId: 'client_proposed_nda' } },
      { cmd: 'CTRX master_services_agreement_tech', label: 'Analyze Tech MSA',         panel: 'CTRX', opts: { contractId: 'master_services_agreement_tech' } },
      { cmd: 'PRIV litigation_memo openai',       label: 'Check privilege: litigation memo', panel: 'PRIV' },
      { cmd: 'DOCA vendor_nda_2026.docx',         label: 'Analyze document',           panel: 'DOCA' },
    ],
  },
  {
    title: 'Privilege & Risk',
    icon: <ShieldAlert size={13} />,
    accent: 'var(--risk-high)',
    actions: [
      { cmd: 'PRIV litigation_memo ollama',       label: 'Check privilege: local model', panel: 'PRIV' },
      { cmd: 'PRIV client_strategy azure_openai', label: 'Check privilege: Azure OpenAI', panel: 'PRIV' },
      { cmd: 'BRF contract dispute',              label: 'Brief outline: contract dispute', panel: 'BRF', opts: { query: 'contract dispute' } },
      { cmd: 'BRF employment law',                label: 'Brief outline: employment law',  panel: 'BRF', opts: { query: 'employment law' } },
    ],
  },
  {
    title: 'Operations',
    icon: <ClockIcon size={13} />,
    accent: 'var(--text-dim)',
    actions: [
      { cmd: 'JOBS', label: 'View analysis queue',    panel: 'JOBS' },
      { cmd: 'WKFL', label: 'Browse playbooks',       panel: 'WKFL' },
      { cmd: 'AUDT', label: 'Review audit log',       panel: 'AUDT' },
      { cmd: 'LIVE', label: 'Check integrations',     panel: 'LIVE' },
    ],
  },
]

function TimeAgo({ ts }: { ts: number }) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return <span>{diff}s ago</span>
  if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>
  return <span>{Math.floor(diff / 3600)}h ago</span>
}

export function HomePanel() {
  const { navigate, pushCommand, recentActivity } = useTerminalStore()
  const isLive = Boolean(import.meta.env.VITE_MCP_URL)

  function run(action: QuickAction) {
    pushCommand(action.cmd)
    navigate(action.panel, action.opts)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      {/* Hero strip */}
      <div style={{
        background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)',
        padding: '20px 28px',
        display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ color: 'var(--text-heading)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            Legal Terminal
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.7, maxWidth: 480 }}>
            Bloomberg-style interface over <code style={{ color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace" }}>legal-mcp</code>.
            Use the sidebar to navigate modules, type a mnemonic command below, or press an F-key.
          </div>
        </div>
        {/* Connection status */}
        <div style={{ background: 'var(--bg-panel2)', border: '1px solid var(--border)', padding: '10px 16px', fontSize: 11, minWidth: 200 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Backend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ color: isLive ? 'var(--status-ok)' : 'var(--text-muted)' }}>●</span>
            <span style={{ color: 'var(--text-dim)' }}>
              {isLive ? `Live — ${import.meta.env.VITE_MCP_URL}` : 'Mock fixtures'}
            </span>
          </div>
          {!isLive && (
            <div style={{ color: 'var(--text-muted)', fontSize: 10, lineHeight: 1.5 }}>
              Set <code style={{ fontFamily: "'IBM Plex Mono', monospace" }}>VITE_MCP_URL</code> in <code style={{ fontFamily: "'IBM Plex Mono', monospace" }}>.env.local</code> to connect live.
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {[
              { label: 'CourtListener', on: false },
              { label: 'PACER', on: false },
            ].map(s => (
              <span key={s.label} style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                <span style={{ opacity: 0.4 }}>○</span> {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick-action grid */}
      <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {GROUPS.map(group => (
          <div key={group.title} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: group.accent }}>{group.icon}</span>
              <span className="card-title">{group.title}</span>
            </div>
            {group.actions.map(action => (
              <button key={action.cmd} className="quick-action" onClick={() => run(action)}>
                <span className="qa-label">{action.panel}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div style={{ padding: '0 28px 28px' }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Recent activity</div>
          {recentActivity.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>
              No activity yet. Open a module above to get started.
            </div>
          ) : (
            <table className="data-table" style={{ marginTop: 4 }}>
              <thead>
                <tr>
                  <th>Command</th>
                  <th style={{ textAlign: 'right' }}>When</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.slice(0, 10).map(ev => (
                  <tr key={ev.id}>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{ev.text}</td>
                    <td className="mono-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <TimeAgo ts={ev.ts} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
