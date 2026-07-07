/**
 * CHAT — "Paralegal" conversational interface.
 *
 * A digital paralegal that answers in plain language and calls the underlying
 * legal-mcp tools (research, citation validation, contracts, brief outlines).
 * Structured results are rendered as inline cards with jump-to-module actions.
 *
 * Messages live in their own zustand store so the conversation survives
 * navigating away and back.
 */

import { useState, useRef, useEffect } from 'react'
import { Scale, ArrowUp, Search, FileText, Quote, PenTool } from 'lucide-react'
import { PanelChrome, RiskBadge } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import { useChatStore, type Attachment } from '../store/chatStore'
import type { Case, Statute, Contract, CitationResult, BriefOutline } from '../mcp/types'

/* ── Intent router — the paralegal "brain" ─────────────────────── */

const CITATION_RE = /\d+\s+(U\.?S\.?|F\.\d?d?|Cal\.?(App\.?)?\d*(st|nd|rd|th)?|S\.?Ct\.?|N\.?E\.?\d?d?|P\.\d?d?)\s*\d*/i

async function respond(input: string, push: ReturnType<typeof useChatStore.getState>['push']): Promise<void> {
  const q = input.toLowerCase()

  // Greetings / small talk
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q) && q.length < 40) {
    push({
      role: 'assistant',
      text: 'Good day. I\u2019m your paralegal assistant. I can research case law, validate citations, review contracts, assess privilege risk, and draft brief outlines. What matter are we working on?',
    })
    return
  }

  // Citation validation
  if (CITATION_RE.test(input) || /\b(cite|citation|bluebook)\b/.test(q)) {
    const m = input.match(CITATION_RE)
    const citation = m ? m[0] : input
    const result = await client.validateCitation(citation)
    push({
      role: 'assistant',
      text: result.valid
        ? `I checked "${citation}" — the citation is well-formed. Details below; you can open the full citation console for normalization and integrity checks.`
        : `I checked "${citation}" and it does not appear to be a valid citation format. Here is what I found:`,
      attachments: [{ kind: 'citation', result }],
    })
    return
  }

  // Brief outline
  if (/\b(brief|outline|motion|memorandum)\b/.test(q)) {
    const caseType =
      q.match(/motion (to|for) [a-z ]+?(?=\s+(based|on|regarding|because|for the)\b|[.,?]|$)/)?.[0]
      ?? (/(contract|employment|tort|jurisdiction)/.exec(q)?.[0] ?? 'motion')
    const outline = await client.generateBriefOutline(caseType, input)
    push({
      role: 'assistant',
      text: 'Here is a working outline based on the facts you gave me. Open the Brief Builder to refine sections and supporting authority.',
      attachments: [{ kind: 'brief', outline }],
    })
    return
  }

  // Research questions take priority over the contract-file intent —
  // "What is the standard for breach of contract?" is research, not a doc review.
  const isQuestion = /^(what|when|how|why|does|do|is|are|can|could|should|under what)\b/.test(q)

  // Contracts on file (doc review intent, not a legal question)
  if (!isQuestion && /\b(contracts?|nda|msa|dpa|baa|clause|agreement|indemn|liability cap)\b/.test(q)) {
    const contracts = await client.listContracts()
    push({
      role: 'assistant',
      text: `We have ${contracts.length} contract${contracts.length === 1 ? '' : 's'} on file. Select one to open it in the Contract Workbench, where I can flag risky clauses and suggest alternatives.`,
      attachments: [{ kind: 'contracts', contracts }],
    })
    return
  }

  // Privilege — route to MCP with document-aware assessment
  if (/\b(privilege|confidential|work.?product|chatgpt|claude|gemini|ai (tool|provider))\b/.test(q)) {
    const fileMatch = input.match(/[\w.-]+\.(docx|pdf|txt)/i)
    const file = fileMatch?.[0] ?? 'litigation_memo.docx'
    const provider = /claude|anthropic/i.test(q) ? 'anthropic'
      : /azure/i.test(q) ? 'azure_openai'
      : /ollama|local/i.test(q) ? 'ollama'
      : 'openai'
    const result = await client.checkPrivilegeRisk(file, provider)
    push({
      role: 'assistant',
      text: `Privilege assessment for "${file}" via ${provider}: ${result.risk} risk. ${result.recommendation}`,
    })
    return
  }

  // Default: full legal research
  const research = await client.researchLegalIssue(input)
  const atts: Attachment[] = []
  if (research.cases.length) atts.push({ kind: 'cases', cases: research.cases.slice(0, 4) })
  if (research.statutes.length) atts.push({ kind: 'statutes', statutes: research.statutes.slice(0, 3) })
  push({
    role: 'assistant',
    text: research.summary || `Here is what I found on "${input}". I\u2019ve pulled the most relevant authority below \u2014 open any item for the full analysis.`,
    attachments: atts.length ? atts : undefined,
  })
}

