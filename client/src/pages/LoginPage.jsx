import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.role === 'ADMIN') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setError('Admins must sign in via the Admin Portal.');
                setLoading(false);
                return;
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1f12 50%, #0a0f1e 100%)',
            padding: '24px',
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 12px',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.75rem', boxShadow: '0 0 30px rgba(5,150,105,0.4)',
                    }}>⚽</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f9fafb', margin: 0 }}>Welcome Back</h1>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '6px' }}>Sign in to your AuctionFC account</p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(55,65,81,0.6)',
                    borderRadius: '20px', padding: '32px', backdropFilter: 'blur(12px)',
                }}>
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
                        {/* Email */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                                Email Address
                            </label>
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                                    background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)',
                                    color: '#f9fafb', fontSize: '0.9rem', outline: 'none',
                                    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#059669'}
                                onBlur={e => e.target.style.borderColor = 'rgba(75,85,99,0.5)'}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                                Password
                            </label>
                            <input
                                id="login-password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                                    background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)',
                                    color: '#f9fafb', fontSize: '0.9rem', outline: 'none',
                                    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#059669'}
                                onBlur={e => e.target.style.borderColor = 'rgba(75,85,99,0.5)'}
                            />
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                                background: loading ? '#374151' : 'linear-gradient(135deg, #059669, #047857)',
                                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                            {loading ? '⏳ Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginTop: '20px' }}>
                    No account yet?{' '}
                    <Link to="/signup" style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>
                        Create one →
                    </Link>
                </p>
            </div>
        </div>
    );
}
