import { useEffect, useState } from 'react';
import api from '../../api/axios';

const POSITIONS = ['CF', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
const POS_COLORS = {
    CF: '#ef4444', RW: '#f97316', LW: '#f97316', CAM: '#eab308',
    CM: '#84cc16', CDM: '#22c55e', CB: '#06b6d4', LB: '#3b82f6',
    RB: '#3b82f6', GK: '#a855f7',
};

const STATUS_STYLES = {
    AVAILABLE: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Available' },
    SOLD: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Sold' },
    UNSOLD: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'Unsold' },
};

export default function PlayersTab({ tournament, user }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', position: 'CF', basePrice: 10, imageUrl: '' });
    const [error, setError] = useState('');
    const [activePos, setActivePos] = useState('ALL');

    const fetchPlayers = async () => {
        try {
            const { data } = await api.get(`/tournaments/${tournament._id}/players`);
            setPlayers(data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchPlayers(); }, [tournament._id]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post(`/tournaments/${tournament._id}/players`, {
                players: [{ ...form, basePrice: Number(form.basePrice) }],
            });
            setShowAdd(false);
            setForm({ name: '', position: 'CF', basePrice: 10, imageUrl: '' });
            fetchPlayers();
        } catch (err) {
            setError(err.response?.data?.message || 'Error adding player');
        }
    };

    const byPosition = activePos === 'ALL' ? players : players.filter(p => p.position === activePos);
    const grouped = POSITIONS.reduce((acc, pos) => {
        acc[pos] = players.filter(p => p.position === pos);
        return acc;
    }, {});

    return (
        <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setActivePos('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activePos === 'ALL' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        ALL ({players.length})
                    </button>
                    {POSITIONS.map(pos => grouped[pos]?.length > 0 && (
                        <button
                            key={pos}
                            onClick={() => setActivePos(pos)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activePos === pos ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                        >
                            {pos} ({grouped[pos].length})
                        </button>
                    ))}
                </div>
                {user?.role === 'ADMIN' && (
                    <button id="add-player-btn" onClick={() => setShowAdd(true)} className="btn-primary text-sm py-2 px-4">
                        + Add Player
                    </button>
                )}
            </div>

            {/* Add Player Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass rounded-2xl p-8 w-full max-w-md animate-scaleIn">
                        <h2 className="text-xl font-bold mb-6">Add Player</h2>
                        {error && <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Player Name</label>
                                <input className="input-field" placeholder="Erling Haaland" required
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Position</label>
                                    <select className="input-field" value={form.position}
                                        onChange={e => setForm({ ...form, position: e.target.value })}>
                                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Base Price (M)</label>
                                    <input type="number" min="1" className="input-field" value={form.basePrice}
                                        onChange={e => setForm({ ...form, basePrice: e.target.value })} required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Photo URL</label>
                                <input className="input-field" placeholder="https://..." value={form.imageUrl}
                                    onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn-primary flex-1">Add</button>
                                <button type="button" className="btn-outline flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Player Grid */}
            {loading ? (
                <div className="text-center text-gray-500 py-10">Loading players...</div>
            ) : byPosition.length === 0 ? (
                <div className="glass rounded-xl p-10 text-center text-gray-500">
                    <p className="text-4xl mb-3">👤</p>
                    <p>No players yet. {user?.role === 'ADMIN' ? 'Add some above.' : 'Admin will add players.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {byPosition.map((p, i) => {
                        const ss = STATUS_STYLES[p.status] || STATUS_STYLES.AVAILABLE;
                        return (
                            <div key={p._id} className="glass rounded-xl overflow-hidden card-hover animate-fadeIn"
                                style={{ animationDelay: `${i * 0.03}s` }}>
                                <div className="relative" style={{ background: 'linear-gradient(135deg, #1f2937, #111827)' }}>
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name}
                                            className="w-full h-28 object-cover object-top" onError={e => { e.target.style.display = 'none'; }} />
                                    ) : (
                                        <div className="h-28 flex items-center justify-center text-5xl">⚽</div>
                                    )}
                                    <span className="absolute top-2 left-2 position-badge text-white"
                                        style={{ background: POS_COLORS[p.position] || '#6b7280' }}>
                                        {p.position}
                                    </span>
                                    <span className="absolute top-2 right-2 position-badge"
                                        style={{ background: ss.bg, color: ss.color }}>
                                        {ss.label}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <p className="font-bold text-sm truncate">{p.name}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-400">Base</span>
                                        <span className="text-yellow-400 font-bold text-xs">{p.basePrice}M</span>
                                    </div>
                                    {p.status === 'SOLD' && p.soldTo && (
                                        <div className="mt-2 text-xs text-green-400 truncate">
                                            → {p.soldTo.name} ({p.soldPrice}M)
                                        </div>
                                    )}
                                    {p.status === 'UNSOLD' && (
                                        <div className="mt-2 text-xs text-gray-500">Unsold</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
