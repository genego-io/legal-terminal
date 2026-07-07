import { useEffect, useState } from 'react'
import { PanelChrome, LoadingDots } from '../components/PanelChrome'
import { client } from '../mcp/index'
import type { IntegrationStatus } from '../mcp/types'

export function LivePanel({ id }: { id: string }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.getIntegrationStatus().then(s => { setStatus(s); setLoading(false) })
  }, [])

  return (
    <PanelChrome id={id} mnemonic="LIVE" title="Integration Status" subtitle="integration_status · CourtListener · PACER" panelType="LIVE">
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="info-pane">
        {loading && <LoadingDots />}
        {status && !loading && (
          <>
            {/* Fee warning */}
            <div style={{ borderLeft: '3px solid var(--risk-medium)', paddingLeft: 12, marginBottom: 20, background: 'var(--bg)', padding: '10px 14px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--risk-medium)', fontWeight: 600, fontSize: 12, marginBottom: 4 }}>PACER billing advisory</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.7 }}>{status.pacer.fee_warning}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>AI agents can exhaust the $30/quarter fee waiver in minutes. See pacer.gov.</div>
            </div>

            {/* Server config */}
            <div className="section-label">Server configuration</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ color: 'var(--text-muted)', padding: '5px 0', width: 110 }}>Transport</td>
                  <td style={{ color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{status.server_config.transport}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ color: 'var(--text-muted)', padding: '5px 0' }}>Port</td>
                  <td style={{ color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>:{status.server_config.port}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-muted)', padding: '5px 0', verticalAlign: 'top' }}>Categories</td>
                  <td style={{ padding: '5px 0' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {status.server_config.categories_enabled.map(c => (
                        <span key={c} style={{ border: '1px solid var(--border-bright)', color: 'var(--risk-low)', fontSize: 10, padding: '1px 6px' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* CourtListener */}
            <div style={{ border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>○</span>
                <span style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: 13 }}>CourtListener / RECAP</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 'auto' }}>free — preferred source</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Disabled. Set <code>COURTLISTENER_ENABLED=true</code> to activate.</div>
              <input disabled placeholder="search_live_case_law — requires COURTLISTENER_ENABLED=true"
                className="field-input" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>

            {/* PACER */}
            <div style={{ border: '1px solid var(--border)', padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: 'var(--risk-medium)', fontSize: 12 }}>○</span>
                <span style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: 13 }}>PACER</span>
                <span style={{ color: 'var(--risk-medium)', fontSize: 10, marginLeft: 'auto' }}>billable — env: {status.pacer.environment}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>Disabled. Set <code>PACER_ENABLED=true</code> + credentials.</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                {['PACER_ENABLED=true', 'PACER_ENVIRONMENT=qa', 'PACER_LOGIN_ID=...', 'PACER_PASSWORD=...'].map(v => (
                  <div key={v}>{v}</div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PanelChrome>
  )
}
