/**
 * CONF — Settings (Privacy, General, Integrations, Notifications)
 */

import { useState, useEffect } from 'react'
import { Lock, Unlock, CheckCircle, XCircle, AlertTriangle, Server, Shield, Settings, Plug, Bell } from 'lucide-react'
import { PanelChrome } from '../components/PanelChrome'
import { client } from '../mcp/index'
import { useTerminalStore } from '../store/terminalStore'
import type { AppSettings } from '../mcp/types'
import { TRIGGER_CATEGORIES } from '../fixtures'

const PROVIDERS = [
  { label: 'Ollama (local)', risk: 'LOW', zdr: true, noTrain: true, hipaa: false, verdict: 'Safe for all privileged material — inference stays on-device.', isLocal: true },
  { label: 'Azure OpenAI', risk: 'MEDIUM', zdr: true, noTrain: true, hipaa: true, verdict: 'Acceptable under enterprise agreement with ZDR and no-training addendum.', isLocal: false },
  { label: 'Google Vertex AI', risk: 'MEDIUM', zdr: true, noTrain: true, hipaa: true, verdict: 'Acceptable under enterprise agreement — review data retention terms.', isLocal: false },
  { label: 'OpenAI API', risk: 'HIGH', zdr: false, noTrain: true, hipaa: false, verdict: 'No ZDR available on standard tier. Obtain enterprise agreement first.', isLocal: false },
  { label: 'Anthropic API', risk: 'HIGH', zdr: false, noTrain: true, hipaa: false, verdict: 'No ZDR on standard tier. Attorney authorisation required before routing.', isLocal: false },
  { label: 'OpenRouter', risk: 'HIGH', zdr: false, noTrain: false, hipaa: false, verdict: 'Training use not excluded. Do not route privileged or client-identifying content.', isLocal: false },
]

const RISK_COLOR: Record<string, string> = {
  LOW: 'var(--risk-low)', MEDIUM: 'var(--risk-medium)', HIGH: 'var(--risk-high)', CRITICAL: 'var(--risk-critical)',
}

const CONF_RULES = [
  'All inference routed through local Ollama endpoint only',
  'Cloud MCP client disabled — mock client used for tool calls',
  'No document content transmitted to any external endpoint',
  'Activity log retained locally; no telemetry',
  'ABA Model Rule 1.6 confidentiality obligations enforced',
  'HIPAA-sensitive matter handling defaults to minimum-disclosure',
]

type Tab = 'privacy' | 'general' | 'integrations' | 'notifications'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'privacy', label: 'Privacy', icon: <Shield size={13} /> },
  { id: 'general', label: 'General', icon: <Settings size={13} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={13} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={13} /> },
]

const PANEL_OPTIONS = ['HOME', 'CHAT', 'PREC', 'CTRX', 'DOCA', 'JOBS', 'WKFL'] as const

