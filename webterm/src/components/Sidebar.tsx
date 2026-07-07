import {
  Search, BookOpen, Quote,
  FileText, FolderOpen, ShieldAlert,
  PenTool,
  ClockIcon, GitBranch, ScrollText, Activity,
  ChevronLeft, ChevronRight, Home,
} from 'lucide-react'
import { useTerminalStore } from '../store/terminalStore'
import type { ViewType } from '../store/terminalStore'

interface NavItem {
  type: ViewType
  label: string
  icon: React.ReactNode
  fkey?: string
}

interface Group {
  label: string
  items: NavItem[]
}

const GROUPS: Group[] = [
  {
    label: 'Research',
    items: [
      { type: 'PREC', label: 'Precedent Search', icon: <Search size={14} />, fkey: 'F2' },
      { type: 'STAT', label: 'Statutes',          icon: <BookOpen size={14} /> },
      { type: 'CITE', label: 'Citations',          icon: <Quote size={14} />,   fkey: 'F3' },
    ],
  },
  {
    label: 'Contracts',
    items: [
      { type: 'CTRX', label: 'Contract Workbench', icon: <FileText size={14} />,    fkey: 'F4' },
      { type: 'DOCA', label: 'Document Analyzer',  icon: <FolderOpen size={14} /> },
      { type: 'PRIV', label: 'Privilege Check',    icon: <ShieldAlert size={14} />, fkey: 'F9' },
    ],
  },
  {
    label: 'Drafting',
    items: [
      { type: 'BRF', label: 'Brief Builder', icon: <PenTool size={14} /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { type: 'JOBS', label: 'Analysis Queue', icon: <ClockIcon size={14} />,   fkey: 'F5' },
      { type: 'WKFL', label: 'Workflows',       icon: <GitBranch size={14} />,   fkey: 'F6' },
      { type: 'AUDT', label: 'Audit Log',        icon: <ScrollText size={14} />, fkey: 'F7' },
      { type: 'LIVE', label: 'Integrations',     icon: <Activity size={14} />,   fkey: 'F10' },
    ],
  },
]

export function Sidebar() {
  const { view, navigate, sidebarCollapsed, setSidebarCollapsed } = useTerminalStore()
  const collapsed = sidebarCollapsed

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Logo row */}
      <div className="sidebar-logo" style={{ justifyContent: collapsed ? 'center' : undefined }}>
        {!collapsed && (
          <span style={{ color: 'var(--text-heading)', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.01em', flex: 1 }}>
            Legal Terminal
          </span>
        )}
        <button
          onClick={() => setSidebarCollapsed(!collapsed)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Home */}
      <button
        className={`sidebar-item${view.type === 'HOME' ? ' active' : ''}`}
        onClick={() => navigate('HOME')}
        style={collapsed ? { justifyContent: 'center', paddingLeft: 0 } : undefined}
        title="Home"
      >
        <Home size={14} className="sidebar-icon" />
        {!collapsed && <span>Home</span>}
      </button>

      {/* Nav groups */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <div className="sidebar-group-label">{group.label}</div>
            )}
            {collapsed && <div style={{ height: 8 }} />}
            {group.items.map(item => (
              <button
                key={item.type}
                className={`sidebar-item${view.type === item.type ? ' active' : ''}`}
                onClick={() => navigate(item.type)}
                style={collapsed ? { justifyContent: 'center', paddingLeft: 0 } : undefined}
                title={collapsed ? `${item.label}${item.fkey ? ` (${item.fkey})` : ''}` : undefined}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.fkey && <span className="fkey-hint">{item.fkey}</span>}
                  </>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom: version tag */}
      {!collapsed && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          v0.1.0-pre.1
        </div>
      )}
    </aside>
  )
}
