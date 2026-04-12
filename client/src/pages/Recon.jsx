import { useState } from 'react';
import { recon } from '../services/api';

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '24px',
  },
  softCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '16px',
  },
  label: { fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' },
  value: { fontSize: '1.1rem', fontWeight: 700 },
  mono: { fontFamily: 'JetBrains Mono, monospace' },
};

function Badge({ label, tone = 'neutral' }) {
  const map = {
    success: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.18)' },
    danger: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.18)' },
    warning: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.18)' },
    info: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.18)' },
    critical: { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.18)' },
    neutral: { bg: 'rgba(148,163,184,0.10)', color: 'var(--text-2)', border: '1px solid rgba(148,163,184,0.12)' },
  };
  const t = map[tone] || map.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '5px 12px',
      borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700,
      background: t.bg, color: t.color, border: t.border,
    }}>{label}</span>
  );
}

function RiskMeter({ score, level }) {
  const deg = Math.max(0, Math.min(100, score)) * 3.6;
  const color = score >= 60 ? '#f87171' : score >= 30 ? '#fb923c' : '#4ade80';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: 120, height: 120, borderRadius: '999px',
        background: `conic-gradient(${color} ${deg}deg, rgba(255,255,255,0.06) ${deg}deg)`,
        display: 'grid', placeItems: 'center', boxShadow: `0 0 30px ${color}22`,
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '999px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{score}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 700 }}>Risk Score</div>
        </div>
      </div>
      <Badge label={level} tone={score >= 60 ? 'danger' : score >= 30 ? 'warning' : 'success'} />
    </div>
  );
}

function PortRow({ port }) {
  const isDangerous = [21, 23, 445, 3306, 3389, 5432].includes(port.port);
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 16px', borderRadius: '10px',
      background: isDangerous ? 'rgba(248,113,113,0.04)' : 'rgba(34,197,94,0.04)',
      border: isDangerous ? '1px solid rgba(248,113,113,0.12)' : '1px solid rgba(34,197,94,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '10px', display: 'grid', placeItems: 'center',
          background: isDangerous ? 'rgba(248,113,113,0.12)' : 'rgba(34,197,94,0.12)',
          color: isDangerous ? '#f87171' : '#4ade80',
          fontSize: '0.82rem', fontWeight: 800,
        }}>{port.port}</div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem' }}>{port.service}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-3)', ...styles.mono }}>
            Port {port.port} — {port.state}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isDangerous && <Badge label="Risky" tone="danger" />}
        <Badge label={port.state} tone="success" />
      </div>
    </div>
  );
}

function AbuseReportRow({ report }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: '10px',
      background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.10)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
          {report.reported_at ? new Date(report.reported_at).toLocaleString() : 'Unknown date'}
        </span>
        <Badge label={report.reporter_country || 'Unknown'} tone="info" />
      </div>
      <div style={{ fontSize: '0.84rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
        {report.comment || 'No comment provided'}
      </div>
    </div>
  );
}

