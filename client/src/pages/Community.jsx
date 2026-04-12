import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
  },
  panel: {
    background: 'linear-gradient(180deg, rgba(14,23,42,0.96), rgba(10,18,34,0.98))',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: '20px',
    padding: '22px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
  },
  softPanel: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(148,163,184,0.10)',
    borderRadius: '16px',
    padding: '16px',
  },
  sectionTitle: {
    fontSize: '0.76rem',
    fontWeight: 800,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '14px',
  },
};

function Panel({ children, style }) {
  return <div style={{ ...styles.panel, ...style }}>{children}</div>;
}

function SoftPanel({ children, style }) {
  return <div style={{ ...styles.softPanel, ...style }}>{children}</div>;
}

function Badge({ label, tone = 'neutral' }) {
  const tones = {
    success: {
      bg: 'rgba(34,197,94,0.12)',
      border: '1px solid rgba(34,197,94,0.18)',
      color: '#4ade80',
    },
    danger: {
      bg: 'rgba(248,113,113,0.12)',
      border: '1px solid rgba(248,113,113,0.18)',
      color: '#f87171',
    },
    warning: {
      bg: 'rgba(251,146,60,0.12)',
      border: '1px solid rgba(251,146,60,0.18)',
      color: '#fb923c',
    },
    info: {
      bg: 'rgba(56,189,248,0.12)',
      border: '1px solid rgba(56,189,248,0.18)',
      color: '#38bdf8',
    },
    neutral: {
      bg: 'rgba(148,163,184,0.10)',
      border: '1px solid rgba(148,163,184,0.12)',
      color: 'var(--text-2)',
    },
  };

  const t = tones[tone] || tones.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        background: t.bg,
        border: t.border,
        color: t.color,
      }}
    >
      {label}
    </span>
  );
}

function StatCard({ title, value, subtitle, tone = 'info' }) {
  const color =
    tone === 'danger'
      ? '#f87171'
      : tone === 'warning'
      ? '#fb923c'
      : tone === 'success'
      ? '#4ade80'
      : '#38bdf8';

  return (
    <SoftPanel>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 700, marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ fontSize: '1.45rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '6px' }}>{subtitle}</div>
    </SoftPanel>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 14px',
        borderRadius: '12px',
        border: active
          ? '1px solid rgba(56,189,248,0.24)'
          : '1px solid rgba(148,163,184,0.12)',
        background: active ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.02)',
        color: active ? '#38bdf8' : 'var(--text-2)',
        fontSize: '0.82rem',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function getHostname(rawUrl) {
  if (!rawUrl) return '';
  try {
    const safe = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;
    return new URL(safe).hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

function getReportTone(status, score) {
  if (status === 'verified') return 'danger';
  if (status === 'dismissed') return 'success';
  if (score >= 70) return 'danger';
  if (score >= 45) return 'warning';
  return 'info';
}

function computeConfidence(report) {
  const up = Number(report.upvotes || 0);
  const down = Number(report.downvotes || 0);
  const total = up + down;

  if (total === 0) return 50;
  return Math.round((up / total) * 100);
}

function computeThreatLevel(report) {
  const confidence = computeConfidence(report);
  if (report.status === 'verified') return { label: 'High Risk', score: 85 };
  if (report.status === 'dismissed') return { label: 'Low Risk', score: 20 };
  if (confidence >= 75) return { label: 'Elevated', score: 70 };
  if (confidence >= 55) return { label: 'Moderate', score: 50 };
  return { label: 'Unreviewed', score: 30 };
}

function ReportCard({ report, onVote }) {
  const domain = getHostname(report.url);
  const confidence = computeConfidence(report);
  const threat = computeThreatLevel(report);
  const tone = getReportTone(report.status, threat.score);

  return (
    <SoftPanel
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 0.8fr',
        gap: '16px',
        alignItems: 'stretch',
      }}
    >
      <div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background:
                tone === 'danger'
                  ? 'rgba(248,113,113,0.12)'
                  : tone === 'warning'
                  ? 'rgba(251,146,60,0.12)'
                  : tone === 'success'
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(56,189,248,0.12)',
              color:
                tone === 'danger'
                  ? '#f87171'
                  : tone === 'warning'
                  ? '#fb923c'
                  : tone === 'success'
                  ? '#4ade80'
                  : '#38bdf8',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            🌐
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-1)' }}>
              {domain || 'Unknown domain'}
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-3)',
                marginTop: '4px',
                fontFamily: 'JetBrains Mono, monospace',
                wordBreak: 'break-all',
              }}
            >
              {report.url}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Badge
            label={report.status || 'pending'}
            tone={
              report.status === 'verified'
                ? 'danger'
                : report.status === 'dismissed'
                ? 'success'
                : 'warning'
            }
          />
          <Badge label={threat.label} tone={tone} />
          <Badge label={`Confidence ${confidence}%`} tone="info" />
        </div>

        <div
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-2)',
            lineHeight: 1.6,
            marginBottom: '12px',
          }}
        >
          {report.reason || 'No reason was added for this report.'}
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-3)' }}>
          <span>Created: {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Unknown'}</span>
          <span>Upvotes: {report.upvotes || 0}</span>
          <span>Downvotes: {report.downvotes || 0}</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div
          style={{
            borderRadius: '16px',
            padding: '14px',
            border: '1px solid rgba(148,163,184,0.10)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', fontWeight: 700, marginBottom: '8px' }}>
            Community Score
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{confidence}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '4px' }}>
            Based on community voting
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onVote(report.id, 'up')}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(34,197,94,0.18)',
              background: 'rgba(34,197,94,0.10)',
              color: '#4ade80',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ▲ Trust
          </button>

          <button
            onClick={() => onVote(report.id, 'down')}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(248,113,113,0.18)',
              background: 'rgba(248,113,113,0.10)',
              color: '#f87171',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ▼ Doubt
          </button>
        </div>
      </div>
    </SoftPanel>
  );
}

