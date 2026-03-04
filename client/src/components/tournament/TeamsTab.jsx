import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function TeamsTab({ tournament, user }) {
    const [teams, setTeams] = useState([]);
    const [myTeam, setMyTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', logo: '' });
    const [formError, setFormError] = useState('');
    const [actionMsg, setActionMsg] = useState('');
    const [budgetInputs, setBudgetInputs] = useState({}); // teamId -> amount string

    // Team name autocomplete
    const [teamSuggestions, setTeamSuggestions] = useState([]);
    const [isTeamSearching, setIsTeamSearching] = useState(false);
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const teamSearchTimeout = useRef(null);

    const fetchTeams = async () => {
        try {
            const res = await api.get(`/tournaments/${tournament._id}/teams`);
            setTeams(res.data);
            if (user?.role === 'TEAM_OWNER') {
                try {
                    const mt = await api.get(`/tournaments/${tournament._id}/teams/myteam`);
                    setMyTeam(mt.data);
                } catch { setMyTeam(null); }
            }
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchTeams(); }, [tournament._id]);

    // Team name autocomplete effect
    useEffect(() => {
        if (!showTeamDropdown || form.name.length < 2) { setTeamSuggestions([]); return; }
        if (teamSearchTimeout.current) clearTimeout(teamSearchTimeout.current);
        teamSearchTimeout.current = setTimeout(async () => {
            setIsTeamSearching(true);
            try {
                const { data } = await api.get(`/team-search?q=${encodeURIComponent(form.name)}`);
                setTeamSuggestions(data);
            } catch { setTeamSuggestions([]); }
            setIsTeamSearching(false);
        }, 400);
        return () => clearTimeout(teamSearchTimeout.current);
    }, [form.name, showTeamDropdown]);

    const handleSelectTeam = (result) => {
        setForm({ name: result.name, logo: result.logo || '' });
        setShowTeamDropdown(false);
    };

    const notify = (msg, isError = false) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(''), 3500);
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            await api.post(`/tournaments/${tournament._id}/teams`, form);
            setShowCreate(false);
            setForm({ name: '', logo: '' });
            setShowTeamDropdown(false);
            fetchTeams();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Error creating team');
        }
    };

    const handleRequest = async (teamId) => {
        try {
            await api.post(`/tournaments/${tournament._id}/teams/${teamId}/request`);
            fetchTeams();
            notify('✅ Request sent! Waiting for admin approval.');
        } catch (err) {
            notify('❌ ' + (err.response?.data?.message || 'Could not send request'));
        }
    };

    const handleApprove = async (teamId) => {
        try {
            await api.put(`/tournaments/${tournament._id}/teams/${teamId}/approve`);
            fetchTeams();
            notify('✅ Team approved!');
        } catch (err) {
            notify('❌ ' + (err.response?.data?.message || 'Error approving'));
        }
    };

    const handleAddBudget = async (teamId, isDecrease = false) => {
        const raw = parseFloat(budgetInputs[teamId]);
        if (!raw || isNaN(raw) || raw <= 0) { notify('❌ Enter a valid positive amount'); return; }
        const amount = isDecrease ? -raw : raw;
        try {
            await api.put(`/tournaments/${tournament._id}/teams/${teamId}/budget`, { amount });
            setBudgetInputs(prev => ({ ...prev, [teamId]: '' }));
            fetchTeams();
            notify(isDecrease ? `✅ Deducted ${raw}M from team budget` : `✅ Added ${raw}M to team budget`);
        } catch (err) {
            notify('❌ ' + (err.response?.data?.message || 'Error updating budget'));
        }
    };

    const handleReject = async (teamId) => {
        try {
            await api.put(`/tournaments/${tournament._id}/teams/${teamId}/reject`);
            fetchTeams();
            notify('⚪ Request rejected.');
        } catch (err) {
            notify('❌ ' + (err.response?.data?.message || 'Error rejecting'));
        }
    };

    const filledSlots = teams.filter(t => t.assignedUserId).length;
    const pendingCount = teams.filter(t => t.pendingUserId && !t.assignedUserId).length;

    return (
        <div>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        <strong style={{ color: '#f9fafb' }}>{filledSlots}</strong> / {tournament.totalSlots} slots filled
                    </span>
                    {pendingCount > 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
                            ⏳ {pendingCount} pending approval
                        </span>
                    )}
                </div>
                {user?.role === 'ADMIN' && (
                    <button onClick={() => setShowCreate(true)} style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                    }}>+ Add Team Slot</button>
                )}
            </div>

            {/* Status message */}
            {actionMsg && (
                <div style={{
                    padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.875rem', fontWeight: 500,
                    background: actionMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${actionMsg.startsWith('✅') ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color: actionMsg.startsWith('✅') ? '#34d399' : '#f87171',
                }}>{actionMsg}</div>
            )}

            {/* Team owner join guide */}
            {user?.role === 'TEAM_OWNER' && !myTeam && (
                <div style={{
                    padding: '14px 18px', borderRadius: '12px', marginBottom: '20px',
                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                }}>
                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                    <div>
                        <p style={{ fontWeight: 700, color: '#a5b4fc', fontSize: '0.8rem', margin: '0 0 3px' }}>How to join</p>
                        <p style={{ color: '#6b7280', fontSize: '0.78rem', margin: 0, lineHeight: 1.6 }}>
                            Find an <strong style={{ color: '#f9fafb' }}>Available</strong> slot below and click <strong style={{ color: '#f9fafb' }}>Request to Join</strong>.
                            Once the admin approves your request, you'll be linked to that team and can bid in the auction.
                        </p>
                    </div>
                </div>
            )}

            {/* My team banner */}
            {myTeam && (
                <div style={{
                    padding: '14px 18px', borderRadius: '12px', marginBottom: '20px',
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                    }}>🛡️</div>
                    <div>
                        <p style={{ fontWeight: 700, color: '#34d399', fontSize: '0.875rem', margin: '0 0 2px' }}>Your Team: {myTeam.name}</p>
                        <p style={{ color: '#6b7280', fontSize: '0.78rem', margin: 0 }}>
                            💰 {myTeam.budgetRemaining}M remaining · ⚽ {myTeam.squadCount} players
                        </p>
                    </div>
                </div>
            )}

            {/* Teams grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>⏳ Loading teams...</div>
            ) : teams.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 0',
                    background: 'rgba(17,24,39,0.6)', borderRadius: '16px',
                    border: '1px solid rgba(55,65,81,0.4)',
                }}>
                    <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🏟️</p>
                    <p style={{ color: '#f9fafb', fontWeight: 700, margin: '0 0 4px' }}>No team slots yet</p>
                    <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                        {user?.role === 'ADMIN' ? 'Add team slots using the button above.' : 'Admin hasn\'t added team slots yet.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                    {teams.map((team) => {
                        const isMine = myTeam?._id === team._id;
                        const isAssigned = !!team.assignedUserId;
                        const isPending = !isAssigned && (team.pendingUserId?._id === user?._id || team.pendingUserId === user?._id);
                        const hasPendingRequest = !isAssigned && !!team.pendingUserId;
                        const isAvailable = !isAssigned && !hasPendingRequest;
                        const canRequest = user?.role === 'TEAM_OWNER' && !myTeam && isAvailable;

                        // Status info
                        let statusLabel = 'Available';
                        let statusColor = '#10b981';
                        let statusBg = 'rgba(16,185,129,0.1)';
                        if (isAssigned) { statusLabel = 'Taken'; statusColor = '#6b7280'; statusBg = 'rgba(107,114,128,0.1)'; }
                        else if (hasPendingRequest) { statusLabel = 'Pending'; statusColor = '#f59e0b'; statusBg = 'rgba(245,158,11,0.1)'; }

                        return (
                            <div key={team._id} style={{
                                background: isMine ? 'rgba(5,150,105,0.08)' : 'rgba(17,24,39,0.8)',
                                border: `1px solid ${isMine ? 'rgba(5,150,105,0.4)' : 'rgba(55,65,81,0.4)'}`,
                                borderRadius: '16px', padding: '20px',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                            >
                                {/* Team header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                    <Link to={`/tournament/${tournament._id}/team/${team._id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '12px', flexShrink: 0 }}>
                                        {team.logo ? (
                                            <img src={team.logo} alt={team.name} style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover' }}
                                                onError={e => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                                                background: 'linear-gradient(135deg, #3b82f6, #4338ca)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: '#fff'
                                            }}>🛡️</div>
                                        )}
                                    </Link>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f9fafb', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <Link to={`/tournament/${tournament._id}/team/${team._id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-emerald-400 transition-colors">
                                                {team.name}
                                            </Link>
                                            {isMine && <span style={{ color: '#34d399', fontSize: '0.7rem', marginLeft: '6px' }}>(You)</span>}
                                        </h3>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
                                            background: statusBg, color: statusColor,
                                        }}>{statusLabel}</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                                    <div style={{ background: 'rgba(31,41,55,0.6)', borderRadius: '8px', padding: '8px 10px' }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', margin: 0 }}>{team.budgetRemaining}M</p>
                                        <p style={{ fontSize: '0.68rem', color: '#6b7280', margin: '2px 0 0' }}>Budget Left</p>
                                    </div>
                                    <div style={{ background: 'rgba(31,41,55,0.6)', borderRadius: '8px', padding: '8px 10px' }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#60a5fa', margin: 0 }}>{team.squadCount}</p>
                                        <p style={{ fontSize: '0.68rem', color: '#6b7280', margin: '2px 0 0' }}>Players</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                {canRequest && (
                                    <button onClick={() => handleRequest(team._id)} style={{
                                        width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid rgba(5,150,105,0.4)',
                                        background: 'rgba(5,150,105,0.08)', color: '#34d399', fontWeight: 600, fontSize: '0.8rem',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(5,150,105,0.18)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,150,105,0.08)'; }}
                                    >
                                        🙋 Request to Join This Team
                                    </button>
                                )}

                                {isPending && (
                                    <div style={{
                                        padding: '9px', borderRadius: '8px', textAlign: 'center',
                                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                                        color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600,
                                    }}>⏳ Your request is pending approval</div>
                                )}

                                {/* Admin pending request — with username */}
                                {user?.role === 'ADMIN' && hasPendingRequest && (
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, margin: '0 0 6px' }}>
                                            ⏳ Request from: <strong>{team.pendingUserId?.username || team.pendingUserId?.email || 'Unknown'}</strong>
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                            <button onClick={() => handleApprove(team._id)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✓ Approve</button>
                                            <button onClick={() => handleReject(team._id)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✕ Reject</button>
                                        </div>
                                    </div>
                                )}

                                {/* Admin budget control */}
                                {user?.role === 'ADMIN' && isAssigned && (
                                    <div>
                                        <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 5px', fontWeight: 600 }}>💰 Adjust Budget</p>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            <input
                                                type="number" min="1" placeholder="Amount (M)"
                                                value={budgetInputs[team._id] || ''}
                                                onChange={e => setBudgetInputs(prev => ({ ...prev, [team._id]: e.target.value }))}
                                                style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.4)', color: '#f9fafb', fontSize: '0.8rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                                onFocus={e => e.target.style.borderColor = '#059669'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(75,85,99,0.4)'}
                                            />
                                            <button
                                                onClick={() => handleAddBudget(team._id, false)}
                                                title="Add budget"
                                                style={{ padding: '7px 11px', borderRadius: '8px', border: '1px solid rgba(5,150,105,0.35)', background: 'rgba(5,150,105,0.12)', color: '#34d399', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                                            >+</button>
                                            <button
                                                onClick={() => handleAddBudget(team._id, true)}
                                                title="Deduct budget"
                                                style={{ padding: '7px 11px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.10)', color: '#f87171', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                                            >−</button>
                                        </div>
                                    </div>
                                )}
                                {user?.role === 'TEAM_OWNER' && myTeam && !isMine && isAvailable && (
                                    <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '0.75rem' }}>
                                        You already have a team
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Team Modal */}
            {showCreate && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                }}>
                    <div style={{
                        background: 'rgba(17,24,39,0.98)', border: '1px solid rgba(55,65,81,0.6)',
                        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px',
                    }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 20px' }}>Add Team Slot</h2>
                        {formError && (
                            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.875rem' }}>
                                ⚠️ {formError}
                            </div>
                        )}
                        <form onSubmit={handleCreateTeam}>
                            {/* Team Name with autocomplete */}
                            <div style={{ marginBottom: '16px', position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Team Name</label>
                                <input
                                    placeholder="Manchester City" required value={form.name}
                                    onChange={e => { setForm({ ...form, name: e.target.value }); setShowTeamDropdown(true); }}
                                    onFocus={() => { if (form.name.length >= 2) setShowTeamDropdown(true); }}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', boxSizing: 'border-box', background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)', color: '#f9fafb', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                />
                                {showTeamDropdown && form.name.length >= 2 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                                        background: 'rgba(17,24,39,0.98)', border: '1px solid rgba(75,85,99,0.5)',
                                        borderRadius: '10px', overflow: 'hidden', zIndex: 110,
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
                                    }}>
                                        {isTeamSearching ? (
                                            <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>Searching...</div>
                                        ) : teamSuggestions.length === 0 ? (
                                            <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>No clubs found.</span>
                                                <button type="button" onClick={() => setShowTeamDropdown(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}>Close</button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(75,85,99,0.3)' }}>
                                                    <span style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggestions</span>
                                                    <button type="button" onClick={() => setShowTeamDropdown(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.9rem', cursor: 'pointer' }}>✕</button>
                                                </div>
                                                <div style={{ maxHeight: '210px', overflowY: 'auto' }}>
                                                    {teamSuggestions.map((t, i) => (
                                                        <div key={i} onClick={() => handleSelectTeam(t)} style={{
                                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                                                            borderBottom: '1px solid rgba(75,85,99,0.2)', cursor: 'pointer', transition: 'background 0.2s'
                                                        }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(75,85,99,0.3)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            {t.logo ? (
                                                                <img src={t.logo} alt={t.name} style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }}
                                                                    onError={e => e.target.style.display = 'none'} />
                                                            ) : (
                                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>🛡️</div>
                                                            )}
                                                            <div>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f9fafb' }}>{t.name}</div>
                                                                <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{t.league} · {t.country}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Logo URL with live preview */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Logo URL (auto-filled or manual)</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input placeholder="https://..." value={form.logo}
                                        onChange={e => setForm({ ...form, logo: e.target.value })}
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', boxSizing: 'border-box', background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)', color: '#f9fafb', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                    />
                                    {form.logo && (
                                        <img src={form.logo} alt="preview" style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }}
                                            onError={e => e.target.style.display = 'none'} />
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                                    Add Team
                                </button>
                                <button type="button" onClick={() => { setShowCreate(false); setFormError(''); }} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid rgba(75,85,99,0.5)', background: 'transparent', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
