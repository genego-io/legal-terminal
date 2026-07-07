import { useTerminalStore } from '../store/terminalStore'
import type { PanelType } from '../store/terminalStore'
import type { ReactNode } from 'react'
import { Search, FileText, ShieldAlert, ClockIcon, Scale, Database, ScrollText, Activity } from 'lucide-react'
import { SurfaceCard, SectionHeader, MetricTile, StatusPill } from '../components/ProductSurface'
import { CASES, CONTRACTS, JOBS, AUDIT_LOG } from '../fixtureMeta'

interface QuickAction {
  cmd: string
  label: string
  panel: PanelType
  opts?: { query?: string; contractId?: string }
}

interface GroupDef {
  title: string
  icon: ReactNode
  accent: string
  actions: QuickAction[]
}

const GROUPS: GroupDef[] = [
  {
    title: 'Research',
    icon: <Search size={14} />,
    accent: 'var(--accent)',
    actions: [
      { cmd: 'PREC breach of contract',         label: 'Breach of contract precedents', panel: 'PREC', opts: { query: 'breach of contract' } },
      { cmd: 'PREC attorney-client privilege',  label: 'Attorney-client privilege',     panel: 'PREC', opts: { query: 'attorney-client privilege' } },
      { cmd: 'CITE 2022 Cal.App.4th 1234',      label: 'Validate a citation',           panel: 'CITE', opts: { query: '2022 Cal.App.4th 1234' } },
      { cmd: 'STAT Cal.Civ.Code.1657',          label: 'Cal. Civ. Code 1657',            panel: 'STAT', opts: { query: 'Cal.Civ.Code.1657' } },
    ],
  },
  {
    title: 'Contracts',
    icon: <FileText size={14} />,
    accent: 'var(--risk-medium)',
    actions: [
      { cmd: 'CTRX client_proposed_nda',         label: 'Analyze client NDA',              panel: 'CTRX', opts: { contractId: 'client_proposed_nda' } },
      { cmd: 'CTRX master_services_agreement_tech', label: 'Analyze Tech MSA',             panel: 'CTRX', opts: { contractId: 'master_services_agreement_tech' } },
      { cmd: 'PRIV litigation_memo openai',      label: 'Check privilege: litigation memo', panel: 'PRIV' },
      { cmd: 'DOCA vendor_nda_2026.docx',        label: 'Analyze document',                panel: 'DOCA' },
    ],
  },
  {
    title: 'Privilege & Risk',
    icon: <ShieldAlert size={14} />,
    accent: 'var(--risk-high)',
    actions: [
      { cmd: 'PRIV litigation_memo ollama',       label: 'Check privilege: local model',     panel: 'PRIV' },
      { cmd: 'PRIV client_strategy azure_openai', label: 'Check privilege: Azure OpenAI',    panel: 'PRIV' },
      { cmd: 'BRF contract dispute',              label: 'Brief outline: contract dispute',  panel: 'BRF', opts: { query: 'contract dispute' } },
      { cmd: 'BRF employment law',                label: 'Brief outline: employment law',    panel: 'BRF', opts: { query: 'employment law' } },
    ],
  },
  {
    title: 'Operations',
    icon: <ClockIcon size={14} />,
    accent: 'var(--text-dim)',
    actions: [
      { cmd: 'JOBS', label: 'View analysis queue', panel: 'JOBS' },
      { cmd: 'WKFL', label: 'Browse playbooks',    panel: 'WKFL' },
      { cmd: 'AUTM', label: 'Automations',         panel: 'AUTM' },
      { cmd: 'TRIG', label: 'Triggers & inbox',    panel: 'TRIG' },
      { cmd: 'AUDT', label: 'Review audit log',    panel: 'AUDT' },
      { cmd: 'LIVE', label: 'Check integrations',  panel: 'LIVE' },
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
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero-copy">
          <SectionHeader
            eyebrow="Legal Terminal"
            title="Matter workbench for high-volume legal teams"
            description={(
              <>
                A keyboard-first practice workspace for legal research, contract review, privilege assessment,
                document analysis, and operational audit trails.
              </>
            )}
            meta={(
              <>
                <StatusPill tone={isLive ? 'success' : 'default'}>{isLive ? 'Live MCP' : 'Mock fixtures'}</StatusPill>
                <StatusPill tone="accent">Command driven</StatusPill>
              </>
            )}
            actions={(
              <button
                onClick={() => navigate('CHAT')}
                className="btn-primary home-primary-action"
                title="Open the Paralegal chat (F1)"
              >
                <Scale size={14} />
                Ask the Paralegal
                <span className="home-action-key">F1</span>
              </button>
            )}
          />
        </div>

        <SurfaceCard className="home-system-card" padding="md">
          <div className="section-label">Runtime</div>
          <div className="home-status-row">
            <span className={`home-status-dot${isLive ? ' on' : ''}`} />
            <span>{isLive ? import.meta.env.VITE_MCP_URL : 'Offline demo mode'}</span>
          </div>
          {!isLive && (
            <div className="home-status-note">
              Set <code>VITE_MCP_URL</code> in <code>.env.local</code> to connect a live MCP server.
            </div>
          )}
          <div className="home-status-list">
            <span><span className="home-mini-dot" /> CourtListener</span>
            <span><span className="home-mini-dot warn" /> PACER</span>
          </div>
        </SurfaceCard>
      </div>

      <div className="home-metrics-grid">
        <MetricTile label="Authority Library" value={CASES.length} detail="local case fixtures" tone="accent" />
        <MetricTile label="Contract Files" value={CONTRACTS.length} detail="sample agreements" />
        <MetricTile label="Analysis Queue" value={JOBS.length} detail="background jobs" tone="warning" />
        <MetricTile label="Audit Trail" value={AUDIT_LOG.length} detail="tool invocations" tone="success" />
      </div>

      <div className="home-grid">
        {GROUPS.map(group => (
          <SurfaceCard key={group.title} className="home-action-card" padding="md">
            <div className="home-card-header">
              <span className="home-card-icon" style={{ color: group.accent }}>{group.icon}</span>
              <span className="card-title">{group.title}</span>
            </div>
            {group.actions.map(action => (
              <button key={action.cmd} className="quick-action" onClick={() => run(action)}>
                <span className="qa-label">{action.panel}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </SurfaceCard>
        ))}
      </div>

      <div className="home-recent">
        <SurfaceCard padding="md">
          <SectionHeader
            eyebrow="Session"
            title="Recent activity"
            meta={<StatusPill>{recentActivity.length} events</StatusPill>}
          />
          {recentActivity.length === 0 ? (
            <div className="home-activity-empty">
              <Activity size={16} />
              <span>No activity yet. Open a module above to get started.</span>
            </div>
          ) : (
            <table className="data-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Command</th>
                  <th style={{ textAlign: 'right' }}>When</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.slice(0, 10).map(ev => (
                  <tr key={ev.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{ev.text}</td>
                    <td className="mono-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <TimeAgo ts={ev.ts} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SurfaceCard>
      </div>

      <div className="home-footer-strip">
        <span><Database size={13} /> Local evidence-first workspace</span>
        <span><ScrollText size={13} /> Audit-aware workflows</span>
      </div>
    </div>
  )
}
