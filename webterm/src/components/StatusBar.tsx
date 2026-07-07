import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { useTerminalStore } from '../store/terminalStore'
import { ClientModeToggle } from './ClientModeToggle'

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
  const { view, splitView, recentActivity, confidentialMode, navigate } = useTerminalStore()
  const lastActivity = recentActivity[0]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: confidentialMode ? 'var(--confidential-faint)' : 'var(--bg-panel2)',
      borderTop: `1px solid ${confidentialMode ? 'var(--confidential-border)' : 'var(--border)'}`,
      padding: '3px 14px', fontSize: 10, color: 'var(--text-muted)',
      flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace",
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      {/* Confidential mode badge — only when active */}
      {confidentialMode && (
        <>
          <button
            onClick={() => navigate('CONF')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--confidential-faint)', border: '1px solid var(--confidential-border)',
              color: 'var(--confidential)', fontSize: 10, padding: '1px 7px', cursor: 'pointer',
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em',
              animation: 'none',
            }}
            title="Confidential mode active — click to open settings"
          >
            <Lock size={10} />
            CONF
          </button>
          {SEP}
        </>
      )}
      {/* Runtime mode toggle */}
      <ClientModeToggle />
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
