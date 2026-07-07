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
import { useViewport, TABLET_BREAKPOINT } from './hooks/useViewport'
import { automationScheduler } from './services/automationScheduler'
import { client } from './mcp/index'

const FKEY_MAP: Record<string, PanelType> = {
  F1: 'CHAT',
  F2: 'PREC', F3: 'CITE', F4: 'CTRX', F5: 'JOBS',
  F6: 'WKFL', F7: 'AUDT', F8: 'AUTM', F9: 'PRIV', F10: 'LIVE',
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { navigate, setSidebarCollapsed, closeSplit, sidebarCollapsed } = useTerminalStore()
  const { isCompact } = useViewport()

  const theme = useTerminalStore(s => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    automationScheduler.setRunHandler(async (a) => {
      await client.runWorkflow(a.workflowId, a.workflowSource)
    })
    automationScheduler.start()
    return () => automationScheduler.stop()
  }, [])

  useEffect(() => {
    const lock = isCompact && !sidebarCollapsed
    document.body.style.overflow = lock ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isCompact, sidebarCollapsed])

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
      // Escape → close palette or mobile sidebar
      if (e.key === 'Escape') {
        if (paletteOpen) setPaletteOpen(false)
        else if (isCompact && !useTerminalStore.getState().sidebarCollapsed) {
          setSidebarCollapsed(true)
        }
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, paletteOpen, setSidebarCollapsed, isCompact])

  return (
    <div className={`app-shell${isCompact && !sidebarCollapsed ? ' nav-open' : ''}`}>
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
