import { useState } from 'react';

const POS_COLORS = {
    CF: '#ef4444', RW: '#f97316', LW: '#f97316', CAM: '#eab308',
    CM: '#84cc16', CDM: '#22c55e', CB: '#06b6d4', LB: '#3b82f6',
    RB: '#3b82f6', GK: '#a855f7',
};

function getIncrement(price) {
    if (price < 25) return 2.5;
    if (price < 100) return 5;
    return 10;
}

const CAT_ICONS = {
    CF: '🎯', Wingers: '⚡', 'Attacking Mid': '🔥',
    'Center Mid': '⚙️', 'Center Back': '🛡️', 'Full Backs': '🏃', Goalkeeper: '🥊',
};

export default function TeamBidView({
    auctionState, setAuctionState, socketRef, tournamentId, myTeam, allTeams, timeRemaining,
    soldNotif, unsoldNotif, rejectionMsg, bidLogs,
    onQuit,
    categoryPlayers,  // { available, unsold } for the active category
    activeCategory,   // string e.g. 'CF'
}) {
    const [showQuitModal, setShowQuitModal] = useState(false);

    const status = auctionState?.status;
    const isLive = status === 'LIVE';
    const isPaused = status === 'PAUSED';

    const handleBid = (e) => {
        e.preventDefault();
        if (auctionState?.status !== 'LIVE' || auctionState?.currentLeaderTeamId === myTeam?._id) return;

        // OPTIMISTIC UI UPDATE
        const increment = getIncrement(auctionState.currentPrice);
        const nextPrice = +(auctionState.currentPrice + increment).toFixed(1);
        const originalState = { ...auctionState };

        setAuctionState(prev => ({
            ...prev,
            currentPrice: nextPrice,
            currentLeaderTeamId: myTeam?._id,
        }));

        // Send real request
        socketRef.current?.emit('bid:place', { tournamentId, teamId: myTeam?._id }, (res) => {
            if (res && !res.success) {
                // Revert optimistic update if server rejected
                setAuctionState(originalState);
            }
        });
    };
    const currentPlayer = auctionState?.currentPlayer;
    const currentPrice = auctionState?.currentPrice || 0;
    const leaderTeam = allTeams.find(t => t._id === auctionState?.currentLeaderTeamId);
    const myQuits = auctionState?.quitMap?.[auctionState?.currentPlayerId] || [];
    const iQuit = myTeam ? myQuits.includes(myTeam._id) : false;
    const canBid = isLive && !iQuit && myTeam && !soldNotif && !unsoldNotif;
    const nextBidPrice = +(currentPrice + getIncrement(currentPrice)).toFixed(1);
    const timerColor = timeRemaining > 10 ? '#10b981' : timeRemaining > 5 ? '#f59e0b' : '#ef4444';
    const timerPct = auctionState ? Math.max(0, (timeRemaining / (auctionState.timerDuration || 20)) * 100) : 100;
    const posColor = currentPlayer ? (POS_COLORS[currentPlayer.position] || '#6b7280') : '#6b7280';

    const LOG_COLOR = { bid: '#34d399', sold: '#fbbf24', unsold: '#9ca3af', system: '#8b5cf6', quit: '#f87171' };

    /* CATEGORY LOBBY — no player active yet but a category is selected */
    if (!currentPlayer && !soldNotif && !unsoldNotif) {
        const hasCategory = !!activeCategory;
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Category announcement */}
                    <div style={{
                        background: hasCategory
                            ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(59,130,246,0.06))'
                            : 'rgba(17,24,39,0.9)',
                        border: hasCategory ? '2px solid rgba(99,102,241,0.35)' : '1px solid rgba(55,65,81,0.4)',
                        borderRadius: '24px', padding: '32px', textAlign: 'center',
                        boxShadow: hasCategory ? '0 0 40px rgba(99,102,241,0.1)' : 'none',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>
                            {hasCategory ? (CAT_ICONS[activeCategory] || '⚽') : '⏳'}
                        </div>
                        {hasCategory ? (
                            <>
                                <p style={{ color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Category</p>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f9fafb', margin: '0 0 8px' }}>{activeCategory}</h2>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Admin is preparing the auction. Get ready to bid!</p>
                                {isPaused && <p style={{ color: '#f59e0b', fontWeight: 700, marginTop: '8px' }}>⏸ Auction is paused</p>}
                            </>
                        ) : (
                            <>
                                <h3 style={{ color: '#f9fafb', fontWeight: 800, fontSize: '1.125rem', margin: '0 0 8px' }}>Waiting for Admin</h3>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>The admin has not selected a category yet.</p>
                            </>
                        )}
                    </div>

                    {/* Available players in category preview */}
                    {hasCategory && categoryPlayers?.available?.length > 0 && (
                        <div style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(55,65,81,0.4)', borderRadius: '18px', padding: '20px' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                📄 Players Up For Auction ({categoryPlayers.available.length})
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {categoryPlayers.available.map((p, i) => (
                                    <div key={p._id} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 14px', borderRadius: '10px',
                                        background: 'rgba(31,41,55,0.5)', border: '1px solid rgba(55,65,81,0.4)',
                                    }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', width: '20px', textAlign: 'center' }}>#{i + 1}</span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 700, color: '#f9fafb', margin: 0, fontSize: '0.9rem' }}>{p.name}</p>
                                            <p style={{ color: '#6b7280', fontSize: '0.7rem', margin: '2px 0 0' }}>{p.position}</p>
                                        </div>
                                        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.875rem' }}>{p.basePrice}M</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: My Team stats */}
                {myTeam && (
                    <div style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(55,65,81,0.4)', borderRadius: '18px', padding: '20px', position: 'sticky', top: '20px' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🧑‍🤝 My Team</p>
                        {myTeam.logo && <img src={myTeam.logo} alt={myTeam.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', border: '2px solid rgba(99,102,241,0.4)' }} />}
                        <p style={{ fontWeight: 800, color: '#f9fafb', margin: '0 0 16px', fontSize: '1rem' }}>{myTeam.name}</p>
                        {[
                            { label: '💰 Budget Remaining', value: `${myTeam.budgetRemaining}M`, color: '#10b981' },
                            { label: '🧑‍⚽ Players Signed', value: myTeam.squadCount, color: '#3b82f6' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ padding: '12px', background: `${color}0d`, borderRadius: '10px', border: `1px solid ${color}22`, marginBottom: '8px' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900, color, margin: 0 }}>{value}</p>
                                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '3px 0 0' }}>{label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>

            {/* ── Left: Main Auction Window ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* SOLD notification */}
                {soldNotif && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(5,150,105,0.2), rgba(4,120,87,0.1))',
                        border: '2px solid rgba(16,185,129,0.5)',
                        borderRadius: '20px', padding: '32px', textAlign: 'center',
                        animation: 'fadeIn 0.3s ease',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎊</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399', margin: '0 0 8px' }}>SOLD!</h2>
                        <p style={{ color: '#f9fafb', fontWeight: 700, margin: '0 0 4px', fontSize: '1.1rem' }}>{soldNotif.player?.name}</p>
                        <p style={{ color: '#10b981', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 4px' }}>{soldNotif.soldPrice}M</p>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>to {soldNotif.team?.name}</p>
                    </div>
                )}

                {/* UNSOLD notification */}
                {unsoldNotif && !soldNotif && (
                    <div style={{
                        background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)',
                        borderRadius: '20px', padding: '32px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📋</div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f87171', margin: '0 0 8px' }}>UNSOLD</h2>
                        <p style={{ color: '#9ca3af', fontWeight: 700 }}>{unsoldNotif.player?.name}</p>
                    </div>
                )}

                {/* Player Card */}
                {currentPlayer && !soldNotif && !unsoldNotif && (
                    <div style={{
                        background: 'rgba(17,24,39,0.95)',
                        border: `2px solid ${isLive ? posColor + '55' : isPaused ? 'rgba(245,158,11,0.3)' : 'rgba(55,65,81,0.5)'}`,
                        borderRadius: '24px',
                        padding: '28px',
                        boxShadow: isLive ? `0 0 40px ${posColor}22` : 'none',
                    }}>
                        {/* Status bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            {isLive && (
                                <span style={{
                                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                                    background: 'rgba(16,185,129,0.15)', color: '#34d399',
                                    border: '1px solid rgba(16,185,129,0.3)', animation: 'pulse 2s infinite',
                                }}>● LIVE BIDDING</span>
                            )}
                            {isPaused && (
                                <span style={{
                                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                                    background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                }}>⏸ PAUSED</span>
                            )}
                            {iQuit && (
                                <span style={{
                                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                                    background: 'rgba(239,68,68,0.15)', color: '#f87171',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                }}>You exited bidding for this player</span>
                            )}
                        </div>

                        {/* Player Info */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                            {/* Avatar */}
                            <div style={{
                                width: '90px', height: '90px', borderRadius: '50%', flexShrink: 0,
                                background: `radial-gradient(circle, ${posColor}44, ${posColor}11)`,
                                border: `3px solid ${posColor}66`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2.5rem',
                            }}>
                                ⚽
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                                        background: `${posColor}22`, color: posColor, border: `1px solid ${posColor}44`,
                                    }}>
                                        {currentPlayer.position}
                                    </span>
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f9fafb', margin: '0 0 4px' }}>
                                    {currentPlayer.name}
                                </h2>
                                <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
                                    Base Price: <span style={{ color: '#f9fafb', fontWeight: 700 }}>{currentPlayer.basePrice}M</span>
                                </p>
                            </div>
                        </div>

                        {/* Current Price */}
                        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: 'rgba(31,41,55,0.5)', borderRadius: '16px' }}>
                            <p style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Current Price</p>
                            <p style={{ fontSize: '3rem', fontWeight: 900, color: '#f9fafb', margin: '0 0 4px', lineHeight: 1 }}>
                                {currentPrice}<span style={{ fontSize: '1.25rem', color: '#6b7280', fontWeight: 600, marginLeft: '4px' }}>M</span>
                            </p>
                            {leaderTeam && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                                    {leaderTeam.logo && (
                                        <img src={leaderTeam.logo} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                    )}
                                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.875rem' }}>
                                        🏆 {leaderTeam.name}
                                    </span>
                                </div>
                            )}
                            {!leaderTeam && <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: '8px 0 0' }}>No bids yet</p>}
                        </div>

                        {/* Timer */}
                        {(isLive || isPaused) && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Time Remaining</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: timerColor, fontFamily: 'monospace' }}>
                                        {timeRemaining}s
                                    </span>
                                </div>
                                <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(55,65,81,0.5)', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${timerPct}%`,
                                        background: `linear-gradient(90deg, ${timerColor}, ${timerColor}cc)`,
                                        borderRadius: '999px', transition: 'width 1s linear',
                                        boxShadow: `0 0 8px ${timerColor}66`,
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* Budget info */}
                        {myTeam && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                {[
                                    { label: 'My Budget', value: `${myTeam.budgetRemaining}M`, color: myTeam.budgetRemaining >= nextBidPrice ? '#10b981' : '#ef4444' },
                                    { label: 'Squad Size', value: myTeam.squadCount, color: '#3b82f6' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} style={{ padding: '12px', background: 'rgba(31,41,55,0.5)', borderRadius: '10px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color, margin: 0 }}>{value}</p>
                                        <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '2px 0 0', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bid / Quit buttons */}
                        {myTeam && (
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                <button
                                    onClick={handleBid}
                                    disabled={!canBid}
                                    style={{
                                        padding: '18px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        fontWeight: 900,
                                        fontSize: '1rem',
                                        cursor: canBid ? 'pointer' : 'not-allowed',
                                        background: canBid
                                            ? 'linear-gradient(135deg, #059669, #047857)'
                                            : 'rgba(55,65,81,0.3)',
                                        color: canBid ? '#fff' : '#4b5563',
                                        boxShadow: canBid ? '0 0 24px rgba(5,150,105,0.4)' : 'none',
                                        transition: 'all 0.15s',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    BID — {nextBidPrice}M
                                </button>
                                <button
                                    onClick={() => setShowQuitModal(true)}
                                    disabled={!isLive || iQuit || !myTeam}
                                    style={{
                                        padding: '18px',
                                        borderRadius: '14px',
                                        border: `1px solid ${iQuit ? 'rgba(107,114,128,0.3)' : 'rgba(239,68,68,0.4)'}`,
                                        background: iQuit ? 'rgba(107,114,128,0.08)' : 'rgba(239,68,68,0.08)',
                                        color: iQuit ? '#9ca3af' : '#f87171',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        cursor: (!isLive || iQuit) ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {iQuit ? '✓ Out' : 'QUIT'}
                                </button>
                            </div>
                        )}

                        {/* Rejection message */}
                        {rejectionMsg && (
                            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.825rem', fontWeight: 600 }}>
                                ⚠️ {rejectionMsg}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Right: Live Activity Feed ── */}
            <div style={{
                background: 'rgba(17,24,39,0.9)',
                border: '1px solid rgba(55,65,81,0.4)',
                borderRadius: '18px',
                padding: '16px',
                maxHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📡 Live Feed</p>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[...bidLogs].reverse().map((log, i) => (
                        <div key={i} style={{
                            padding: '8px 10px', borderRadius: '8px',
                            background: `${LOG_COLOR[log.type] || '#9ca3af'}0f`,
                            border: `1px solid ${LOG_COLOR[log.type] || '#9ca3af'}22`,
                        }}>
                            <span style={{ fontSize: '0.78rem', color: LOG_COLOR[log.type] || '#9ca3af', lineHeight: 1.5 }}>{log.message}</span>
                        </div>
                    ))}
                    {bidLogs.length === 0 && <p style={{ color: '#374151', fontSize: '0.8rem' }}>Waiting for first bid...</p>}
                </div>
            </div>

            {/* ── Quit Confirmation Modal ── */}
            {showQuitModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)', zIndex: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: 'rgba(17,24,39,0.98)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '24px',
                        padding: '36px',
                        maxWidth: '420px',
                        width: '90%',
                        boxShadow: '0 0 60px rgba(239,68,68,0.15)',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '16px', textAlign: 'center' }}>🚫</div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#f9fafb', textAlign: 'center', margin: '0 0 12px' }}>
                            Confirm Exit From Bidding
                        </h3>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.7, textAlign: 'center', margin: '0 0 28px' }}>
                            If you quit, you will <strong style={{ color: '#f87171' }}>not be allowed to bid again</strong> for this player. This action cannot be undone.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button
                                onClick={() => { onQuit(); setShowQuitModal(false); }}
                                style={{
                                    padding: '14px', borderRadius: '12px', border: 'none',
                                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                    color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                                }}
                            >
                                Confirm Quit
                            </button>
                            <button
                                onClick={() => setShowQuitModal(false)}
                                style={{
                                    padding: '14px', borderRadius: '12px',
                                    border: '1px solid rgba(55,65,81,0.5)',
                                    background: 'rgba(31,41,55,0.5)',
                                    color: '#9ca3af', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
