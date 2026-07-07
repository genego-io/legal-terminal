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
    <div className={`status-bar${confidentialMode ? ' confidential' : ''}`}>
      {confidentialMode && (
        <>
          <button
            onClick={() => navigate('CONF')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--confidential-faint)', border: '1px solid var(--confidential-border)',
              color: 'var(--confidential)', fontSize: 10, padding: '1px 7px', cursor: 'pointer',
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.04em',
            }}
            title="Confidential mode active — click to open settings"
          >
            <Lock size={10} />
            CONF
          </button>
          {SEP}
        </>
      )}
      <ClientModeToggle />
      {SEP}
      <span className="status-bar-integrations status-bar-hide-tablet" style={{ opacity: 0.5 }}>○ CourtListener</span>
      <span className="status-bar-hide-tablet">{SEP}</span>
      <span className="status-bar-integrations status-bar-hide-tablet" style={{ color: 'var(--risk-medium)', opacity: 0.6 }}>○ PACER</span>
      <span className="status-bar-hide-tablet">{SEP}</span>
      <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
        {view.type}{splitView ? ` / ${splitView.type}` : ''}
      </span>
      {SEP}
      {lastActivity && (
        <>
          <span className="status-bar-activity" style={{
            color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {lastActivity.text}
          </span>
          {SEP}
        </>
      )}
      <span style={{ flex: 1, minWidth: 8 }} />
      <span className="status-bar-brand" style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>Legal Terminal</span>
      <span className="status-bar-brand">{SEP}</span>
      <Clock />
    </div>
  )
}
