import { useState, useEffect, useCallback } from 'react'
import { PanelChrome, RiskBadge, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import { CONTRACT_PICKER } from '../fixtureMeta'
import type { Contract, ContractClause } from '../mcp/types'

interface Props { id: string; contractId?: string }
type View = 'analyze' | 'compare' | 'negotiate'

const RISK_DOT: Record<string, string> = {
  CRITICAL: 'var(--risk-critical)',
  HIGH: 'var(--risk-high)',
  MEDIUM: 'var(--risk-medium)',
  LOW: 'var(--risk-low)',
}

function selBtn(active: boolean): React.CSSProperties {
  return {
    background: active ? 'var(--bg-selected)' : 'transparent',
    border: '1px solid ' + (active ? 'var(--accent-dim)' : 'var(--border)'),
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
    padding: '4px 12px', cursor: 'pointer',
  }
}

function ContractBanner({ contract }: { contract: Contract }) {
  const parties = Object.values(contract.parties).join(' / ')
  return (
    <div className="ctrx-banner">
      <div className="ctrx-banner-label">
        <span className="section-label">Viewing</span>
      </div>
      <div className="ctrx-banner-body">
        <div className="ctrx-banner-title">{contract.title}</div>
        <div className="ctrx-banner-meta">
          <span className="tag">{contract.type}</span>
          <RiskBadge risk={contract.risk_level} />
          <span>{parties}</span>
          <span>·</span>
          <span>{contract.governing_law}</span>
          <span>·</span>
          <span>{contract.term}</span>
        </div>
      </div>
    </div>
  )
}

export function CtrxPanel({ id, contractId: initial }: Props) {
  const [view, setView] = useState<View>('analyze')
  const [contractId, setContractId] = useState(initial ?? 'standard_nda_template')
  const [compareId, setCompareId] = useState('client_proposed_nda')
  const [contract, setContract] = useState<Contract | null>(null)
  const [contractError, setContractError] = useState<string | null>(null)
  const [selectedClause, setSelectedClause] = useState<ContractClause | null>(null)
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [negotiationRole, setNegotiationRole] = useState<'buyer' | 'seller' | 'mutual'>('buyer')
  const [negotiation, setNegotiation] = useState<Awaited<ReturnType<typeof client.generateNegotiationGuide>> | null>(null)
  const [diffs, setDiffs] = useState<{ key: string; change: string }[]>([])
  const { pushActivity } = useTerminalStore()

  const activePicker = CONTRACT_PICKER.find(c => c.id === contractId)

  async function loadContract(cid = contractId) {
    setLoading(true)
    setContractError(null)
    const c = await client.analyzeContract(cid)
    if (!c) {
      setContract(null)
      setSelectedClause(null)
      setContractError(`Contract "${cid}" not found in the library.`)
    } else {
      setContract(c)
      if (c.clauses.length) setSelectedClause(c.clauses[0])
    }
    setLoading(false)
    if (c) pushActivity(`CTRX analyze "${cid}"`)
  }

  async function loadAlts(clause: ContractClause) {
    const alts = await client.suggestAlternatives(clause.text, clause.key)
    setAlternatives(alts)
  }

  const loadNegotiation = useCallback(async () => {
    setLoading(true)
    const guide = await client.generateNegotiationGuide(contractId, negotiationRole)
    setNegotiation(guide)
    setLoading(false)
    pushActivity(`CTRX negotiate "${contractId}" as ${negotiationRole}`)
  }, [contractId, negotiationRole, pushActivity])

  async function loadCompare() {
    setLoading(true)
    const { diffs: d } = await client.compareContracts(contractId, compareId)
    setDiffs(d)
    setLoading(false)
    pushActivity(`CTRX compare "${contractId}" vs "${compareId}"`)
  }

  useEffect(() => { loadContract() }, [])
  useEffect(() => { if (selectedClause) loadAlts(selectedClause) }, [selectedClause])

  useEffect(() => {
    if (view === 'negotiate' && negotiation) loadNegotiation()
  }, [negotiationRole])

  const riskOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const sortedClauses = contract?.clauses.slice().sort((a, b) => riskOrder.indexOf(a.risk) - riskOrder.indexOf(b.risk)) ?? []

  const positionColor: Record<string, string> = {
    reject: 'var(--risk-critical)', negotiate: 'var(--risk-high)', accept: 'var(--risk-low)',
  }

  return (
    <PanelChrome id={id} mnemonic="CTRX" title="Contract Workbench" subtitle="analyze · compare · negotiate" panelType="CTRX">
      <div className="ctrx-library">
        <div className="ctrx-library-header">
          <span className="section-label">Fixture library</span>
          <span className="ctrx-library-count">({CONTRACT_PICKER.length} sample agreements)</span>
        </div>
        <div className="ctrx-chips">
          {CONTRACT_PICKER.map(c => {
            const active = contractId === c.id
            return (
              <button
                key={c.id}
                type="button"
                className={`ctrx-chip${active ? ' active' : ''}`}
                onClick={() => { setContractId(c.id); loadContract(c.id) }}
              >
                <span className="ctrx-chip-type">{c.type}</span>
                <span className="ctrx-chip-dot" style={{ background: RISK_DOT[c.risk_level] }} />
                <span>{c.label}</span>
                {active && <span className="ctrx-chip-viewing">Viewing</span>}
              </button>
            )
          })}
        </div>
      </div>

      {contract && !contractError && <ContractBanner contract={contract} />}

      <div className="tab-bar">
        {(['analyze', 'compare', 'negotiate'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)} className={`tab-btn ${view === v ? 'active' : ''}`}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {loading && <LoadingDots />}

      {contractError && !loading && (
        <div style={{ padding: '20px 24px', color: 'var(--risk-critical)', fontSize: 12 }}>{contractError}</div>
      )}

      {view === 'analyze' && !loading && contract && (
        <div className="panel-split">
          <div className="panel-split-list panel-split-list--narrow">
            <div className="ctrx-clause-header">
              <span className="ctrx-clause-header-title">Clauses ({contract.clauses.length})</span>
              <RiskBadge risk={contract.risk_level} />
            </div>
            {sortedClauses.map(cl => (
              <button key={cl.key} onClick={() => setSelectedClause(cl)} style={{
                display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '8px 12px',
                background: selectedClause?.key === cl.key ? 'var(--bg-selected)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
              }}>
                <RiskBadge risk={cl.risk} />
                <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{cl.label}</span>
              </button>
            ))}
            {contract.missing_clauses.length > 0 && (
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
                <div className="section-label" style={{ marginBottom: 6 }}>Missing clauses</div>
                {contract.missing_clauses.map(m => (
                  <div key={m} style={{ color: 'var(--risk-medium)', fontSize: 11, marginBottom: 4 }}>
                    · {m.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel-split-detail info-pane" style={{ padding: '20px 24px' }}>
            {selectedClause ? (
              <>
                <div className="ctrx-breadcrumb">
                  <strong>{activePicker?.label ?? contractId}</strong> › {selectedClause.label}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                  <RiskBadge risk={selectedClause.risk} />
                  <span style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: 14 }}>{selectedClause.label}</span>
                </div>
                <div className="section-label">Clause text</div>
                <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.75, background: 'var(--bg)', padding: '12px 16px', border: '1px solid var(--border)', marginBottom: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {selectedClause.text}
                </div>
                <div style={{ color: 'var(--risk-high)', fontSize: 12, marginBottom: 20, display: 'flex', gap: 8 }}>
                  <span>↳</span><span>{selectedClause.risk_note}</span>
                </div>
                {alternatives.length > 0 && (
                  <>
                    <div className="section-label">Suggested alternatives</div>
                    {alternatives.map((alt, i) => (
                      <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px 14px', marginBottom: 8, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Alt {i + 1}</div>
                        {alt}
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a clause from the list.</div>
            )}
          </div>
        </div>
      )}

      {view === 'compare' && !loading && (
        <div className="panel-split-detail info-pane" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>Contract A</span>
            <select value={contractId} onChange={e => setContractId(e.target.value)}
              style={{ background: 'var(--bg-panel2)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 12, padding: '5px 10px' }}>
              {CONTRACT_PICKER.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>Contract B</span>
            <select value={compareId} onChange={e => setCompareId(e.target.value)}
              style={{ background: 'var(--bg-panel2)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 12, padding: '5px 10px' }}>
              {CONTRACT_PICKER.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={loadCompare} className="btn-primary">Compare</button>
          </div>
          {diffs.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select two contracts and press Compare.</div>}
          {diffs.map(d => (
            <div key={d.key} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{d.key.replace(/_/g, ' ')}</div>
              <div style={{ color: 'var(--risk-high)', fontSize: 12 }}>↳ {d.change}</div>
            </div>
          ))}
        </div>
      )}

      {view === 'negotiate' && !loading && (
        <div className="panel-split-detail info-pane" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>Your role</span>
            {(['buyer', 'seller', 'mutual'] as const).map(r => (
              <button key={r} onClick={() => setNegotiationRole(r)} style={selBtn(negotiationRole === r)}>{r}</button>
            ))}
            <button onClick={loadNegotiation} className="btn-primary" style={{ marginLeft: 6 }}>Generate guide</button>
          </div>
          {!negotiation && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a party role and press Generate guide.</div>}
          {negotiation && (
            <>
              {negotiation.clauses.map(cl => (
                <div key={cl.key} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ color: positionColor[cl.recommended_position] ?? 'var(--text-muted)', fontWeight: 700, fontSize: 11, minWidth: 70 }}>
                      {cl.recommended_position.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{cl.label}</span>
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 4, paddingLeft: 80 }}>{cl.rationale}</div>
                  {cl.recommended_position !== 'accept' && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', paddingLeft: 80 }}>{cl.fallback_text}</div>
                  )}
                </div>
              ))}
              {negotiation.missing_clauses.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="section-label">Missing clauses</div>
                  {negotiation.missing_clauses.map(m => (
                    <div key={m} style={{ color: 'var(--risk-medium)', fontSize: 12 }}>· {m}</div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>{negotiation.notice}</div>
            </>
          )}
        </div>
      )}
    </PanelChrome>
  )
}
