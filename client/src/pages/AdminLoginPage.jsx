import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('login');
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const switchTab = (t) => {
        setTab(t);
        setError('');
        setForm({ username: '', email: '', password: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let user;
            if (tab === 'login') {
                user = await login(form.email, form.password);
            } else {
                user = await signup(form.email, form.password, 'ADMIN', form.username);
            }
            if (user.role !== 'ADMIN') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setError('Access denied. This portal is for admins only.');
                setLoading(false);
                return;
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '11px 14px', borderRadius: '10px',
        background: 'rgba(31,20,5,0.6)', border: '1px solid rgba(180,83,9,0.3)',
        color: '#f9fafb', fontSize: '0.9rem', outline: 'none',
        boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s',
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0f1e 0%, #1a0f00 50%, #0a0f1e 100%)',
            padding: '24px',
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 12px',
                        background: 'linear-gradient(135deg, #d97706, #b45309)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.75rem', boxShadow: '0 0 30px rgba(217,119,6,0.4)',
                    }}>⚙️</div>
                    <div style={{
                        display: 'inline-block', padding: '4px 14px', borderRadius: '999px',
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                        color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', marginBottom: '10px',
                    }}>🔐 Admin Portal</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f9fafb', margin: 0 }}>Admin Access</h1>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '6px' }}>Authorized personnel only</p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(180,83,9,0.3)',
                    borderRadius: '20px', padding: '32px', backdropFilter: 'blur(12px)',
                }}>
                    {/* Tab switcher */}
                    <div style={{
                        display: 'flex', gap: '4px', background: 'rgba(31,41,55,0.8)',
                        borderRadius: '12px', padding: '4px', marginBottom: '24px',
                    }}>
                        {['login', 'signup'].map(t => (
                            <button key={t} onClick={() => switchTab(t)} style={{
                                flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
                                background: tab === t ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
                                color: tab === t ? '#fff' : '#9ca3af',
                                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                                fontFamily: 'Inter, sans-serif',
                            }}>
                                {t === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: '#f87171', fontSize: '0.875rem', fontWeight: 500,
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Username — only on signup tab */}
                        {tab === 'signup' && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                                    Username
                                </label>
                                <input id="admin-username" name="username" type="text" placeholder="admin_username"
                                    value={form.username} onChange={handleChange} required
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#d97706'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(180,83,9,0.3)'}
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                                Admin Email
                            </label>
                            <input id="admin-email" name="email" type="email" placeholder="admin@example.com"
                                value={form.email} onChange={handleChange} required
                                style={inputStyle}
                                onFocus={e => e.target.style.borderColor = '#d97706'}
                                onBlur={e => e.target.style.borderColor = 'rgba(180,83,9,0.3)'}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                                Password
                            </label>
                            <input id="admin-password" name="password" type="password"
                                placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'}
                                value={form.password} onChange={handleChange} required minLength={6}
                                style={inputStyle}
                                onFocus={e => e.target.style.borderColor = '#d97706'}
                                onBlur={e => e.target.style.borderColor = 'rgba(180,83,9,0.3)'}
                            />
                        </div>

                        <button id="admin-submit" type="submit" disabled={loading} style={{
                            width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                            background: loading ? '#374151' : 'linear-gradient(135deg, #d97706, #b45309)',
                            color: loading ? '#9ca3af' : '#fff',
                            fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                        }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                            {loading
                                ? '⏳ Please wait...'
                                : tab === 'login' ? 'Sign In as Admin' : 'Create Admin Account'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.8rem', marginTop: '20px' }}>
                    Team owner?{' '}
                    <a href="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>
                        Go to main login →
                    </a>
                </p>
            </div>
        </div>
    );
}
