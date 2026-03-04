import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TeamsTab from '../components/tournament/TeamsTab';
import PlayersTab from '../components/tournament/PlayersTab';
import RulesTab from '../components/tournament/RulesTab';

const TABS = [
    { id: 'overview', label: '📋 Overview', adminOnly: false },
    { id: 'teams', label: '👥 Teams', adminOnly: false },
    { id: 'players', label: '⚽ Players', adminOnly: false },
    { id: 'auction', label: '⚡ Auction', adminOnly: false, isAction: true },
];

const STATUS_META = {
    UPCOMING: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', label: 'Upcoming' },
    LIVE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'Live' },
    FINISHED: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)', label: 'Finished' },
};

export default function TournamentPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editError, setEditError] = useState('');
    const [showDeleteTournament, setShowDeleteTournament] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        api.get(`/tournaments/${id}`)
            .then(({ data }) => { setTournament(data); setLoading(false); })
            .catch(() => navigate('/dashboard'));
    }, [id]);

    const openEdit = () => {
        setEditForm({
            name: tournament.name,
            totalSlots: tournament.totalSlots,
            budgetPerTeam: tournament.budgetPerTeam,
            squadSizeLimit: tournament.squadSizeLimit,
            timerDuration: tournament.timerDuration,
        });
        setEditError('');
        setShowEdit(true);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setEditError('');
        try {
            const { data } = await api.put(`/tournaments/${id}`, editForm);
            setTournament(data);
            setShowEdit(false);
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update tournament');
        }
    };

    const handleDeleteTournament = async () => {
        setDeleteError('');
        try {
            await api.delete(`/tournaments/${id}`);
            navigate('/dashboard');
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'Failed to delete tournament');
        }
    };

    if (loading) return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
            <p>Loading tournament...</p>
        </div>
    );

    const meta = STATUS_META[tournament.status] || STATUS_META.UPCOMING;

    return (
        <div className="responsive-page">

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Link to="/dashboard" style={{ color: '#6b7280', fontSize: '0.8rem', textDecoration: 'none' }}>
                    🏟️ Tournaments
                </Link>
                <span style={{ color: '#4b5563', fontSize: '0.8rem' }}>›</span>
                <span style={{ color: '#f9fafb', fontSize: '0.8rem', fontWeight: 600 }}>{tournament.name}</span>
            </div>

            {/* Tournament Header Card */}
            <div style={{
                background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.5)',
                borderRadius: '20px', padding: '28px', marginBottom: '24px',
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
                            background: 'linear-gradient(135deg, #059669, #047857)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
                            boxShadow: '0 0 30px rgba(5,150,105,0.3)',
                        }}>🏆</div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <h1 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#f9fafb', margin: '0 0 6px' }}>{tournament.name}</h1>
                                {user?.role === 'ADMIN' && (
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={openEdit} style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(75,85,99,0.5)', background: 'transparent', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>✏️ Edit</button>
                                        <button onClick={() => setShowDeleteTournament(true)} style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>🗑️ Delete</button>
                                    </div>
                                )}
                            </div>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color, display: 'inline-block' }} />
                                {meta.label}
                            </span>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Teams', value: tournament.totalSlots, icon: '👥' },
                            { label: 'Budget', value: `${tournament.budgetPerTeam}M`, icon: '💰' },
                            { label: 'Squad', value: tournament.squadSizeLimit, icon: '⚽' },
                            { label: 'Timer', value: `${tournament.timerDuration}s`, icon: '⏱️' },
                        ].map(s => (
                            <div key={s.label} style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f9fafb', margin: 0 }}>{s.icon} {s.value}</p>
                                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '2px 0 0' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-strip" style={{
                display: 'flex', gap: '4px', padding: '6px',
                background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(55,65,81,0.4)',
                borderRadius: '14px', marginBottom: '24px',
            }}>
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    const isAuction = tab.isAction;
                    return (
                        <button key={tab.id}
                            onClick={() => tab.isAction ? navigate(`/tournament/${id}/auction`) : setActiveTab(tab.id)}
                            style={{
                                flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none',
                                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                fontFamily: 'Inter, sans-serif',
                                background: isActive && !isAuction
                                    ? 'linear-gradient(135deg, #059669, #047857)'
                                    : isAuction
                                        ? 'rgba(245,158,11,0.1)'
                                        : 'transparent',
                                color: isActive && !isAuction ? '#fff' : isAuction ? '#f59e0b' : '#9ca3af',
                                border: isAuction ? '1px solid rgba(245,158,11,0.25)' : 'none',
                            }}
                            onMouseEnter={e => { if (!isActive || isAuction) e.currentTarget.style.color = '#f9fafb'; }}
                            onMouseLeave={e => { if (!isActive || isAuction) e.currentTarget.style.color = isAuction ? '#f59e0b' : '#9ca3af'; }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'overview' && <RulesTab tournament={tournament} />}
                {activeTab === 'teams' && <TeamsTab tournament={tournament} user={user} />}
                {activeTab === 'players' && <PlayersTab tournament={tournament} user={user} />}
            </div>

            {/* Edit Tournament Modal */}
            {showEdit && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
                    <div style={{ background: 'rgba(17,24,39,0.98)', border: '1px solid rgba(55,65,81,0.6)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 24px' }}>✏️ Edit Tournament</h2>
                        {editError && <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.875rem' }}>⚠️ {editError}</div>}
                        <form onSubmit={handleEdit}>
                            {[
                                { label: 'Tournament Name', key: 'name', type: 'text' },
                                { label: 'Team Slots', key: 'totalSlots', type: 'number', min: 2 },
                                { label: 'Budget per Team (M)', key: 'budgetPerTeam', type: 'number', min: 1 },
                                { label: 'Squad Size Limit', key: 'squadSizeLimit', type: 'number', min: 1 },
                                { label: 'Auction Timer (seconds)', key: 'timerDuration', type: 'number', min: 5 },
                            ].map((f, i) => (
                                <div key={f.key} style={{ marginBottom: i < 4 ? '14px' : '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>{f.label}</label>
                                    <input type={f.type} min={f.min} required value={editForm[f.key] || ''}
                                        onChange={e => setEditForm({ ...editForm, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', boxSizing: 'border-box', background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)', color: '#f9fafb', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                        onFocus={e => e.target.style.borderColor = '#059669'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(75,85,99,0.5)'}
                                    />
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                                <button type="button" onClick={() => setShowEdit(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(75,85,99,0.5)', background: 'transparent', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Tournament Confirm Modal */}
            {showDeleteTournament && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
                    <div style={{ background: 'rgba(17,24,39,0.98)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '380px', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 8px' }}>Delete Tournament?</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 6px' }}>
                            This will permanently delete <strong style={{ color: '#f9fafb' }}>{tournament.name}</strong> along with all its teams and players.
                        </p>
                        <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0 0 24px', fontWeight: 600 }}>This action cannot be undone.</p>
                        {deleteError && <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.8rem' }}>⚠️ {deleteError}</div>}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleDeleteTournament} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Yes, Delete</button>
                            <button onClick={() => setShowDeleteTournament(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(75,85,99,0.5)', background: 'transparent', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
