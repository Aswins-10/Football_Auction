import { useState } from 'react';

const CAT_ICONS = {
    CF: '🎯', Wingers: '⚡', 'Attacking Mid': '🔥',
    'Center Mid': '⚙️', 'Center Back': '🛡️', 'Full Backs': '🏃', Goalkeeper: '🥊',
};

const LOG_COLOR = { bid: '#34d399', sold: '#fbbf24', unsold: '#9ca3af', system: '#8b5cf6', quit: '#f87171' };

export default function AdminCategoryControl({
    category, availablePlayers, unsoldPlayers, auctionState,
    timeRemaining,
    onBack, onSelectPlayer, onReintroduceUnsold,
    onPause, onResume, onSkip, onReopen, onEnd, bidLogs,
}) {
    const [selectedAvailable, setSelectedAvailable] = useState('');
    const [selectedUnsold, setSelectedUnsold] = useState('');

    const status = auctionState?.status;
    const isLive = status === 'LIVE';
    const isPaused = status === 'PAUSED';
    const isSold = status === 'SOLD';
    const isUnsold = status === 'UNSOLD';
    const isWaiting = !status || ['WAITING', 'SOLD', 'UNSOLD'].includes(status);
    const canReintroduce = availablePlayers.length === 0 && unsoldPlayers.length > 0;
    const currentPlayer = auctionState?.currentPlayer;
    const timerDuration = auctionState?.timerDuration || 30;

    // Timer ring helpers
    const radius = 20;
    const circ = 2 * Math.PI * radius;
    const progress = isLive ? Math.max(0, timeRemaining / timerDuration) : isPaused ? Math.max(0, timeRemaining / timerDuration) : 1;
    const dashOffset = circ * (1 - progress);
    const timerColor = timeRemaining <= 5 ? '#ef4444' : timeRemaining <= 10 ? '#f59e0b' : '#34d399';

    // Filter logs to current category (+ system logs from this category)
    const filteredLogs = bidLogs.filter(l => !l.category || l.category === category);

    const btn = (extra = {}) => ({
        padding: '10px 20px', borderRadius: '12px', fontWeight: 700,
        fontSize: '0.875rem', cursor: 'pointer', border: 'none',
        fontFamily: 'Inter, sans-serif', transition: 'all 0.15s', ...extra,
    });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

            {/* ── LEFT MAIN PANEL ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Header */}
                <div style={{
                    background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(55,65,81,0.5)',
                    borderRadius: '18px', padding: '20px',
                    display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                    <button onClick={onBack} style={{
                        ...btn(), padding: '8px 14px', fontSize: '0.8rem',
                        background: 'rgba(55,65,81,0.5)', border: '1px solid rgba(75,85,99,0.4)', color: '#9ca3af',
                    }}>
                        ← Categories
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.75rem' }}>{CAT_ICONS[category] || '⚽'}</span>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f9fafb', margin: 0 }}>{category}</h2>
                            <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: 0 }}>
                                {availablePlayers.length} available · {unsoldPlayers.length} unsold
                            </p>
                        </div>
                    </div>
                    {/* Status pill */}
                    {isLive && <span style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>● LIVE</span>}
                    {isPaused && <span style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: '999px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem' }}>⏸ PAUSED</span>}
                    {isSold && <span style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>🎊 SOLD</span>}
                    {isUnsold && <span style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: '999px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontWeight: 700, fontSize: '0.75rem' }}>📋 UNSOLD</span>}
                    {isWaiting && !isSold && !isUnsold && <span style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: '999px', background: 'rgba(55,65,81,0.3)', border: '1px solid rgba(75,85,99,0.3)', color: '#6b7280', fontWeight: 700, fontSize: '0.75rem' }}>⏳ WAITING</span>}
                </div>

                {/* Current player live card */}
                {currentPlayer && (
                    <div style={{
                        background: isLive
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))'
                            : 'rgba(17,24,39,0.9)',
                        border: `2px solid ${isLive ? 'rgba(16,185,129,0.35)' : isPaused ? 'rgba(245,158,11,0.3)' : 'rgba(55,65,81,0.4)'}`,
                        borderRadius: '18px', padding: '20px',
                    }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {isLive ? '🔴 Currently On Auction' : isPaused ? '⏸ Paused' : '✅ Last Player'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
                                background: 'rgba(99,102,241,0.15)', border: '2px solid rgba(99,102,241,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                            }}>⚽</div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 4px' }}>{currentPlayer.name}</h3>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>{currentPlayer.position}</span>
                                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Base: {currentPlayer.basePrice}M</span>
                                </div>
                            </div>
                            {/* Timer Ring */}
                            {(isLive || isPaused) && (
                                <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                                    <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
                                        <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(55,65,81,0.5)" strokeWidth="4" />
                                        <circle
                                            cx="26" cy="26" r={radius} fill="none"
                                            stroke={timerColor}
                                            strokeWidth="4"
                                            strokeDasharray={circ}
                                            strokeDashoffset={dashOffset}
                                            strokeLinecap="round"
                                            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                                        />
                                    </svg>
                                    <div style={{
                                        position: 'absolute', inset: 0, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem', fontWeight: 900, color: timerColor,
                                    }}>{timeRemaining}</div>
                                </div>
                            )}
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '1.625rem', fontWeight: 900, color: '#f9fafb', margin: 0, lineHeight: 1 }}>{auctionState.currentPrice}M</p>
                                <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '2px 0 0' }}>Current Price</p>
                            </div>
                        </div>
                        {/* Action buttons for live state */}
                        {(isLive || isPaused) && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {isLive && <button onClick={onPause} style={{ ...btn(), background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>⏸ Pause</button>}
                                {isPaused && <button onClick={onResume} style={{ ...btn(), background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>▶ Resume</button>}
                                <button onClick={onSkip} style={{ ...btn(), background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>⏭ Skip (Mark Unsold)</button>
                            </div>
                        )}
                        {isWaiting && auctionState?.previousState && (
                            <button onClick={onReopen} style={{ ...btn(), background: 'rgba(55,65,81,0.5)', border: '1px solid rgba(75,85,99,0.4)', color: '#9ca3af', marginTop: '8px' }}>
                                🔄 Reopen Last Player
                            </button>
                        )}
                    </div>
                )}

                {/* ── AVAILABLE PLAYERS ── */}
                <div style={{
                    background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: '18px', padding: '20px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '1rem' }}>🟢</span>
                        <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f9fafb', margin: 0 }}>Available Players</p>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>Select a player and click Start Auction</p>
                        </div>
                        <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(16,185,129,0.3)' }}>{availablePlayers.length}</span>
                    </div>

                    {availablePlayers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(31,41,55,0.4)', borderRadius: '12px' }}>
                            <p style={{ color: '#4b5563', fontSize: '0.875rem', margin: 0 }}>
                                ✅ All available players have been auctioned.
                            </p>
                            {unsoldPlayers.length > 0 && <p style={{ color: '#f59e0b', fontSize: '0.8rem', margin: '6px 0 0' }}>👇 You can now reintroduce unsold players below.</p>}
                        </div>
                    ) : (
                        <>
                            <select
                                value={selectedAvailable} onChange={e => setSelectedAvailable(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                                    background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(16,185,129,0.4)',
                                    color: '#f9fafb', fontSize: '0.875rem', fontWeight: 600, outline: 'none', cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif', marginBottom: '12px',
                                }}
                            >
                                <option value="">-- Select a player to auction --</option>
                                {availablePlayers.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name}  ·  {p.position}  ·  Base: {p.basePrice}M
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => { if (selectedAvailable) { onSelectPlayer(selectedAvailable); setSelectedAvailable(''); } }}
                                disabled={!selectedAvailable || isLive || isPaused}
                                style={{
                                    ...btn({ width: '100%', padding: '14px', fontSize: '1rem' }),
                                    background: selectedAvailable && !isLive && !isPaused
                                        ? 'linear-gradient(135deg, #059669, #047857)'
                                        : 'rgba(55,65,81,0.3)',
                                    color: selectedAvailable && !isLive && !isPaused ? '#fff' : '#4b5563',
                                    cursor: selectedAvailable && !isLive && !isPaused ? 'pointer' : 'not-allowed',
                                    boxShadow: selectedAvailable && !isLive && !isPaused ? '0 0 20px rgba(5,150,105,0.3)' : 'none',
                                }}
                            >
                                ▶ Start Auction for Selected Player
                            </button>
                        </>
                    )}
                </div>

                {/* ── UNSOLD PLAYERS ── */}
                <div style={{
                    background: 'rgba(17,24,39,0.9)',
                    border: `1px solid ${canReintroduce ? 'rgba(245,158,11,0.3)' : 'rgba(55,65,81,0.3)'}`,
                    borderRadius: '18px', padding: '20px',
                    opacity: canReintroduce ? 1 : 0.55,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '1rem' }}>🟡</span>
                        <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: 800, color: canReintroduce ? '#f9fafb' : '#6b7280', margin: 0 }}>Unsold Players</p>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>
                                {canReintroduce ? 'Select a player to reintroduce into auction' : '🔒 Locked — auction all available players first'}
                            </p>
                        </div>
                        <span style={{
                            marginLeft: 'auto', padding: '3px 10px', borderRadius: '999px',
                            background: canReintroduce ? 'rgba(245,158,11,0.15)' : 'rgba(55,65,81,0.3)',
                            color: canReintroduce ? '#f59e0b' : '#6b7280',
                            fontWeight: 700, fontSize: '0.75rem',
                            border: `1px solid ${canReintroduce ? 'rgba(245,158,11,0.3)' : 'rgba(55,65,81,0.4)'}`,
                        }}>{unsoldPlayers.length}</span>
                    </div>

                    {unsoldPlayers.length === 0 ? (
                        <p style={{ color: '#4b5563', fontSize: '0.85rem', margin: 0, textAlign: 'center', padding: '12px' }}>No unsold players in this category.</p>
                    ) : (
                        <>
                            <select
                                value={selectedUnsold} onChange={e => setSelectedUnsold(e.target.value)}
                                disabled={!canReintroduce}
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                                    background: 'rgba(31,41,55,0.8)', border: `1px solid ${canReintroduce ? 'rgba(245,158,11,0.4)' : 'rgba(55,65,81,0.3)'}`,
                                    color: canReintroduce ? '#f9fafb' : '#4b5563', fontSize: '0.875rem', fontWeight: 600,
                                    outline: 'none', cursor: canReintroduce ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', marginBottom: '12px',
                                }}
                            >
                                <option value="">-- Select unsold player to reintroduce --</option>
                                {unsoldPlayers.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name}  ·  {p.position}  ·  Base: {p.basePrice}M
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => { if (selectedUnsold) { onReintroduceUnsold(selectedUnsold); setSelectedUnsold(''); } }}
                                disabled={!canReintroduce || !selectedUnsold || isLive || isPaused}
                                style={{
                                    ...btn({ width: '100%', padding: '14px' }),
                                    background: canReintroduce && selectedUnsold && !isLive ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(55,65,81,0.3)',
                                    color: canReintroduce && selectedUnsold && !isLive ? '#fff' : '#4b5563',
                                    cursor: canReintroduce && selectedUnsold && !isLive ? 'pointer' : 'not-allowed',
                                }}
                            >
                                ♻️ Reintroduce Selected Player
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '20px' }}>

                {/* Quick Stats */}
                <div style={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(55,65,81,0.45)', borderRadius: '16px', padding: '18px' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📊 Category Progress</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { label: '🟢 Available', value: availablePlayers.length, color: '#10b981' },
                            { label: '🟡 Unsold', value: unsoldPlayers.length, color: '#f59e0b' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: `${color}0d`, border: `1px solid ${color}22` }}>
                                <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>{label}</span>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Feed — filtered by category */}
                <div style={{
                    background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(55,65,81,0.4)',
                    borderRadius: '16px', padding: '16px', maxHeight: '380px', overflowY: 'auto',
                }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        📋 {category} Activity
                    </p>
                    {filteredLogs.length === 0 ? (
                        <p style={{ color: '#374151', fontSize: '0.8rem' }}>No activity yet for {category}</p>
                    ) : (
                        [...filteredLogs].reverse().map((log, i) => (
                            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(31,41,55,0.5)' }}>
                                <span style={{ fontSize: '0.775rem', color: LOG_COLOR[log.type] || '#9ca3af', lineHeight: 1.5 }}>{log.message}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Back to Category button (acts as "close this category session") */}
                <button onClick={onBack} style={{
                    ...btn({ padding: '13px', width: '100%', fontSize: '0.9rem' }),
                    background: 'rgba(55,65,81,0.4)', border: '1px solid rgba(75,85,99,0.5)',
                    color: '#9ca3af',
                }}>
                    ← Back to All Categories
                </button>
            </div>
        </div>
    );
}
