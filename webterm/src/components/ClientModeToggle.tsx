/**
 * Runtime mock ↔ live toggle shown in the status bar.
 * Clicking the pill opens a small popover for the server URL (live mode).
 */
import { useState, useRef, useEffect } from 'react'
import { useTerminalStore } from '../store/terminalStore'

export function ClientModeToggle() {
  const { clientMode, liveUrl, switchClientMode } = useTerminalStore()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState(liveUrl)
  const [switching, setSwitching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])

  async function toggle() {
    if (clientMode === 'mock') {
      setOpen(o => !o)
    } else {
      setSwitching(true)
      await switchClientMode('mock')
      setSwitching(false)
    }
  }

  async function connect() {
    setSwitching(true)
    await switchClientMode('live', url)
    setSwitching(false)
    setOpen(false)
  }

  const isLive = clientMode === 'live'

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={toggle}
        disabled={switching}
        title={isLive ? `Live — ${liveUrl}. Click to switch back to mock.` : 'Mock mode. Click to connect to live server.'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: isLive ? 'var(--live-bg)' : 'transparent',
          border: '1px solid ' + (isLive ? 'var(--risk-low)' : 'var(--border-bright)'),
          color: isLive ? 'var(--risk-low)' : 'var(--text-muted)',
          fontSize: 10, padding: '1px 7px', cursor: 'pointer',
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: '0.04em',
          opacity: switching ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isLive ? 'var(--risk-low)' : 'var(--text-muted)', display: 'inline-block' }} />
        {switching ? '…' : isLive ? 'live' : 'mock'}
      </button>

      {open && !isLive && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
          background: 'var(--bg-panel2)', border: '1px solid var(--border-bright)',
          padding: 12, width: 300, zIndex: 200,
          boxShadow: '0 8px 32px var(--shadow-lg)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            Connect to live server
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, lineHeight: 1.5 }}>
            Start <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--accent)' }}>python main.py --transport sse</code> in the{' '}
            <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--accent)' }}>legal-mcp</code> directory first.
          </div>
          <input
            ref={inputRef}
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && connect()}
            placeholder="http://localhost:8000"
            className="field-input"
            style={{ marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={connect} className="btn-primary" style={{ flex: 1 }}>Connect live</button>
            <button onClick={() => setOpen(false)} className="btn">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
