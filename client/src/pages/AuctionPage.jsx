import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AdminCategoryGrid from '../components/auction/AdminCategoryGrid';
import AdminCategoryControl from '../components/auction/AdminCategoryControl';
import TeamBidView from '../components/auction/TeamBidView';

export default function AuctionPage() {
    const { id: tournamentId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const socketRef = useRef(null);

    // ── Core state ─────────────────────────────────────────────────────────────
    const [tournament, setTournament] = useState(null);
    const [myTeam, setMyTeam] = useState(null);
    const [allTeams, setAllTeams] = useState([]);
    const [auctionState, setAuctionState] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    // ── Notification state ─────────────────────────────────────────────────────
    const [soldNotif, setSoldNotif] = useState(null);
    const [unsoldNotif, setUnsoldNotif] = useState(null);
    const [rejectionMsg, setRejectionMsg] = useState('');
    const [bidLogs, setBidLogs] = useState([]);

    // ── Category state (admin) ─────────────────────────────────────────────────
    const [categoryStats, setCategoryStats] = useState({});
    const [categoryPlayers, setCategoryPlayers] = useState({ available: [], unsold: [] });
    const [selectedCategory, setSelectedCategory] = useState(null); // admin navigated into

    // ── Initial data load ──────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const [tRes, teamsRes] = await Promise.all([
                    api.get(`/tournaments/${tournamentId}`),
                    api.get(`/tournaments/${tournamentId}/teams`),
                ]);
                setTournament(tRes.data);
                setAllTeams(teamsRes.data);
                if (user?.role === 'TEAM_OWNER') {
                    const mtRes = await api.get(`/tournaments/${tournamentId}/teams/myteam`);
                    setMyTeam(mtRes.data);
                }
            } catch { navigate('/dashboard'); }
            setLoading(false);
        };
        init();
    }, [tournamentId]);

    // ── Socket connection ──────────────────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('token');
        const socket = io('http://localhost:5000', { auth: { token }, transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join:tournament', tournamentId);
            if (user?.role === 'ADMIN') {
                socket.emit('auction:init', { tournamentId });
            }
        });
        socket.on('disconnect', () => setConnected(false));

        // Auction state updates
        socket.on('auction:state', (state) => {
            setAuctionState(state);
            setTimeRemaining(state.timeRemaining || 0);
        });
        socket.on('auction:next', ({ player, state }) => {
            setAuctionState(state);
            setTimeRemaining(state.timeRemaining || 0);
            setSoldNotif(null);
            setUnsoldNotif(null);
        });
        socket.on('auction:category_selected', ({ state }) => {
            setAuctionState(state);
        });
        socket.on('auction:tick', ({ timeRemaining }) => setTimeRemaining(timeRemaining));

        // Slim delta event emitted on every bid/quit (replaces broadcasting full auction:state)
        // Only patches the fields that change — avoids heavy re-renders on every bid
        socket.on('auction:bid', ({ currentPrice, currentLeaderTeamId, quitMap }) => {
            setAuctionState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    currentPrice,
                    currentLeaderTeamId,
                    ...(quitMap !== undefined && { quitMap }),
                };
            });
        });

        // Sold/unsold events
        socket.on('auction:sold', ({ player, team, soldPrice }) => {
            setSoldNotif({ player, team, soldPrice });
            setUnsoldNotif(null);
        });
        socket.on('auction:unsold', ({ player }) => {
            setUnsoldNotif({ player });
            setSoldNotif(null);
        });

        // Real-time budget update — patch without full HTTP refetch
        socket.on('auction:team_budget', ({ teamId, budgetRemaining, squadCount }) => {
            setAllTeams(prev => prev.map(t =>
                t._id === teamId ? { ...t, budgetRemaining, squadCount } : t
            ));
            setMyTeam(prev => prev?._id === teamId ? { ...prev, budgetRemaining, squadCount } : prev);
        });

        // Pause/resume
        socket.on('auction:paused', (state) => setAuctionState(state));
        socket.on('auction:resumed', (state) => setAuctionState(state));
        socket.on('auction:ended', () => setAuctionState(prev => prev ? { ...prev, status: 'FINISHED' } : null));

        // Category stats
        socket.on('auction:category_stats', (stats) => setCategoryStats(stats));

        // Category player lists (admin only)
        socket.on('auction:category_players', (lists) => setCategoryPlayers(lists));

        // Bid events
        socket.on('bid:rejected', ({ reason }) => {
            setRejectionMsg(reason);
            setTimeout(() => setRejectionMsg(''), 3500);
        });
        socket.on('bid:log', (log) => {
            setBidLogs(prev => [...prev, log].slice(-80));
        });

        // Reintroduced player
        socket.on('auction:player_reintroduced', () => {
            if (user?.role === 'ADMIN' && selectedCategory) {
                socket.emit('auction:get_category_players', { tournamentId, category: selectedCategory });
            }
        });

        return () => {
            socket.emit('leave:tournament', tournamentId);
            socket.disconnect();
        };
    }, [tournamentId]);

    // ── Refresh category players when state changes ────────────────────────────
    useEffect(() => {
        if (user?.role !== 'ADMIN' || !selectedCategory || !socketRef.current?.connected) return;
        socketRef.current.emit('auction:get_category_players', { tournamentId, category: selectedCategory });
    }, [auctionState?.status, selectedCategory]);

    // ── Sync selectedCategory with state when state's category is loaded ───────
    useEffect(() => {
        if (auctionState?.activeCategory && !selectedCategory) {
            setSelectedCategory(auctionState.activeCategory);
        }
    }, [auctionState?.activeCategory]);

    // ── Admin: Select category ─────────────────────────────────────────────────
    const handleSelectCategory = useCallback((cat) => {
        setSelectedCategory(cat);
        socketRef.current?.emit('auction:select_category', { tournamentId, category: cat });
        socketRef.current?.emit('auction:get_category_players', { tournamentId, category: cat });
    }, [tournamentId]);

    // ── Admin: Select player ───────────────────────────────────────────────────
    const handleSelectPlayer = useCallback((playerId) => {
        socketRef.current?.emit('auction:select_player', { tournamentId, playerId });
    }, [tournamentId]);

    // ── Admin: Reintroduce unsold ──────────────────────────────────────────────
    const handleReintroduceUnsold = useCallback((playerId) => {
        socketRef.current?.emit('auction:reintroduce_unsold', { tournamentId, playerId });
    }, [tournamentId]);

    // ── Team: Bid ──────────────────────────────────────────────────────────────
    const handleBid = () => myTeam && socketRef.current?.emit('bid:place', { tournamentId, teamId: myTeam._id });
    const handleQuit = () => myTeam && socketRef.current?.emit('bid:quit', { tournamentId, teamId: myTeam._id });

    // ── Admin socket helpers ───────────────────────────────────────────────────
    const adminEmit = (event) => socketRef.current?.emit(event, { tournamentId });

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#6b7280' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⚡</div>
                <p style={{ fontWeight: 600 }}>Loading auction...</p>
            </div>
        </div>
    );

    const status = auctionState?.status;
    const isFinished = status === 'FINISHED';

    return (
        <div className="responsive-page">

            {/* ── Top Bar ── */}
            <div className="auction-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link to={`/tournament/${tournamentId}`} style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.8rem' }}>
                        ← Back
                    </Link>
                    <div style={{ height: '16px', width: '1px', background: '#374151' }} />
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb', margin: 0 }}>
                        ⚡ {tournament?.name} — Auction
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Connection badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                        borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${connected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        color: connected ? '#34d399' : '#f87171',
                    }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: connected ? '#34d399' : '#f87171' }} />
                        {connected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </div>

            {/* ── FINISHED state ── */}
            {isFinished && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🏆</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f9fafb', margin: '0 0 8px' }}>Auction Complete</h2>
                    <p style={{ color: '#6b7280' }}>All categories have been auctioned.</p>
                </div>
            )}

            {/* ── ADMIN VIEW ── */}
            {!isFinished && user?.role === 'ADMIN' && (
                selectedCategory ? (
                    <AdminCategoryControl
                        category={selectedCategory}
                        availablePlayers={categoryPlayers.available}
                        unsoldPlayers={categoryPlayers.unsold}
                        auctionState={auctionState}
                        timeRemaining={timeRemaining}
                        onBack={() => setSelectedCategory(null)}
                        onSelectPlayer={handleSelectPlayer}
                        onReintroduceUnsold={handleReintroduceUnsold}
                        onPause={() => adminEmit('auction:pause')}
                        onResume={() => adminEmit('auction:resume')}
                        onSkip={() => adminEmit('auction:skip')}
                        onReopen={() => adminEmit('auction:reopen')}
                        onEnd={() => { if (window.confirm('End the entire auction?')) adminEmit('auction:end'); }}
                        bidLogs={bidLogs}
                    />
                ) : (
                    <AdminCategoryGrid
                        stats={categoryStats}
                        onSelect={handleSelectCategory}
                        activeCategory={auctionState?.activeCategory}
                    />
                )
            )}

            {/* ── TEAM OWNER VIEW ── */}
            {!isFinished && user?.role === 'TEAM_OWNER' && (
                <TeamBidView
                    auctionState={auctionState}
                    setAuctionState={setAuctionState}
                    socketRef={socketRef}
                    myTeam={myTeam}
                    allTeams={allTeams}
                    tournamentId={tournamentId}
                    timeRemaining={timeRemaining}
                    soldNotif={soldNotif}
                    unsoldNotif={unsoldNotif}
                    rejectionMsg={rejectionMsg}
                    bidLogs={bidLogs}
                    onQuit={handleQuit}
                    categoryPlayers={categoryPlayers}
                    activeCategory={auctionState?.activeCategory}
                />
            )}

            {/* ── SPECTATOR / OTHER ROLE VIEW ── */}
            {!isFinished && user?.role !== 'ADMIN' && user?.role !== 'TEAM_OWNER' && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                    <p>You are viewing this auction as a spectator.</p>
                </div>
            )}
        </div>
    );
}
