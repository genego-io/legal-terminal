/**
 * Ctrl+K command palette using cmdk.
 */
import { useEffect, useRef } from 'react'
import { Command } from 'cmdk'
import { useTerminalStore } from '../store/terminalStore'
import { MNEMONICS } from './CommandLine'

interface Props {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const { navigate, pushCommand, commandHistory } = useTerminalStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  function run(cmd: string, panelType: string) {
    pushCommand(cmd)
    navigate(panelType as Parameters<typeof navigate>[0])
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="command-palette-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'var(--overlay)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <Command
        className="command-palette-dialog"
        style={{
          maxHeight: '60vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onKeyDown={e => { if (e.key === 'Escape') onClose() }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>›</span>
          <Command.Input
            ref={inputRef}
            placeholder="Search modules, mnemonics, recent commands…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-heading)', fontFamily: 'var(--font-mono)', fontSize: 13,
              caretColor: 'var(--accent)',
            }}
          />
          <kbd style={{ fontSize: 10, color: 'var(--text-muted)', border: '1px solid var(--border-bright)', padding: '1px 5px', fontFamily: 'inherit' }}>
            Esc
          </kbd>
        </div>

        <Command.List style={{ flex: 1, overflowY: 'auto' }}>
          <Command.Empty style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
            No modules found.
          </Command.Empty>

          {commandHistory.length > 0 && (
            <Command.Group heading={
              <div style={{ padding: '8px 14px 2px', fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Recent
              </div>
            }>
              {commandHistory.slice(0, 5).map((cmd, i) => {
                const firstWord = cmd.split(' ')[0].toUpperCase()
                const match = MNEMONICS.find(m => m.cmd === firstWord)
                return (
                  <Command.Item
                    key={`recent-${i}`}
                    value={cmd}
                    onSelect={() => match && run(cmd, match.panel)}
                    style={itemStyle}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, marginRight: 8 }}>↑</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{cmd}</span>
                  </Command.Item>
                )
              })}
            </Command.Group>
          )}

          <Command.Group heading={
            <div style={{ padding: '8px 14px 2px', fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Modules
            </div>
          }>
            {MNEMONICS.map(m => (
              <Command.Item
                key={m.cmd}
                value={`${m.cmd} ${m.desc} ${m.tool}`}
                onSelect={() => run(m.cmd, m.panel)}
                style={itemStyle}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="mnemonic-badge" style={{ marginRight: 4 }}>{m.cmd}</span>
                <span style={{ flex: 1, color: 'var(--text-dim)', fontSize: 12 }}>{m.desc}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{m.tool}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}

const itemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '7px 14px', cursor: 'pointer',
  background: 'transparent', fontSize: 12,
  transition: 'background 0.1s',
}
