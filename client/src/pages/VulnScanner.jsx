import { useMemo, useState } from 'react';
import { vulnScan, shodan } from '../services/api';

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
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 12px',
        borderRadius: '999px',
        fontSize: '0.74rem',
        fontWeight: 700,
        background: t.bg,
        color: t.color,
        border: t.border,
      }}
    >
      {label}
    </span>
  );
}

function sevTone(s) {
  return s === 'critical'
    ? 'critical'
    : s === 'high'
      ? 'danger'
      : s === 'medium'
        ? 'warning'
        : s === 'good'
          ? 'success'
          : 'info';
}

function prettyCpe(cpe) {
  if (!cpe || typeof cpe !== 'string') return 'Unknown';

  try {
    // Example: cpe:/a:apache:http_server:2.4.7
    const parts = cpe.split(':');
    const vendor = parts[2] || '';
    const product = parts[3] || '';
    const version = parts[4] || '';

    const toTitle = (str) =>
      str
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase());

    const vendorText = vendor ? toTitle(vendor) : '';
    const productText = product ? toTitle(product) : '';
    const versionText = version ? ` ${version}` : '';

    return `${vendorText}${vendorText && productText ? ' ' : ''}${productText}${versionText}`.trim() || cpe;
  } catch {
    return cpe;
  }
}

