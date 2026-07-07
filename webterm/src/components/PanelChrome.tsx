import type { ReactNode } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import type { PanelType } from '../store/terminalStore'

interface Props {
  id: string
  mnemonic: string
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
  panelType?: PanelType
}

export function PanelChrome({ mnemonic, title, subtitle, children, actions, panelType }: Props) {
  const { pinSplit, splitView, closeSplit } = useTerminalStore()
  const isSplit = splitView?.type === panelType

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', overflow: 'hidden' }}>
      <div className="module-header">
        <span className="mnemonic-badge">{mnemonic}</span>
        <span className="module-title">{title}</span>
        {subtitle && <span className="module-subtitle">— {subtitle}</span>}
        <span style={{ flex: 1 }} />
        {actions}
        {panelType && (
          <button
            onClick={() => isSplit ? closeSplit() : pinSplit(panelType)}
            title={isSplit ? 'Close split' : 'Pin to split view'}
            style={{
              background: isSplit ? 'var(--accent-faint)' : 'transparent',
              border: '1px solid ' + (isSplit ? 'var(--accent-dim)' : 'var(--border-bright)'),
              color: isSplit ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 10, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {isSplit ? '× split' : '⊞ split'}
          </button>
        )}
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
    <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
      Loading…
    </div>
  )
}

export function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>{msg}</div>
  )
}

