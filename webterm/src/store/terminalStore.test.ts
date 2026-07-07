import { describe, it, expect, beforeEach } from 'vitest'
import { useTerminalStore } from './terminalStore'

function reset() {
  useTerminalStore.getState().resetPanels()
  useTerminalStore.getState().setTheme('light')
  useTerminalStore.setState({ commandHistory: [], selectedCase: null, selectedContract: null, recentActivity: [] })
}

beforeEach(reset)

describe('navigate', () => {
  it('sets the view type', () => {
    useTerminalStore.getState().navigate('PREC')
    expect(useTerminalStore.getState().view.type).toBe('PREC')
  })

  it('stores optional query', () => {
    useTerminalStore.getState().navigate('PREC', { query: 'breach' })
    expect(useTerminalStore.getState().view.query).toBe('breach')
  })

  it('navigating replaces the view', () => {
    useTerminalStore.getState().navigate('CITE')
    useTerminalStore.getState().navigate('CTRX')
    expect(useTerminalStore.getState().view.type).toBe('CTRX')
  })
})

describe('openPanel (backward-compat shim)', () => {
  it('navigates to the panel type', () => {
    useTerminalStore.getState().openPanel('WKFL')
    expect(useTerminalStore.getState().view.type).toBe('WKFL')
  })

  it('does not crash when called multiple times', () => {
    expect(() => {
      useTerminalStore.getState().openPanel('AUDT')
      useTerminalStore.getState().openPanel('AUDT')
    }).not.toThrow()
  })
})

describe('closePanel (backward-compat shim)', () => {
  it('navigates back to HOME', () => {
    useTerminalStore.getState().navigate('PREC')
    useTerminalStore.getState().closePanel('any-id')
    expect(useTerminalStore.getState().view.type).toBe('HOME')
  })

  it('does not crash on a non-existent id', () => {
    expect(() => useTerminalStore.getState().closePanel('fake-id')).not.toThrow()
  })
})

describe('splitView', () => {
  it('pinSplit sets a secondary view', () => {
    useTerminalStore.getState().pinSplit('CITE')
    expect(useTerminalStore.getState().splitView?.type).toBe('CITE')
  })

  it('closeSplit removes the secondary view', () => {
    useTerminalStore.getState().pinSplit('CITE')
    useTerminalStore.getState().closeSplit()
    expect(useTerminalStore.getState().splitView).toBeNull()
  })
})

describe('pushCommand', () => {
  it('prepends commands to history', () => {
    useTerminalStore.getState().pushCommand('PREC breach')
    useTerminalStore.getState().pushCommand('CITE 2022')
    const { commandHistory } = useTerminalStore.getState()
    expect(commandHistory[0]).toBe('CITE 2022')
    expect(commandHistory[1]).toBe('PREC breach')
  })

  it('keeps history capped at 50 entries', () => {
    for (let i = 0; i < 60; i++) useTerminalStore.getState().pushCommand(`CMD ${i}`)
    expect(useTerminalStore.getState().commandHistory.length).toBe(50)
  })
})

describe('pushActivity', () => {
  it('prepends activity events', () => {
    useTerminalStore.getState().pushActivity('searched precedents')
    expect(useTerminalStore.getState().recentActivity[0].text).toBe('searched precedents')
  })

  it('caps at 30 entries', () => {
    for (let i = 0; i < 40; i++) useTerminalStore.getState().pushActivity(`event ${i}`)
    expect(useTerminalStore.getState().recentActivity.length).toBe(30)
  })
})

describe('selectedCase / selectedContract', () => {
  it('sets and reads selectedCase', () => {
    useTerminalStore.getState().setSelectedCase('case-123')
    expect(useTerminalStore.getState().selectedCase).toBe('case-123')
  })

  it('clears selectedCase', () => {
    useTerminalStore.getState().setSelectedCase('case-123')
    useTerminalStore.getState().setSelectedCase(null)
    expect(useTerminalStore.getState().selectedCase).toBeNull()
  })
})

describe('resetPanels', () => {
  it('resets view to HOME', () => {
    useTerminalStore.getState().navigate('PREC')
    useTerminalStore.getState().resetPanels()
    expect(useTerminalStore.getState().view.type).toBe('HOME')
  })

  it('clears splitView', () => {
    useTerminalStore.getState().pinSplit('CITE')
    useTerminalStore.getState().resetPanels()
    expect(useTerminalStore.getState().splitView).toBeNull()
  })
})

describe('theme', () => {
  it('defaults to light', () => {
    expect(useTerminalStore.getState().theme).toBe('light')
  })

  it('setTheme updates store and document attribute', () => {
    useTerminalStore.getState().setTheme('dark')
    expect(useTerminalStore.getState().theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('toggleTheme switches between light and dark', () => {
    useTerminalStore.getState().setTheme('light')
    useTerminalStore.getState().toggleTheme()
    expect(useTerminalStore.getState().theme).toBe('dark')
    useTerminalStore.getState().toggleTheme()
    expect(useTerminalStore.getState().theme).toBe('light')
  })
})
