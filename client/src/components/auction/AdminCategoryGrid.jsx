/**
 * AdminCategoryGrid – shows 7 category cards with player stats for admin
 */
const POS_ICONS = {
    CF: '🎯',
    Wingers: '⚡',
    'Attacking Mid': '🔥',
    'Center Mid': '⚙️',
    'Center Back': '🛡️',
    'Full Backs': '🏃',
    Goalkeeper: '🥊',
};

const CAT_COLORS = {
    CF: '#ef4444',
    Wingers: '#f97316',
    'Attacking Mid': '#eab308',
    'Center Mid': '#22c55e',
    'Center Back': '#06b6d4',
    'Full Backs': '#3b82f6',
    Goalkeeper: '#a855f7',
};

export default function AdminCategoryGrid({ stats, onSelect, activeCategory }) {
    const categories = Object.keys(POS_ICONS);

    return (
        <div>
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f9fafb', margin: '0 0 6px' }}>
                    ⚽ Select Auction Category
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                    Choose a category to start auctioning players
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
            }}>
                {categories.map(cat => {
                    const s = stats?.[cat] || { available: 0, unsold: 0, sold: 0, total: 0 };
                    const color = CAT_COLORS[cat];
                    const icon = POS_ICONS[cat];
                    const isActive = activeCategory === cat;

                    return (
                        <div
                            key={cat}
                            onClick={() => onSelect(cat)}
                            style={{
                                background: 'rgba(17,24,39,0.85)',
                                border: `2px solid ${isActive ? color : 'rgba(55,65,81,0.5)'}`,
                                borderRadius: '18px',
                                padding: '22px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: isActive ? `0 0 24px ${color}44` : 'none',
                                transform: isActive ? 'translateY(-2px)' : 'none',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.borderColor = color;
                                    e.currentTarget.style.boxShadow = `0 8px 30px ${color}33`;
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.borderColor = 'rgba(55,65,81,0.5)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            {/* Background accent */}
                            <div style={{
                                position: 'absolute', top: 0, right: 0,
                                width: '80px', height: '80px',
                                background: `radial-gradient(circle at top right, ${color}22, transparent)`,
                                borderRadius: '0 18px 0 80px',
                            }} />

                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: `${color}22`,
                                    border: `1px solid ${color}44`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.25rem',
                                }}>
                                    {icon}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 800, color: '#f9fafb', margin: 0, fontSize: '0.925rem' }}>{cat}</p>
                                    <p style={{ color: '#6b7280', fontSize: '0.7rem', margin: 0 }}>{s.total} players total</p>
                                </div>
                                {isActive && (
                                    <span style={{
                                        marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
                                        padding: '3px 8px', borderRadius: '999px',
                                        background: `${color}22`, color,
                                        border: `1px solid ${color}44`,
                                    }}>ACTIVE</span>
                                )}
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                {[
                                    { label: 'Available', value: s.available, c: '#10b981' },
                                    { label: 'Unsold', value: s.unsold, c: '#f59e0b' },
                                    { label: 'Sold', value: s.sold, c: '#6b7280' },
                                ].map(({ label, value, c }) => (
                                    <div key={label} style={{
                                        textAlign: 'center',
                                        padding: '8px 4px',
                                        borderRadius: '8px',
                                        background: `${c}11`,
                                        border: `1px solid ${c}22`,
                                    }}>
                                        <p style={{ fontSize: '1.125rem', fontWeight: 800, color: c, margin: 0 }}>{value}</p>
                                        <p style={{ fontSize: '0.6rem', color: '#6b7280', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Progress bar */}
                            {s.total > 0 && (
                                <div style={{ marginTop: '14px' }}>
                                    <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(55,65,81,0.5)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${(s.sold / s.total) * 100}%`,
                                            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                                            borderRadius: '999px',
                                            transition: 'width 0.5s',
                                        }} />
                                    </div>
                                    <p style={{ color: '#4b5563', fontSize: '0.65rem', margin: '4px 0 0', textAlign: 'right' }}>
                                        {s.sold}/{s.total} sold
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
