import { useState, useEffect, useCallback } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import { CONTRACT_PICKER } from '../fixtureMeta'
import type { PanelType } from '../store/terminalStore'
import type { Workflow, UserWorkflow, WorkflowStepDef, WorkflowRun, ToolCatalogEntry } from '../mcp/types'
import { createUserWorkflow } from '../services/workflowRunner'

const MNEMONIC_TO_PANEL: Record<string, PanelType> = {
  CTRX: 'CTRX', NEGO: 'CTRX', META: 'DOCA', PRIV: 'PRIV',
  PREC: 'PREC', BRF: 'BRF', CITE: 'CITE', JOBS: 'JOBS',
}

type Tab = 'browse' | 'builder'

export function WkflPanel({ id }: { id: string }) {
  const [tab, setTab] = useState<Tab>('browse')
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [userWorkflows, setUserWorkflows] = useState<UserWorkflow[]>([])
  const [catalog, setCatalog] = useState<ToolCatalogEntry[]>([])
  const [selected, setSelected] = useState<Workflow | null>(null)
  const [editWf, setEditWf] = useState<UserWorkflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState<WorkflowRun | null>(null)
  const { navigate, pushActivity } = useTerminalStore()

  const refresh = useCallback(async () => {
    const [w, uw, cat] = await Promise.all([
      client.getWorkflows(), client.getUserWorkflows(), client.getToolCatalog(),
    ])
    setWorkflows(w)
    setUserWorkflows(uw)
    setCatalog(cat)
    setLoading(false)
  }, [])

  useEffect(() => { refresh().then(() => client.getWorkflows().then(w => setSelected(w[0] ?? null))) }, [refresh])

  function launch(w: Workflow) {
    const p = MNEMONIC_TO_PANEL[w.mnemonic]
    if (p) { pushActivity(`WKFL launched "${w.title}"`); navigate(p) }
  }

  async function runBuiltin(w: Workflow) {
    if (!w.executable_steps?.length) return
    setRunning(true)
    const run = await client.runWorkflow(w.id, 'builtin')
    setLastRun(run)
    pushActivity(`WKFL ran "${w.title}" — ${run.status}`)
    setRunning(false)
  }

  async function testRunUser() {
    if (!editWf) return
    setRunning(true)
    await client.saveUserWorkflow(editWf)
    const run = await client.runWorkflow(editWf.id, 'user')
    setLastRun(run)
    pushActivity(`WKFL test run "${editWf.title}" — ${run.status}`)
    setRunning(false)
  }

  function newWorkflow() {
    setEditWf(createUserWorkflow('New workflow', '', []))
  }

  function addStep() {
    if (!editWf || !catalog[0]) return
    const step: WorkflowStepDef = {
      id: `step-${Date.now()}`,
      toolId: catalog[0].toolId,
      params: {},
    }
    setEditWf({ ...editWf, steps: [...editWf.steps, step] })
  }

  async function saveWorkflow() {
    if (!editWf?.title.trim()) return
    const saved = await client.saveUserWorkflow(editWf)
    setEditWf(saved)
    refresh()
    pushActivity(`WKFL saved "${saved.title}"`)
  }

  async function deleteWorkflow() {
    if (!editWf) return
    await client.deleteUserWorkflow(editWf.id)
    setEditWf(null)
    refresh()
  }

  return (
    <PanelChrome id={id} mnemonic="WKFL" title="Workflows" subtitle="browse playbooks · build sequences" panelType="WKFL">
      <div className="tab-bar">
        <button type="button" className={`tab-btn ${tab === 'browse' ? 'active' : ''}`} onClick={() => setTab('browse')}>Browse</button>
        <button type="button" className={`tab-btn ${tab === 'builder' ? 'active' : ''}`} onClick={() => setTab('builder')}>Builder</button>
      </div>

      {loading && <LoadingDots />}

      {tab === 'browse' && !loading && (
        <div className="panel-split">
          <div className="panel-split-list panel-split-list--history">
            {workflows.map(w => (
              <button key={w.id} type="button" onClick={() => setSelected(w)} className={`wkfl-list-item${selected?.id === w.id ? ' active' : ''}`}>
                <span className="mnemonic-badge">{w.mnemonic}</span>
                <div>
                  <div className="wkfl-list-title">{w.title} <span className="wkfl-badge-system">System</span></div>
                  <div className="wkfl-list-trigger">{w.trigger}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="panel-split-detail info-pane" style={{ padding: '20px 24px' }}>
            {selected ? (
              <>
                <h3 style={{ marginBottom: 5, fontSize: 15 }}>{selected.title}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20, fontStyle: 'italic' }}>Trigger: &ldquo;{selected.trigger}&rdquo;</div>
                <div className="section-label">Tool call sequence</div>
                {selected.steps.map(step => (
                  <div key={step.n} className="wkfl-step-card">
                    <span className="wkfl-step-num">{step.n}.</span>
                    <div><div className="wkfl-step-tool">{step.tool}</div><div className="wkfl-step-desc">{step.desc}</div></div>
                  </div>
                ))}
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  {selected.executable_steps?.length ? (
                    <button type="button" onClick={() => runBuiltin(selected)} className="btn-primary" disabled={running}>
                      {running ? 'Running…' : 'Run workflow'}
                    </button>
                  ) : (
                    <button type="button" onClick={() => launch(selected)} className="btn-primary">Open {selected.mnemonic} →</button>
                  )}
                </div>
                {lastRun && selected.executable_steps && (
                  <div className="wkfl-run-result">
                    <div className="section-label">Last run — {lastRun.status}</div>
                    {lastRun.steps.map(s => (
                      <div key={s.stepId} style={{ fontSize: 11, color: s.success ? 'var(--risk-low)' : 'var(--risk-high)' }}>
                        {s.toolId}: {s.summary}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a workflow.</div>}
          </div>
        </div>
      )}

      {tab === 'builder' && !loading && (
        <div className="panel-split">
          <div className="panel-split-list panel-split-list--narrow">
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
              <button type="button" className="btn-primary" style={{ width: '100%', fontSize: 11 }} onClick={newWorkflow}>+ New workflow</button>
            </div>
            {userWorkflows.map(w => (
              <button key={w.id} type="button" onClick={() => setEditWf(w)} className={`wkfl-list-item${editWf?.id === w.id ? ' active' : ''}`}>
                <div className="wkfl-list-title">{w.title}</div>
                <div className="wkfl-list-trigger">{w.steps.length} step(s)</div>
              </button>
            ))}
            {userWorkflows.length === 0 && <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>No custom workflows yet.</div>}
          </div>
          <div className="panel-split-detail info-pane wkfl-builder-pane">
            {editWf ? (
              <>
                <div className="conf-setting-row"><label>Title</label>
                  <input className="field-input" value={editWf.title} onChange={e => setEditWf({ ...editWf, title: e.target.value })} /></div>
                <div className="conf-setting-row"><label>Trigger description</label>
                  <input className="field-input" value={editWf.trigger} onChange={e => setEditWf({ ...editWf, trigger: e.target.value })} /></div>
                <div className="section-label">Steps</div>
                {editWf.steps.map((step, idx) => {
                  const tool = catalog.find(t => t.toolId === step.toolId)
                  return (
                    <div key={step.id} className="wkfl-builder-step">
                      <select className="field-input" value={step.toolId} onChange={e => {
                        const steps = [...editWf.steps]
                        steps[idx] = { ...step, toolId: e.target.value, params: {} }
                        setEditWf({ ...editWf, steps })
                      }}>
                        {catalog.map(t => <option key={t.toolId} value={t.toolId}>{t.label}</option>)}
                      </select>
                      {tool?.params.map(p => (
                        <div key={p.key} className="conf-setting-row">
                          <label>{p.label}</label>
                          {p.type === 'select' && p.options ? (
                            <select className="field-input" value={step.params[p.key] ?? ''}
                              onChange={e => {
                                const steps = [...editWf.steps]
                                steps[idx] = { ...step, params: { ...step.params, [p.key]: e.target.value } }
                                setEditWf({ ...editWf, steps })
                              }}>
                              <option value="">—</option>
                              {p.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : p.type === 'contract' ? (
                            <select className="field-input" value={step.params[p.key] ?? ''}
                              onChange={e => {
                                const steps = [...editWf.steps]
                                steps[idx] = { ...step, params: { ...step.params, [p.key]: e.target.value } }
                                setEditWf({ ...editWf, steps })
                              }}>
                              <option value="">—</option>
                              {CONTRACT_PICKER.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                          ) : (
                            <input className="field-input" value={step.params[p.key] ?? ''}
                              onChange={e => {
                                const steps = [...editWf.steps]
                                steps[idx] = { ...step, params: { ...step.params, [p.key]: e.target.value } }
                                setEditWf({ ...editWf, steps })
                              }} />
                          )}
                        </div>
                      ))}
                      <button type="button" className="btn" style={{ fontSize: 10 }} onClick={() => setEditWf({ ...editWf, steps: editWf.steps.filter((_, i) => i !== idx) })}>Remove</button>
                    </div>
                  )
                })}
                <button type="button" className="btn" style={{ marginBottom: 12 }} onClick={addStep}>+ Add step</button>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn-primary" onClick={saveWorkflow}>Save</button>
                  <button type="button" className="btn" onClick={testRunUser} disabled={running || !editWf.steps.length}>Test run</button>
                  <button type="button" className="btn" onClick={deleteWorkflow}>Delete</button>
                </div>
                {lastRun && editWf && (
                  <div className="wkfl-run-result">
                    <div className="section-label">Test run — {lastRun.status}</div>
                    {lastRun.steps.map(s => <div key={s.stepId} style={{ fontSize: 11 }}>{s.toolId}: {s.summary}</div>)}
                  </div>
                )}
              </>
            ) : <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 20 }}>Create or select a workflow to edit.</div>}
          </div>
        </div>
      )}
    </PanelChrome>
  )
}
