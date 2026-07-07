import './index.css'
import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { CommandLine } from './components/CommandLine'
import { CommandPalette } from './components/CommandPalette'
import { StatusBar } from './components/StatusBar'
import { Workspace } from './components/Workspace'
import { useTerminalStore } from './store/terminalStore'
import type { PanelType } from './store/terminalStore'

const FKEY_MAP: Record<string, PanelType> = {
  F2: 'PREC', F3: 'CITE', F4: 'CTRX', F5: 'JOBS',
  F6: 'WKFL', F7: 'AUDT', F9: 'PRIV', F10: 'LIVE',
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { navigate } = useTerminalStore()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // F-keys
      if (e.key in FKEY_MAP && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        navigate(FKEY_MAP[e.key])
        return
      }
      // Ctrl+K → palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(p => !p)
        return
      }
      // Escape → close palette
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, paletteOpen])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Left sidebar */}
      <Sidebar />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar: command input */}
        <div style={{
          background: 'var(--bg-panel2)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'stretch', flexShrink: 0, height: 38,
        }}>
          <CommandLine onOpenPalette={() => setPaletteOpen(true)} />
        </div>

        {/* View area */}
        <Workspace />

        {/* Status bar */}
        <StatusBar />
      </div>

      {/* Ctrl+K palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
