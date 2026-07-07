import { useState, useEffect, useCallback } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import type { InboxMessage, ParalegalInboxConfig, TriggerRule, TriggerCategory, Automation } from '../mcp/types'
import { INBOX_SEED } from '../fixtures'

type Tab = 'inbox' | 'pop3' | 'rules'

export function TrigPanel({ id }: { id: string }) {
  const [tab, setTab] = useState<Tab>('inbox')
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [inboxCfg, setInboxCfg] = useState<ParalegalInboxConfig | null>(null)
  const [rules, setRules] = useState<TriggerRule[]>([])
  const [categories, setCategories] = useState<TriggerCategory[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [selectedRule, setSelectedRule] = useState<TriggerRule | null>(null)
  const [selectedCat, setSelectedCat] = useState('contract')
  const [loading, setLoading] = useState(true)
  const [testMsg, setTestMsg] = useState<string | null>(null)
  const { pushActivity, navigate } = useTerminalStore()

  const refresh = useCallback(async () => {
    const [m, cfg, r, cats, auto] = await Promise.all([
      client.getInboxMessages(), client.getParalegalInboxConfig(),
      client.getTriggerRules(), client.getTriggerCategories(), client.getAutomations(),
    ])
    setMessages(m)
    setInboxCfg(cfg)
    setRules(r)
    setCategories(cats)
    setAutomations(auto)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function simulate(seedId?: string) {
    await client.simulateInboundMessage(seedId)
    pushActivity('TRIG simulated inbound message')
    refresh()
  }

  async function process(id: string) {
    await client.processInboxMessage(id)
    pushActivity('TRIG processed inbox message')
    refresh()
  }

  async function savePop3() {
    if (!inboxCfg) return
    await client.saveParalegalInboxConfig(inboxCfg)
    pushActivity('TRIG saved POP3 config')
  }

  async function testPop3() {
    const r = await client.testPop3Connection()
    setTestMsg(r.message)
    setTimeout(() => setTestMsg(null), 4000)
  }

  function catLabel(id: string) {
    return categories.find(c => c.id === id)?.label ?? id
  }

  function catColor(id: string) {
    return categories.find(c => c.id === id)?.color ?? '#94a3b8'
  }

  function newRule() {
    setSelectedRule({
      id: `rule-${Date.now()}`,
      name: 'New rule',
      categoryId: selectedCat,
      enabled: true,
      conditions: { subjectKeywords: [], attachmentTypes: ['pdf', 'docx'] },
      action: { automationId: automations[0]?.id ?? '', workflowSource: 'builtin', agentPromptTemplate: 'Review {{subject}} from {{from}} ({{filename}})', autoRunChat: true },
    })
  }

  async function saveRule(r: TriggerRule) {
    await client.saveTriggerRule(r)
    setSelectedRule(r)
    refresh()
    pushActivity(`TRIG saved rule "${r.name}"`)
  }

  const filteredRules = rules.filter(r => r.categoryId === selectedCat)

  return (
    <PanelChrome id={id} mnemonic="TRIG" title="Triggers" subtitle="paralegal inbox · POP3 · category rules" panelType="TRIG">
      <div className="tab-bar">
        {(['inbox', 'pop3', 'rules'] as Tab[]).map(t => (
          <button key={t} type="button" className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'inbox' ? 'Paralegal Inbox' : t === 'pop3' ? 'POP3 Config' : 'Category Rules'}
          </button>
        ))}
      </div>

      {loading && <LoadingDots />}

      {tab === 'inbox' && !loading && inboxCfg && (
        <>
          <div className="ctrx-banner">
            <div className="ctrx-banner-label"><span className="section-label">Inbox</span></div>
            <div className="ctrx-banner-body">
              <div className="ctrx-banner-title">{inboxCfg.address}</div>
              <div className="ctrx-banner-meta">
                <span className="tag">Simulated</span>
                <span>{messages.filter(m => m.status === 'pending').length} pending</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <select className="field-input" style={{ fontSize: 11 }} id="seed-select" defaultValue="">
                <option value="">Random seed</option>
                {INBOX_SEED.map(s => <option key={s.id} value={s.id}>{s.subject.slice(0, 40)}…</option>)}
              </select>
              <button type="button" className="btn-primary" style={{ fontSize: 11 }}
                onClick={() => {
                  const sel = (document.getElementById('seed-select') as HTMLSelectElement)?.value
                  simulate(sel || undefined)
                }}>Simulate inbound</button>
            </div>
          </div>
          <div className="table-scroll" style={{ flex: 1 }}>
            <table className="data-table">
              <thead><tr><th>From</th><th>Subject</th><th>Category</th><th>Attachments</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontSize: 11 }}>{m.from}</td>
                    <td style={{ fontSize: 11 }}>{m.subject}</td>
                    <td><span className="trig-cat-badge" style={{ background: catColor(m.categoryId) }}>{catLabel(m.categoryId)}</span></td>
                    <td style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>{m.attachments.join(', ')}</td>
                    <td><span className={`status-chip ${m.status === 'processed' ? 'complete' : m.status === 'pending' ? 'queued' : 'processing'}`}>{m.status}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {m.status === 'pending' && <button type="button" className="btn" style={{ fontSize: 10, marginRight: 4 }} onClick={() => process(m.id)}>Process</button>}
                      {m.status === 'pending' && <button type="button" className="btn" style={{ fontSize: 10, marginRight: 4 }} onClick={() => client.dismissInboxMessage(m.id).then(refresh)}>Dismiss</button>}
                      <button type="button" className="btn" style={{ fontSize: 10 }} onClick={() => { navigate('CHAT'); pushActivity('TRIG open in Paralegal') }}>Paralegal</button>
                    </td>
                  </tr>
                ))}
                {messages.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--text-muted)', fontSize: 12 }}>No messages. Simulate inbound to demo.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'pop3' && !loading && inboxCfg && (
        <div className="info-pane" style={{ padding: '20px 24px', maxWidth: 560 }}>
          <div className="conf-card" style={{ marginBottom: 16, background: 'var(--accent-faint)', borderColor: 'var(--accent-dim)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Pre-release: inbound mail is <strong>simulated</strong>. POP3 settings are saved for a future server-side worker.
            </div>
          </div>
          <div className="conf-setting-row"><label>Inbox address</label>
            <input className="field-input" value={inboxCfg.address}
              onChange={e => setInboxCfg({ ...inboxCfg, address: e.target.value })} /></div>
          <div className="conf-setting-row"><label>Display name</label>
            <input className="field-input" value={inboxCfg.displayName}
              onChange={e => setInboxCfg({ ...inboxCfg, displayName: e.target.value })} /></div>
          <div className="section-label">POP3 server</div>
          <div className="conf-config-grid">
            <div className="conf-setting-row"><label>Host</label>
              <input className="field-input" value={inboxCfg.pop3.host}
                onChange={e => setInboxCfg({ ...inboxCfg, pop3: { ...inboxCfg.pop3, host: e.target.value } })} /></div>
            <div className="conf-setting-row"><label>Port</label>
              <input className="field-input" type="number" value={inboxCfg.pop3.port}
                onChange={e => setInboxCfg({ ...inboxCfg, pop3: { ...inboxCfg.pop3, port: Number(e.target.value) } })} /></div>
            <div className="conf-setting-row"><label>Username</label>
              <input className="field-input" value={inboxCfg.pop3.username}
                onChange={e => setInboxCfg({ ...inboxCfg, pop3: { ...inboxCfg.pop3, username: e.target.value } })} /></div>
            <div className="conf-setting-row"><label>Password</label>
              <input className="field-input" type="password" value={inboxCfg.pop3.password}
                onChange={e => setInboxCfg({ ...inboxCfg, pop3: { ...inboxCfg.pop3, password: e.target.value } })} /></div>
          </div>
          <div className="conf-setting-row conf-setting-row--check">
            <label><input type="checkbox" checked={inboxCfg.pop3.useTls}
              onChange={e => setInboxCfg({ ...inboxCfg, pop3: { ...inboxCfg.pop3, useTls: e.target.checked } })} /> Use TLS</label>
          </div>
          <div className="conf-setting-row conf-setting-row--check">
            <label><input type="checkbox" checked={inboxCfg.pop3.enabled}
              onChange={e => setInboxCfg({ ...inboxCfg, pop3: { ...inboxCfg.pop3, enabled: e.target.checked } })} /> Enable listening (simulated)</label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn-primary" onClick={savePop3}>Save configuration</button>
            <button type="button" className="btn" onClick={testPop3}>Test connection</button>
          </div>
          {testMsg && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent)' }}>{testMsg}</div>}
        </div>
      )}

      {tab === 'rules' && !loading && (
        <div className="panel-split">
          <div className="panel-split-list panel-split-list--narrow">
            <div className="section-label" style={{ padding: '8px 12px' }}>Categories</div>
            {categories.filter(c => c.id !== 'uncategorized').map(c => (
              <button key={c.id} type="button" onClick={() => { setSelectedCat(c.id); setSelectedRule(null) }}
                className={`wkfl-list-item${selectedCat === c.id ? ' active' : ''}`}>
                <span className="trig-cat-badge" style={{ background: c.color }}>{c.label}</span>
                <div className="wkfl-list-trigger">{rules.filter(r => r.categoryId === c.id).length} rule(s)</div>
              </button>
            ))}
          </div>
          <div className="panel-split-detail info-pane" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="section-label">{catLabel(selectedCat)} rules</div>
              <button type="button" className="btn" style={{ fontSize: 11 }} onClick={newRule}>+ Add rule</button>
            </div>
            {filteredRules.map(r => (
              <button key={r.id} type="button" onClick={() => setSelectedRule(r)} className={`wkfl-step-card${selectedRule?.id === r.id ? ' active' : ''}`} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                <strong>{r.name}</strong> — {r.enabled ? 'enabled' : 'disabled'}
              </button>
            ))}
            {selectedRule && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div className="conf-setting-row"><label>Rule name</label>
                  <input className="field-input" value={selectedRule.name} onChange={e => setSelectedRule({ ...selectedRule, name: e.target.value })} /></div>
                <div className="conf-setting-row"><label>Subject keywords (comma-separated)</label>
                  <input className="field-input" value={selectedRule.conditions.subjectKeywords?.join(', ') ?? ''}
                    onChange={e => setSelectedRule({ ...selectedRule, conditions: { ...selectedRule.conditions, subjectKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} /></div>
                <div className="conf-setting-row"><label>From domains (comma-separated)</label>
                  <input className="field-input" value={selectedRule.conditions.fromDomains?.join(', ') ?? ''}
                    onChange={e => setSelectedRule({ ...selectedRule, conditions: { ...selectedRule.conditions, fromDomains: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} /></div>
                <div className="conf-setting-row"><label>Automation</label>
                  <select className="field-input" value={selectedRule.action.automationId}
                    onChange={e => setSelectedRule({ ...selectedRule, action: { ...selectedRule.action, automationId: e.target.value } })}>
                    <option value="">None (prompt only)</option>
                    {automations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select></div>
                <div className="conf-setting-row"><label>Agent prompt template</label>
                  <textarea className="field-input" rows={3} value={selectedRule.action.agentPromptTemplate ?? ''}
                    onChange={e => setSelectedRule({ ...selectedRule, action: { ...selectedRule.action, agentPromptTemplate: e.target.value } })} />
                  <span className="conf-helper">Tokens: {'{{subject}} {{from}} {{category}} {{filename}} {{attachmentCount}}'}</span></div>
                <div className="conf-setting-row conf-setting-row--check">
                  <label><input type="checkbox" checked={selectedRule.action.autoRunChat}
                    onChange={e => setSelectedRule({ ...selectedRule, action: { ...selectedRule.action, autoRunChat: e.target.checked } })} /> Auto-run in Paralegal</label>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="button" className="btn-primary" onClick={() => saveRule(selectedRule)}>Save rule</button>
                  <button type="button" className="btn" onClick={() => client.deleteTriggerRule(selectedRule.id).then(() => { setSelectedRule(null); refresh() })}>Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PanelChrome>
  )
}
