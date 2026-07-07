import { useState, useEffect, useCallback } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import type { Automation, AutomationSchedule, Workflow, UserWorkflow, WorkflowRun } from '../mcp/types'
import { computeNextRunAt, scheduleSummary } from '../services/automationScheduler'

function newAutomation(): Automation {
  return {
    id: `auto-${Date.now()}`,
    name: 'New automation',
    workflowId: 'contract-risk-triage',
    workflowSource: 'builtin',
    schedule: { type: 'daily', time: '09:00' },
    enabled: false,
    lastRunAt: null,
    nextRunAt: null,
    lastStatus: null,
  }
}

export function AutmPanel({ id }: { id: string }) {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [userWorkflows, setUserWorkflows] = useState<UserWorkflow[]>([])
  const [selected, setSelected] = useState<Automation | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRun, setLastRun] = useState<WorkflowRun | null>(null)
  const { pushActivity } = useTerminalStore()

  const refresh = useCallback(async () => {
    const [a, w, uw] = await Promise.all([
      client.getAutomations(), client.getWorkflows(), client.getUserWorkflows(),
    ])
    setAutomations(a)
    setWorkflows(w)
    setUserWorkflows(uw)
    setLoading(false)
  }, [])

  useEffect(() => { refresh().then(() => client.getAutomations().then(a => setSelected(a[0] ?? null))) }, [refresh])

  async function save(a: Automation) {
    const next = { ...a, nextRunAt: computeNextRunAt(a.schedule) }
    const saved = await client.saveAutomation(next)
    setSelected(saved)
    refresh()
    pushActivity(`AUTM saved "${saved.name}"`)
  }

  async function toggle(id: string, enabled: boolean) {
    await client.toggleAutomation(id, enabled)
    refresh()
  }

  async function runNow(id: string) {
    const run = await client.runAutomationNow(id)
    setLastRun(run)
    pushActivity(`AUTM ran automation`)
    refresh()
  }

  async function remove(id: string) {
    await client.deleteAutomation(id)
    setSelected(null)
    refresh()
  }

  function isExecutable(wfId: string, source: 'builtin' | 'user'): boolean {
    if (source === 'user') return userWorkflows.some(w => w.id === wfId && w.steps.length > 0)
    return workflows.some(w => w.id === wfId && w.executable_steps?.length)
  }

  return (
    <PanelChrome id={id} mnemonic="AUTM" title="Automations" subtitle="schedule workflows · event triggers" panelType="AUTM">
      {loading && <LoadingDots />}
      {!loading && (
        <div className="panel-split">
          <div className="panel-split-list panel-split-list--narrow">
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
              <button type="button" className="btn-primary" style={{ width: '100%', fontSize: 11 }}
                onClick={() => setSelected(newAutomation())}>+ New automation</button>
            </div>
            {automations.map(a => (
              <button key={a.id} type="button" onClick={() => setSelected(a)} className={`wkfl-list-item${selected?.id === a.id ? ' active' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <input type="checkbox" checked={a.enabled} onChange={e => { e.stopPropagation(); toggle(a.id, e.target.checked) }} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div className="wkfl-list-title">{a.name}</div>
                    <div className="wkfl-list-trigger">{scheduleSummary(a.schedule)}</div>
                  </div>
                  {a.lastStatus && <span className={`status-chip ${a.lastStatus === 'success' ? 'complete' : 'error'}`}>{a.lastStatus}</span>}
                </div>
              </button>
            ))}
          </div>
          <div className="panel-split-detail info-pane" style={{ padding: '20px 24px' }}>
            {selected ? (
              <>
                <div className="conf-setting-row"><label>Name</label>
                  <input className="field-input" value={selected.name} onChange={e => setSelected({ ...selected, name: e.target.value })} /></div>
                <div className="conf-setting-row"><label>Workflow source</label>
                  <select className="field-input" value={selected.workflowSource}
                    onChange={e => setSelected({ ...selected, workflowSource: e.target.value as 'builtin' | 'user', workflowId: e.target.value === 'user' ? (userWorkflows[0]?.id ?? '') : 'contract-risk-triage' })}>
                    <option value="builtin">System playbook</option>
                    <option value="user">Custom workflow</option>
                  </select></div>
                <div className="conf-setting-row"><label>Workflow</label>
                  <select className="field-input" value={selected.workflowId}
                    onChange={e => setSelected({ ...selected, workflowId: e.target.value })}>
                    {selected.workflowSource === 'builtin'
                      ? workflows.filter(w => w.executable_steps?.length).map(w => <option key={w.id} value={w.id}>{w.title}</option>)
                      : userWorkflows.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                  </select>
                  {!isExecutable(selected.workflowId, selected.workflowSource) && (
                    <span style={{ fontSize: 10, color: 'var(--risk-high)' }}>Not executable — add executable steps</span>
                  )}</div>
                <div className="conf-setting-row"><label>Schedule type</label>
                  <select className="field-input" value={selected.schedule.type}
                    onChange={e => {
                      const t = e.target.value as AutomationSchedule['type']
                      let schedule: AutomationSchedule
                      if (t === 'once') schedule = { type: 'once', dateTime: new Date(Date.now() + 86400000).toISOString() }
                      else if (t === 'daily') schedule = { type: 'daily', time: '09:00' }
                      else if (t === 'weekly') schedule = { type: 'weekly', dayOfWeek: 1, time: '09:00' }
                      else schedule = { type: 'event', event: 'job_complete' }
                      setSelected({ ...selected, schedule })
                    }}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="once">Once</option>
                    <option value="event">On event</option>
                  </select></div>
                {selected.schedule.type === 'daily' && (
                  <div className="conf-setting-row"><label>Time</label>
                    <input type="time" className="field-input" value={selected.schedule.time}
                      onChange={e => setSelected({ ...selected, schedule: { type: 'daily', time: e.target.value } })} /></div>
                )}
                {selected.schedule.type === 'weekly' && (
                  <>
                    <div className="conf-setting-row"><label>Day</label>
                      <select className="field-input" value={selected.schedule.dayOfWeek}
                        onChange={e => setSelected({ ...selected, schedule: { ...selected.schedule, dayOfWeek: Number(e.target.value) } as AutomationSchedule })}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => <option key={d} value={i}>{d}</option>)}
                      </select></div>
                    <div className="conf-setting-row"><label>Time</label>
                      <input type="time" className="field-input" value={(selected.schedule as { time: string }).time}
                        onChange={e => setSelected({ ...selected, schedule: { type: 'weekly', dayOfWeek: (selected.schedule as { dayOfWeek: number }).dayOfWeek, time: e.target.value } })} /></div>
                  </>
                )}
                {selected.schedule.type === 'once' && (
                  <div className="conf-setting-row"><label>Date & time</label>
                    <input type="datetime-local" className="field-input"
                      value={selected.schedule.dateTime.slice(0, 16)}
                      onChange={e => setSelected({ ...selected, schedule: { type: 'once', dateTime: new Date(e.target.value).toISOString() } })} /></div>
                )}
                {selected.schedule.type === 'event' && (
                  <div className="conf-setting-row"><label>Event</label>
                    <select className="field-input" value={selected.schedule.event}
                      onChange={e => setSelected({ ...selected, schedule: { type: 'event', event: e.target.value as AutomationSchedule extends { type: 'event' } ? AutomationSchedule['event'] : never } })}>
                      <option value="job_complete">Job complete</option>
                      <option value="document_upload">Document uploaded</option>
                      <option value="contract_selected">Contract selected</option>
                      <option value="email_received">Email received</option>
                      <option value="app_open">App opened</option>
                    </select></div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="btn-primary" onClick={() => save(selected)}>Save</button>
                  <button type="button" className="btn" onClick={() => runNow(selected.id)}>Run now</button>
                  <button type="button" className="btn" onClick={() => remove(selected.id)}>Delete</button>
                </div>
                {selected.lastRunAt && (
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                    Last run: {new Date(selected.lastRunAt).toLocaleString()} — {selected.lastStatus ?? '—'}
                  </div>
                )}
                {lastRun && (
                  <div className="wkfl-run-result">
                    <div className="section-label">Last manual run — {lastRun.status}</div>
                    {lastRun.steps.map(s => <div key={s.stepId} style={{ fontSize: 11 }}>{s.toolId}: {s.summary}</div>)}
                  </div>
                )}
              </>
            ) : <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select or create an automation.</div>}
          </div>
        </div>
      )}
    </PanelChrome>
  )
}