export default function Community() {
  const [reports, setReports] = useState([]);
  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const response = await api.get('/community/reports');
      setReports(Array.isArray(response.data) ? response.data : []);
    } catch {
      setReports([]);
    }
  };

  const submit = async () => {
    if (!url.trim()) {
      setMsg('Please enter a suspicious URL.');
      return;
    }

    setSubmitting(true);
    setMsg('');

    try {
      await api.post('/community/report', {
        url: url.trim(),
        reason: reason.trim(),
      });

      setMsg('Report submitted successfully.');
      setUrl('');
      setReason('');
      load();
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const vote = async (id, type) => {
    try {
      await api.post(`/community/report/${id}/vote`, { type });
      load();
    } catch {}
  };

  const filteredReports = useMemo(() => {
    let list = [...reports];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        [r.url, r.reason, r.status, getHostname(r.url)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (filter !== 'all') {
      if (filter === 'verified') list = list.filter((r) => r.status === 'verified');
      if (filter === 'dismissed') list = list.filter((r) => r.status === 'dismissed');
      if (filter === 'pending') list = list.filter((r) => r.status !== 'verified' && r.status !== 'dismissed');
      if (filter === 'high-confidence') list = list.filter((r) => computeConfidence(r) >= 70);
    }

    list.sort((a, b) => {
      const aScore = (a.upvotes || 0) - (a.downvotes || 0);
      const bScore = (b.upvotes || 0) - (b.downvotes || 0);
      return bScore - aScore;
    });

    return list;
  }, [reports, search, filter]);

  const stats = useMemo(() => {
    const total = reports.length;
    const verified = reports.filter((r) => r.status === 'verified').length;
    const dismissed = reports.filter((r) => r.status === 'dismissed').length;
    const pending = total - verified - dismissed;

    const highConfidence = reports.filter((r) => computeConfidence(r) >= 70).length;

    return { total, verified, dismissed, pending, highConfidence };
  }, [reports]);

  return (
    <div style={styles.page}>
      <Panel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: '18px',
            alignItems: 'stretch',
          }}
        >
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Community Threat Intelligence</h2>
              <p style={{ margin: '8px 0 0', color: 'var(--text-2)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                Report suspicious URLs, review community findings, and build a shared phishing intelligence feed.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '14px',
              }}
            >
              <StatCard title="Total Reports" value={stats.total} subtitle="All submitted URLs" tone="info" />
              <StatCard title="Verified Threats" value={stats.verified} subtitle="Marked malicious by review" tone="danger" />
              <StatCard title="Pending Review" value={stats.pending} subtitle="Awaiting stronger validation" tone="warning" />
              <StatCard title="High Confidence" value={stats.highConfidence} subtitle="Strong community agreement" tone="success" />
            </div>
          </div>

          <SoftPanel>
            <div style={styles.sectionTitle}>How this works</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-2)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <div>1. Submit a suspicious website or phishing page.</div>
              <div>2. Community members vote to increase or reduce trust in the report.</div>
              <div>3. Reports gradually become more useful as more people interact with them.</div>
              <div>4. Even with one user, this still works as a personal threat log for demo purposes.</div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge label="Shared Intelligence" tone="info" />
              <Badge label="Voting Enabled" tone="warning" />
              <Badge label="Phishing Reports" tone="danger" />
            </div>
          </SoftPanel>
        </div>
      </Panel>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '0.95fr 1.05fr',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        <Panel>
          <div style={styles.sectionTitle}>Submit Suspicious URL</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-2)',
                  marginBottom: '8px',
                }}
              >
                Suspicious URL
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://suspicious-website.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(10,18,34,0.92)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: '14px',
                  color: 'var(--text-1)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-2)',
                  marginBottom: '8px',
                }}
              >
                Why is it suspicious?
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Example: fake login page, urgency scam, typo-squatted domain, suspicious redirect..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(10,18,34,0.92)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: '14px',
                  color: 'var(--text-1)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              onClick={submit}
              disabled={submitting}
              style={{
                padding: '14px 20px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                color: 'white',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                opacity: submitting ? 0.7 : 1,
                boxShadow: '0 8px 24px rgba(56,189,248,0.22)',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Threat Report'}
            </button>

            {msg && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(56,189,248,0.08)',
                  border: '1px solid rgba(56,189,248,0.16)',
                  color: '#38bdf8',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                }}
              >
                {msg}
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <div style={styles.sectionTitle}>Search & Filter Threat Feed</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by domain, URL, reason, or status..."
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(10,18,34,0.92)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: '14px',
                color: 'var(--text-1)',
                fontSize: '0.92rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </FilterButton>
              <FilterButton active={filter === 'verified'} onClick={() => setFilter('verified')}>
                Verified
              </FilterButton>
              <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
                Pending
              </FilterButton>
              <FilterButton active={filter === 'dismissed'} onClick={() => setFilter('dismissed')}>
                Dismissed
              </FilterButton>
              <FilterButton active={filter === 'high-confidence'} onClick={() => setFilter('high-confidence')}>
                High Confidence
              </FilterButton>
            </div>

            <div style={{ color: 'var(--text-3)', fontSize: '0.84rem' }}>
              Showing {filteredReports.length} of {reports.length} reports
            </div>
          </div>
        </Panel>
      </div>

      <Panel style={{ padding: '18px' }}>
        <div
          style={{
            padding: '4px 6px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ ...styles.sectionTitle, marginBottom: '6px' }}>Community Threat Feed</div>
            <div style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>
              Shared suspicious URL reports ranked by community validation
            </div>
          </div>
          <Badge label={`${filteredReports.length} visible reports`} tone="info" />
        </div>

        {filteredReports.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} onVote={vote} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '52px 20px',
              textAlign: 'center',
              color: 'var(--text-3)',
              borderRadius: '16px',
              border: '1px dashed rgba(148,163,184,0.16)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-2)' }}>
              No matching community reports
            </div>
            <div style={{ fontSize: '0.88rem' }}>
              Try changing filters, clearing search, or submit the first suspicious URL.
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}