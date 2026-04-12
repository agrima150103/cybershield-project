import { useMemo, useState } from 'react';
import { email } from '../services/api';

const SAMPLE = `Received: from mail-evil.example.com (mail-evil.example.com [203.0.113.1]) by mx.google.com with ESMTP; Tue, 08 Apr 2026 10:00:00 -0700
Received: from unknown-relay.badnet.co ([198.51.100.21]) by mail-evil.example.com with ESMTP; Tue, 08 Apr 2026 09:58:12 -0700
From: "PayPal Security" <security@paypal.com>
Return-Path: <hacker@evil-domain.com>
Reply-To: billing@fake-paypal-support.net
To: victim@gmail.com
Subject: Verify your account immediately
Authentication-Results: mx.google.com; spf=fail; dkim=fail; dmarc=fail
DKIM-Signature: v=1; a=rsa-sha256; d=evil-domain.com`;

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
    fontSize: '0.78rem',
    fontWeight: 800,
    color: 'var(--text-3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '14px',
  },
  h2: {
    fontSize: '1.18rem',
    fontWeight: 800,
    margin: 0,
  },
  h3: {
    fontSize: '1rem',
    fontWeight: 700,
    margin: 0,
  },
  p: {
    margin: 0,
    color: 'var(--text-2)',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  mono: {
    fontFamily: 'JetBrains Mono, monospace',
  },
};

function Panel({ children, style }) {
  return <div style={{ ...styles.panel, ...style }}>{children}</div>;
}

function SoftPanel({ children, style }) {
  return <div style={{ ...styles.softPanel, ...style }}>{children}</div>;
}

function Badge({ label, tone = 'neutral' }) {
  const map = {
    success: {
      bg: 'rgba(34,197,94,0.12)',
      color: '#4ade80',
      border: '1px solid rgba(34,197,94,0.18)',
    },
    danger: {
      bg: 'rgba(248,113,113,0.12)',
      color: '#f87171',
      border: '1px solid rgba(248,113,113,0.18)',
    },
    warning: {
      bg: 'rgba(251,146,60,0.12)',
      color: '#fb923c',
      border: '1px solid rgba(251,146,60,0.18)',
    },
    info: {
      bg: 'rgba(56,189,248,0.12)',
      color: '#38bdf8',
      border: '1px solid rgba(56,189,248,0.18)',
    },
    neutral: {
      bg: 'rgba(148,163,184,0.10)',
      color: 'var(--text-2)',
      border: '1px solid rgba(148,163,184,0.12)',
    },
  };

  const theme = map[tone] || map.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        background: theme.bg,
        color: theme.color,
        border: theme.border,
      }}
    >
      {label}
    </span>
  );
}

function StepCard({ step, title, subtitle, state }) {
  const tone =
    state === 'complete'
      ? { ring: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '✓' }
      : state === 'in-progress'
      ? { ring: '#fb923c', bg: 'rgba(251,146,60,0.12)', icon: '◔' }
      : state === 'failed'
      ? { ring: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '!' }
      : { ring: 'rgba(148,163,184,0.35)', bg: 'rgba(148,163,184,0.08)', icon: '•' };

  return (
    <SoftPanel style={{ minHeight: 132 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '999px',
            border: `3px solid ${tone.ring}`,
            background: tone.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: tone.ring,
            flexShrink: 0,
          }}
        >
          {tone.icon}
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 700 }}>Step {step}</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>
        </div>
      </div>
      <p style={{ ...styles.p, fontSize: '0.84rem' }}>{subtitle}</p>
    </SoftPanel>
  );
}

function AuthCard({ label, value, explanation }) {
  const normalized = String(value || 'unknown').toLowerCase();

  const tone =
    normalized === 'pass'
      ? 'success'
      : normalized === 'fail'
      ? 'danger'
      : normalized === 'softfail' || normalized === 'neutral'
      ? 'warning'
      : 'neutral';

  return (
    <SoftPanel>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 700, marginBottom: '8px' }}>
            {label}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'capitalize' }}>{normalized}</div>
        </div>
        <Badge label={normalized} tone={tone} />
      </div>
      <p style={{ ...styles.p, marginTop: '12px', fontSize: '0.84rem' }}>{explanation}</p>
    </SoftPanel>
  );
}

