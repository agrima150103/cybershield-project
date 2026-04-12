import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px 14px 48px',
    background: 'rgba(15, 23, 42, 0.58)',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Outfit, sans-serif',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#050a14',
        overflow: 'hidden',
        fontFamily: 'Outfit, sans-serif',
        position: 'relative',
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          flex: 1,
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1400&q=80"
          alt="Cybersecurity"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(3,8,18,0.28) 0%, rgba(3,8,18,0.34) 42%, rgba(3,8,18,0.52) 72%, rgba(3,8,18,0.72) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(5,10,20,0.42) 0%, rgba(5,10,20,0.16) 32%, rgba(5,10,20,0.56) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 18% 20%, rgba(6,182,212,0.14) 0%, transparent 24%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            padding: '48px 54px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '700px',
              padding: '36px 34px',
              borderRadius: '28px',
              background: 'rgba(7, 16, 30, 0.45)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.28)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 26px rgba(6, 182, 212, 0.3)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #67e8f9, #60a5fa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CyberShield
              </span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'rgba(6,182,212,0.14)',
                border: '1px solid rgba(6,182,212,0.18)',
                color: '#67e8f9',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '18px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22d3ee' }} />
              Enterprise Security Access
            </div>

            <h1
              style={{
                fontSize: '3.8rem',
                fontWeight: 900,
                color: 'white',
                lineHeight: 1.03,
                marginBottom: '18px',
                letterSpacing: '-0.05em',
                maxWidth: '720px',
              }}
            >
              Join the Threat
              <br />
              Intelligence Network
            </h1>

            <p
              style={{
                fontSize: '1.14rem',
                color: 'rgba(226, 232, 240, 0.9)',
                maxWidth: '540px',
                lineHeight: 1.7,
                marginBottom: '28px',
              }}
            >
              Create your account to start protecting users, domains, and inboxes against phishing, malware, spoofing, and emerging cyber threats.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '14px',
              }}
            >
              {[
                { value: '50K+', label: 'Threats Tracked' },
                { value: '99.2%', label: 'Detection Rate' },
                { value: '< 3s', label: 'Scan Time' },
                { value: '24/7', label: 'Monitoring' },
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    background: 'rgba(8, 15, 28, 0.52)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          width: '540px',
          minHeight: '100vh',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 56px',
          background: '#050b18',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Clean diagonal slant */}
        <div
          style={{
            position: 'absolute',
            left: '-80px',
            top: '-5%',
            width: '160px',
            height: '110%',
            background: '#050b18',
            transform: 'skewX(-4deg)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 3 }}>
          <h2
            style={{
              fontSize: '2.3rem',
              fontWeight: 800,
              color: 'white',
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}
          >
            Sign Up Now
          </h2>
          <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '1rem' }}>
            Start your threat intelligence journey
          </p>

          {error && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: 0 }}>{error}</p>
            </div>
          )}

          <div>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#1e293b'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Username */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" required style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#1e293b'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#1e293b'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = '#06b6d4'; e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#1e293b'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px' }}>
              <input type="checkbox" style={{ accentColor: '#06b6d4', width: '16px', height: '16px' }} />
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                I agree to the <span style={{ color: '#06b6d4', cursor: 'pointer' }}>terms & conditions</span>
              </span>
            </label>

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 6px 24px rgba(6, 182, 212, 0.2)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
            <span style={{ fontSize: '0.85rem', color: '#475569' }}>Or</span>
            <div style={{ flex: 1, height: '1px', background: '#1e293b' }} />
          </div>

          <button
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              color: '#94a3b8',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontFamily: 'Outfit, sans-serif',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign Up with Google
          </button>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.95rem', color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#06b6d4', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}