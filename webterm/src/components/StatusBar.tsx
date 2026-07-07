import { useEffect, useState } from 'react'
import { useTerminalStore } from '../store/terminalStore'
import type { PanelType } from '../store/terminalStore'

const FKEYS: { key: string; label: string; panel?: PanelType }[] = [
  { key: 'F1', label: 'Help' },
  { key: 'F2', label: 'PREC', panel: 'PREC' },
  { key: 'F3', label: 'CITE', panel: 'CITE' },
  { key: 'F4', label: 'CTRX', panel: 'CTRX' },
  { key: 'F5', label: 'JOBS', panel: 'JOBS' },
  { key: 'F6', label: 'WKFL', panel: 'WKFL' },
  { key: 'F7', label: 'AUDT', panel: 'AUDT' },
  { key: 'F8', label: 'Export' },
  { key: 'F9', label: 'PRIV', panel: 'PRIV' },
  { key: 'F10', label: 'LIVE', panel: 'LIVE' },
]

function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>
      {t.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  )
}

export function FKeyStrip() {
  const { openPanel } = useTerminalStore()
  return (
    <div style={{
      display: 'flex', gap: 0,
      background: 'var(--bg-panel2)', borderTop: '1px solid var(--border)',
      padding: '3px 10px', flexShrink: 0,
    }}>
      {FKEYS.map(f => (
        <button
          key={f.key}
          onClick={() => f.panel && openPanel(f.panel)}
          style={{
            background: 'transparent', border: 'none', cursor: f.panel ? 'pointer' : 'default',
            padding: '2px 8px', fontSize: 11, fontFamily: 'inherit',
            color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>{f.key}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{f.label}</span>
        </button>
      ))}
    </div>
  )
}

export function StatusBar() {
  const { panels } = useTerminalStore()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: 'var(--bg-panel2)', borderTop: '1px solid var(--border)',
      padding: '3px 14px', fontSize: 11, color: 'var(--text-muted)',
      flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <span>
        <span style={{ color: 'var(--status-ok)' }}>●</span>
        {' '}legal-mcp SSE :8000
      </span>
      <span style={{ color: 'var(--border-bright)' }}>│</span>
      <span style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>○</span>
        {' '}CourtListener off
      </span>
      <span style={{ color: 'var(--border-bright)' }}>│</span>
      <span style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--risk-medium)' }}>○</span>
        {' '}PACER off
      </span>
      <span style={{ color: 'var(--border-bright)' }}>│</span>
      <span style={{ color: 'var(--text-muted)' }}>{panels.length} panel{panels.length !== 1 ? 's' : ''}</span>
      <span style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Legal Terminal v0.1.0</span>
      <span style={{ color: 'var(--border-bright)' }}>│</span>
      <Clock />
    </div>
  )
}

/** Static activity strip — replaces the scrolling ticker tape */
export function ActivityStrip() {
  const events = [
    'job-003  dpa_addendum_eu.pdf  processing',
    'job-001  vendor_nda_2026.docx  complete  HIGH  3 flags',
    'search_precedents "breach of contract delivery"  →  4 results',
    'validate_citation 2022 Cal.App.4th 1234  →  valid',
    'check_privilege_risk litigation_memo.docx openai  →  HIGH',
  ]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % events.length), 4000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="activity-strip">
      <span style={{ color: 'var(--accent)', marginRight: 8 }}>Recent</span>
      {events[idx]}
    </div>
  )
}