function InfoRow({ label, value, mono = false, danger = false }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        padding: '12px 0',
        borderBottom: '1px solid rgba(148,163,184,0.10)',
      }}
    >
      <span style={{ color: 'var(--text-3)', fontSize: '0.86rem' }}>{label}</span>
      <span
        style={{
          color: danger ? '#f87171' : 'var(--text-1)',
          fontSize: '0.86rem',
          textAlign: 'right',
          ...(mono ? styles.mono : {}),
        }}
      >
        {String(value ?? 'Unknown')}
      </span>
    </div>
  );
}

function ScoreRing({ score, label }) {
  const deg = Math.max(0, Math.min(100, score)) * 3.6;
  const tone =
    score >= 75 ? '#f87171' : score >= 45 ? '#fb923c' : '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: 132,
          height: 132,
          borderRadius: '999px',
          background: `conic-gradient(${tone} ${deg}deg, rgba(255,255,255,0.06) ${deg}deg)`,
          display: 'grid',
          placeItems: 'center',
          boxShadow: `0 0 40px ${tone}22`,
        }}
      >
        <div
          style={{
            width: 98,
            height: 98,
            borderRadius: '999px',
            background: 'rgba(8,15,28,0.98)',
            border: '1px solid rgba(148,163,184,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: tone }}>{score}%</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 700 }}>Threat Score</div>
        </div>
      </div>
      <Badge
        label={label}
        tone={score >= 75 ? 'danger' : score >= 45 ? 'warning' : 'success'}
      />
    </div>
  );
}

function ListItem({ text, tone = 'neutral' }) {
  const color =
    tone === 'danger'
      ? '#f87171'
      : tone === 'warning'
      ? '#fb923c'
      : tone === 'success'
      ? '#22c55e'
      : '#38bdf8';

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '999px',
          background: color,
          marginTop: 7,
          flexShrink: 0,
        }}
      />
      <div style={{ ...styles.p, fontSize: '0.85rem' }}>{text}</div>
    </div>
  );
}

function RoutingTimeline({ hops }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {hops.map((hop, i) => (
        <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '999px',
                background: 'rgba(56,189,248,0.12)',
                border: '1px solid rgba(56,189,248,0.18)',
                color: '#38bdf8',
                display: 'grid',
                placeItems: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {i + 1}
            </div>
            {i < hops.length - 1 && (
              <div
                style={{
                  width: 2,
                  flex: 1,
                  background: 'linear-gradient(180deg, rgba(56,189,248,0.55), rgba(56,189,248,0.08))',
                  marginTop: 6,
                }}
              />
            )}
          </div>

          <SoftPanel style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 700 }}>Hop {i + 1}</div>
              {hop.ip ? <Badge label={hop.ip} tone="info" /> : <Badge label="IP Unknown" tone="neutral" />}
            </div>

            <p style={{ ...styles.p, fontSize: '0.84rem' }}>
              <span style={{ color: 'var(--text-3)' }}>From: </span>
              <span style={{ color: 'var(--text-1)' }}>{hop.from_server || 'Unknown source'}</span>
              <span style={{ color: 'var(--text-3)' }}> → To: </span>
              <span style={{ color: 'var(--text-1)' }}>{hop.by_server || 'Unknown destination'}</span>
            </p>

            {hop.timestamp && (
              <p style={{ ...styles.p, fontSize: '0.78rem', marginTop: '8px' }}>
                Timestamp: <span style={{ color: 'var(--text-1)' }}>{hop.timestamp}</span>
              </p>
            )}
          </SoftPanel>
        </div>
      ))}
    </div>
  );
}

function getDomain(emailLike) {
  if (!emailLike || typeof emailLike !== 'string') return '';
  const match = emailLike.match(/@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/);
  return match ? match[1].toLowerCase() : '';
}

function parseDisplayAddress(raw) {
  if (!raw) return '';
  const angleMatch = raw.match(/<([^>]+)>/);
  return angleMatch ? angleMatch[1] : raw;
}

