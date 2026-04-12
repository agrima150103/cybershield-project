import { useState, useEffect } from 'react';
import { admin } from '../services/api';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('overview');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [s, u, r] = await Promise.all([
        admin.getStats(),
        admin.getUsers(),
        admin.getCommunityReports(),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setReports(r.data);
    } catch {
      setMsg('Failed to load admin data. Make sure you have admin role.');
    }
  };

  const updateRole = async (id, role) => {
    try {
      await admin.updateRole(id, role);
      setMsg(`Role updated to ${role}`);
      loadAll();
    } catch { setMsg('Failed to update role'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await admin.deleteUser(id);
      setMsg('User deleted');
      loadAll();
    } catch (e) { setMsg(e.response?.data?.error || 'Failed to delete'); }
  };

  const updateReportStatus = async (id, status) => {
    try {
      await admin.updateReportStatus(id, status);
      setMsg(`Report marked as ${status}`);
      loadAll();
    } catch { setMsg('Failed to update report'); }
  };

  const tabs = ['overview', 'users', 'reports'];

  const statCards = stats ? [
    { label: 'Total Users', value: stats.total_users, color: '#38bdf8' },
    { label: 'Total Scans', value: stats.total_scans, color: '#818cf8' },
    { label: 'Malicious Found', value: stats.malicious_scans, color: '#f87171' },
    { label: 'Community Reports', value: stats.total_reports, color: '#fbbf24' },
    { label: 'Threat Entries', value: stats.total_threats, color: '#fb923c' },
    { label: 'Email Analyses', value: stats.total_emails, color: '#34d399' },
    { label: 'Scans This Week', value: stats.scans_this_week, color: '#a78bfa' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)' }}>Admin Panel</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', marginTop: '4px' }}>
          Manage users, review community reports, and monitor platform metrics.
        </p>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '12px',
          background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.16)',
          color: '#38bdf8', fontSize: '0.86rem', fontWeight: 600,
        }}>{msg}</div>
      )}

      <div style={{ display: 'flex', gap: '6px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
            background: tab === t ? 'var(--cyan-dim)' : 'transparent',
            color: tab === t ? 'var(--cyan)' : 'var(--text-3)',
            border: tab === t ? '1px solid rgba(56,189,248,0.15)' : '1px solid transparent',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {statCards.map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '22px', borderLeft: `3px solid ${s.color}`,
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '10px' }}>{s.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['Username', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-1)' }}>{u.username}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-2)', fontSize: '0.82rem' }}>{u.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} style={{
                      padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)',
                      background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '0.82rem',
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}>
                      <option value="viewer">Viewer</option>
                      <option value="analyst">Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-3)', fontSize: '0.82rem' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button onClick={() => deleteUser(u.id)} style={{
                      padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.18)',
                      background: 'rgba(248,113,113,0.10)', color: '#f87171',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reports' && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['URL', 'Reason', 'Status', 'Votes', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '14px 20px', fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="mono" style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-2)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-2)', fontSize: '0.82rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600,
                      background: r.status === 'verified' ? 'rgba(248,113,113,0.12)' : r.status === 'dismissed' ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
                      color: r.status === 'verified' ? '#f87171' : r.status === 'dismissed' ? '#34d399' : '#fbbf24',
                    }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-2)', fontSize: '0.82rem' }}>
                    ▲{r.upvotes || 0} ▼{r.downvotes || 0}
                  </td>
                  <td style={{ padding: '14px 20px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => updateReportStatus(r.id, 'verified')} style={{
                      padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.18)',
                      background: 'rgba(248,113,113,0.10)', color: '#f87171',
                      fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Verify</button>
                    <button onClick={() => updateReportStatus(r.id, 'dismissed')} style={{
                      padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.18)',
                      background: 'rgba(52,211,153,0.10)', color: '#34d399',
                      fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Dismiss</button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '56px', textAlign: 'center', color: 'var(--text-3)' }}>No community reports yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}