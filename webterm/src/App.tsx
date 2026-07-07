import './index.css'
import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { CommandLine } from './components/CommandLine'
import { CommandPalette } from './components/CommandPalette'
import { PreReleaseOverlay } from './components/PreReleaseOverlay'
import { StatusBar } from './components/StatusBar'
import { Workspace } from './components/Workspace'
import { useTerminalStore } from './store/terminalStore'
import type { PanelType } from './store/terminalStore'
import { TABLET_BREAKPOINT } from './hooks/useViewport'

const FKEY_MAP: Record<string, PanelType> = {
  F1: 'CHAT',
  F2: 'PREC', F3: 'CITE', F4: 'CTRX', F5: 'JOBS',
  F6: 'WKFL', F7: 'AUDT', F9: 'PRIV', F10: 'LIVE',
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { navigate, setSidebarCollapsed, closeSplit } = useTerminalStore()

  const theme = useTerminalStore(s => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT}px)`)
    const onTabletLayout = () => {
      if (mq.matches) {
        setSidebarCollapsed(true)
        closeSplit()
      }
    }
    onTabletLayout()
    mq.addEventListener('change', onTabletLayout)
    return () => mq.removeEventListener('change', onTabletLayout)
  }, [setSidebarCollapsed, closeSplit])

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
    <div className="app-shell">
      <Sidebar />

      <div className="main-column">
        <div className="command-line-bar">
          <CommandLine onOpenPalette={() => setPaletteOpen(true)} />
        </div>

        <Workspace />

        <StatusBar />
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <PreReleaseOverlay />
    </div>
  )
}
