import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmailAnalyzer from './pages/EmailAnalyzer';
import Community from './pages/Community';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Recon from './pages/Recon';
import GoPhish from './pages/GoPhish';
import YaraScan from './pages/YaraScan';
import BreachCheck from './pages/BreachCheck';
import VulnScanner from './pages/VulnScanner';

function Sidebar() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/email-analyzer', label: 'Email Analyzer', icon: '📧' },
    { to: '/recon', label: 'Reconnaissance', icon: '🔎' },
    { to: '/gophish', label: 'GoPhish Simulator', icon: '🎣' },
    { to: '/yara', label: 'YARA Scanner', icon: '🔬' },
    { to: '/vulnscan', label: 'Vuln Scanner', icon: '🛡️' },
    { to: '/breach', label: 'Breach Checker', icon: '🔐' },
    { to: '/community', label: 'Community', icon: '👥' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  if (user?.role === 'admin') {
    links.splice(8, 0, { to: '/admin', label: 'Admin Panel', icon: '🔧' });
  }

  return (
    <aside style={{
      width: '250px', height: '100vh', position: 'fixed', top: 0, left: 0,
      background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '20px 14px',
      zIndex: 100, overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '0 8px' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '10px',
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem',
        }}>🛡️</div>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>CyberShield</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px', flex: 1 }}>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: '10px', textDecoration: 'none',
            fontSize: '0.84rem', fontWeight: 600, fontFamily: 'inherit',
            transition: 'all 0.15s',
            background: isActive ? 'var(--cyan-dim)' : 'transparent',
            color: isActive ? 'var(--cyan)' : 'var(--text-3)',
            border: isActive ? '1px solid rgba(56,189,248,0.12)' : '1px solid transparent',
          })}>
            <span style={{ fontSize: '0.95rem' }}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{
        padding: '12px 10px', borderRadius: '10px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)' }}>{user?.username}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px' }}>{user?.email}</div>
        <button onClick={logout} style={{
          marginTop: '8px', width: '100%', padding: '7px', borderRadius: '8px',
          border: '1px solid rgba(248,113,113,0.18)', background: 'rgba(248,113,113,0.08)',
          color: '#f87171', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>Logout</button>
      </div>
    </aside>
  );
}

function AppLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: '250px', flex: 1, padding: '32px 36px',
        background: 'var(--bg-base)', minHeight: '100vh',
      }}>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="email-analyzer" element={<EmailAnalyzer />} />
          <Route path="recon" element={<Recon />} />
          <Route path="gophish" element={<GoPhish />} />
          <Route path="yara" element={<YaraScan />} />
          <Route path="vulnscan" element={<VulnScanner />} />
          <Route path="breach" element={<BreachCheck />} />
          <Route path="community" element={<Community />} />
          <Route path="admin" element={<Admin />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}