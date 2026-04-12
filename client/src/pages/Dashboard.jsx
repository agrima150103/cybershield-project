import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { scan, threats, reports } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useWebSocket from '../hooks/useWebSocket';

const PIE_COLORS = ['#34d399', '#fbbf24', '#f87171'];

export default function Dashboard() {
  const { user } = useAuth();
  const { connected, alerts } = useWebSocket();
  const [history, setHistory] = useState([]);
  const [threatList, setThreatList] = useState([]);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [tab, setTab] = useState('scanner');

  useEffect(() => {
    scan.history().then(r => setHistory(r.data)).catch(() => {});
    threats.recent().then(r => setThreatList(r.data)).catch(() => {});
  }, []);

  const doScan = async () => {
    if (!url) return;
    setScanning(true); setResult(null);
    try {
      const r = await scan.url(url);
      setResult(r.data);
      setHistory((await scan.history()).data);
    } catch { setResult({ error: true }); }
    setScanning(false);
  };

  const downloadPdf = async () => {
    if (!result || downloading) return;
    setDownloading(true);
    try {
      await reports.generate(result);
    } catch {
      alert('PDF generation failed');
    }
    setDownloading(false);
  };

  const scoreColor = s => s > 0.6 ? '#f87171' : s > 0.3 ? '#fbbf24' : '#34d399';
  const scoreLabel = s => s > 0.6 ? 'High Risk' : s > 0.3 ? 'Suspicious' : 'Safe';

  const dist = [
    { name: 'Safe', value: history.filter(s => s.threat_score <= 0.3).length },
    { name: 'Suspicious', value: history.filter(s => s.threat_score > 0.3 && s.threat_score <= 0.6).length },
    { name: 'Malicious', value: history.filter(s => s.threat_score > 0.6).length },
  ];

  const barData = history.slice(0, 12).map(s => ({
    name: s.domain?.substring(0, 16) || '?',
    score: s.threat_score,
    fill: scoreColor(s.threat_score),
  }));

  const stats = [
    { label: 'Total Scans', value: history.length, color: '#38bdf8', change: '+12% this week' },
    { label: 'Malicious Found', value: history.filter(s => s.is_malicious).length, color: '#f87171', change: 'Flagged threats' },
    { label: 'Threat Feeds', value: threatList.length, color: '#fbbf24', change: 'From 3 sources' },
    { label: 'Safe URLs', value: history.filter(s => !s.is_malicious).length, color: '#34d399', change: 'Verified clean' },
  ];

  const tabs = ['scanner', 'history', 'threats'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome */}
      <div className="fade-up">
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
          Welcome back, {user?.username} 👋
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', marginTop: '4px' }}>
          Here's what's happening with your threat intelligence today.
        </p>
      </div>

      {/* Live WebSocket Status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 16px', borderRadius: '14px',
        background: connected ? 'rgba(34,197,94,0.08)' : 'rgba(248,113,113,0.08)',
        border: connected ? '1px solid rgba(34,197,94,0.18)' : '1px solid rgba(248,113,113,0.18)',
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '999px',
          background: connected ? '#22c55e' : '#f87171',
          boxShadow: connected ? '0 0 8px #22c55e55' : '0 0 8px #f8717155',
          animation: connected ? 'pulse 2s infinite' : 'none',
        }} />
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: connected ? '#4ade80' : '#f87171' }}>
          {connected ? 'Live Threat Feed Connected' : 'Live Feed Disconnected'}
        </span>
        {alerts.length > 0 && (
          <span style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: '999px',
            background: 'rgba(248,113,113,0.12)', color: '#f87171',
            fontSize: '0.76rem', fontWeight: 700,
          }}>
            {alerts.length} alert{alerts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Recent live alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.slice(0, 3).map((alert, i) => (
            <div key={i} style={{
              padding: '12px 16px', borderRadius: '12px',
              background: alert.type === 'threat_alert' ? 'rgba(248,113,113,0.08)' : 'rgba(56,189,248,0.08)',
              border: alert.type === 'threat_alert' ? '1px solid rgba(248,113,113,0.16)' : '1px solid rgba(56,189,248,0.16)',
              fontSize: '0.84rem', color: 'var(--text-2)',
              animation: 'fadeIn 0.3s ease',
            }}>
              <strong style={{ color: alert.type === 'threat_alert' ? '#f87171' : '#38bdf8' }}>
                {alert.type === 'threat_alert' ? '🚨 Threat Alert' : '✓ Scan Complete'}
              </strong>
              {' — '}
              {alert.data?.url || alert.data?.domain || 'Unknown'}
              {alert.data?.threat_score != null && ` (Score: ${(alert.data.threat_score * 100).toFixed(0)}%)`}
              {alert.data?.ml_prediction && (
                <span style={{
                  marginLeft: '8px', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                  background: alert.data.ml_prediction === 'phishing' ? 'rgba(248,113,113,0.12)' : 'rgba(34,197,94,0.12)',
                  color: alert.data.ml_prediction === 'phishing' ? '#f87171' : '#4ade80',
                }}>
                  ML: {alert.data.ml_prediction}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
            background: tab === t ? 'var(--cyan-dim)' : 'transparent',
            color: tab === t ? 'var(--cyan)' : 'var(--text-3)',
            border: tab === t ? '1px solid rgba(56,189,248,0.15)' : '1px solid transparent',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'scanner' && (
        <>
          {/* Top Row: Stats + Pie Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {stats.map((s, i) => (
                <div key={i} className={`fade-up delay-${i + 1}`} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '16px', padding: '22px 24px',
                  borderLeft: `3px solid ${s.color}`,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  minHeight: '120px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-3)' }}>{s.label}</span>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17l9.2-9.2M17 17V7H7"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '6px', fontWeight: 500 }}>
                      {s.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fade-up delay-2" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)' }}>Threat Distribution</span>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600,
                  background: 'var(--cyan-dim)', color: 'var(--cyan)',
                }}>{history.length} scans</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                      {dist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} fillOpacity={0.9} stroke="transparent" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111a2d', border: '1px solid rgba(56,189,248,0.1)', borderRadius: '10px', fontFamily: 'Montserrat', fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px' }}>
                {dist.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[i] }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* URL Scanner */}
          <div className="fade-up delay-3" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '28px',
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>URL Scanner</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginTop: '4px' }}>
                Analyze any URL for phishing, malware, and suspicious indicators
              </p>
            </div>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{
                flex: 1, background: 'var(--bg-input)',
                border: '1px solid var(--border)', borderRadius: '14px',
                display: 'flex', alignItems: 'center', padding: '0 18px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doScan()}
                  placeholder="Enter URL to scan (e.g. https://suspicious-site.com)"
                  style={{
                    flex: 1, padding: '16px 14px', background: 'transparent', border: 'none',
                    color: 'var(--text-1)', fontSize: '0.92rem', outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
              <button onClick={doScan} disabled={scanning} style={{
                padding: '16px 36px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                color: 'white', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', opacity: scanning ? 0.6 : 1, whiteSpace: 'nowrap',
                boxShadow: '0 4px 20px rgba(56,189,248,0.25)',
                minWidth: '140px', textAlign: 'center',
              }}>
                {scanning ? 'Scanning...' : 'Scan URL'}
              </button>
            </div>

            {/* Scan Result */}
            {result && !result.error && (
              <div style={{
                marginTop: '24px', padding: '24px', borderRadius: '14px',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
              }} className="fade-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{result.domain}</h3>
                    <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '4px' }}>{result.url}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: scoreColor(result.threat_score), lineHeight: 1 }}>
                      {(result.threat_score * 100).toFixed(0)}%
                    </div>
                    <span style={{
                      padding: '4px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                      background: `${scoreColor(result.threat_score)}18`, color: scoreColor(result.threat_score),
                    }}>{scoreLabel(result.threat_score)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--bg-base)', marginBottom: '22px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '4px', width: `${result.threat_score * 100}%`,
                    background: `linear-gradient(90deg, #34d399, ${scoreColor(result.threat_score)})`,
                    transition: 'width 0.8s ease',
                  }} />
                </div>

                {/* Info Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  {[
                    { l: 'SSL Certificate', v: result.ssl_info?.has_ssl ? 'Valid' : 'Missing', c: result.ssl_info?.has_ssl ? '#34d399' : '#f87171' },
                    { l: 'IP-Based URL', v: result.features?.has_ip_address ? 'Yes' : 'No', c: result.features?.has_ip_address ? '#f87171' : '#34d399' },
                    { l: 'Domain Age', v: result.whois_data?.domain_age_days ? `${result.whois_data.domain_age_days} days` : 'N/A', c: 'var(--text-1)' },
                    { l: 'VirusTotal', v: `${result.virustotal_result?.malicious_count || 0} flags`, c: (result.virustotal_result?.malicious_count || 0) > 0 ? '#f87171' : '#34d399' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '18px', borderRadius: '12px',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.l}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: item.c }}>{item.v}</div>
                    </div>
                  ))}
                </div>

                {/* ML Analysis */}
                {result.ml_analysis?.ml_available && (
                  <div style={{
                    marginTop: '18px', padding: '18px', borderRadius: '12px',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                      ML Model Analysis
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '4px' }}>Random Forest</div>
                        <div style={{
                          fontSize: '1.1rem', fontWeight: 800,
                          color: result.ml_analysis.rf_prediction === 'phishing' ? '#f87171' : '#34d399',
                        }}>
                          {(result.ml_analysis.rf_phishing_probability * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '4px' }}>Gradient Boost</div>
                        <div style={{
                          fontSize: '1.1rem', fontWeight: 800,
                          color: result.ml_analysis.gb_prediction === 'phishing' ? '#f87171' : '#34d399',
                        }}>
                          {(result.ml_analysis.gb_phishing_probability * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '4px' }}>Ensemble</div>
                        <div style={{
                          fontSize: '1.1rem', fontWeight: 800,
                          color: result.ml_analysis.ensemble_prediction === 'phishing' ? '#f87171' : '#34d399',
                        }}>
                          {(result.ml_analysis.ensemble_score * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '4px' }}>Verdict</div>
                        <span style={{
                          padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                          background: result.ml_analysis.ensemble_prediction === 'phishing' ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
                          color: result.ml_analysis.ensemble_prediction === 'phishing' ? '#f87171' : '#34d399',
                        }}>
                          {result.ml_analysis.ensemble_prediction}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Download PDF Report */}
                <button onClick={downloadPdf} disabled={downloading} style={{
                  marginTop: '18px', padding: '14px 24px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #fb923c, #f87171)',
                  color: 'white', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(251,146,60,0.22)',
                  opacity: downloading ? 0.6 : 1,
                }}>
                  {downloading ? '⏳ Generating...' : '📄 Download PDF Report'}
                </button>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          {history.length > 0 && (
            <div className="fade-up delay-4" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '28px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Recent Scan Scores</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '2px' }}>Threat scores from your latest URL scans</p>
                </div>
                <span style={{
                  padding: '4px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600,
                  background: 'var(--cyan-dim)', color: 'var(--cyan)',
                }}>Last {barData.length} scans</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} barSize={40}>
                  <XAxis dataKey="name"
                    tick={{ fill: '#556780', fontSize: 11, fontFamily: 'Montserrat' }}
                    axisLine={{ stroke: 'rgba(56,189,248,0.06)' }}
                    tickLine={false} />
                  <YAxis domain={[0, 1]}
                    tick={{ fill: '#556780', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(56,189,248,0.04)' }}
                    contentStyle={{
                      background: '#111a2d', border: '1px solid rgba(56,189,248,0.15)',
                      borderRadius: '10px', fontFamily: 'Montserrat', fontSize: '0.82rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    }}
                    formatter={(val) => [`${(val * 100).toFixed(0)}%`, 'Threat Score']}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {barData.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="fade-in" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['URL', 'Domain', 'Score', 'Status', 'Date'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '16px 22px', fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="mono" style={{ padding: '16px 22px', fontSize: '0.75rem', color: 'var(--text-2)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</td>
                  <td style={{ padding: '16px 22px', color: 'var(--text-2)' }}>{s.domain}</td>
                  <td style={{ padding: '16px 22px', fontWeight: 700, color: scoreColor(s.threat_score) }}>{(s.threat_score * 100).toFixed(0)}%</td>
                  <td style={{ padding: '16px 22px' }}>
                    <span style={{
                      padding: '5px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600,
                      background: s.is_malicious ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
                      color: s.is_malicious ? '#f87171' : '#34d399',
                    }}>{s.is_malicious ? 'Malicious' : 'Safe'}</span>
                  </td>
                  <td style={{ padding: '16px 22px', color: 'var(--text-3)', fontSize: '0.82rem' }}>{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '56px', textAlign: 'center', color: 'var(--text-3)' }}>No scans yet — try scanning a URL</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Threats Tab */}
      {tab === 'threats' && (
        <div className="fade-in" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{threatList.length} threats loaded</span>
            <button onClick={async () => { await threats.fetchFeeds(); setThreatList((await threats.recent()).data); }}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)', color: 'white',
                fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(56,189,248,0.2)',
              }}>Refresh Feeds</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['URL', 'Source', 'Type', 'Confidence'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '16px 22px', fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {threatList.map(t => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="mono" style={{ padding: '16px 22px', fontSize: '0.75rem', color: 'var(--text-2)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.url}</td>
                  <td style={{ padding: '16px 22px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: 'var(--cyan-dim)', color: 'var(--cyan)' }}>{t.source}</span>
                  </td>
                  <td style={{ padding: '16px 22px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: 'var(--amber-dim)', color: 'var(--amber)' }}>{t.threat_type}</span>
                  </td>
                  <td style={{ padding: '16px 22px', color: 'var(--text-2)', fontWeight: 600 }}>{((t.confidence || 0) * 100).toFixed(0)}%</td>
                </tr>
              ))}
              {threatList.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '56px', textAlign: 'center', color: 'var(--text-3)' }}>No threats loaded — click Refresh Feeds</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}