/**
 * CONF — Confidential Mode / Privacy Settings
 *
 * Lets the user lock the terminal into a confidential-only posture:
 * - Forces all inference through a local Ollama endpoint
 * - Disables cloud MCP client so no data leaves the machine
 * - References the privilege risk findings from legal-mcp (ABA Rule 1.6 / Heppner)
 */

import { useState } from 'react'
import { Lock, Unlock, CheckCircle, XCircle, AlertTriangle, Server, Shield } from 'lucide-react'
import { PanelChrome } from '../components/PanelChrome'
import { useTerminalStore } from '../store/terminalStore'

// Provider trust matrix (mirrors PrivPanel data from legal-mcp)
const PROVIDERS = [
  {
    label: 'Ollama (local)',    risk: 'LOW',      zdr: true,  noTrain: true,  hipaa: false,
    verdict: 'Safe for all privileged material — inference stays on-device.',
    isLocal: true,
  },
  {
    label: 'Azure OpenAI',     risk: 'MEDIUM',   zdr: true,  noTrain: true,  hipaa: true,
    verdict: 'Acceptable under enterprise agreement with ZDR and no-training addendum.',
    isLocal: false,
  },
  {
    label: 'Google Vertex AI', risk: 'MEDIUM',   zdr: true,  noTrain: true,  hipaa: true,
    verdict: 'Acceptable under enterprise agreement — review data retention terms.',
    isLocal: false,
  },
  {
    label: 'OpenAI API',       risk: 'HIGH',     zdr: false, noTrain: true,  hipaa: false,
    verdict: 'No ZDR available on standard tier. Obtain enterprise agreement first.',
    isLocal: false,
  },
  {
    label: 'Anthropic API',    risk: 'HIGH',     zdr: false, noTrain: true,  hipaa: false,
    verdict: 'No ZDR on standard tier. Attorney authorisation required before routing.',
    isLocal: false,
  },
  {
    label: 'OpenRouter',       risk: 'HIGH',     zdr: false, noTrain: false, hipaa: false,
    verdict: 'Training use not excluded. Do not route privileged or client-identifying content.',
    isLocal: false,
  },
]

const RISK_COLOR: Record<string, string> = {
  LOW: 'var(--risk-low)', MEDIUM: 'var(--risk-medium)',
  HIGH: 'var(--risk-high)', CRITICAL: 'var(--risk-critical)',
}

const CONF_RULES = [
  'All inference routed through local Ollama endpoint only',
  'Cloud MCP client disabled — mock client used for tool calls',
  'No document content transmitted to any external endpoint',
  'Activity log retained locally; no telemetry',
  'ABA Model Rule 1.6 confidentiality obligations enforced',
  'HIPAA-sensitive matter handling defaults to minimum-disclosure',
]