export default function VulnScanner() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [shodanResult, setShodanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState('headers');
  const [showAllCves, setShowAllCves] = useState(false);

  const card = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '24px',
  };

  const soft = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px',
  };

  const actionBtn = {
    padding: '9px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(56,189,248,0.16)',
    background: 'rgba(56,189,248,0.08)',
    color: '#38bdf8',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const doScan = async () => {
    if (!url.trim()) return;

    setScanning(true);
    setResult(null);
    setShodanResult(null);
    setShowAllCves(false);

    try {
      const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
      const domain = cleanUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      const [vulnRes, shodanRes] = await Promise.all([
        vulnScan.full(cleanUrl),
        shodan.lookup(domain).catch(() => ({ data: null })),
      ]);

      setResult(vulnRes.data);
      setShodanResult(shodanRes.data);
    } catch {
      setResult({ error: 'Scan failed' });
    }

    setScanning(false);
  };

  const headers = result?.security_headers || {};
  const paths = result?.exposed_paths || {};
  const sslData = result?.ssl_analysis || {};

  const shodanTechnologies = useMemo(() => {
    if (!shodanResult?.technologies?.length) return [];
    return shodanResult.technologies.map(prettyCpe);
  }, [shodanResult]);

  const visibleCves = useMemo(() => {
    const all = shodanResult?.vulnerabilities || [];
    return showAllCves ? all : all.slice(0, 10);
  }, [shodanResult, showAllCves]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)' }}>
          Vulnerability Scanner
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', marginTop: '4px' }}>
          Check security headers, exposed paths, SSL/TLS configuration, and Shodan fingerprinting.
        </p>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', gap: '14px' }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doScan()}
            placeholder="Enter URL or domain (e.g. example.com)"
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={doScan}
            disabled={scanning}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #f87171, #a855f7)',
              color: 'white',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              opacity: scanning ? 0.6 : 1,
              boxShadow: '0 4px 16px rgba(248,113,113,0.22)',
              whiteSpace: 'nowrap',
            }}
          >
            {scanning ? 'Scanning...' : '🛡️ Full Scan'}
          </button>
        </div>
      </div>

      {result && !result.error && (
        <>
          <div
            style={{
              ...card,
              border:
                result.combined_score >= 40
                  ? '1px solid rgba(248,113,113,0.20)'
                  : result.combined_score >= 20
                    ? '1px solid rgba(251,146,60,0.20)'
                    : '1px solid rgba(34,197,94,0.18)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>
                  {result.domain}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: 0 }}>{result.url}</p>
              </div>
              <Badge
                label={`${result.risk_level} — Score ${result.combined_score}`}
                tone={result.combined_score >= 40 ? 'danger' : result.combined_score >= 20 ? 'warning' : 'success'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              <div style={soft}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Total findings
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: result.total_findings > 5 ? '#f87171' : '#fb923c' }}>
                  {result.total_findings}
                </div>
              </div>

              <div style={soft}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Header score
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: headers.header_score > 30 ? '#f87171' : '#4ade80' }}>
                  {headers.header_score || 0}
                </div>
              </div>

              <div style={soft}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Exposure score
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: paths.exposure_score > 20 ? '#f87171' : '#4ade80' }}>
                  {paths.exposure_score || 0}
                </div>
              </div>

              <div style={soft}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  SSL score
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: sslData.ssl_score > 20 ? '#f87171' : '#4ade80' }}>
                  {sslData.ssl_score || 0}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['headers', 'paths', 'ssl', 'shodan'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  background: tab === t ? 'rgba(248,113,113,0.12)' : 'transparent',
                  color: tab === t ? '#f87171' : 'var(--text-3)',
                  border: tab === t ? '1px solid rgba(248,113,113,0.15)' : '1px solid transparent',
                }}
              >
                {t === 'ssl' ? 'SSL/TLS' : t === 'shodan' ? 'Shodan' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'headers' && (
            <div style={card}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px' }}>
                Security headers analysis
              </h3>

              {headers.missing_headers?.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Missing headers
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {headers.missing_headers.map((h, i) => (
                      <div key={i} style={{ ...soft, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.88rem', fontFamily: 'JetBrains Mono, monospace' }}>
                            {h.header}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '2px' }}>{h.issue}</div>
                        </div>
                        <Badge label={h.severity} tone={sevTone(h.severity)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {headers.present_headers?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Present headers
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {headers.present_headers.map((h, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(34,197,94,0.04)',
                          border: '1px solid rgba(34,197,94,0.10)',
                        }}
                      >
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: '#4ade80' }}>
                          {h.header}
                        </span>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-3)',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'paths' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>Exposed paths</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge label={`${paths.paths_checked} checked`} tone="info" />
                  <Badge label={`${paths.paths_found} found`} tone={paths.paths_found > 3 ? 'danger' : 'warning'} />
                </div>
              </div>

              {paths.found?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {paths.found.map((p, i) => (
                    <div key={i} style={{ ...soft, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.88rem', fontFamily: 'JetBrains Mono, monospace' }}>
                          {p.path}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '2px' }}>{p.description}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <Badge label={`HTTP ${p.status_code}`} tone={p.status_code === 200 ? 'danger' : 'warning'} />
                        <Badge label={p.severity} tone={sevTone(p.severity)} />
                        {p.accessible && <Badge label="Accessible" tone="danger" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', color: '#4ade80', borderRadius: '12px', border: '1px dashed rgba(34,197,94,0.16)' }}>
                  No sensitive paths exposed
                </div>
              )}
            </div>
          )}

          {tab === 'ssl' && (
            <div style={card}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px' }}>
                SSL/TLS analysis
              </h3>

              {sslData.has_ssl ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '18px' }}>
                    <div style={soft}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '4px' }}>TLS version</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{sslData.tls_version}</div>
                    </div>
                    <div style={soft}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '4px' }}>Cipher</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.85rem' }}>{sslData.cipher}</div>
                    </div>
                    <div style={soft}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '4px' }}>Expires in</div>
                      <div style={{ fontWeight: 700, color: sslData.days_until_expiry < 30 ? '#f87171' : '#4ade80' }}>
                        {sslData.days_until_expiry} days
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sslData.findings?.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: f.severity === 'good' ? 'rgba(34,197,94,0.04)' : 'rgba(248,113,113,0.04)',
                          border: f.severity === 'good' ? '1px solid rgba(34,197,94,0.10)' : '1px solid rgba(248,113,113,0.10)',
                        }}
                      >
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-2)' }}>{f.issue}</span>
                        <Badge label={f.severity} tone={sevTone(f.severity)} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.14)', color: '#f87171' }}>
                  TLS analysis failed or HTTPS is unavailable for this host. This can indicate an insecure deployment, an HTTP-only service, or a handshake/network issue.
                  <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-3)' }}>
                    Details: {sslData.error || 'No additional error details'}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'shodan' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                    Shodan fingerprint
                  </h3>
                  <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--text-3)' }}>
                    Passive internet exposure and technology intelligence
                  </p>
                </div>
                {shodanResult?.source && <Badge label={shodanResult.source} tone="info" />}
              </div>

              {shodanResult?.found ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
                    <div style={soft}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '4px' }}>OS</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{shodanResult.os || 'Unknown'}</div>
                    </div>
                    <div style={soft}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '4px' }}>Organization</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.85rem' }}>{shodanResult.organization || 'Unknown'}</div>
                    </div>
                    <div style={soft}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '4px' }}>Country</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{shodanResult.country || 'Unknown'}</div>
                    </div>
                    <div style={soft}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '4px' }}>Open ports</div>
                      <div style={{ fontWeight: 700, color: (shodanResult.open_ports?.length || 0) > 5 ? '#f87171' : '#4ade80' }}>
                        {shodanResult.open_ports?.length || 0}
                      </div>
                    </div>
                  </div>

                  {shodanTechnologies.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Technologies detected
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {shodanTechnologies.map((t, i) => (
                          <Badge key={i} label={t} tone="info" />
                        ))}
                      </div>
                    </div>
                  )}

                  {shodanResult.vulnerabilities?.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
                          Known vulnerabilities (CVEs)
                        </div>
                        {shodanResult.vulnerabilities.length > 10 && (
                          <button
                            onClick={() => setShowAllCves((v) => !v)}
                            style={actionBtn}
                          >
                            {showAllCves ? 'Show less' : `Show more (${shodanResult.vulnerabilities.length - 10} more)`}
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {visibleCves.map((v, i) => (
                          <Badge key={i} label={v} tone="danger" />
                        ))}
                      </div>
                    </div>
                  )}

                  {shodanResult.services?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Exposed services
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {shodanResult.services.slice(0, 10).map((s, i) => (
                          <div key={i} style={{ ...soft, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>Port {s.port}</span>
                              <span style={{ color: 'var(--text-3)', marginLeft: '8px', fontSize: '0.82rem' }}>
                                {s.product || 'Unknown'} {s.version || ''}
                              </span>
                            </div>
                            <Badge label={s.transport || 'tcp'} tone="info" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {shodanResult.risk_findings?.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Risk findings
                      </div>
                      {shodanResult.risk_findings.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'rgba(248,113,113,0.04)',
                            border: '1px solid rgba(248,113,113,0.10)',
                            marginBottom: '6px',
                          }}
                        >
                          <div style={{ width: 6, height: 6, borderRadius: '999px', background: '#f87171', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.84rem', color: 'var(--text-2)' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : shodanResult?.error ? (
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.18)', color: '#fb923c', fontSize: '0.86rem' }}>
                  {shodanResult.error}
                </div>
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-3)' }}>
                  {shodanResult?.message || 'No Shodan data available'}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {result?.error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.18)',
            color: '#f87171',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          {result.error}
        </div>
      )}
    </div>
  );
}