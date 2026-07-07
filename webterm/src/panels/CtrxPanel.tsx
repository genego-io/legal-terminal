import { useState, useEffect } from 'react'
import { PanelChrome, RiskBadge, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import type { Contract, ContractClause } from '../mcp/types'

interface Props { id: string; contractId?: string }
type View = 'analyze' | 'compare' | 'negotiate'

const CONTRACTS = [
  { id: 'standard_nda_template', label: 'Standard NDA' },
  { id: 'client_proposed_nda', label: 'Client NDA (Proposed)' },
  { id: 'master_services_agreement_tech', label: 'Tech MSA' },
]

function btn(active: boolean) {
  return {
    background: active ? 'var(--bg-selected)' : 'transparent',
    border: '1px solid ' + (active ? 'var(--accent-dim)' : 'var(--border)'),
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
    padding: '3px 10px', cursor: 'pointer',
  } as const
}

export function CtrxPanel({ id, contractId: initial }: Props) {
  const [view, setView] = useState<View>('analyze')
  const [contractId, setContractId] = useState(initial ?? 'client_proposed_nda')
  const [compareId, setCompareId] = useState('standard_nda_template')
  const [contract, setContract] = useState<Contract | null>(null)
  const [selectedClause, setSelectedClause] = useState<ContractClause | null>(null)
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [negotiationRole, setNegotiationRole] = useState<'buyer' | 'seller' | 'mutual'>('buyer')
  const [negotiation, setNegotiation] = useState<Awaited<ReturnType<typeof client.generateNegotiationGuide>> | null>(null)
  const [diffs, setDiffs] = useState<{ key: string; change: string }[]>([])

  async function loadContract(cid = contractId) {
    setLoading(true)
    const c = await client.analyzeContract(cid)
    setContract(c)
    if (c?.clauses.length) setSelectedClause(c.clauses[0])
    setLoading(false)
  }

  async function loadAlts(clause: ContractClause) {
    const alts = await client.suggestAlternatives(clause.text, clause.key)
    setAlternatives(alts)
  }

  async function loadNegotiation() {
    setLoading(true)
    const guide = await client.generateNegotiationGuide(contractId, negotiationRole)
    setNegotiation(guide); setLoading(false)
  }

  async function loadCompare() {
    setLoading(true)
    const { diffs: d } = await client.compareContracts(contractId, compareId)
    setDiffs(d); setLoading(false)
  }

  useEffect(() => { loadContract() }, [])
  useEffect(() => { if (selectedClause) loadAlts(selectedClause) }, [selectedClause])

  const riskOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const sortedClauses = contract?.clauses.slice().sort((a, b) => riskOrder.indexOf(a.risk) - riskOrder.indexOf(b.risk)) ?? []

  const positionColor: Record<string, string> = {
    reject: 'var(--risk-critical)', negotiate: 'var(--risk-high)', accept: 'var(--risk-low)',
  }

  return (
    <PanelChrome id={id} mnemonic="CTRX" title="Contract Workbench" subtitle="analyze · compare · negotiate">
      {/* Contract selector */}
      <div style={{ display: 'flex', gap: 4, padding: '6px 10px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {CONTRACTS.map(c => (
          <button key={c.id} onClick={() => { setContractId(c.id); loadContract(c.id) }}
            style={btn(contractId === c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* View tabs */}
      <div className="tab-bar">
        {(['analyze', 'compare', 'negotiate'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)} className={`tab-btn ${view === v ? 'active' : ''}`}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {loading && <LoadingDots />}

      {/* ANALYZE */}
      {view === 'analyze' && !loading && contract && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: 230, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '6px 12px 5px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>{contract.title}</span>
              <RiskBadge risk={contract.risk_level} />
            </div>
            {sortedClauses.map(cl => (
              <button key={cl.key} onClick={() => setSelectedClause(cl)} style={{
                display: 'flex', gap: 8, alignItems: 'center', width: '100%', padding: '7px 12px',
                background: selectedClause?.key === cl.key ? 'var(--bg-selected)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
              }}>
                <RiskBadge risk={cl.risk} />
                <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{cl.label}</span>
              </button>
            ))}
            {contract.missing_clauses.length > 0 && (
              <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-bright)' }}>
                <div className="section-label" style={{ marginBottom: 6 }}>Missing clauses</div>
                {contract.missing_clauses.map(m => (
                  <div key={m} style={{ color: 'var(--risk-medium)', fontSize: 11, marginBottom: 3 }}>
                    · {m.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="info-pane">
            {selectedClause && (
              <>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <RiskBadge risk={selectedClause.risk} />
                  <span style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: 13 }}>{selectedClause.label}</span>
                </div>
                <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.7, background: 'var(--bg)', padding: '10px 14px', border: '1px solid var(--border)', marginBottom: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {selectedClause.text}
                </div>
                <div style={{ color: 'var(--risk-high)', fontSize: 12, marginBottom: 14, display: 'flex', gap: 8 }}>
                  <span>↳</span><span>{selectedClause.risk_note}</span>
                </div>
                {alternatives.length > 0 && (
                  <>
                    <div className="section-label">Suggested alternatives</div>
                    {alternatives.map((alt, i) => (
                      <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', marginBottom: 6, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 10, marginRight: 8 }}>Alt {i + 1}</span>
                        {alt}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* COMPARE */}
      {view === 'compare' && !loading && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="info-pane">
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Base:</span>
            <select value={contractId} onChange={e => setContractId(e.target.value)}
              style={{ background: 'var(--bg-panel2)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, padding: '4px 8px' }}>
              {CONTRACTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>vs.</span>
            <select value={compareId} onChange={e => setCompareId(e.target.value)}
              style={{ background: 'var(--bg-panel2)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 11, padding: '4px 8px' }}>
              {CONTRACTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={loadCompare} className="btn-primary">Compare</button>
          </div>
          {diffs.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select two contracts and press Compare.</div>}
          {diffs.map(d => (
            <div key={d.key} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 600, marginBottom: 3 }}>{d.key.replace(/_/g, ' ')}</div>
              <div style={{ color: 'var(--risk-high)', fontSize: 12 }}>↳ {d.change}</div>
            </div>
          ))}
        </div>
      )}

      {/* NEGOTIATE */}
      {view === 'negotiate' && !loading && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="info-pane">
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Party role:</span>
            {(['buyer', 'seller', 'mutual'] as const).map(r => (
              <button key={r} onClick={() => setNegotiationRole(r)} style={btn(negotiationRole === r)}>
                {r}
              </button>
            ))}
            <button onClick={loadNegotiation} className="btn-primary" style={{ marginLeft: 8 }}>Generate</button>
          </div>
          {negotiation && (
            <>
              {negotiation.clauses.map(cl => (
                <div key={cl.key} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      color: positionColor[cl.recommended_position] ?? 'var(--text-muted)',
                      fontWeight: 600, fontSize: 11,
                    }}>
                      {cl.recommended_position.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>{cl.label}</span>
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 4 }}>{cl.rationale}</div>
                  {cl.recommended_position !== 'accept' && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', paddingLeft: 8 }}>{cl.fallback_text}</div>
                  )}
                </div>
              ))}
              {negotiation.missing_clauses.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="section-label">Missing clauses</div>
                  {negotiation.missing_clauses.map(m => (
                    <div key={m} style={{ color: 'var(--risk-medium)', fontSize: 11 }}>· {m}</div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 11, borderTop: '1px solid var(--border)', paddingTop: 10 }}>{negotiation.notice}</div>
            </>
          )}
          {!negotiation && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a party role and press Generate.</div>}
        </div>
      )}
    </PanelChrome>
  )
}
