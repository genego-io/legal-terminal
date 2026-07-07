/**
 * WTCH — Docket Watch
 *
 * "Under consideration" feature panel. Shows the full product pitch,
 * a mock watch list, and a roadmap callout. No backend calls are made.
 */

import { useState } from 'react'
import { Radar, Bell, Plus, Trash2, Rss, Mail, Globe, Clock } from 'lucide-react'
import { PanelChrome } from '../components/PanelChrome'

interface WatchedEntity {
  id: string
  name: string
  type: 'company' | 'person' | 'matter'
  addedOn: string
  lastChecked: string
  newCases: number
  status: 'active' | 'paused'
}

const MOCK_ENTITIES: WatchedEntity[] = [
  { id: 'w1', name: 'Acme Technologies Corp.',  type: 'company', addedOn: '2026-01-12', lastChecked: 'Tonight', newCases: 0, status: 'active' },
  { id: 'w2', name: 'John Harrington',           type: 'person',  addedOn: '2026-02-03', lastChecked: 'Tonight', newCases: 2, status: 'active' },
  { id: 'w3', name: 'Pacific Logistics Ltd.',    type: 'company', addedOn: '2026-03-28', lastChecked: 'Tonight', newCases: 0, status: 'paused' },
]

const HOW_IT_WORKS = [
  {
    icon: <Plus size={18} />,
    title: 'Add a watched entity',
    body: 'Designate any company, individual, or matter number. Docket Watch indexes against PACER party records — plaintiff and defendant both.',
  },
  {
    icon: <Rss size={18} />,
    title: 'Nightly PACER scan',
    body: 'Each night we query federal court dockets across all 94 district courts for new filings matching your entity list. Real case data, not scraped headlines.',
  },
  {
    icon: <Bell size={18} />,
    title: 'Instant alert',
    body: 'New filing? You get an email the next morning — and a webhook POST if you\'ve configured one. Each alert links directly to the PACER case page.',
  },
]

const ALERT_CHANNELS = [
  { icon: <Mail size={14} />, label: 'Email digest', soon: false },
  { icon: <Globe size={14} />, label: 'Webhook (POST)', soon: false },
  { icon: <Rss size={14} />,  label: 'RSS feed', soon: true },
  { icon: <Bell size={14} />, label: 'In-app notification', soon: true },
]