export default function Recon() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('ports');

  const runRecon = async () => {
    if (!domain.trim()) return;
    setScanning(true);
    setError('');
    setResult(null);

    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
      const r = await recon.full(cleanDomain);
      setResult(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Reconnaissance failed');
    }
    setScanning(false);
  };

  const portData = result?.port_scan || {};
  const abuseData = result?.abuse_check || {};

  return (
    <div style={styles.page}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)' }}>
          Network Reconnaissance
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', marginTop: '4px' }}>
          Scan open ports, check IP reputation, and assess server exposure using Nmap and AbuseIPDB.
        </p>
      </div>

      {/* Scanner Input */}
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{
            flex: 1, background: 'var(--bg-input)',
            border: '1px solid var(--border)', borderRadius: '14px',
            display: 'flex', alignItems: 'center', padding: '0 18px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="2" y="2" width="20" height="20" rx="4" /><path d="M12 8v4m0 4h.01" />
            </svg>
            <input value={domain} onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runRecon()}
              placeholder="Enter domain to scan (e.g. example.com)"
              style={{
                flex: 1, padding: '16px 14px', background: 'transparent', border: 'none',
                color: 'var(--text-1)', fontSize: '0.92rem', outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
          <button onClick={runRecon} disabled={scanning} style={{
            padding: '16px 36px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            color: 'white', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', opacity: scanning ? 0.6 : 1,
            boxShadow: '0 4px 20px rgba(168,85,247,0.25)',
            minWidth: '160px', textAlign: 'center',
          }}>
            {scanning ? 'Scanning...' : '🔍 Run Recon'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '12px',
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)',
          color: '#f87171', fontWeight: 600, fontSize: '0.88rem',
        }}>{error}</div>
      )}

      {result && (
        <>
          {/* Summary Banner */}
          <div style={{
            ...styles.card,
            background: result.combined_risk_score >= 60
              ? 'linear-gradient(180deg, rgba(48,18,24,0.95), rgba(15,12,24,0.98))'
              : result.combined_risk_score >= 30
              ? 'linear-gradient(180deg, rgba(48,38,14,0.95), rgba(15,12,24,0.98))'
              : 'linear-gradient(180deg, rgba(12,32,24,0.95), rgba(10,18,34,0.98))',
            border: result.combined_risk_score >= 60
              ? '1px solid rgba(248,113,113,0.20)'
              : result.combined_risk_score >= 30
              ? '1px solid rgba(251,146,60,0.20)'
              : '1px solid rgba(34,197,94,0.18)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <Badge label={result.combined_risk_level} tone={result.combined_risk_score >= 60 ? 'danger' : result.combined_risk_score >= 30 ? 'warning' : 'success'} />
                  <Badge label={`IP: ${result.ip || 'Unknown'}`} tone="info" />
                  <Badge label={`${portData.open_count || 0} open ports`} tone={portData.open_count > 5 ? 'warning' : 'info'} />
                  {abuseData.total_reports > 0 && (
                    <Badge label={`${abuseData.total_reports} abuse reports`} tone="danger" />
                  )}
                </div>

                <h3 style={{
                  fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px',
                  color: result.combined_risk_score >= 60 ? '#f87171' : result.combined_risk_score >= 30 ? '#fb923c' : '#4ade80',
                }}>
                  {result.domain}
                </h3>

                <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  Combined reconnaissance result based on port exposure analysis and IP abuse reputation data.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '18px' }}>
                  <div style={styles.softCard}>
                    <div style={styles.label}>Resolved IP</div>
                    <div style={{ ...styles.value, ...styles.mono, color: 'var(--text-1)', fontSize: '0.95rem' }}>
                      {result.ip || 'N/A'}
                    </div>
                  </div>
                  <div style={styles.softCard}>
                    <div style={styles.label}>ISP</div>
                    <div style={{ ...styles.value, color: 'var(--text-1)', fontSize: '0.95rem' }}>
                      {abuseData.isp || 'Unknown'}
                    </div>
                  </div>
                  <div style={styles.softCard}>
                    <div style={styles.label}>Country</div>
                    <div style={{ ...styles.value, color: 'var(--text-1)', fontSize: '0.95rem' }}>
                      {abuseData.country_name || 'Unknown'}
                    </div>
                  </div>
                  <div style={styles.softCard}>
                    <div style={styles.label}>Scan Duration</div>
                    <div style={{ ...styles.value, color: 'var(--text-1)', fontSize: '0.95rem' }}>
                      {portData.scan_duration_seconds || 0}s
                    </div>
                  </div>
                </div>
              </div>

              <RiskMeter score={result.combined_risk_score} level={result.combined_risk_level} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ports', 'abuse', 'findings'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '9px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
                background: tab === t ? 'rgba(168,85,247,0.12)' : 'transparent',
                color: tab === t ? '#a855f7' : 'var(--text-3)',
                border: tab === t ? '1px solid rgba(168,85,247,0.15)' : '1px solid transparent',
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>

          {/* Ports Tab */}
          {tab === 'ports' && (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>Open Port Discovery</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '2px' }}>
                    Scanned {portData.total_ports_scanned || 0} common ports on {result.ip}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge label={`${portData.open_count || 0} open`} tone="warning" />
                  <Badge label={`${portData.closed_count || 0} closed`} tone="success" />
                </div>
              </div>

              {portData.open_ports?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {portData.open_ports.map((port, i) => (
                    <PortRow key={i} port={port} />
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)',
                  borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.16)',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                    No open ports detected
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    All {portData.total_ports_scanned || 0} scanned ports are closed or filtered.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Abuse Tab */}
          {tab === 'abuse' && (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>AbuseIPDB Reputation</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '2px' }}>
                    IP abuse intelligence for {abuseData.ip || result.ip}
                  </p>
                </div>
                {abuseData.abuse_confidence_score != null && (
                  <Badge
                    label={`Abuse Score: ${abuseData.abuse_confidence_score}%`}
                    tone={abuseData.abuse_confidence_score >= 50 ? 'danger' : abuseData.abuse_confidence_score >= 25 ? 'warning' : 'success'}
                  />
                )}
              </div>

              {abuseData.error && !abuseData.is_checked ? (
                <div style={{
                  padding: '16px', borderRadius: '12px',
                  background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.18)',
                  color: '#fb923c', fontSize: '0.86rem',
                }}>
                  {abuseData.error}. Get a free key at abuseipdb.com
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
                    <div style={styles.softCard}>
                      <div style={styles.label}>Abuse Confidence</div>
                      <div style={{
                        ...styles.value, color: abuseData.abuse_confidence_score >= 50 ? '#f87171' : abuseData.abuse_confidence_score >= 25 ? '#fb923c' : '#4ade80',
                      }}>{abuseData.abuse_confidence_score ?? 'N/A'}%</div>
                    </div>
                    <div style={styles.softCard}>
                      <div style={styles.label}>Total Reports</div>
                      <div style={{ ...styles.value, color: abuseData.total_reports > 0 ? '#f87171' : '#4ade80' }}>
                        {abuseData.total_reports ?? 0}
                      </div>
                    </div>
                    <div style={styles.softCard}>
                      <div style={styles.label}>Distinct Reporters</div>
                      <div style={{ ...styles.value, color: '#38bdf8' }}>{abuseData.num_distinct_users ?? 0}</div>
                    </div>
                    <div style={styles.softCard}>
                      <div style={styles.label}>Usage Type</div>
                      <div style={{ ...styles.value, color: 'var(--text-1)', fontSize: '0.9rem' }}>
                        {abuseData.usage_type || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  {/* Attack Categories */}
                  {abuseData.attack_categories?.length > 0 && (
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ ...styles.label, marginBottom: '10px' }}>Reported Attack Categories</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {abuseData.attack_categories.map((cat, i) => (
                          <Badge key={i} label={cat} tone="danger" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Reports */}
                  {abuseData.recent_reports?.length > 0 && (
                    <div>
                      <div style={{ ...styles.label, marginBottom: '10px' }}>Recent Abuse Reports</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {abuseData.recent_reports.map((report, i) => (
                          <AbuseReportRow key={i} report={report} />
                        ))}
                      </div>
                    </div>
                  )}

                  {abuseData.total_reports === 0 && (
                    <div style={{
                      padding: '36px 20px', textAlign: 'center', color: 'var(--text-3)',
                      borderRadius: '12px', border: '1px dashed rgba(34,197,94,0.16)',
                      background: 'rgba(34,197,94,0.03)',
                    }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80', marginBottom: '6px' }}>
                        Clean IP — No abuse reports
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        This IP has not been reported to AbuseIPDB in the last 90 days.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Findings Tab */}
          {tab === 'findings' && (
            <div style={styles.card}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '18px' }}>
                Security Findings & Recommendations
              </h3>

              {portData.risk_findings?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                  {portData.risk_findings.map((finding, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '14px 16px', borderRadius: '10px',
                      background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.12)',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '999px',
                        background: '#f87171', marginTop: 7, flexShrink: 0,
                      }} />
                      <div style={{ color: 'var(--text-2)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                        {finding}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '36px 20px', textAlign: 'center', color: 'var(--text-3)',
                  borderRadius: '12px', border: '1px dashed rgba(34,197,94,0.16)',
                  background: 'rgba(34,197,94,0.03)', marginBottom: '18px',
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80', marginBottom: '6px' }}>
                    No critical port findings
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    No high-risk ports or services were detected on this target.
                  </div>
                </div>
              )}

              {/* General Recommendations */}
              <div style={{ ...styles.label, marginBottom: '10px' }}>General Recommendations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  portData.open_count > 5 && 'Consider reducing the number of exposed services to minimize attack surface.',
                  portData.open_ports?.some(p => p.port === 21) && 'Disable FTP or switch to SFTP for secure file transfers.',
                  portData.open_ports?.some(p => p.port === 23) && 'Disable Telnet immediately — it transmits credentials in plaintext.',
                  portData.open_ports?.some(p => p.port === 3389) && 'Restrict RDP access behind a VPN or use Network Level Authentication.',
                  portData.open_ports?.some(p => [3306, 5432].includes(p.port)) && 'Database ports should not be exposed publicly — restrict to localhost or VPN.',
                  abuseData.total_reports > 0 && `This IP has ${abuseData.total_reports} abuse report(s) — investigate and consider blocklisting.`,
                  abuseData.abuse_confidence_score >= 50 && 'High abuse score indicates this IP is actively involved in malicious activity.',
                  'Regularly scan for new open ports and monitor changes to your server exposure.',
                ].filter(Boolean).map((rec, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '12px 16px', borderRadius: '10px',
                    background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.10)',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '999px',
                      background: '#38bdf8', marginTop: 7, flexShrink: 0,
                    }} />
                    <div style={{ color: 'var(--text-2)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                      {rec}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}