import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_META = {
    UPCOMING: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', label: 'Upcoming', dot: '🟢' },
    LIVE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Live', dot: '🟡' },
    FINISHED: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)', label: 'Finished', dot: '⚫' },
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', totalSlots: 8, budgetPerTeam: 200, squadSizeLimit: 15, timerDuration: 20 });
    const [createError, setCreateError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null); // tournament object to delete
    const [deleteError, setDeleteError] = useState('');

    const fetchTournaments = async () => {
        try {
            const { data } = await api.get('/tournaments');
            setTournaments(data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchTournaments(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateError('');
        try {
            await api.post('/tournaments', form);
            setShowCreate(false);
            setForm({ name: '', totalSlots: 8, budgetPerTeam: 200, squadSizeLimit: 15, timerDuration: 20 });
            fetchTournaments();
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Failed to create tournament');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeleteError('');
        try {
            await api.delete(`/tournaments/${deleteConfirm._id}`);
            setTournaments(prev => prev.filter(t => t._id !== deleteConfirm._id));
            setDeleteConfirm(null);
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="responsive-page">

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.875rem)', fontWeight: 900, color: '#f9fafb', margin: 0 }}>
                        {user?.role === 'ADMIN' ? '⚙️ Admin Dashboard' : '🏟️ Tournaments'}
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '6px' }}>
                        {user?.role === 'ADMIN'
                            ? 'Manage tournaments and team approvals'
                            : 'Browse tournaments and request a team slot to start bidding'}
                    </p>
                </div>
                {user?.role === 'ADMIN' && (
                    <button onClick={() => setShowCreate(true)} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(5,150,105,0.3)', transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        + New Tournament
                    </button>
                )}
            </div>

            {/* Team Owner guidance card */}
            {user?.role === 'TEAM_OWNER' && (
                <div style={{
                    padding: '16px 20px', borderRadius: '14px', marginBottom: '24px',
                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                }}>
                    <span style={{ fontSize: '1.5rem' }}>💡</span>
                    <div>
                        <p style={{ fontWeight: 700, color: '#a5b4fc', fontSize: '0.875rem', margin: '0 0 4px' }}>How to join a tournament</p>
                        <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>
                            Open a tournament below → go to the <strong style={{ color: '#f9fafb' }}>Teams</strong> tab →
                            find an <strong style={{ color: '#f9fafb' }}>Available</strong> team slot →
                            click <strong style={{ color: '#f9fafb' }}>Request to Join</strong>.
                            Once the admin approves, you can bid in the auction!
                        </p>
                    </div>
                </div>
            )}

            {/* Tournaments */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#6b7280' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
                    <p>Loading tournaments...</p>
                </div>
            ) : tournaments.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '80px 0',
                    background: 'rgba(17,24,39,0.6)', borderRadius: '20px',
                    border: '1px solid rgba(55,65,81,0.4)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏟️</div>
                    <p style={{ color: '#f9fafb', fontWeight: 700, margin: '0 0 6px' }}>No tournaments yet</p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {user?.role === 'ADMIN' ? 'Create your first tournament above.' : 'Check back soon!'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {tournaments.map((t) => {
                        const meta = STATUS_META[t.status] || STATUS_META.UPCOMING;
                        return (
                            <Link to={`/tournament/${t._id}`} key={t._id} style={{ textDecoration: 'none', display: 'block' }}>
                                <div style={{
                                    background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.4)',
                                    borderRadius: '18px', padding: '24px', height: '100%',
                                    transition: 'all 0.2s', cursor: 'pointer', position: 'relative',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(5,150,105,0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(55,65,81,0.4)'; }}
                                >
                                    {/* Card top */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #059669, #047857)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                                        }}>🏆</div>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                                                letterSpacing: '0.05em', textTransform: 'uppercase',
                                                background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                                            }}>{meta.label}</span>
                                            {user?.role === 'ADMIN' && (
                                                <button
                                                    onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm(t); setDeleteError(''); }}
                                                    title="Delete tournament"
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '7px', border: 'none',
                                                        background: 'rgba(239,68,68,0.15)', color: '#f87171',
                                                        fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                                                >🗑</button>
                                            )}
                                        </div>
                                    </div>

                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {t.name}
                                    </h2>
                                    <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 16px' }}>
                                        Timer: {t.timerDuration}s per player
                                    </p>

                                    {/* Stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[
                                            { label: 'Team Slots', value: t.totalSlots, icon: '👥' },
                                            { label: 'Budget / Team', value: `${t.budgetPerTeam}M`, icon: '💰' },
                                            { label: 'Squad Limit', value: t.squadSizeLimit, icon: '⚽' },
                                            { label: 'Timer', value: `${t.timerDuration}s`, icon: '⏱️' },
                                        ].map(s => (
                                            <div key={s.label} style={{
                                                background: 'rgba(31,41,55,0.6)', borderRadius: '10px', padding: '10px 12px',
                                            }}>
                                                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '0 0 2px' }}>{s.icon} {s.label}</p>
                                                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#f9fafb', margin: 0 }}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{
                                        marginTop: '16px', padding: '10px', borderRadius: '10px', textAlign: 'center',
                                        background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)',
                                        color: '#34d399', fontSize: '0.8rem', fontWeight: 600,
                                    }}>
                                        {user?.role === 'ADMIN' ? 'Manage Tournament →' : 'View & Join Tournament →'}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Create Tournament Modal */}
            {showCreate && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                }}>
                    <div style={{
                        background: 'rgba(17,24,39,0.98)', border: '1px solid rgba(55,65,81,0.6)',
                        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px',
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 24px' }}>Create Tournament</h2>

                        {createError && (
                            <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.875rem' }}>
                                ⚠️ {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreate}>
                            {[
                                { label: 'Tournament Name', key: 'name', type: 'text', placeholder: 'Premier League 2025' },
                                { label: 'Team Slots', key: 'totalSlots', type: 'number', min: 2, placeholder: '8' },
                                { label: 'Budget per Team (M)', key: 'budgetPerTeam', type: 'number', min: 10, placeholder: '200' },
                                { label: 'Squad Size Limit', key: 'squadSizeLimit', type: 'number', min: 1, placeholder: '15' },
                                { label: 'Auction Timer (seconds)', key: 'timerDuration', type: 'number', min: 5, placeholder: '20' },
                            ].map((f, i) => (
                                <div key={f.key} style={{ marginBottom: i < 4 ? '16px' : '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>{f.label}</label>
                                    <input
                                        type={f.type} placeholder={f.placeholder} min={f.min} required
                                        value={form[f.key]}
                                        onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: '10px', boxSizing: 'border-box',
                                            background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)',
                                            color: '#f9fafb', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif',
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#059669'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(75,85,99,0.5)'}
                                    />
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg, #059669, #047857)',
                                    color: '#fff', fontWeight: 700, cursor: 'pointer',
                                }}>Create Tournament</button>
                                <button type="button" onClick={() => setShowCreate(false)} style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                                    background: 'transparent', border: '1px solid rgba(75,85,99,0.5)', color: '#9ca3af', fontWeight: 600,
                                }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                }}>
                    <div style={{
                        background: 'rgba(17,24,39,0.98)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '380px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 8px' }}>Delete Tournament?</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 4px' }}>
                            Permanently delete <strong style={{ color: '#f9fafb' }}>{deleteConfirm.name}</strong>?
                        </p>
                        <p style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, margin: '0 0 24px' }}>All teams and players will also be deleted.</p>
                        {deleteError && <div style={{ marginBottom: '14px', padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.8rem' }}>⚠️ {deleteError}</div>}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleDelete} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Yes, Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(75,85,99,0.5)', background: 'transparent', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
