import {
  Search, BookOpen, Quote,
  FileText, FolderOpen, ShieldAlert,
  PenTool, Scale,
  ClockIcon, GitBranch, ScrollText, Activity,
  ChevronLeft, ChevronRight, Home,
  Radar, Lock, Unlock, Sun, Moon,
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
    label: 'Assistant',
    items: [
      { type: 'CHAT', label: 'Paralegal', icon: <Scale size={14} />, fkey: 'F1' },
    ],
  },
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
      { type: 'WTCH', label: 'Docket Watch',     icon: <Radar size={14} /> },
    ],
  },
]

export function Sidebar() {
  const { view, navigate, sidebarCollapsed, setSidebarCollapsed, confidentialMode, toggleConfidentialMode, theme, toggleTheme } = useTerminalStore()
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
                  {item.type === 'WTCH' && <span className="soon-badge">Soon</span>}
                  {item.fkey && <span className="fkey-hint">{item.fkey}</span>}
                </>
              )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom: theme + confidential mode + version */}
      <div style={{
        borderTop: `1px solid ${confidentialMode ? 'var(--confidential-border)' : 'var(--border)'}`,
        transition: 'border-color 0.2s',
      }}>
        <button
          onClick={toggleTheme}
          className="sidebar-item"
          style={{ justifyContent: collapsed ? 'center' : undefined }}
          title={collapsed ? (theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode') : undefined}
        >
          <span className="sidebar-icon">
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </span>
          {!collapsed && (
            <span style={{ flex: 1, fontSize: 12 }}>
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </span>
          )}
        </button>

        {/* Confidential mode toggle — always visible */}
        <button
          onClick={toggleConfidentialMode}
          className={`sidebar-item${view.type === 'CONF' ? ' active' : ''}`}
          style={{
            justifyContent: collapsed ? 'center' : undefined,
            color: confidentialMode ? 'var(--confidential)' : 'var(--text-muted)',
            background: confidentialMode ? 'var(--confidential-faint)' : 'transparent',
          }}
          title={collapsed
            ? confidentialMode ? 'Confidential mode ON — click to disable' : 'Confidential mode OFF — click to enable'
            : undefined}
        >
          <span className="sidebar-icon" style={{ color: confidentialMode ? 'var(--confidential)' : 'var(--text-muted)' }}>
            {confidentialMode ? <Lock size={14} /> : <Unlock size={14} />}
          </span>
          {!collapsed && (
            <>
              <span style={{ flex: 1, fontSize: 12 }}>
                {confidentialMode ? 'Confidential' : 'Standard mode'}
              </span>
              <button
                onClick={e => { e.stopPropagation(); navigate('CONF') }}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 4px',
                  fontSize: 10, color: 'var(--text-muted)',
                }}
                title="Privacy settings"
              >
                Settings
              </button>
            </>
          )}
        </button>

        {!collapsed && (
          <div style={{ padding: '6px 12px 8px', fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
            v0.2.0-pre.1
          </div>
        )}
      </div>
    </aside>
  )
}
