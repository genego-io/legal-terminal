import './index.css'
import { CommandLine } from './components/CommandLine'
import { FKeyStrip, StatusBar, ActivityStrip } from './components/StatusBar'
import { Workspace } from './components/Workspace'
import { useTerminalStore } from './store/terminalStore'
import { useEffect } from 'react'

export default function App() {
  const { openPanel } = useTerminalStore()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, () => void> = {
        F2:  () => openPanel('PREC'),
        F3:  () => openPanel('CITE'),
        F4:  () => openPanel('CTRX'),
        F5:  () => openPanel('JOBS'),
        F6:  () => openPanel('WKFL'),
        F7:  () => openPanel('AUDT'),
        F9:  () => openPanel('PRIV'),
        F10: () => openPanel('LIVE'),
      }
      if (e.key in map && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        map[e.key]()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openPanel])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Top header */}
      <div style={{
        background: 'var(--bg-panel2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'stretch', flexShrink: 0,
      }}>
        <div style={{
          padding: '8px 16px', borderRight: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <span style={{ color: 'var(--text-heading)', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em' }}>
            Legal Terminal
          </span>
          <span style={{
            color: 'var(--text-muted)', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
            border: '1px solid var(--border-bright)', padding: '1px 6px',
          }}>
            legal-mcp
          </span>
        </div>
        <CommandLine />
      </div>

      {/* Activity strip */}
      <ActivityStrip />

      {/* Main workspace */}
      <Workspace />

      {/* F-key strip */}
      <FKeyStrip />

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