function computeThreatScore(result) {
  let score = 0;
  const indicators = [];

  const spf = String(result?.spf_result || 'unknown').toLowerCase();
  const dkim = String(result?.dkim_result || 'unknown').toLowerCase();
  const dmarc = String(result?.dmarc_result || 'unknown').toLowerCase();

  if (spf === 'fail') {
    score += 25;
    indicators.push('SPF failed');
  }
  if (dkim === 'fail') {
    score += 25;
    indicators.push('DKIM failed');
  }
  if (dmarc === 'fail') {
    score += 20;
    indicators.push('DMARC failed');
  }

  const fromDomain = getDomain(parseDisplayAddress(result?.from));
  const returnDomain = getDomain(parseDisplayAddress(result?.return_path));
  const replyDomain = getDomain(parseDisplayAddress(result?.reply_to));

  if (fromDomain && returnDomain && fromDomain !== returnDomain) {
    score += 15;
    indicators.push('From / Return-Path mismatch');
  }

  if (replyDomain && fromDomain && replyDomain !== fromDomain) {
    score += 10;
    indicators.push('Reply-To domain mismatch');
  }

  if (result?.is_spoofed) {
    score += 20;
    indicators.push('Backend flagged spoofing');
  }

  if (Array.isArray(result?.spoofing_indicators) && result.spoofing_indicators.length > 0) {
    score += Math.min(15, result.spoofing_indicators.length * 4);
    indicators.push(`${result.spoofing_indicators.length} spoofing indicators found`);
  }

  if (Array.isArray(result?.urls) && result.urls.some((u) => u?.suspicious || u?.verdict === 'malicious')) {
    score += 15;
    indicators.push('Suspicious URLs found');
  }

  if (Array.isArray(result?.attachments) && result.attachments.some((a) => a?.malicious || a?.suspicious)) {
    score += 20;
    indicators.push('Suspicious attachment found');
  }

  if (result?.tone_analysis?.urgency || result?.tone_analysis?.threatening || result?.tone_analysis?.sensitive_request) {
    score += 10;
    indicators.push('Social engineering language detected');
  }

  score = Math.min(score, 100);

  let level = 'Low Risk';
  if (score >= 75) level = 'High Risk';
  else if (score >= 45) level = 'Medium Risk';

  return { score, level, indicators };
}

function authExplanation(type, value) {
  const v = String(value || 'unknown').toLowerCase();

  if (type === 'SPF') {
    if (v === 'pass') return 'The sender IP appears authorized to send mail for the claimed domain.';
    if (v === 'fail') return 'The sender IP is not authorized for the claimed domain, which is a strong spoofing signal.';
    return 'SPF result is unavailable or inconclusive.';
  }

  if (type === 'DKIM') {
    if (v === 'pass') return 'The message signature appears valid and suggests the content was not modified after signing.';
    if (v === 'fail') return 'The DKIM signature failed verification or does not align properly.';
    return 'DKIM verification result is unavailable or inconclusive.';
  }

  if (type === 'DMARC') {
    if (v === 'pass') return 'Domain alignment checks succeeded based on SPF or DKIM policy.';
    if (v === 'fail') return 'DMARC alignment failed, which often indicates spoofing or domain impersonation.';
    return 'DMARC policy result is unavailable or inconclusive.';
  }

  return '';
}

function buildRecommendations(result, scoreData) {
  const recs = [];

  if (result?.is_spoofed || scoreData.score >= 75) {
    recs.push('Quarantine or block this email before user interaction.');
    recs.push('Do not click links or open attachments from this message.');
  }

  if (String(result?.spf_result).toLowerCase() === 'fail') {
    recs.push('Verify whether the sender IP is authorized by the domain’s SPF policy.');
  }

  if (String(result?.dkim_result).toLowerCase() === 'fail') {
    recs.push('Inspect DKIM alignment and verify whether the signing domain is expected.');
  }

  if (String(result?.dmarc_result).toLowerCase() === 'fail') {
    recs.push('Review DMARC policy enforcement and check if the sender domain is being impersonated.');
  }

  const fromDomain = getDomain(parseDisplayAddress(result?.from));
  const returnDomain = getDomain(parseDisplayAddress(result?.return_path));
  if (fromDomain && returnDomain && fromDomain !== returnDomain) {
    recs.push('Compare From and Return-Path addresses; the domain mismatch suggests spoofing.');
  }

  if (Array.isArray(result?.urls) && result.urls.length > 0) {
    recs.push('Review embedded URLs for typosquatting, redirects, and suspicious reputation.');
  }

  if (Array.isArray(result?.attachments) && result.attachments.length > 0) {
    recs.push('Run any attachment through malware or sandbox inspection before delivery.');
  }

  if (result?.tone_analysis?.urgency || result?.tone_analysis?.sensitive_request) {
    recs.push('Treat urgency, payment requests, or credential prompts as possible social engineering.');
  }

  if (!recs.length) {
    recs.push('No critical issues detected in the available fields, but continue with standard email hygiene checks.');
  }

  return recs;
}

