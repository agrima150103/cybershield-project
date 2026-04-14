import { useState } from 'react';
import { breach } from '../services/api';

function Badge({ label, tone = 'neutral' }) {
  const map = {
    success: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.18)' },
    danger: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.18)' },
    warning: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.18)' },
    info: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.18)' },
    neutral: { bg: 'rgba(148,163,184,0.10)', color: 'var(--text-2)', border: '1px solid rgba(148,163,184,0.12)' },
  };
  const t = map[tone] || map.neutral;
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700, background: t.bg, color: t.color, border: t.border }}>{label}</span>;
}

export default function BreachCheck() {
  const [tab, setTab] = useState('password');
  const [password, setPassword] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passResult, setPassResult] = useState(null);
  const [emailResult, setEmailResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkPass = async () => {
    if (!password) return;
    setChecking(true); setPassResult(null);
    try { const r = await breach.checkPassword(password); setPassResult(r.data); } catch {}
    setChecking(false);
  };

  const checkEmail = async () => {
    if (!emailInput) return;
    setChecking(true); setEmailResult(null);
    try { const r = await breach.checkEmail(emailInput); setEmailResult(r.data); } catch {}
    setChecking(false);
  };

  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' };
  const soft = { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' };
  const input = { width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' };

  const strengthColor = (s) => s >= 80 ? '#4ade80' : s >= 60 ? '#38bdf8' : s >= 40 ? '#fb923c' : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)' }}>Breach &amp; Password Checker</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', marginTop: '4px' }}>
          Check if passwords have appeared in known data breaches using Have I Been Pwned, and analyze password strength with entropy calculations.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {['password', 'email'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
            background: tab === t ? 'rgba(168,85,247,0.12)' : 'transparent', color: tab === t ? '#a855f7' : 'var(--text-3)',
            border: tab === t ? '1px solid rgba(168,85,247,0.15)' : '1px solid transparent',
          }}>{t === 'password' ? 'Password Check' : 'Email Check'}</button>
        ))}
      </div>

      {tab === 'password' && (
        <>
          <div style={card}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '16px' }}>
              Your password is never sent to any server. We use the k-Anonymity model — only the first 5 characters of the SHA-1 hash are sent to Have I Been Pwned. Your full password stays local.
            </p>
            <div style={{ display: 'flex', gap: '14px' }}>
              <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkPass()} type="password" placeholder="Enter a password to check" style={input} />
              <button onClick={checkPass} disabled={checking} style={{
                padding: '14px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: 'white', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: checking ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(168,85,247,0.22)', whiteSpace: 'nowrap',
              }}>{checking ? 'Checking...' : '🔐 Check Password'}</button>
            </div>
          </div>

          {passResult && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              {/* Breach result */}
              <div style={{
                ...card,
                border: passResult.breach_check?.breached ? '1px solid rgba(248,113,113,0.20)' : '1px solid rgba(34,197,94,0.18)',
              }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px' }}>Breach check</h3>
                {passResult.breach_check?.breached ? (
                  <>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171', marginBottom: '8px' }}>
                      {passResult.breach_check.breach_count?.toLocaleString()} breaches
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{passResult.breach_check.message}</p>
                    <Badge label={passResult.breach_check.risk_level} tone="danger" />
                  </>
                ) : passResult.breach_check?.breached === false ? (
                  <>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80', marginBottom: '8px' }}>Not found in breaches</div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{passResult.breach_check.message}</p>
                    <Badge label="Low risk" tone="success" />
                  </>
                ) : (
                  <p style={{ color: 'var(--text-3)' }}>Could not check breach database</p>
                )}
              </div>

              {/* Strength result */}
              {passResult.strength_analysis && (
                <div style={card}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px' }}>Strength analysis</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: strengthColor(passResult.strength_analysis.score) }}>
                      {passResult.strength_analysis.score}%
                    </span>
                    <Badge label={passResult.strength_analysis.strength} tone={passResult.strength_analysis.score >= 60 ? 'success' : passResult.strength_analysis.score >= 40 ? 'warning' : 'danger'} />
                  </div>
                  {/* Strength bar */}
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-base)', marginBottom: '16px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${passResult.strength_analysis.score}%`, background: strengthColor(passResult.strength_analysis.score), transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                    <div style={soft}><div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '4px' }}>Entropy</div><div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{passResult.strength_analysis.entropy_bits} bits</div></div>
                    <div style={soft}><div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '4px' }}>Length</div><div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{passResult.strength_analysis.length} chars</div></div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Badge label={passResult.strength_analysis.has_uppercase ? 'Uppercase' : 'No uppercase'} tone={passResult.strength_analysis.has_uppercase ? 'success' : 'danger'} />
                    <Badge label={passResult.strength_analysis.has_lowercase ? 'Lowercase' : 'No lowercase'} tone={passResult.strength_analysis.has_lowercase ? 'success' : 'danger'} />
                    <Badge label={passResult.strength_analysis.has_digits ? 'Numbers' : 'No numbers'} tone={passResult.strength_analysis.has_digits ? 'success' : 'danger'} />
                    <Badge label={passResult.strength_analysis.has_special ? 'Special chars' : 'No special'} tone={passResult.strength_analysis.has_special ? 'success' : 'danger'} />
                  </div>
                  {/* Findings */}
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {passResult.strength_analysis.findings?.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-2)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '999px', background: f.includes('Missing') || f.includes('short') || f.includes('Weak') || f.includes('commonly') ? '#f87171' : '#4ade80', flexShrink: 0 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'email' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <input value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkEmail()} type="email" placeholder="Enter email to check (e.g. user@example.com)" style={input} />
              <button onClick={checkEmail} disabled={checking} style={{
                padding: '14px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: 'white', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: checking ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(168,85,247,0.22)', whiteSpace: 'nowrap',
              }}>{checking ? 'Checking...' : '📧 Check Email'}</button>
            </div>
          </div>

          {emailResult && (
            <div style={card}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px' }}>Email breach awareness</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-2)', marginBottom: '12px' }}>Checked: {emailResult.email}</p>
              {emailResult.domain_breached && (
                <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.14)', marginBottom: '14px' }}>
                  <Badge label="Domain breach history" tone="danger" />
                  <p style={{ fontSize: '0.86rem', color: '#f87171', marginTop: '8px' }}>{emailResult.domain_warning}</p>
                </div>
              )}
              {!emailResult.domain_breached && (
                <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.14)', marginBottom: '14px' }}>
                  <Badge label="No major domain breaches" tone="success" />
                </div>
              )}
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Security recommendations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {emailResult.general_tips?.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.10)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '999px', background: '#38bdf8', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-2)' }}>{tip}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '14px' }}>
                For a complete breach history, visit <span style={{ color: '#38bdf8' }}>haveibeenpwned.com</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}