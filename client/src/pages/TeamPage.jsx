import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/ui/Loader';

const POS_COLORS = {
    CF: '#ef4444', RW: '#f97316', LW: '#f97316', CAM: '#eab308',
    CM: '#84cc16', CDM: '#22c55e', CB: '#06b6d4', LB: '#3b82f6',
    RB: '#3b82f6', GK: '#a855f7',
};

export default function TeamPage() {
    const { id: tournamentId, teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setLoading(true);
                // We'll get all teams in tournament, find ours
                const { data: teamsData } = await api.get(`/tournaments/${tournamentId}/teams`);
                const targetTeam = teamsData.find(t => t._id === teamId);

                if (!targetTeam) throw new Error('Team not found');
                setTeam(targetTeam);

                // Fetch all players, filter by those sold to this team
                const { data: playersData } = await api.get(`/tournaments/${tournamentId}/players`);
                const mySquad = playersData.filter(p => p.soldTo === teamId || p.soldTo?._id === teamId);
                setPlayers(mySquad);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to load team');
            } finally {
                setLoading(false);
            }
        };
        fetchTeamData();
    }, [tournamentId, teamId]);

    if (loading) return <div className="max-w-7xl mx-auto px-6 py-10"><Loader text="Loading Roster..." /></div>;
    if (error) return <div className="max-w-7xl mx-auto px-6 py-10 text-center text-red-500 font-bold">⚠️ {error}</div>;
    if (!team) return null;

    const totalSpent = players.reduce((sum, p) => sum + (p.soldPrice || 0), 0);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }} className="animate-fadeIn">
            {/* Header */}
            <Link to={`/tournament/${tournamentId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#9ca3af', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px' }} className="hover:text-white transition-colors">
                ← Back to Tournament
            </Link>

            <div style={{ background: 'linear-gradient(135deg, rgba(31,41,55,0.8), rgba(17,24,39,0.9))', borderRadius: '24px', padding: '32px', border: '1px solid rgba(75,85,99,0.4)', display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                {team.logo ? (
                    <img src={team.logo} alt={team.name} style={{ width: '100px', height: '100px', borderRadius: '20px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} />
                ) : (
                    <div style={{ width: '100px', height: '100px', borderRadius: '20px', background: 'linear-gradient(135deg, #3b82f6, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>🛡️</div>
                )}
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f9fafb', margin: '0 0 8px', lineHeight: 1.1 }}>{team.name}</h1>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                        Manager: <span style={{ color: '#f3f4f6' }}>{team.assignedUserId?.username || team.assignedUserId?.email || 'Unknown'}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34d399', margin: '0 0 4px', lineHeight: 1 }}>{team.budgetRemaining}M</p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 700 }}>Budget Left</p>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#60a5fa', margin: '0 0 4px', lineHeight: 1 }}>{players.length}</p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: 700 }}>Squad Size</p>
                    </div>
                </div>
            </div>

            {/* Roster Grid */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f9fafb', margin: 0 }}>Team Roster</h2>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600, margin: 0 }}>Total value: <span style={{ color: '#f59e0b' }}>{totalSpent}M</span></p>
            </div>

            {players.length === 0 ? (
                <div style={{ background: 'rgba(31,41,55,0.4)', borderRadius: '20px', padding: '60px 20px', textAlign: 'center', border: '1px dashed rgba(75,85,99,0.5)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📋</div>
                    <h3 style={{ color: '#f9fafb', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px' }}>No players bought yet</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>Players purchased in the auction will appear here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {players.map(p => (
                        <div key={p._id} style={{
                            background: 'rgba(17,24,39,0.8)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(55,65,81,0.5)',
                            display: 'flex', alignItems: 'center', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default'
                        }} className="hover:scale-105 hover:shadow-xl">
                            {/* Photo Strip */}
                            <div style={{ width: '90px', height: '110px', background: 'linear-gradient(135deg, #1f2937, #111827)', position: 'relative' }}>
                                {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', opacity: 0.3 }}>👤</div>
                                )}
                                <div style={{ position: 'absolute', top: '8px', left: '8px', background: POS_COLORS[p.position] || '#6b7280', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    {p.position}
                                </div>
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, padding: '16px' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 2px' }}>Bought For</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 900, color: '#f59e0b', margin: 0 }}>{p.soldPrice}M</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 2px' }}>Base</p>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', margin: 0 }}>{p.basePrice}M</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
