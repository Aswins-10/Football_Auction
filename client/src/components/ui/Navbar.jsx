import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;
    const dashPath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
    const isDashActive = isActive('/dashboard') || isActive('/admin/dashboard');

    return (
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '58px' }}>

                    {/* Logo */}
                    <Link to={user ? dashPath : '/'} style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', flexShrink: 0 }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 0 14px rgba(5,150,105,0.35)' }}>⚽</div>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f9fafb' }}>AuctionFC</span>
                    </Link>

                    {/* Desktop nav links */}
                    {user && (
                        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Link to={dashPath} style={{
                                padding: '6px 14px', borderRadius: '8px', textDecoration: 'none',
                                fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s',
                                background: isDashActive ? 'rgba(5,150,105,0.15)' : 'transparent',
                                color: isDashActive ? '#34d399' : '#9ca3af',
                            }}>🏟️ Tournaments</Link>
                        </div>
                    )}

                    {/* Desktop right side */}
                    <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '5px 11px', borderRadius: '10px', background: 'rgba(31,41,55,0.6)', border: '1px solid rgba(55,65,81,0.4)' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: user.role === 'ADMIN' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                                        {user.role === 'ADMIN' ? '⚙️' : '👤'}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f9fafb', margin: 0, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username || user.email}</p>
                                        <p style={{ fontSize: '0.62rem', fontWeight: 700, margin: 0, color: user.role === 'ADMIN' ? '#f59e0b' : '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user.role === 'ADMIN' ? 'Admin' : 'Team Owner'}</p>
                                    </div>
                                </div>
                                <button onClick={logout} style={{ padding: '6px 13px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(75,85,99,0.5)', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(75,85,99,0.5)'; e.currentTarget.style.color = '#9ca3af'; }}>
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" style={{ padding: '6px 15px', borderRadius: '8px', textDecoration: 'none', border: '1px solid rgba(75,85,99,0.5)', color: '#d1d5db', fontSize: '0.875rem', fontWeight: 500 }}>Login</Link>
                                <Link to="/signup" style={{ padding: '6px 15px', borderRadius: '8px', textDecoration: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 0 18px rgba(5,150,105,0.3)' }}>Sign Up</Link>
                            </>
                        )}
                    </div>

                    {/* Hamburger — mobile only */}
                    <button className="hamburger-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
                        <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
                        <span style={{ opacity: menuOpen ? 0 : 1 }} />
                        <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
                    </button>
                </div>
            </div>

            {/* Mobile dropdown menu */}
            <div className={`nav-mobile-menu ${menuOpen ? 'open' : ''}`}>
                {user ? (
                    <>
                        {/* User info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(31,41,55,0.6)', marginBottom: '4px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: user.role === 'ADMIN' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {user.role === 'ADMIN' ? '⚙️' : '👤'}
                            </div>
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f9fafb', margin: 0 }}>{user.username || user.email}</p>
                                <p style={{ fontSize: '0.65rem', fontWeight: 700, margin: 0, color: user.role === 'ADMIN' ? '#f59e0b' : '#34d399', textTransform: 'uppercase' }}>{user.role === 'ADMIN' ? 'Admin' : 'Team Owner'}</p>
                            </div>
                        </div>
                        <Link to={dashPath} onClick={() => setMenuOpen(false)} style={{ padding: '12px 14px', borderRadius: '10px', textDecoration: 'none', color: isDashActive ? '#34d399' : '#d1d5db', background: isDashActive ? 'rgba(5,150,105,0.12)' : 'rgba(31,41,55,0.4)', fontWeight: 600, fontSize: '0.9rem' }}>
                            🏟️ Tournaments
                        </Link>
                        <button onClick={() => { logout(); setMenuOpen(false); }} style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left' }}>
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" onClick={() => setMenuOpen(false)} style={{ padding: '12px 14px', borderRadius: '10px', textDecoration: 'none', color: '#d1d5db', background: 'rgba(31,41,55,0.4)', fontWeight: 600, fontSize: '0.9rem' }}>Login</Link>
                        <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ padding: '12px 14px', borderRadius: '10px', textDecoration: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
