import type { ReactNode } from 'react'
import { useTerminalStore } from '../store/terminalStore'

interface Props {
  id: string
  mnemonic: string
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
}

export function PanelChrome({ id, mnemonic, title, subtitle, children, actions }: Props) {
  const { activePanel, setActivePanel, closePanel } = useTerminalStore()
  const isActive = activePanel === id

  return (
    <div
      className="panel-chrome"
      style={{ height: '100%', outline: isActive ? '1px solid var(--accent-dim)' : 'none' }}
      onClick={() => setActivePanel(id)}
    >
      <div className="panel-header">
        <span className="mnemonic-badge">{mnemonic}</span>
        <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>{title}</span>
        {subtitle && <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>— {subtitle}</span>}
        <span style={{ flex: 1 }} />
        {actions}
        <button
          onClick={e => { e.stopPropagation(); closePanel(id) }}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 14, lineHeight: 1, padding: '0 2px',
            fontFamily: 'inherit',
          }}
          title="Close panel"
        >
          ×
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: 'var(--risk-critical)', HIGH: 'var(--risk-high)',
  MEDIUM: 'var(--risk-medium)', LOW: 'var(--risk-low)',
}

export function RiskBadge({ risk }: { risk: string }) {
  const color = RISK_COLORS[risk] ?? 'var(--text-muted)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ color, fontSize: 10, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em' }}>{risk}</span>
    </span>
  )
}

export function RelevanceBar({ score }: { score: number }) {
  return (
    <div className="relevance-bar" style={{ width: 56 }}>
      <div className="relevance-fill" style={{ width: `${score * 100}%` }} />
    </div>
  )
}

export function LoadingDots() {
  return (
    <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>
      Loading…
    </div>
  )
}

export function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>
      {msg}
    </div>
  )
}