export function DktwPanel({ id }: { id: string }) {
  const [entities, setEntities] = useState<WatchedEntity[]>(MOCK_ENTITIES)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<WatchedEntity['type']>('company')
  const [interested, setInterested] = useState(false)

  function addEntity() {
    if (!newName.trim()) return
    const e: WatchedEntity = {
      id: `w${Date.now()}`,
      name: newName.trim(),
      type: newType,
      addedOn: new Date().toISOString().split('T')[0],
      lastChecked: 'Pending',
      newCases: 0,
      status: 'active',
    }
    setEntities(prev => [e, ...prev])
    setNewName('')
  }

  function remove(id: string) {
    setEntities(prev => prev.filter(e => e.id !== id))
  }

  function toggleStatus(eid: string) {
    setEntities(prev => prev.map(e =>
      e.id === eid ? { ...e, status: e.status === 'active' ? 'paused' : 'active' } : e
    ))
  }

  return (
    <PanelChrome id={id} mnemonic="WTCH" title="Docket Watch" subtitle="entity monitoring · PACER federal dockets" panelType="WTCH">
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* ── Under consideration banner ───────────────────── */}
        <div style={{
          margin: '16px 20px 0',
          padding: '10px 14px',
          background: 'var(--confidential-faint)',
          border: '1px solid var(--confidential-border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Clock size={13} style={{ color: 'var(--risk-medium)', flexShrink: 0 }} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--risk-medium)', fontWeight: 700 }}>Under consideration</strong>
            {' '}— Docket Watch is on the roadmap pending PACER API access and production
            infrastructure. The watch list below is a preview mockup. Vote it up to move it higher.
          </div>
          <button
            onClick={() => setInterested(true)}
            disabled={interested}
            style={{
              flexShrink: 0, fontSize: 10, padding: '3px 10px',
              background: interested ? 'var(--confidential-strong)' : 'transparent',
              border: `1px solid ${interested ? 'var(--risk-medium)' : 'var(--border-bright)'}`,
              color: interested ? 'var(--risk-medium)' : 'var(--text-muted)', cursor: interested ? 'default' : 'pointer',
            }}
          >
            {interested ? '✓ Noted' : '▲ I want this'}
          </button>
        </div>

        {/* ── Pitch ─────────────────────────────────────────── */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, border: '1px solid var(--border-bright)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', background: 'var(--bg-panel2)', flexShrink: 0,
            }}>
              <Radar size={20} />
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '0.01em' }}>
                Docket Watch
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Continuous federal litigation monitoring for entities you designate
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.75, maxWidth: 680, marginBottom: 20 }}>
            A party search answers "what's out there right now?" Docket Watch answers "tell me the moment something new appears."
            Add any company or individual to your watch list and we'll check federal dockets every night using live PACER data.
            When a new case is filed — whether they're the plaintiff or the defendant — you get an alert before your morning coffee.
          </p>

          {/* How it works */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{ background: 'var(--bg-panel2)', border: '1px solid var(--border)', padding: '14px 16px' }}>
                <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{step.icon}</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.body}</div>
              </div>
            ))}
          </div>

          {/* Alert channels */}
          <div style={{ marginBottom: 24 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Alert channels</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ALERT_CHANNELS.map(ch => (
                <div key={ch.label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--bg-panel2)', border: '1px solid var(--border)',
                  padding: '4px 12px', fontSize: 11,
                  color: ch.soon ? 'var(--text-muted)' : 'var(--text-dim)',
                  opacity: ch.soon ? 0.6 : 1,
                }}>
                  <span style={{ color: ch.soon ? 'var(--text-muted)' : 'var(--accent)' }}>{ch.icon}</span>
                  {ch.label}
                  {ch.soon && <span style={{ fontSize: 9, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>SOON</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Mock watch list ───────────────────────────────── */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Watch list preview <span style={{ fontStyle: 'italic', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' }}>(mockup — not persisted)</span></div>

          {/* Add entity row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as WatchedEntity['type'])}
              style={{
                background: 'var(--bg-panel2)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: 11, padding: '4px 8px',
                fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <option value="company">Company</option>
              <option value="person">Person</option>
              <option value="matter">Matter #</option>
            </select>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEntity()}
              placeholder="Entity name or matter number…"
              className="field-input"
              style={{ flex: 1 }}
            />
            <button onClick={addEntity} className="btn-primary" style={{ flexShrink: 0 }}>
              <Plus size={12} style={{ display: 'inline', marginRight: 4 }} />
              Watch
            </button>
          </div>

          {/* Entity table */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Type</th>
                <th>Added</th>
                <th>Next check</th>
                <th style={{ textAlign: 'center' }}>New cases</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entities.map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-heading)' }}>{e.name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' }}>{e.type}</td>
                  <td className="mono-cell">{e.addedOn}</td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 11 }}>{e.lastChecked}</td>
                  <td style={{ textAlign: 'center' }}>
                    {e.newCases > 0
                      ? <span style={{ color: 'var(--risk-critical)', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 12 }}>{e.newCases}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                  <td>
                    <button
                      onClick={() => toggleStatus(e.id)}
                      className={`status-chip ${e.status === 'active' ? 'complete' : 'queued'}`}
                      style={{ cursor: 'pointer', background: 'transparent', border: 'none', fontFamily: 'inherit' }}
                    >
                      {e.status}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => remove(e.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }} title="Remove">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--bg-panel2)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-dim)' }}>Requires:</strong> PACER API credentials (CM/ECF e-filing account) ·
            PACER charges $0.10/page for court documents accessed via API ·
            Docket Watch handles rate-limiting and batching automatically so you only pay for new filings.
          </div>
        </div>
      </div>
    </PanelChrome>
  )
}
