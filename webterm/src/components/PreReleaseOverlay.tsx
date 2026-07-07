/**
 * One-time welcome overlay on first visit (per release version).
 * Dismissed state is stored in localStorage.
 */
import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'

export const RELEASE_VERSION = '0.2.0-pre.3'
const STORAGE_KEY = `legal-term-welcome-${RELEASE_VERSION}`

const LINKS = [
  {
    label: 'Legal Terminal',
    href: 'https://github.com/genego-io/legal-terminal',
    desc: 'This showcase UI — web terminal & TUI',
  },
  {
    label: 'legal-mcp',
    href: 'https://github.com/agentic-ops/legal-mcp',
    desc: 'MCP server powering research, contracts & citations',
  },
] as const

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function PreReleaseOverlay() {
  const [visible, setVisible] = useState(() => !wasDismissed())

  useEffect(() => {
    if (!visible) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* storage unavailable */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prerelease-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'var(--overlay)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--bg-panel)', border: '1px solid var(--border-bright)',
        boxShadow: '0 24px 64px var(--shadow-lg)',
      }}>
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--accent)', background: 'var(--accent-faint)',
            border: '1px solid var(--accent-dim)', padding: '2px 8px', marginBottom: 14,
          }}>
            Pre-release · v{RELEASE_VERSION}
          </div>
          <h2
            id="prerelease-title"
            className="legal"
            style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.2 }}
          >
            Legal Terminal
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.65 }}>
            This is an early MVP — a Bloomberg-style terminal showcase built on top of{' '}
            <strong style={{ color: 'var(--text-heading)', fontWeight: 600 }}>legal-mcp</strong>.
            Mock fixtures run by default; live MCP is optional. Not production-ready — interfaces,
            integrations, and coverage are still evolving.
          </p>
        </div>

        <div style={{ padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="section-label" style={{ marginBottom: 2 }}>Source repositories</div>
          {LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', textDecoration: 'none',
                background: 'var(--bg-panel2)', border: '1px solid var(--border)',
                color: 'var(--text-heading)', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-dim)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <ExternalLink size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>{link.label}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {link.desc}
                </span>
              </span>
            </a>
          ))}
        </div>

        <div style={{
          padding: '14px 28px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Esc to dismiss
          </span>
          <button type="button" className="btn-primary" onClick={dismiss} style={{ padding: '8px 20px', fontSize: 12 }}>
            Enter terminal
          </button>
        </div>
      </div>
    </div>
  )
}
