import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function LandingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user]);

    return (
        <div style={{ background: '#0a0f1e', minHeight: '100vh', overflowX: 'hidden' }}>

            {/* ── HERO ── */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Subtle background glow — purely decorative, no layout impact */}
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                    background: 'radial-gradient(ellipse 900px 500px at 50% 0%, rgba(5,150,105,0.15) 0%, transparent 70%)',
                }} />

                <div style={{
                    position: 'relative', zIndex: 1,
                    maxWidth: '800px', margin: '0 auto',
                    padding: '80px 24px 72px',
                    textAlign: 'center',
                }}>
                    {/* Live badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '6px 16px', borderRadius: '999px', fontSize: '11px',
                            fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                            background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)',
                            color: '#34d399',
                        }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
                            Real-Time Football Auction Platform
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 style={{
                        fontWeight: 900, lineHeight: 1.05, marginBottom: '20px',
                        fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
                        color: '#f9fafb',
                    }}>
                        Build Your<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #34d399, #059669)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Dream Squad
                        </span>
                    </h1>

                    {/* Subtext */}
                    <p style={{
                        color: '#9ca3af', fontSize: '1.125rem', lineHeight: 1.7,
                        marginBottom: '36px', maxWidth: '480px', margin: '0 auto 36px',
                    }}>
                        Compete in private live football player auctions. Manage your budget
                        smartly, outbid rivals, and build the ultimate team — in real time.
                    </p>

                    {/* CTA buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '60px' }}>
                        <Link to="/signup" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '14px 32px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #059669, #047857)',
                            color: '#fff', fontWeight: 700, fontSize: '1rem',
                            textDecoration: 'none', boxShadow: '0 0 40px rgba(5,150,105,0.35)',
                            transition: 'all 0.2s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(5,150,105,0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 40px rgba(5,150,105,0.35)'; }}
                        >
                            Get Started Free →
                        </Link>
                        <Link to="/login" style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '14px 32px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                            color: '#d1d5db', fontWeight: 600, fontSize: '1rem',
                            textDecoration: 'none', transition: 'all 0.2s ease',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            Sign In
                        </Link>
                    </div>

                    {/* Stats strip */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
                        gap: '40px', paddingTop: '40px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        {[
                            { value: 'Live', label: 'Real-Time Bidding' },
                            { value: '20s', label: 'Default Timer' },
                            { value: '10', label: 'Player Positions' },
                            { value: '∞', label: 'Strategies' },
                        ].map(s => (
                            <div key={s.label} style={{ textAlign: 'center' }}>
                                <p style={{
                                    fontSize: '1.875rem', fontWeight: 900,
                                    background: 'linear-gradient(135deg, #34d399, #059669)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    margin: 0,
                                }}>{s.value}</p>
                                <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '4px 0 0' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── HOW IT WORKS ── */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <p style={{ color: '#34d399', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                        How It Works
                    </p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f9fafb', margin: 0 }}>
                        Auction in 3 Simple Steps
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {[
                        { step: '01', icon: '🏟️', title: 'Create & Join', desc: 'Admin creates a tournament with budget, squad limits and timer. Team owners request their team slot and get approved.', color: '#10b981' },
                        { step: '02', icon: '⚡', title: 'Bid Live', desc: 'Players appear one by one in queue. Hit BID to raise the price. Timer resets on every bid. Use QUIT to skip strategically.', color: '#f59e0b' },
                        { step: '03', icon: '🏆', title: 'Build Squad', desc: 'Win players before the countdown hits zero. Manage budget across all positions to assemble the strongest team.', color: '#6366f1' },
                    ].map(item => (
                        <div key={item.step} style={{
                            background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.5)',
                            borderRadius: '20px', padding: '28px', position: 'relative', overflow: 'hidden',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                        >
                            {/* Background step number */}
                            <div style={{
                                position: 'absolute', right: '-8px', top: '-16px',
                                fontSize: '7rem', fontWeight: 900, color: item.color,
                                opacity: 0.05, lineHeight: 1, userSelect: 'none',
                            }}>{item.step}</div>

                            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{item.icon}</div>
                            <p style={{ color: item.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Step {item.step}
                            </p>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f9fafb', marginBottom: '10px' }}>{item.title}</h3>
                            <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── FEATURES GRID ── */}
            <div style={{
                background: 'rgba(17,24,39,0.4)',
                borderTop: '1px solid rgba(55,65,81,0.3)',
                borderBottom: '1px solid rgba(55,65,81,0.3)',
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <p style={{ color: '#34d399', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                            Features
                        </p>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f9fafb', margin: 0 }}>
                            Built for Serious Auctions
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        {[
                            { icon: '⏱️', title: 'Server Timer', desc: 'Countdown runs on server — resets on every bid' },
                            { icon: '💸', title: 'Smart Increments', desc: 'Adaptive steps: +2.5M / +5M / +10M' },
                            { icon: '🚫', title: 'Quit Strategy', desc: 'Quit a player — last team wins instantly' },
                            { icon: '🛡️', title: 'Budget Guard', desc: 'Server validates every bid, no overspending' },
                            { icon: '👑', title: 'Admin Controls', desc: 'Pause, Resume, Skip, Reopen, End auction' },
                            { icon: '📡', title: 'Live Sync', desc: 'Socket.io keeps every screen in real time' },
                            { icon: '🔐', title: 'Secure Auth', desc: 'Separate admin and team owner portals' },
                            { icon: '📊', title: 'Bid Logs', desc: 'Every bid tracked with team and timestamp' },
                        ].map(f => (
                            <div key={f.title} style={{
                                background: 'rgba(31,41,55,0.6)', border: '1px solid rgba(55,65,81,0.4)',
                                borderRadius: '14px', padding: '20px',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                            >
                                <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{f.icon}</div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f9fafb', marginBottom: '6px' }}>{f.title}</h4>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── FOOTER CTA ── */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚽</div>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f9fafb', marginBottom: '12px' }}>
                    Ready to start bidding?
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '32px' }}>
                    Create your account in seconds. No credit card required.
                </p>
                <Link to="/signup" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '16px 40px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#fff', fontWeight: 700, fontSize: '1rem',
                    textDecoration: 'none', boxShadow: '0 0 50px rgba(5,150,105,0.3)',
                    transition: 'all 0.2s ease',
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 70px rgba(5,150,105,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 50px rgba(5,150,105,0.3)'; }}
                >
                    Create Free Account →
                </Link>
            </div>

        </div>
    );
}
