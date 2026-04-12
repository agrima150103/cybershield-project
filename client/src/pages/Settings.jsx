import { useState, useEffect } from 'react';
import { settings } from '../services/api';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const r = await settings.getProfile();
      setProfile(r.data);
      setUsername(r.data.username);
      setEmail(r.data.email);
    } catch {}
  };

  const updateProfile = async () => {
    setMsg('');
    try {
      await settings.updateProfile({ username: username.trim(), email: email.trim() });
      setMsg('Profile updated successfully');
      loadProfile();
    } catch (e) {
      setMsg(e.response?.data?.error || 'Update failed');
    }
  };

  const changePassword = async () => {
    setPassMsg('');
    if (newPassword !== confirmPassword) { setPassMsg('Passwords do not match'); return; }
    if (newPassword.length < 6) { setPassMsg('Minimum 6 characters'); return; }
    try {
      await settings.changePassword({ currentPassword, newPassword });
      setPassMsg('Password changed successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e) {
      setPassMsg(e.response?.data?.error || 'Password change failed');
    }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: '12px', color: 'var(--text-1)', fontSize: '0.9rem',
    outline: 'none', fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block', fontSize: '0.82rem', fontWeight: 700,
    color: 'var(--text-2)', marginBottom: '8px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)' }}>Settings</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-3)', marginTop: '4px' }}>
          Manage your profile, credentials, and preferences.
        </p>
      </div>

      {/* Profile Info Card */}
      {profile && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '999px',
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 800, color: 'white',
            }}>
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>{profile.username}</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-3)' }}>{profile.email}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <span style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                background: 'var(--cyan-dim)', color: 'var(--cyan)',
              }}>{profile.role}</span>
              <span style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                background: 'rgba(129,140,248,0.12)', color: '#818cf8',
              }}>{profile.total_scans} scans</span>
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
            Member since {new Date(profile.created_at).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Edit Profile */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '24px',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '20px' }}>Edit Profile</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={inputStyle} />
          </div>
          <button onClick={updateProfile} style={{
            padding: '14px 24px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
            color: 'white', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(56,189,248,0.22)',
            alignSelf: 'flex-start',
          }}>Save Changes</button>
          {msg && <div style={{ fontSize: '0.86rem', color: '#38bdf8', fontWeight: 600 }}>{msg}</div>}
        </div>
      </div>

      {/* Change Password */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '24px',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '20px' }}>Change Password</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" style={inputStyle} />
          </div>
          <button onClick={changePassword} style={{
            padding: '14px 24px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #fb923c, #f87171)',
            color: 'white', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(251,146,60,0.22)',
            alignSelf: 'flex-start',
          }}>Change Password</button>
          {passMsg && <div style={{ fontSize: '0.86rem', color: '#fb923c', fontWeight: 600 }}>{passMsg}</div>}
        </div>
      </div>
    </div>
  );
}