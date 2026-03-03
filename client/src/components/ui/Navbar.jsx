import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: 'rgba(10,15,30,0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>

                    {/* Logo */}
                    <Link to={user ? '/dashboard' : '/'} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none',
                    }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #059669, #047857)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem', boxShadow: '0 0 16px rgba(5,150,105,0.35)',
                        }}>⚽</div>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f9fafb' }}>AuctionFC</span>
                    </Link>

                    {/* Nav Links (logged in) */}
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Link to="/dashboard" style={{
                                padding: '6px 14px', borderRadius: '8px', textDecoration: 'none',
                                fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s',
                                background: isActive('/dashboard') ? 'rgba(5,150,105,0.15)' : 'transparent',
                                color: isActive('/dashboard') ? '#34d399' : '#9ca3af',
                            }}>
                                🏟️ Tournaments
                            </Link>
                        </div>
                    )}

                    {/* Right side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user ? (
                            <>
                                {/* User badge */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '6px 12px', borderRadius: '10px',
                                    background: 'rgba(31,41,55,0.6)',
                                    border: '1px solid rgba(55,65,81,0.4)',
                                }}>
                                    <div style={{
                                        width: '30px', height: '30px', borderRadius: '8px',
                                        background: user.role === 'ADMIN'
                                            ? 'linear-gradient(135deg, #d97706, #b45309)'
                                            : 'linear-gradient(135deg, #059669, #047857)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem',
                                    }}>
                                        {user.role === 'ADMIN' ? '⚙️' : '👤'}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f9fafb', margin: 0 }}>
                                            {user.username || user.email}
                                        </p>
                                        <p style={{
                                            fontSize: '0.65rem', fontWeight: 700, margin: 0,
                                            color: user.role === 'ADMIN' ? '#f59e0b' : '#34d399',
                                            textTransform: 'uppercase', letterSpacing: '0.06em',
                                        }}>
                                            {user.role === 'ADMIN' ? 'Admin' : 'Team Owner'}
                                        </p>
                                    </div>
                                </div>

                                <button onClick={logout} style={{
                                    padding: '7px 14px', borderRadius: '8px',
                                    background: 'transparent', border: '1px solid rgba(75,85,99,0.5)',
                                    color: '#9ca3af', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(75,85,99,0.5)'; e.currentTarget.style.color = '#9ca3af'; }}
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" style={{
                                    padding: '7px 16px', borderRadius: '8px', textDecoration: 'none',
                                    border: '1px solid rgba(75,85,99,0.5)', color: '#d1d5db',
                                    fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s',
                                }}>Login</Link>
                                <Link to="/signup" style={{
                                    padding: '7px 16px', borderRadius: '8px', textDecoration: 'none',
                                    background: 'linear-gradient(135deg, #059669, #047857)',
                                    color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                                    boxShadow: '0 0 20px rgba(5,150,105,0.3)',
                                }}>Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
