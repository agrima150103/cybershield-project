import { useState } from 'react';
import { yaraScan } from '../services/api';

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
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700, background: t.bg, color: t.color, border: t.border }}>{label}</span>;
}

function sevTone(s) {
  return s === 'critical' ? 'critical' : s === 'high' ? 'danger' : s === 'medium' ? 'warning' : 'info';
}

export default function YaraScan() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [rules, setRules] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState('scan');

  const doScan = async () => {
    if (!url.trim()) return;
    setScanning(true); setResult(null);
    try {
      const r = await yaraScan.scan(url.trim());
      setResult(r.data);
    } catch { setResult({ error: 'Scan failed' }); }
    setScanning(false);
  };

  const loadRules = async () => {
    try { const r = await yaraScan.getRules(); setRules(r.data); } catch {}
  };

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' };
  const soft = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)' }}>YARA Rule Scanner</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', marginTop: '4px' }}>
          Scan web pages against custom YARA rules to detect phishing kits, credential harvesting, brand impersonation, and obfuscated redirects.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {['scan', 'rules'].map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'rules' && !rules) loadRules(); }} style={{
            padding: '9px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
            background: tab === t ? 'rgba(168,85,247,0.12)' : 'transparent', color: tab === t ? '#a855f7' : 'var(--text-3)',
            border: tab === t ? '1px solid rgba(168,85,247,0.15)' : '1px solid transparent',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'scan' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && doScan()}
                placeholder="Enter URL to scan with YARA rules (e.g. http://suspicious-site.com)"
                style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
              />
              <button onClick={doScan} disabled={scanning} style={{
                padding: '14px 28px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: 'white', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', opacity: scanning ? 0.6 : 1, boxShadow: '0 4px 16px rgba(168,85,247,0.22)',
              }}>{scanning ? 'Scanning...' : '🔬 YARA Scan'}</button>
            </div>
          </div>

          {result && !result.error && (
            <>
              <div style={{
                ...card,
                border: result.risk_score >= 50 ? '1px solid rgba(248,113,113,0.20)' : result.risk_score >= 25 ? '1px solid rgba(251,146,60,0.20)' : '1px solid rgba(34,197,94,0.18)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>Scan Results</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>{result.url}</p>
                  </div>
                  <Badge label={`${result.risk_level} — Score ${result.risk_score}`} tone={result.risk_score >= 50 ? 'danger' : result.risk_score >= 25 ? 'warning' : 'success'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
                  {[
                    { l: 'Rules matched', v: result.total_matches, c: result.total_matches > 0 ? '#f87171' : '#4ade80' },
                    { l: 'Rules loaded', v: result.rules_loaded, c: '#38bdf8' },
                    { l: 'Status code', v: result.status_code || 'N/A', c: 'var(--text-1)' },
                    { l: 'Risk score', v: `${result.risk_score}%`, c: result.risk_score >= 50 ? '#f87171' : result.risk_score >= 25 ? '#fb923c' : '#4ade80' },
                  ].map((s, i) => (
                    <div key={i} style={soft}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{s.l}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Page analysis */}
                {result.page_analysis && (
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Page characteristics</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge label={result.page_analysis.has_forms ? 'Forms detected' : 'No forms'} tone={result.page_analysis.has_forms ? 'warning' : 'success'} />
                      <Badge label={result.page_analysis.has_password_field ? 'Password field found' : 'No password fields'} tone={result.page_analysis.has_password_field ? 'danger' : 'success'} />
                      <Badge label={result.page_analysis.has_iframe ? 'iFrame detected' : 'No iFrames'} tone={result.page_analysis.has_iframe ? 'warning' : 'neutral'} />
                      <Badge label={result.page_analysis.has_obfuscation ? 'Obfuscation detected' : 'No obfuscation'} tone={result.page_analysis.has_obfuscation ? 'danger' : 'success'} />
                      <Badge label={`${result.page_analysis.external_links_count} external links`} tone="info" />
                    </div>
                  </div>
                )}

                {/* Matched rules */}
                {result.matches.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Matched YARA rules</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {result.matches.map((m, i) => (
                        <div key={i} style={soft}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem' }}>{m.rule_name}</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <Badge label={m.severity} tone={sevTone(m.severity)} />
                              <Badge label={m.category} tone="info" />
                              <Badge label={`+${m.score_contribution} pts`} tone="warning" />
                            </div>
                          </div>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-2)', margin: '0 0 8px', lineHeight: 1.6 }}>{m.description}</p>
                          {m.matched_strings?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {m.matched_strings.map((s, j) => (
                                <div key={j} style={{ fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-3)', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-card)' }}>
                                  {s.identifier}: {s.matched_text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-3)', borderRadius: '12px', border: '1px dashed rgba(34,197,94,0.16)', background: 'rgba(34,197,94,0.03)' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80', marginBottom: '6px' }}>Clean — no YARA rules matched</div>
                    <div style={{ fontSize: '0.85rem' }}>No phishing patterns, credential harvesting, or obfuscation detected.</div>
                  </div>
                )}
              </div>
            </>
          )}

          {result?.error && (
            <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', fontSize: '0.86rem', fontWeight: 600 }}>{result.error}</div>
          )}
        </>
      )}

      {tab === 'rules' && rules && (
        <div style={{ ...card, overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['Rule name', 'Description', 'Severity', 'Category'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.rules?.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>{r.name}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-2)' }}>{r.description}</td>
                  <td style={{ padding: '14px 20px' }}><Badge label={r.severity} tone={sevTone(r.severity)} /></td>
                  <td style={{ padding: '14px 20px' }}><Badge label={r.category} tone="info" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}