export function ConfPanel({ id }: { id: string }) {
  const [tab, setTab] = useState<Tab>('privacy')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const { confidentialMode, toggleConfidentialMode, setLocalModelUrl, setLocalModel, setTheme, switchClientMode, liveUrl } = useTerminalStore()

  useEffect(() => {
    client.getAppSettings().then(setSettings)
  }, [])

  async function saveSettings(partial: Partial<AppSettings>) {
    const next = await client.saveAppSettings(partial)
    setSettings(next)
    if (partial.localModelUrl) setLocalModelUrl(partial.localModelUrl)
    if (partial.localModel) setLocalModel(partial.localModel)
    if (partial.theme) setTheme(partial.theme)
    if (partial.liveMcpUrl && partial.liveMcpUrl !== liveUrl) {
      await switchClientMode('live', partial.liveMcpUrl)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) return (
    <PanelChrome id={id} mnemonic="CONF" title="Settings" subtitle="loading…" panelType="CONF">
      <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>Loading settings…</div>
    </PanelChrome>
  )

  return (
    <PanelChrome id={id} mnemonic="CONF" title="Settings" subtitle="privacy · general · integrations · notifications" panelType="CONF">
      <div className="conf-tabs">
        {TABS.map(t => (
          <button key={t.id} type="button" className={`conf-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="conf-scroll">
        <div className="conf-content-column">

          {tab === 'privacy' && (
            <>
              <div className={`conf-card conf-card--hero${confidentialMode ? ' confidential' : ''}`}>
                <div className="conf-card-icon">{confidentialMode ? <Lock size={20} /> : <Unlock size={20} />}</div>
                <div className="conf-card-body">
                  <div className="conf-card-title">Confidential Mode</div>
                  <div className="conf-card-desc">
                    {confidentialMode
                      ? 'Active — all inference routed through your local Ollama endpoint.'
                      : 'Off — the terminal may route inference through cloud providers.'}
                  </div>
                </div>
                <button type="button" onClick={toggleConfidentialMode} className={`conf-toggle-btn${confidentialMode ? ' on' : ''}`}>
                  {confidentialMode ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div className="conf-card">
                <div className="section-label">Rules enforced when confidential mode is active</div>
                <ul className="conf-rules-list">
                  {CONF_RULES.map((rule, i) => (
                    <li key={i}><Shield size={12} /> {rule}</li>
                  ))}
                </ul>
              </div>

              <div className="conf-card">
                <div className="conf-card-header"><Server size={13} /> Local model (Ollama)</div>
                <div className="conf-config-grid">
                  <div className="conf-setting-row">
                    <label>Ollama endpoint</label>
                    <input className="field-input" value={settings.localModelUrl}
                      onChange={e => setSettings({ ...settings, localModelUrl: e.target.value })} />
                  </div>
                  <div className="conf-setting-row">
                    <label>Model</label>
                    <input className="field-input" value={settings.localModel}
                      onChange={e => setSettings({ ...settings, localModel: e.target.value })} />
                  </div>
                </div>
                <button type="button" className="btn-primary" style={{ fontSize: 11 }}
                  onClick={() => saveSettings({ localModelUrl: settings.localModelUrl, localModel: settings.localModel })}>
                  Save model config
                </button>
              </div>

              <div className="conf-card">
                <div className="section-label">AI provider trust levels</div>
                <p className="conf-helper">Based on <em>United States v. Heppner</em> and ABA Model Rule 1.6.</p>
                <div className="conf-provider-grid">
                  {PROVIDERS.map(p => (
                    <div key={p.label} className={`conf-provider-card${confidentialMode && !p.isLocal ? ' dimmed' : ''}`}>
                      <div className="conf-provider-head">
                        {p.isLocal && <Lock size={11} />}
                        <span>{p.label}</span>
                        <span style={{ color: RISK_COLOR[p.risk], fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700 }}>{p.risk}</span>
                      </div>
                      <div className="conf-provider-flags">
                        ZDR {p.zdr ? <CheckCircle size={11} style={{ color: 'var(--risk-low)' }} /> : <XCircle size={11} style={{ color: 'var(--risk-high)' }} />}
                        No train {p.noTrain ? <CheckCircle size={11} style={{ color: 'var(--risk-low)' }} /> : <AlertTriangle size={11} style={{ color: 'var(--risk-medium)' }} />}
                      </div>
                      <div className="conf-provider-verdict">{p.verdict}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'general' && (
            <div className="conf-card">
              <div className="section-label">Terminal preferences</div>
              <div className="conf-setting-row">
                <label>Default panel on startup</label>
                <select className="field-input" value={settings.defaultPanel}
                  onChange={e => setSettings({ ...settings, defaultPanel: e.target.value as AppSettings['defaultPanel'] })}>
                  {PANEL_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="conf-setting-row">
                <label>Analysis queue refresh</label>
                <select className="field-input" value={settings.jobsRefreshIntervalSec}
                  onChange={e => setSettings({ ...settings, jobsRefreshIntervalSec: Number(e.target.value) })}>
                  <option value={2}>Every 2 seconds</option>
                  <option value={5}>Every 5 seconds</option>
                  <option value={10}>Every 10 seconds</option>
                  <option value={0}>Manual only</option>
                </select>
              </div>
              <div className="conf-setting-row">
                <label>Theme</label>
                <select className="field-input" value={settings.theme}
                  onChange={e => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="conf-setting-row conf-setting-row--check">
                <label><input type="checkbox" checked={settings.sidebarDefaultCollapsed}
                  onChange={e => setSettings({ ...settings, sidebarDefaultCollapsed: e.target.checked })} /> Start with sidebar collapsed</label>
              </div>
              <button type="button" className="btn-primary" style={{ fontSize: 11, marginTop: 12 }}
                onClick={() => saveSettings({
                  defaultPanel: settings.defaultPanel,
                  jobsRefreshIntervalSec: settings.jobsRefreshIntervalSec,
                  theme: settings.theme,
                  sidebarDefaultCollapsed: settings.sidebarDefaultCollapsed,
                })}>
                Save general settings
              </button>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="conf-card">
              <div className="section-label">External services</div>
              <div className="conf-setting-row">
                <label>Live MCP server URL</label>
                <input className="field-input" value={settings.liveMcpUrl}
                  onChange={e => setSettings({ ...settings, liveMcpUrl: e.target.value })} placeholder="http://localhost:8000" />
              </div>
              <div className="conf-setting-row">
                <label>CourtListener API token</label>
                <input className="field-input" type="password" value={settings.courtListenerToken}
                  onChange={e => setSettings({ ...settings, courtListenerToken: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="conf-setting-row">
                <label>PACER username</label>
                <input className="field-input" value={settings.pacerUsername}
                  onChange={e => setSettings({ ...settings, pacerUsername: e.target.value })} placeholder="pacer_user" />
              </div>
              <button type="button" className="btn-primary" style={{ fontSize: 11, marginTop: 12 }}
                onClick={() => saveSettings({
                  liveMcpUrl: settings.liveMcpUrl,
                  courtListenerToken: settings.courtListenerToken,
                  pacerUsername: settings.pacerUsername,
                })}>
                Save integrations
              </button>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="conf-card">
              <div className="section-label">Alerts & webhooks</div>
              <div className="conf-setting-row conf-setting-row--check">
                <label><input type="checkbox" checked={settings.emailDigestEnabled}
                  onChange={e => setSettings({ ...settings, emailDigestEnabled: e.target.checked })} /> Email digest (Docket Watch / inbox)</label>
              </div>
              <div className="conf-setting-row">
                <label>Webhook URL</label>
                <input className="field-input" value={settings.webhookUrl}
                  onChange={e => setSettings({ ...settings, webhookUrl: e.target.value })} placeholder="https://hooks.example.com/legal" />
              </div>
              <div className="section-label" style={{ marginTop: 16 }}>Per-category notifications</div>
              {TRIGGER_CATEGORIES.filter(c => c.id !== 'uncategorized').map(cat => (
                <div key={cat.id} className="conf-setting-row conf-setting-row--check">
                  <label>
                    <input type="checkbox"
                      checked={settings.categoryNotifications[cat.id] !== false}
                      onChange={e => setSettings({
                        ...settings,
                        categoryNotifications: { ...settings.categoryNotifications, [cat.id]: e.target.checked },
                      })} />
                    <span className="conf-cat-dot" style={{ background: cat.color }} /> {cat.label}
                  </label>
                </div>
              ))}
              <button type="button" className="btn-primary" style={{ fontSize: 11, marginTop: 12 }}
                onClick={() => saveSettings({
                  emailDigestEnabled: settings.emailDigestEnabled,
                  webhookUrl: settings.webhookUrl,
                  categoryNotifications: settings.categoryNotifications,
                })}>
                Save notifications
              </button>
            </div>
          )}

          {saved && <div className="conf-saved-toast">Settings saved</div>}
        </div>
      </div>
    </PanelChrome>
  )
}