export default function EmailAnalyzer() {
  const [headers, setHeaders] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!headers.trim()) return;

    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const response = await email.analyze(headers);
      setResult(response.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreData = useMemo(() => {
    if (!result) return null;
    return computeThreatScore(result);
  }, [result]);

  const identityCheck = useMemo(() => {
    if (!result) return null;

    const fromValue = parseDisplayAddress(result.from);
    const returnPathValue = parseDisplayAddress(result.return_path);
    const replyToValue = parseDisplayAddress(result.reply_to);

    const fromDomain = getDomain(fromValue);
    const returnDomain = getDomain(returnPathValue);
    const replyDomain = getDomain(replyToValue);

    return {
      fromValue,
      returnPathValue,
      replyToValue,
      fromDomain,
      returnDomain,
      replyDomain,
      fromVsReturnMismatch: !!(fromDomain && returnDomain && fromDomain !== returnDomain),
      fromVsReplyMismatch: !!(fromDomain && replyDomain && fromDomain !== replyDomain),
    };
  }, [result]);

  const recommendations = useMemo(() => {
    if (!result || !scoreData) return [];
    return buildRecommendations(result, scoreData);
  }, [result, scoreData]);

  const stepState = useMemo(() => {
    if (!result) return null;

    const authFailed =
      String(result.spf_result).toLowerCase() === 'fail' ||
      String(result.dkim_result).toLowerCase() === 'fail' ||
      String(result.dmarc_result).toLowerCase() === 'fail';

    return {
      parsing: 'complete',
      auth: authFailed ? 'failed' : 'complete',
      content:
        result?.tone_analysis || result?.urls || result?.attachments
          ? 'in-progress'
          : 'idle',
      verdict: result?.is_spoofed ? 'failed' : 'complete',
    };
  }, [result]);

  return (
    <div style={styles.page}>
      <Panel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 0.9fr',
            gap: '18px',
            alignItems: 'stretch',
          }}
        >
          <div>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={styles.h2}>Email Threat Analyzer</h2>
              <p style={{ ...styles.p, marginTop: '6px' }}>
                Inspect email headers, authentication, routing, spoofing signals, links,
                attachments, and delivery anomalies in one investigation workflow.
              </p>
            </div>

            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder="Paste raw email headers here..."
              rows={14}
              style={{
                width: '100%',
                padding: '16px',
                background: 'rgba(10,18,34,0.92)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: '14px',
                color: 'var(--text-1)',
                fontSize: '0.8rem',
                lineHeight: 1.7,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={analyze}
                disabled={analyzing}
                style={{
                  padding: '13px 22px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  opacity: analyzing ? 0.7 : 1,
                  boxShadow: '0 8px 24px rgba(56,189,248,0.22)',
                }}
              >
                {analyzing ? 'Analyzing...' : 'Analyze Email'}
              </button>

              <button
                onClick={() => setHeaders(SAMPLE)}
                style={{
                  padding: '13px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(56,189,248,0.15)',
                  background: 'rgba(56,189,248,0.10)',
                  color: '#38bdf8',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Load Spoofed Sample
              </button>
            </div>
          </div>

          <SoftPanel
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 220,
            }}
          >
            <div>
              <div style={styles.sectionTitle}>Summary Checklist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ListItem text="Sender identity and route consistency" tone="info" />
                <ListItem text="SPF, DKIM, and DMARC verification" tone="info" />
                <ListItem text="Return-Path and Reply-To mismatch detection" tone="info" />
                <ListItem text="URL, attachment, and language analysis" tone="info" />
                <ListItem text="Spam, phishing, impersonation, and delivery diagnostics" tone="info" />
              </div>
            </div>

            <div style={{ marginTop: '18px' }}>
              <Badge label="CyberShield Inspection Ready" tone="info" />
            </div>
          </SoftPanel>
        </div>
      </Panel>

      {error && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '16px',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.18)',
            color: '#f87171',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {result && scoreData && identityCheck && (
        <>
          <Panel
            style={{
              border: result.is_spoofed
                ? '1px solid rgba(248,113,113,0.20)'
                : '1px solid rgba(34,197,94,0.18)',
              background: result.is_spoofed
                ? 'linear-gradient(180deg, rgba(48,18,24,0.95), rgba(15,12,24,0.98))'
                : 'linear-gradient(180deg, rgba(12,32,24,0.95), rgba(10,18,34,0.98))',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 0.8fr',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <Badge
                    label={result.is_spoofed ? 'Spoofing Detected' : 'No Strong Spoofing Signal'}
                    tone={result.is_spoofed ? 'danger' : 'success'}
                  />
                  <Badge label={scoreData.level} tone={scoreData.score >= 75 ? 'danger' : scoreData.score >= 45 ? 'warning' : 'success'} />
                </div>

                <h2
                  style={{
                    ...styles.h2,
                    fontSize: '1.5rem',
                    color: result.is_spoofed ? '#f87171' : '#4ade80',
                    marginBottom: '8px',
                  }}
                >
                  {result.is_spoofed ? 'Potential Email Spoofing / Phishing Risk' : 'Email Appears More Consistent'}
                </h2>

                <p style={styles.p}>
                  This verdict is based on sender identity checks, authentication failures,
                  route inspection, mismatch detection, and any available content intelligence.
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                    marginTop: '18px',
                  }}
                >
                  <SoftPanel>
                    <div style={{ color: 'var(--text-3)', fontSize: '0.76rem', fontWeight: 700, marginBottom: '6px' }}>
                      Displayed Sender
                    </div>
                    <div style={{ ...styles.p, ...styles.mono, color: 'var(--text-1)' }}>
                      {result.from || 'Unknown'}
                    </div>
                  </SoftPanel>

                  <SoftPanel>
                    <div style={{ color: 'var(--text-3)', fontSize: '0.76rem', fontWeight: 700, marginBottom: '6px' }}>
                      Return-Path
                    </div>
                    <div style={{ ...styles.p, ...styles.mono, color: identityCheck.fromVsReturnMismatch ? '#f87171' : 'var(--text-1)' }}>
                      {result.return_path || 'Unknown'}
                    </div>
                  </SoftPanel>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ScoreRing score={scoreData.score} label={scoreData.level} />
              </div>
            </div>
          </Panel>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            <StepCard
              step="1"
              title="Header Parsing"
              subtitle={`${result.hop_count || result.hops?.length || 0} routing hop(s) extracted from Received lines.`}
              state={stepState.parsing}
            />
            <StepCard
              step="2"
              title="Authentication"
              subtitle={`SPF: ${result.spf_result || 'unknown'}, DKIM: ${result.dkim_result || 'unknown'}, DMARC: ${result.dmarc_result || 'unknown'}.`}
              state={stepState.auth}
            />
            <StepCard
              step="3"
              title="Content Signals"
              subtitle="Checks for suspicious URLs, attachments, urgency language, and hidden indicators if available."
              state={stepState.content}
            />
            <StepCard
              step="4"
              title="Threat Verdict"
              subtitle={result.is_spoofed ? 'Suspicious sender identity or authentication inconsistency detected.' : 'No severe spoofing pattern found in current fields.'}
              state={stepState.verdict}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.25fr 1fr',
              gap: '18px',
            }}
          >
            <Panel>
              <div style={styles.sectionTitle}>Authentication Results</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '14px',
                }}
              >
                <AuthCard label="SPF" value={result.spf_result} explanation={authExplanation('SPF', result.spf_result)} />
                <AuthCard label="DKIM" value={result.dkim_result} explanation={authExplanation('DKIM', result.dkim_result)} />
                <AuthCard label="DMARC" value={result.dmarc_result} explanation={authExplanation('DMARC', result.dmarc_result)} />
              </div>
            </Panel>

            <Panel>
              <div style={styles.sectionTitle}>Sender Identity Check</div>
              <InfoRow label="From" value={identityCheck.fromValue || result.from || 'Unknown'} mono />
              <InfoRow
                label="Return-Path"
                value={identityCheck.returnPathValue || result.return_path || 'Unknown'}
                mono
                danger={identityCheck.fromVsReturnMismatch}
              />
              <InfoRow
                label="Reply-To"
                value={identityCheck.replyToValue || result.reply_to || 'Unknown'}
                mono
                danger={identityCheck.fromVsReplyMismatch}
              />
              <InfoRow label="From Domain" value={identityCheck.fromDomain || 'Unknown'} mono />
              <InfoRow
                label="Return Domain"
                value={identityCheck.returnDomain || 'Unknown'}
                mono
                danger={identityCheck.fromVsReturnMismatch}
              />
              <InfoRow
                label="Mismatch Status"
                value={
                  identityCheck.fromVsReturnMismatch || identityCheck.fromVsReplyMismatch
                    ? 'Suspicious mismatch detected'
                    : 'No strong mismatch found'
                }
                danger={identityCheck.fromVsReturnMismatch || identityCheck.fromVsReplyMismatch}
              />
            </Panel>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              gap: '18px',
            }}
          >
            <Panel>
              <div style={styles.sectionTitle}>Header Route / Received Chain</div>
              {Array.isArray(result.hops) && result.hops.length > 0 ? (
                <RoutingTimeline hops={result.hops} />
              ) : (
                <p style={styles.p}>No routing hops were returned by the backend.</p>
              )}
            </Panel>

            <Panel>
              <div style={styles.sectionTitle}>Threat Indicators</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scoreData.indicators.length > 0 ? (
                  scoreData.indicators.map((item, i) => <ListItem key={i} text={item} tone="danger" />)
                ) : (
                  <ListItem text="No major threat indicators computed from current fields." tone="success" />
                )}

                {Array.isArray(result.spoofing_indicators) &&
                  result.spoofing_indicators.map((item, i) => (
                    <ListItem key={`spoof-${i}`} text={item} tone="danger" />
                  ))}
              </div>
            </Panel>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '18px',
            }}
          >
            <Panel>
              <div style={styles.sectionTitle}>Content and Body Analysis</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <SoftPanel>
                  <div style={{ ...styles.h3, marginBottom: '8px' }}>URL / Link Analysis</div>
                  {Array.isArray(result.urls) && result.urls.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {result.urls.map((url, i) => (
                        <div key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.10)', paddingBottom: '10px' }}>
                          <div style={{ ...styles.p, ...styles.mono, color: 'var(--text-1)' }}>
                            {url.url || url.original || 'Unknown URL'}
                          </div>
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <Badge
                              label={url.verdict || (url.suspicious ? 'suspicious' : 'unverified')}
                              tone={
                                url.verdict === 'malicious'
                                  ? 'danger'
                                  : url.suspicious
                                  ? 'warning'
                                  : 'neutral'
                              }
                            />
                            {url.redirects_to && <Badge label={`Redirects → ${url.redirects_to}`} tone="info" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.p}>
                      No URL analysis data returned. This section will populate if the backend extracts and evaluates links.
                    </p>
                  )}
                </SoftPanel>

                <SoftPanel>
                  <div style={{ ...styles.h3, marginBottom: '8px' }}>Attachment Analysis</div>
                  {Array.isArray(result.attachments) && result.attachments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {result.attachments.map((file, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{file.name || 'Unnamed file'}</div>
                            <div style={{ ...styles.p, fontSize: '0.8rem' }}>{file.type || 'Unknown type'}</div>
                          </div>
                          <Badge
                            label={file.verdict || (file.malicious ? 'malicious' : file.suspicious ? 'suspicious' : 'clean')}
                            tone={file.malicious ? 'danger' : file.suspicious ? 'warning' : 'success'}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.p}>
                      No attachment scan data returned. Use this section when your backend adds malware or sandbox checks.
                    </p>
                  )}
                </SoftPanel>

                <SoftPanel>
                  <div style={{ ...styles.h3, marginBottom: '8px' }}>Tone / Social Engineering Check</div>
                  {result.tone_analysis ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge label={`Urgency: ${result.tone_analysis.urgency ? 'Yes' : 'No'}`} tone={result.tone_analysis.urgency ? 'warning' : 'success'} />
                      <Badge label={`Threatening: ${result.tone_analysis.threatening ? 'Yes' : 'No'}`} tone={result.tone_analysis.threatening ? 'warning' : 'success'} />
                      <Badge label={`Sensitive Request: ${result.tone_analysis.sensitive_request ? 'Yes' : 'No'}`} tone={result.tone_analysis.sensitive_request ? 'danger' : 'success'} />
                    </div>
                  ) : (
                    <p style={styles.p}>
                      No tone analysis returned. This section is ready for language or LLM-based phishing cues.
                    </p>
                  )}
                </SoftPanel>

                <SoftPanel>
                  <div style={{ ...styles.h3, marginBottom: '8px' }}>Obfuscation Detection</div>
                  {Array.isArray(result.obfuscation_flags) && result.obfuscation_flags.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {result.obfuscation_flags.map((flag, i) => (
                        <ListItem key={i} text={flag} tone="warning" />
                      ))}
                    </div>
                  ) : (
                    <p style={styles.p}>
                      No hidden HTML, QR-link, or obfuscation flags returned in the current analysis.
                    </p>
                  )}
                </SoftPanel>
              </div>
            </Panel>

            <Panel>
              <div style={styles.sectionTitle}>Threat Categorization & Diagnostics</div>

              <SoftPanel style={{ marginBottom: '14px' }}>
                <div style={{ ...styles.h3, marginBottom: '8px' }}>Threat Detection</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <Badge label={result.is_spoofed ? 'Phishing / Spoofing Suspected' : 'No major spoofing verdict'} tone={result.is_spoofed ? 'danger' : 'success'} />
                  {result.spam_score != null && <Badge label={`Spam Score: ${result.spam_score}`} tone="warning" />}
                  {result.spam_status && <Badge label={`Spam Status: ${result.spam_status}`} tone="warning" />}
                  {result.bec_detected != null && (
                    <Badge label={result.bec_detected ? 'BEC Suspected' : 'BEC Not Flagged'} tone={result.bec_detected ? 'danger' : 'success'} />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ListItem
                    text={
                      result.impersonation_detected
                        ? 'Displayed sender identity may not match technical sender.'
                        : 'No direct impersonation flag returned.'
                    }
                    tone={result.impersonation_detected ? 'danger' : 'success'}
                  />
                  <ListItem
                    text={
                      result.phishing_detected
                        ? 'Backend or content logic flagged phishing behavior.'
                        : 'No explicit phishing flag returned from backend.'
                    }
                    tone={result.phishing_detected ? 'danger' : 'neutral'}
                  />
                </div>
              </SoftPanel>

              <SoftPanel style={{ marginBottom: '14px' }}>
                <div style={{ ...styles.h3, marginBottom: '8px' }}>Technical Diagnostics</div>
                <InfoRow label="Sender IP" value={result.sender_ip || 'Unknown'} mono />
                <InfoRow label="Hop Count" value={result.hop_count || result.hops?.length || 0} />
                <InfoRow label="Delivery Delay" value={result.delivery_delay || 'Not computed'} />
                <InfoRow label="Rejected / Delayed Reason" value={result.delivery_issue || 'None reported'} />
                <InfoRow label="Character Encoding" value={result.character_encoding || 'Unknown'} />
              </SoftPanel>

              <SoftPanel>
                <div style={{ ...styles.h3, marginBottom: '8px' }}>Recommended Action</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recommendations.map((rec, i) => (
                    <ListItem key={i} text={rec} tone="info" />
                  ))}
                </div>
              </SoftPanel>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}