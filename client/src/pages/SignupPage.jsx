import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await signup(form.email, form.password, 'TEAM_OWNER', form.username);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
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
            <div style={{ width: '100%', maxWidth: '420px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 12px',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.75rem', boxShadow: '0 0 30px rgba(5,150,105,0.4)',
                    }}>⚽</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f9fafb', margin: 0 }}>Create Account</h1>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '6px' }}>Join AuctionFC and start bidding</p>
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
                        {[
                            { label: 'Username', name: 'username', type: 'text', placeholder: 'e.g. john_doe' },
                            { label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@example.com' },
                            { label: 'Password', name: 'password', type: 'password', placeholder: 'Min. 6 characters', minLength: 6 },
                            { label: 'Confirm Password', name: 'confirmPassword', type: 'password', placeholder: 'Re-enter your password' },
                        ].map((f, i) => (
                            <div key={f.name} style={{ marginBottom: i < 3 ? '16px' : '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>
                                    {f.label}
                                </label>
                                <input
                                    id={`signup-${f.name}`}
                                    name={f.name}
                                    type={f.type}
                                    placeholder={f.placeholder}
                                    value={form[f.name]}
                                    onChange={handleChange}
                                    minLength={f.minLength}
                                    required
                                    style={{
                                        width: '100%', padding: '11px 14px', borderRadius: '10px',
                                        background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)',
                                        color: '#f9fafb', fontSize: '0.9rem', outline: 'none',
                                        boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#059669'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(75,85,99,0.5)'}
                                />
                            </div>
                        ))}

                        <button
                            id="signup-submit"
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                                background: loading ? '#374151' : 'linear-gradient(135deg, #059669, #047857)',
                                color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s', letterSpacing: '0.02em',
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                            {loading ? '⏳ Creating account...' : 'Create Account'}
                        </button>
                    </form>
                </div>

                {/* Footer link */}
                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginTop: '20px' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>
                        Sign in →
                    </Link>
                </p>
            </div>
        </div>
    );
}