/* ── Attachment renderers ──────────────────────────────────────── */

function CaseCards({ cases }: { cases: Case[] }) {
  const { navigate } = useTerminalStore()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {cases.map(c => (
        <button key={c.id} onClick={() => navigate('PREC', { query: c.name })}
          style={cardStyle} title="Open in Precedent Search">
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 2 }}>
            {c.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>
            {c.citation} · {c.court} · {c.year}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{c.holding}</div>
        </button>
      ))}
    </div>
  )
}

function StatuteCards({ statutes }: { statutes: Statute[] }) {
  const { navigate } = useTerminalStore()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {statutes.map(s => (
        <button key={s.id} onClick={() => navigate('STAT', { statuteId: s.id })}
          style={cardStyle} title="Open in Statute Viewer">
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 2 }}>
            {s.title}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>{s.id}</div>
        </button>
      ))}
    </div>
  )
}

function CitationCard({ result }: { result: CitationResult }) {
  const { navigate } = useTerminalStore()
  return (
    <button onClick={() => navigate('CITE', { query: result.citation })} style={{ ...cardStyle, marginTop: 8 }} title="Open in Citation Console">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', padding: '1px 7px',
          color: result.valid ? 'var(--risk-low)' : 'var(--risk-critical)',
          border: `1px solid ${result.valid ? 'var(--risk-low)' : 'var(--risk-critical)'}`,
        }}>
          {result.valid ? 'VALID' : 'INVALID'}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-dim)' }}>{result.normalized || result.citation}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
        {result.reporter_name ? `${result.reporter_name} (${result.reporter})` : result.reporter}
        {' · '}integrity: {result.integrity}
        {result.issues.length > 0 && ` · ${result.issues.length} issue${result.issues.length === 1 ? '' : 's'}`}
      </div>
    </button>
  )
}

function ContractCards({ contracts }: { contracts: Contract[] }) {
  const { navigate } = useTerminalStore()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {contracts.map(c => (
        <button key={c.id} onClick={() => navigate('CTRX', { contractId: c.id })}
          style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }} title="Open in Contract Workbench">
          <RiskBadge risk={c.risk_level} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-heading)' }}>{c.title}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
              {c.id} · {c.clauses.length} clauses
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

function BriefCard({ outline }: { outline: BriefOutline }) {
  const { navigate } = useTerminalStore()
  return (
    <button onClick={() => navigate('BRF')} style={{ ...cardStyle, marginTop: 8 }} title="Open in Brief Builder">
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>
        {outline.case_type}
      </div>
      {outline.issue_statement && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 6, lineHeight: 1.5 }}>
          {outline.issue_statement}
        </div>
      )}
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.7 }}>
        {outline.sections.slice(0, 6).map((s, i) => <li key={i}>{s.title}</li>)}
      </ol>
    </button>
  )
}

const cardStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  background: 'var(--bg-panel2)', border: '1px solid var(--border)',
  padding: '10px 12px', cursor: 'pointer', fontFamily: 'inherit',
  color: 'var(--text)', transition: 'border-color 0.15s',
}

function renderAttachment(a: Attachment, i: number) {
  switch (a.kind) {
    case 'cases': return <CaseCards key={i} cases={a.cases} />
    case 'statutes': return <StatuteCards key={i} statutes={a.statutes} />
    case 'citation': return <CitationCard key={i} result={a.result} />
    case 'contracts': return <ContractCards key={i} contracts={a.contracts} />
    case 'brief': return <BriefCard key={i} outline={a.outline} />
  }
}

/* ── Suggested prompts (empty state) ───────────────────────────── */

const SUGGESTIONS = [
  { icon: <Search size={13} />, label: 'Research an issue', prompt: 'What is the standard for anticipatory breach of contract?' },
  { icon: <Quote size={13} />, label: 'Check a citation', prompt: 'Validate 2022 Cal.App.4th 1234' },
  { icon: <FileText size={13} />, label: 'Review contracts', prompt: 'Which of our contracts have high-risk clauses?' },
  { icon: <PenTool size={13} />, label: 'Draft an outline', prompt: 'Draft a brief outline for a motion to dismiss based on lack of personal jurisdiction' },
]

