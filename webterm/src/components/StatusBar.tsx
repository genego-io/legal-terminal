import { useEffect, useState } from 'react'
import { useTerminalStore } from '../store/terminalStore'

function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>
      {t.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  )
}

const SEP = <span style={{ color: 'var(--border-bright)' }}>│</span>

export function StatusBar() {
  const { view, splitView, recentActivity } = useTerminalStore()
  const isLive = Boolean(import.meta.env.VITE_MCP_URL)
  const lastActivity = recentActivity[0]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--bg-panel2)', borderTop: '1px solid var(--border)',
      padding: '3px 14px', fontSize: 10, color: 'var(--text-muted)',
      flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {/* Connection */}
      <span>
        <span style={{ color: isLive ? 'var(--status-ok)' : 'var(--text-muted)' }}>●</span>
        {' '}{isLive ? 'live :8000' : 'mock'}
      </span>
      {SEP}
      <span style={{ opacity: 0.5 }}>○ CourtListener</span>
      {SEP}
      <span style={{ color: 'var(--risk-medium)', opacity: 0.6 }}>○ PACER</span>
      {SEP}
      {/* Current view */}
      <span style={{ color: 'var(--text-dim)' }}>
        {view.type}{splitView ? ` / ${splitView.type}` : ''}
      </span>
      {SEP}
      {/* Last activity */}
      {lastActivity && (
        <>
          <span style={{ color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lastActivity.text}
          </span>
          {SEP}
        </>
      )}
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Legal Terminal</span>
      {SEP}
      <Clock />
    </div>
  )
}