export function ConfPanel({ id }: { id: string }) {
  const {
    confidentialMode, toggleConfidentialMode,
    localModelUrl, setLocalModelUrl,
    localModel, setLocalModel,
  } = useTerminalStore()

  const [urlDraft, setUrlDraft] = useState(localModelUrl)
  const [modelDraft, setModelDraft] = useState(localModel)

  function saveConfig() {
    setLocalModelUrl(urlDraft)
    setLocalModel(modelDraft)
  }

  return (
    <PanelChrome id={id} mnemonic="CONF" title="Privacy Settings" subtitle="confidential mode · local inference · ABA Rule 1.6" panelType="CONF">
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Master toggle ───────────────────────────────── */}
          <div style={{
            background: confidentialMode ? 'var(--confidential-faint)' : 'var(--bg-panel2)',
            border: `1px solid ${confidentialMode ? 'var(--confidential-border)' : 'var(--border)'}`,
            padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
            transition: 'all 0.2s',
          }}>
            <div style={{
              width: 44, height: 44, border: `1px solid ${confidentialMode ? 'var(--confidential-border)' : 'var(--border-bright)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              color: confidentialMode ? 'var(--confidential)' : 'var(--text-muted)',
              background: confidentialMode ? 'var(--confidential-faint)' : 'transparent',
              transition: 'all 0.2s',
            }}>
              {confidentialMode ? <Lock size={20} /> : <Unlock size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 16, fontWeight: 700,
                color: confidentialMode ? 'var(--confidential)' : 'var(--text-heading)',
                marginBottom: 4,
              }}>
                Confidential Mode
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {confidentialMode
                  ? 'Active — all inference is routed through your local Ollama endpoint. No client data leaves this machine.'
                  : 'Off — the terminal may route inference through cloud providers depending on your client configuration.'}
              </div>
            </div>
            <button
              onClick={toggleConfidentialMode}
              style={{
                padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: confidentialMode ? 'var(--confidential-strong)' : 'var(--accent-faint)',
                border: `1px solid ${confidentialMode ? 'var(--confidential-border)' : 'var(--accent-dim)'}`,
                color: confidentialMode ? 'var(--confidential)' : 'var(--accent)',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {confidentialMode ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* ── Rules enforced when active ───────────────────── */}
          <div>
            <div className="section-label" style={{ marginBottom: 10 }}>Rules enforced when confidential mode is active</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CONF_RULES.map((rule, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  <span style={{ color: confidentialMode ? 'var(--confidential)' : 'var(--text-muted)', marginTop: 2, flexShrink: 0 }}>
                    <Shield size={12} />
                  </span>
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {/* ── Local model config ───────────────────────────── */}
          <div style={{ background: 'var(--bg-panel2)', border: '1px solid var(--border)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Server size={13} style={{ color: 'var(--accent)' }} />
              <div className="section-label" style={{ margin: 0 }}>Local model configuration (Ollama)</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ollama endpoint</div>
                <input
                  value={urlDraft}
                  onChange={e => setUrlDraft(e.target.value)}
                  className="field-input"
                  placeholder="http://localhost:11434"
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Model</div>
                <input
                  value={modelDraft}
                  onChange={e => setModelDraft(e.target.value)}
                  className="field-input"
                  placeholder="llama3.2:latest"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={saveConfig} className="btn-primary" style={{ fontSize: 11 }}>Save configuration</button>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Run: <code style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--accent)' }}>ollama serve</code> on the target machine
              </span>
            </div>
          </div>

          {/* ── Provider trust table ─────────────────────────── */}
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>AI provider trust levels</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
              Based on <em>United States v. Heppner</em> (S.D.N.Y. Feb. 2026) and ABA Model Rule 1.6.
              Confidential mode blocks all non-local providers.
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Risk</th>
                  <th style={{ textAlign: 'center' }}>Zero-data-retention</th>
                  <th style={{ textAlign: 'center' }}>No training use</th>
                  <th style={{ textAlign: 'center' }}>HIPAA-eligible</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {PROVIDERS.map(p => (
                  <tr key={p.label} style={{
                    opacity: confidentialMode && !p.isLocal ? 0.45 : 1,
                    transition: 'opacity 0.2s',
                  }}>
                    <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.isLocal && <Lock size={11} style={{ color: 'var(--confidential)' }} />}
                      {p.label}
                    </td>
                    <td>
                      <span style={{ color: RISK_COLOR[p.risk], fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700 }}>
                        {p.risk}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.zdr
                        ? <CheckCircle size={13} style={{ color: 'var(--risk-low)' }} />
                        : <XCircle size={13} style={{ color: 'var(--risk-high)' }} />}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.noTrain
                        ? <CheckCircle size={13} style={{ color: 'var(--risk-low)' }} />
                        : <AlertTriangle size={13} style={{ color: 'var(--risk-medium)' }} />}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.hipaa
                        ? <CheckCircle size={13} style={{ color: 'var(--risk-low)' }} />
                        : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.4 }}>{p.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PanelChrome>
  )
}