/* ── Main panel ────────────────────────────────────────────────── */

export function ChatPanel({ id }: { id: string }) {
  const { messages, thinking, push, setThinking, clear, consumePendingPrompt } = useChatStore()
  const { pushActivity } = useTerminalStore()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || thinking) return
    setInput('')
    push({ role: 'user', text: msg })
    setThinking(true)
    // Small delay so the thinking indicator is visible even with instant mock responses
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500))
    try {
      await respond(msg, push)
      pushActivity(`Paralegal answered: "${msg.slice(0, 48)}${msg.length > 48 ? '…' : ''}"`)
    } catch (err) {
      push({ role: 'assistant', text: `I ran into a problem handling that request: ${err instanceof Error ? err.message : String(err)}. If you are in live mode, check that the legal-mcp server is running.` })
    }
    setThinking(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    const pending = consumePendingPrompt()
    if (pending && !thinking) send(pending)
  }, [id])

  return (
    <PanelChrome id={id} mnemonic="CHAT" title="Paralegal" subtitle="conversational assistant · research_legal_issue" panelType="CHAT"
      actions={messages.length > 0 ? (
        <button onClick={clear} className="btn" style={{ fontSize: 10 }}>New conversation</button>
      ) : undefined}
    >
      {/* Conversation */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
        <div className="chat-content-column">

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: '8vh' }}>
              <div style={{
                width: 52, height: 52, margin: '0 auto 16px', borderRadius: '50%',
                border: '1px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', background: 'var(--bg-panel2)',
              }}>
                <Scale size={24} />
              </div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>
                How can I assist with your matter?
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
                I can research case law, validate citations, review contracts,<br />
                assess privilege risk, and draft brief outlines.
              </div>
              <div className="chat-suggestions-grid">
                {SUGGESTIONS.map(s => (
                  <button key={s.label} onClick={() => send(s.prompt)}
                    style={{ ...cardStyle, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px' }}>
                    <span style={{ color: 'var(--accent)', marginTop: 1 }}>{s.icon}</span>
                    <span>
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 3 }}>{s.label}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.prompt}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(m => m.role === 'user' ? (
            <div key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
              <div style={{
                background: 'var(--accent-faint)', border: '1px solid var(--accent-dim)',
                padding: '9px 14px', fontSize: 13, color: 'var(--text-heading)', lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} style={{ display: 'flex', gap: 12, maxWidth: '92%' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                border: '1px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', background: 'var(--bg-panel2)',
              }}>
                <Scale size={14} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>
                  Paralegal
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {m.text}
                </div>
                {m.attachments?.map(renderAttachment)}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                border: '1px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', background: 'var(--bg-panel2)',
              }}>
                <Scale size={14} />
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                <span className="chat-dot" /><span className="chat-dot" style={{ animationDelay: '0.15s' }} /><span className="chat-dot" style={{ animationDelay: '0.3s' }} />
                <span style={{ marginLeft: 6, fontStyle: 'italic' }}>reviewing…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 24px', flexShrink: 0 }}>
        <div style={{
          maxWidth: 760, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'flex-end',
          background: 'var(--bg-panel2)', border: '1px solid var(--border-bright)', padding: '8px 8px 8px 14px',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            placeholder="Ask about case law, a citation, a contract… (Enter to send, Shift+Enter for a new line)"
            rows={Math.min(4, Math.max(1, input.split('\n').length))}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              color: 'var(--text-heading)', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6,
            }}
            spellCheck={false}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || thinking}
            style={{
              width: 30, height: 30, flexShrink: 0, cursor: input.trim() && !thinking ? 'pointer' : 'default',
              background: input.trim() && !thinking ? 'var(--accent)' : 'var(--bg-panel)',
              border: '1px solid ' + (input.trim() && !thinking ? 'var(--accent)' : 'var(--border)'),
              color: input.trim() && !thinking ? 'var(--bg)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            title="Send (Enter)"
          >
            <ArrowUp size={15} />
          </button>
        </div>
        <div style={{ maxWidth: 760, margin: '6px auto 0', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
          Responses are drawn from the connected legal-mcp tools. Verify all authority before filing.
        </div>
      </div>
    </PanelChrome>
  )
}
