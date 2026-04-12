import { useState, useEffect } from 'react';
import { gophish, scan } from '../services/api';

function Badge({ label, tone = 'neutral' }) {
  const map = {
    success: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.18)' },
    danger: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.18)' },
    warning: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.18)' },
    info: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.18)' },
    purple: { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.18)' },
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

function StatCard({ label, value, color, subtitle }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '18px', borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
      {subtitle && <div style={{ fontSize: '0.76rem', color: 'var(--text-3)', marginTop: '4px' }}>{subtitle}</div>}
    </div>
  );
}

function CampaignCard({ campaign, onSelect, onScanUrl }) {
  const clickRate = campaign.total_targets > 0
    ? ((campaign.links_clicked / campaign.total_targets) * 100).toFixed(1)
    : 0;

  const statusTone = campaign.status === 'Completed' ? 'success'
    : campaign.status === 'In progress' ? 'warning'
    : campaign.status === 'Created' ? 'info' : 'neutral';

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
            {campaign.name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
            Template: {campaign.template_name} • SMTP: {campaign.smtp_name}
          </div>
        </div>
        <Badge label={campaign.status} tone={statusTone} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{campaign.total_targets}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Targets</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80' }}>{campaign.emails_sent}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Sent</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{campaign.emails_opened}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Opened</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fb923c' }}>{campaign.links_clicked}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Clicked</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171' }}>{campaign.data_submitted}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Submitted</div>
        </div>
      </div>

      {/* Click Rate Bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>Click Rate</span>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: clickRate > 30 ? '#f87171' : clickRate > 10 ? '#fb923c' : '#4ade80' }}>
            {clickRate}%
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-card)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3, width: `${Math.min(clickRate, 100)}%`,
            background: clickRate > 30 ? '#f87171' : clickRate > 10 ? '#fb923c' : '#4ade80',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => onSelect(campaign.id)} style={{
          flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.18)',
          background: 'rgba(56,189,248,0.10)', color: '#38bdf8',
          fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>View Details</button>
        {campaign.url && (
          <button onClick={() => onScanUrl(campaign.url)} style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(168,85,247,0.18)',
            background: 'rgba(168,85,247,0.10)', color: '#a855f7',
            fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Scan Phish URL</button>
        )}
      </div>
    </div>
  );
}

export default function GoPhish() {
  const [tab, setTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [pages, setPages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [urlAnalysis, setUrlAnalysis] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [phishUrl, setPhishUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, p, t] = await Promise.all([
        gophish.getCampaigns().catch(() => ({ data: { campaigns: [] } })),
        gophish.getPages().catch(() => ({ data: { pages: [] } })),
        gophish.getTemplates().catch(() => ({ data: { templates: [] } })),
      ]);
      setCampaigns(c.data.campaigns || []);
      setPages(p.data.pages || []);
      setTemplates(t.data.templates || []);
      if (c.data.error) setError(c.data.error);
    } catch (e) {
      setError('Failed to connect to GoPhish. Make sure GoPhish is running.');
    }
    setLoading(false);
  };

  const viewCampaign = async (id) => {
    try {
      const r = await gophish.getCampaign(id);
      setSelectedCampaign(r.data);
    } catch { setError('Failed to load campaign details'); }
  };

  const scanPhishUrl = async (url) => {
    setAnalyzing(true);
    setScanResult(null);
    setUrlAnalysis(null);
    try {
      const [analysis, scanRes] = await Promise.all([
        gophish.analyzeUrl(url),
        scan.url(url).catch(() => null),
      ]);
      setUrlAnalysis(analysis.data);
      if (scanRes) setScanResult(scanRes.data);
    } catch { setError('URL analysis failed'); }
    setAnalyzing(false);
  };

  const manualAnalyze = async () => {
    if (!phishUrl.trim()) return;
    await scanPhishUrl(phishUrl.trim());
  };

  const tabs = ['campaigns', 'analyze', 'pages', 'templates'];

  const totalTargets = campaigns.reduce((s, c) => s + c.total_targets, 0);
  const totalClicked = campaigns.reduce((s, c) => s + c.links_clicked, 0);
  const totalSubmitted = campaigns.reduce((s, c) => s + c.data_submitted, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)' }}>
          GoPhish Phishing Simulator
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', marginTop: '4px' }}>
          Monitor phishing campaigns, analyze landing pages, and test CyberShield detection against real phishing simulations.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '12px',
          background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.18)',
          color: '#fb923c', fontSize: '0.86rem', fontWeight: 600,
        }}>{error}</div>
      )}

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Campaigns" value={campaigns.length} color="#a855f7" subtitle="Total phishing campaigns" />
        <StatCard label="Total Targets" value={totalTargets} color="#38bdf8" subtitle="People targeted" />
        <StatCard label="Links Clicked" value={totalClicked} color="#fb923c" subtitle={totalTargets > 0 ? `${((totalClicked / totalTargets) * 100).toFixed(1)}% click rate` : '0%'} />
        <StatCard label="Data Submitted" value={totalSubmitted} color="#f87171" subtitle="Credentials captured" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => { setTab(t); setSelectedCampaign(null); setUrlAnalysis(null); setScanResult(null); }} style={{
            padding: '9px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
            background: tab === t ? 'rgba(168,85,247,0.12)' : 'transparent',
            color: tab === t ? '#a855f7' : 'var(--text-3)',
            border: tab === t ? '1px solid rgba(168,85,247,0.15)' : '1px solid transparent',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* Campaigns Tab */}
      {tab === 'campaigns' && !selectedCampaign && (
        <div>
          {campaigns.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {campaigns.map(c => (
                <CampaignCard key={c.id} campaign={c} onSelect={viewCampaign} onScanUrl={scanPhishUrl} />
              ))}
            </div>
          ) : (
            <div style={{
              padding: '56px 20px', textAlign: 'center', borderRadius: '16px',
              background: 'var(--bg-card)', border: '1px dashed rgba(148,163,184,0.16)',
              color: 'var(--text-3)',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '8px' }}>
                No campaigns found
              </div>
              <div style={{ fontSize: '0.88rem' }}>
                Create a phishing campaign in GoPhish (http://127.0.0.1:3333), then refresh this page.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaign Detail */}
      {tab === 'campaigns' && selectedCampaign && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)' }}>{selectedCampaign.name}</h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '4px' }}>
                Launched: {selectedCampaign.launch_date ? new Date(selectedCampaign.launch_date).toLocaleString() : 'Not launched'}
              </div>
            </div>
            <button onClick={() => setSelectedCampaign(null)} style={{
              padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border)',
              background: 'var(--bg-surface)', color: 'var(--text-2)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>← Back</button>
          </div>

          {selectedCampaign.stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <StatCard label="Click Rate" value={`${selectedCampaign.stats.click_rate}%`} color={selectedCampaign.stats.click_rate > 30 ? '#f87171' : '#fb923c'} />
              <StatCard label="Submission Rate" value={`${selectedCampaign.stats.submission_rate}%`} color="#f87171" />
              <StatCard label="Report Rate" value={`${selectedCampaign.stats.report_rate}%`} color="#4ade80" subtitle="Users who reported phish" />
            </div>
          )}

          {/* Timeline */}
          {selectedCampaign.timeline?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                Target Timeline
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCampaign.timeline.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: '10px',
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.88rem' }}>
                        {t.first_name} {t.last_name}
                      </span>
                      <span style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginLeft: '10px' }}>{t.email}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {t.ip && <Badge label={t.ip} tone="info" />}
                      <Badge
                        label={t.status}
                        tone={t.status === 'Submitted Data' ? 'danger' : t.status === 'Clicked Link' ? 'warning' : t.status === 'Email Opened' ? 'info' : 'neutral'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analyze Tab */}
      {tab === 'analyze' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '24px',
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px' }}>
              Analyze Phishing URL
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '16px' }}>
              Paste a GoPhish landing page URL or any suspicious URL to test CyberShield's detection against it.
            </p>
            <div style={{ display: 'flex', gap: '14px' }}>
              <input value={phishUrl} onChange={e => setPhishUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && manualAnalyze()}
                placeholder="http://localhost:8888 or any phishing URL"
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: '12px',
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  color: 'var(--text-1)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button onClick={manualAnalyze} disabled={analyzing} style={{
                padding: '14px 28px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: 'white', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', opacity: analyzing ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(168,85,247,0.22)',
              }}>
                {analyzing ? 'Analyzing...' : '🎣 Analyze URL'}
              </button>
            </div>
          </div>

          {/* GoPhish Analysis Result */}
          {urlAnalysis && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>Phishing Page Analysis</h3>
                <Badge
                  label={urlAnalysis.risk_level || 'Unknown'}
                  tone={urlAnalysis.risk_score >= 70 ? 'danger' : urlAnalysis.risk_score >= 40 ? 'warning' : 'success'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <StatCard label="Phishing Risk Score" value={`${urlAnalysis.risk_score || 0}%`} color={urlAnalysis.risk_score >= 50 ? '#f87171' : '#fb923c'} />
                <StatCard label="Detection" value={urlAnalysis.is_phishing_page ? 'PHISHING DETECTED' : 'Not flagged'} color={urlAnalysis.is_phishing_page ? '#f87171' : '#4ade80'} />
              </div>

              {urlAnalysis.indicators?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Detection Indicators
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {urlAnalysis.indicators.map((ind, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '10px', alignItems: 'center',
                        padding: '10px 14px', borderRadius: '10px',
                        background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.12)',
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '999px', background: '#f87171', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-2)' }}>{ind}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CyberShield Scan Result */}
          {scanResult && !scanResult.error && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px',
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px' }}>
                CyberShield Full Scan Result
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                <StatCard label="Threat Score" value={`${(scanResult.threat_score * 100).toFixed(0)}%`} color={scanResult.threat_score > 0.6 ? '#f87171' : scanResult.threat_score > 0.3 ? '#fb923c' : '#4ade80'} />
                <StatCard label="ML Verdict" value={scanResult.ml_analysis?.ensemble_prediction || 'N/A'} color={scanResult.ml_analysis?.ensemble_prediction === 'phishing' ? '#f87171' : '#4ade80'} />
                <StatCard label="SSL" value={scanResult.ssl_info?.has_ssl ? 'Valid' : 'Missing'} color={scanResult.ssl_info?.has_ssl ? '#4ade80' : '#f87171'} />
                <StatCard label="VirusTotal" value={`${scanResult.virustotal_result?.malicious_count || 0} flags`} color={(scanResult.virustotal_result?.malicious_count || 0) > 0 ? '#f87171' : '#4ade80'} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pages Tab */}
      {tab === 'pages' && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['Name', 'Credentials', 'Passwords', 'Form', 'Redirect', 'HTML Size'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-1)' }}>{p.name}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <Badge label={p.capture_credentials ? 'Yes' : 'No'} tone={p.capture_credentials ? 'danger' : 'success'} />
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <Badge label={p.capture_passwords ? 'Yes' : 'No'} tone={p.capture_passwords ? 'danger' : 'success'} />
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <Badge label={p.has_form ? 'Yes' : 'No'} tone={p.has_form ? 'warning' : 'neutral'} />
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '0.78rem', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {p.redirect_url || '—'}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-2)' }}>{p.html_length} chars</td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '56px', textAlign: 'center', color: 'var(--text-3)' }}>No landing pages configured in GoPhish</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['Name', 'Subject', 'Tracking', 'Phish URL', 'Urgency', 'Modified'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-1)' }}>{t.name}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-2)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <Badge label={t.has_tracking_image ? 'Yes' : 'No'} tone={t.has_tracking_image ? 'info' : 'neutral'} />
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <Badge label={t.has_phish_url ? 'Yes' : 'No'} tone={t.has_phish_url ? 'warning' : 'neutral'} />
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <Badge label={t.has_urgency_language ? 'Detected' : 'None'} tone={t.has_urgency_language ? 'danger' : 'success'} />
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                    {t.modified_date ? new Date(t.modified_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '56px', textAlign: 'center', color: 'var(--text-3)' }}>No email templates configured in GoPhish</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}