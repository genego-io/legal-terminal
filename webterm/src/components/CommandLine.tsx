import { useState, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Menu } from 'lucide-react'
import { useTerminalStore } from '../store/terminalStore'
import type { ViewType } from '../store/terminalStore'
import { useViewport } from '../hooks/useViewport'

export const MNEMONICS: { cmd: string; panel: ViewType; desc: string; tool: string }[] = [
  { cmd: 'CHAT', panel: 'CHAT', desc: 'Paralegal assistant',        tool: 'research_legal_issue' },
  { cmd: 'PREC', panel: 'PREC', desc: 'Precedent & case search',   tool: 'search_precedents' },
  { cmd: 'CASE', panel: 'CASE', desc: 'Case law research',          tool: 'search_case_law' },
  { cmd: 'STAT', panel: 'STAT', desc: 'Statute viewer',             tool: 'extract_statute' },
  { cmd: 'CITE', panel: 'CITE', desc: 'Citation console',           tool: 'validate_citation' },
  { cmd: 'CTRX', panel: 'CTRX', desc: 'Contract workbench',         tool: 'analyze_clauses' },
  { cmd: 'DOCA', panel: 'DOCA', desc: 'Document analyzer',          tool: 'analyze_document' },
  { cmd: 'PRIV', panel: 'PRIV', desc: 'Privilege risk check',       tool: 'check_privilege_risk' },
  { cmd: 'BRF',  panel: 'BRF',  desc: 'Brief builder',              tool: 'generate_brief_outline' },
  { cmd: 'JOBS', panel: 'JOBS', desc: 'Analysis queue',             tool: 'list_analysis_jobs' },
  { cmd: 'LIVE', panel: 'LIVE', desc: 'Integration status',         tool: 'integration_status' },
  { cmd: 'WKFL', panel: 'WKFL', desc: 'Workflows & builder',        tool: 'skill_playbooks' },
  { cmd: 'AUTM', panel: 'AUTM', desc: 'Automations scheduler',    tool: 'automations' },
  { cmd: 'TRIG', panel: 'TRIG', desc: 'Triggers & paralegal inbox', tool: 'inbox_triggers' },
  { cmd: 'AUDT', panel: 'AUDT', desc: 'Audit log',                  tool: 'utils.audit' },
  { cmd: 'WTCH', panel: 'WTCH', desc: 'Docket Watch — entity monitoring', tool: 'pacer.docket_watch' },
  { cmd: 'CONF', panel: 'CONF', desc: 'Privacy settings',           tool: 'confidential_mode' },
]

function parseCommand(raw: string): { panel: ViewType | null; query: string } {
  const parts = raw.trim().toUpperCase().split(/\s+/)
  const match = MNEMONICS.find(m => m.cmd === parts[0])
  if (!match) return { panel: null, query: raw }
  return { panel: match.panel, query: parts.slice(1).join(' ').toLowerCase() }
}

interface Props {
  onOpenPalette?: () => void
}

export function CommandLine({ onOpenPalette }: Props) {
  const [value, setValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { navigate, pushCommand, sidebarCollapsed, setSidebarCollapsed } = useTerminalStore()
  const { isTablet, isCompact } = useViewport()

  const suggestions = value
    ? MNEMONICS.filter(m =>
        m.cmd.startsWith(value.toUpperCase().split(' ')[0]) ||
        m.desc.toLowerCase().includes(value.toLowerCase())
      )
    : []

  function execute(raw?: string) {
    const cmd = (raw ?? value).trim()
    if (!cmd) return
    pushCommand(cmd)
    const { panel, query } = parseCommand(cmd)
    if (panel) navigate(panel, { query: query || undefined })
    setValue('')
    setShowSuggestions(false)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') execute()
    if (e.key === 'Escape') { setValue(''); setShowSuggestions(false) }
    if (e.key === 'Tab' && suggestions.length) {
      e.preventDefault()
      setValue(suggestions[0].cmd + ' ')
    }
  }

  return (
    <div className="command-line-root">
      {showSuggestions && suggestions.length > 0 && (
        <div className="command-suggestions">
          {suggestions.map(s => (
            <button
              key={s.cmd}
              onClick={() => execute(s.cmd)}
              className="command-suggestion"
            >
              <span className="mnemonic-badge">{s.cmd}</span>
              <span style={{ flex: 1, color: 'var(--text-dim)' }}>{s.desc}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>{s.tool}</span>
            </button>
          ))}
        </div>
      )}

      <div className="command-row">
        {isCompact && sidebarCollapsed && (
          <button
            type="button"
            className="sidebar-menu-btn"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Open navigation menu"
          >
            <Menu size={16} />
          </button>
        )}
        <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>›</span>
        <input
          ref={inputRef}
          className="term-input"
          value={value}
          onChange={e => { setValue(e.target.value); setShowSuggestions(true) }}
          onKeyDown={onKey}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => value && setShowSuggestions(true)}
          placeholder={isTablet ? 'PREC breach · CITE citation · Tab to complete' : 'PREC breach of contract  ·  CITE 2022 Cal.App.4th 1234  ·  Tab to complete'}
          spellCheck={false}
          autoComplete="off"
        />
        {onOpenPalette && (
          <button
            onClick={onOpenPalette}
            title="Open command palette (Ctrl+K)"
            className="cmd-kbd-hint"
          >
            {isTablet ? (
              <span>⌘K</span>
            ) : (
              <>
                <span className="cmd-kbd-text">Ctrl</span>
                <span style={{ opacity: 0.5 }}>+</span>
                <span className="cmd-kbd-text">K</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
