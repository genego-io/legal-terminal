import {
  Search, BookOpen, Quote,
  FileText, FolderOpen, ShieldAlert,
  PenTool, Scale,
  ClockIcon, GitBranch, ScrollText, Activity, Zap, Mail,
  ChevronLeft, ChevronRight, Home, X,
  Radar, Lock, Unlock, Sun, Moon,
} from 'lucide-react'
import { useTerminalStore } from '../store/terminalStore'
import type { ViewType } from '../store/terminalStore'
import { useViewport } from '../hooks/useViewport'

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
      { type: 'AUTM', label: 'Automations',     icon: <Zap size={14} />,         fkey: 'F8' },
      { type: 'TRIG', label: 'Triggers',        icon: <Mail size={14} /> },
      { type: 'AUDT', label: 'Audit Log',        icon: <ScrollText size={14} />, fkey: 'F7' },
      { type: 'LIVE', label: 'Integrations',     icon: <Activity size={14} />,   fkey: 'F10' },
      { type: 'WTCH', label: 'Docket Watch',     icon: <Radar size={14} /> },
    ],
  },
]

export function Sidebar() {
  const { view, navigate, sidebarCollapsed, setSidebarCollapsed, confidentialMode, toggleConfidentialMode, theme, toggleTheme } = useTerminalStore()
  const { isCompact, isTablet } = useViewport()
  const collapsed = sidebarCollapsed
  const mobileOpen = isCompact && !collapsed

  function closeMobileNav() {
    if (isCompact) setSidebarCollapsed(true)
  }

  function goTo(type: ViewType) {
    navigate(type)
    closeMobileNav()
  }

  function toggleCollapsed() {
    if (isCompact && collapsed) {
      setSidebarCollapsed(false)
    } else {
      setSidebarCollapsed(!collapsed)
    }
  }

  const asideClass = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
    isTablet && !isCompact ? 'tablet' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={closeMobileNav}
          aria-label="Close navigation menu"
        />
      )}
      <aside className={asideClass}>
        <div className="sidebar-logo">
          {!collapsed && (
            <span className="sidebar-brand">Legal Terminal</span>
          )}
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={mobileOpen ? closeMobileNav : toggleCollapsed}
            title={mobileOpen ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={mobileOpen ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {mobileOpen ? <X size={16} /> : collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <button
          type="button"
          className={`sidebar-item${view.type === 'HOME' ? ' active' : ''}`}
          onClick={() => goTo('HOME')}
          title={collapsed && !isCompact ? 'Home' : undefined}
        >
          <Home size={14} className="sidebar-icon" />
          {!collapsed && <span>Home</span>}
        </button>

        <div className="sidebar-nav-scroll">
          {GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <div className="sidebar-group-label">{group.label}</div>
              )}
              {collapsed && !isCompact && <div className="sidebar-group-spacer" />}
              {group.items.map(item => (
                <button
                  key={item.type}
                  type="button"
                  className={`sidebar-item${view.type === item.type ? ' active' : ''}`}
                  onClick={() => goTo(item.type)}
                  title={collapsed && !isCompact ? `${item.label}${item.fkey ? ` (${item.fkey})` : ''}` : undefined}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="sidebar-item-label">{item.label}</span>
                      {item.type === 'WTCH' && <span className="soon-badge">Soon</span>}
                      {item.fkey && <span className="fkey-hint">{item.fkey}</span>}
                    </>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className={`sidebar-footer${confidentialMode ? ' confidential' : ''}`}>
          <button
            type="button"
            onClick={toggleTheme}
            className="sidebar-item"
            title={collapsed && !isCompact ? (theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode') : undefined}
          >
            <span className="sidebar-icon">
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </span>
            {!collapsed && (
              <span className="sidebar-item-label">
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleConfidentialMode}
            className={`sidebar-item sidebar-item--conf${view.type === 'CONF' ? ' active' : ''}${confidentialMode ? ' on' : ''}`}
            title={collapsed && !isCompact
              ? confidentialMode ? 'Confidential mode ON — click to disable' : 'Confidential mode OFF — click to enable'
              : undefined}
          >
            <span className="sidebar-icon">
              {confidentialMode ? <Lock size={14} /> : <Unlock size={14} />}
            </span>
            {!collapsed && (
              <>
                <span className="sidebar-item-label">
                  {confidentialMode ? 'Confidential' : 'Standard mode'}
                </span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); goTo('CONF') }}
                  className="sidebar-settings-link"
                  title="Privacy settings"
                >
                  Settings
                </button>
              </>
            )}
          </button>

          {!collapsed && (
            <div className="sidebar-version">v0.2.0-pre.3</div>
          )}
        </div>
      </aside>
    </>
  )
}
