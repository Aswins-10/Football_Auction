import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../api/axios';

const POSITIONS = ['CF', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
const POS_COLORS = {
    CF: '#ef4444', RW: '#f97316', LW: '#f97316', CAM: '#eab308',
    CM: '#84cc16', CDM: '#22c55e', CB: '#06b6d4', LB: '#3b82f6',
    RB: '#3b82f6', GK: '#a855f7',
};
const STATUS_STYLES = {
    AVAILABLE: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Available', dot: '#10b981' },
    SOLD: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Sold', dot: '#ef4444' },
    UNSOLD: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: 'Unsold', dot: '#6b7280' },
};
const PAGE_SIZE = 12;

export default function PlayersTab({ tournament, user }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', position: 'CF', basePrice: 10 });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [activePos, setActivePos] = useState('ALL');
    const [activeStatus, setActiveStatus] = useState('ALL');
    const [page, setPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // playerId to delete

    // Autocomplete state
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchTimeoutRef = useRef(null);

    const fileInputRef = useRef(null);

    const fetchPlayers = useCallback(async () => {
        try {
            const { data } = await api.get(`/tournaments/${tournament._id}/players`);
            setPlayers(data);
        } catch { }
        setLoading(false);
    }, [tournament._id]);

    useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [search, activePos, activeStatus]);

    // Autocomplete effect
    useEffect(() => {
        if (!showDropdown || form.name.length < 2) {
            setSearchResults([]);
            return;
        }
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const { data } = await api.get(`/player-search?q=${encodeURIComponent(form.name)}`);
                setSearchResults(data);
            } catch (err) {
                setSearchResults([]);
            }
            setIsSearching(false);
        }, 400);

        return () => clearTimeout(searchTimeoutRef.current);
    }, [form.name, showDropdown]);

    const handleSelectResult = (result) => {
        setForm(prev => ({
            ...prev,
            name: result.name,
            position: POSITIONS.includes(result.position) ? result.position : prev.position,
            imageUrl: result.image // save the external URL
        }));
        if (result.image) {
            setImagePreview(result.image);
            setImageFile(null); // clearing any local picked file
        }
        setShowDropdown(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        setUploading(true);
        try {
            let finalImageUrl = form.imageUrl || ''; // use external URL if present
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                const { data } = await api.post(
                    `/tournaments/${tournament._id}/players/upload-image`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                finalImageUrl = data.url;
            }
            await api.post(`/tournaments/${tournament._id}/players`, {
                players: [{ ...form, basePrice: Number(form.basePrice), imageUrl: finalImageUrl }],
            });
            setShowAdd(false);
            setForm({ name: '', position: 'CF', basePrice: 10, imageUrl: '' });
            setImageFile(null);
            setImagePreview('');
            fetchPlayers();
        } catch (err) {
            setError(err.response?.data?.message || 'Error adding player');
        }
        setUploading(false);
    };

    const handleDelete = async (playerId) => {
        try {
            await api.delete(`/tournaments/${tournament._id}/players/${playerId}`);
            setPlayers(prev => prev.filter(p => p._id !== playerId));
        } catch { }
        setDeleteConfirm(null);
    };

    // --- Filtering ---
    const filtered = players.filter(p => {
        const matchName = p.name.toLowerCase().includes(search.toLowerCase());
        const matchPos = activePos === 'ALL' || p.position === activePos;
        const matchStatus = activeStatus === 'ALL' || p.status === activeStatus;
        return matchName && matchPos && matchStatus;
    });

    const grouped = POSITIONS.reduce((acc, pos) => {
        acc[pos] = players.filter(p => p.position === pos);
        return acc;
    }, {});

    // Pagination
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const statCounts = {
        ALL: players.length,
        AVAILABLE: players.filter(p => p.status === 'AVAILABLE').length,
        SOLD: players.filter(p => p.status === 'SOLD').length,
        UNSOLD: players.filter(p => p.status === 'UNSOLD').length,
    };

    return (
        <div>
            {/* ── Toolbar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

                {/* Row 1: Search + Add Player */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', opacity: 0.5 }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search players..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                padding: '10px 14px 10px 38px', borderRadius: '10px',
                                background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.4)',
                                color: '#f9fafb', fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter, sans-serif',
                            }}
                            onFocus={e => e.target.style.borderColor = '#059669'}
                            onBlur={e => e.target.style.borderColor = 'rgba(75,85,99,0.4)'}
                        />
                    </div>
                    {user?.role === 'ADMIN' && (
                        <button
                            id="add-player-btn"
                            onClick={() => setShowAdd(true)}
                            style={{
                                padding: '10px 18px', borderRadius: '10px', border: 'none',
                                background: 'linear-gradient(135deg, #059669, #047857)',
                                color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                boxShadow: '0 0 16px rgba(5,150,105,0.3)',
                            }}
                        >
                            + Add Player
                        </button>
                    )}
                </div>

                {/* Row 2: Position Filters */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['ALL', ...POSITIONS].map(pos => {
                        const count = pos === 'ALL' ? players.length : (grouped[pos]?.length || 0);
                        if (pos !== 'ALL' && count === 0) return null;
                        const isActive = activePos === pos;
                        return (
                            <button
                                key={pos}
                                onClick={() => setActivePos(pos)}
                                style={{
                                    padding: '5px 12px', borderRadius: '8px', border: 'none',
                                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                                    background: isActive
                                        ? (pos === 'ALL' ? '#059669' : POS_COLORS[pos] || '#059669')
                                        : 'rgba(31,41,55,0.8)',
                                    color: isActive ? '#fff' : '#9ca3af',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {pos} {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Row 3: Status Filters */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['ALL', 'AVAILABLE', 'SOLD', 'UNSOLD'].map(s => {
                        const isActive = activeStatus === s;
                        const ss = STATUS_STYLES[s];
                        return (
                            <button
                                key={s}
                                onClick={() => setActiveStatus(s)}
                                style={{
                                    padding: '4px 12px', borderRadius: '8px', cursor: 'pointer',
                                    fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s',
                                    background: isActive ? (ss?.bg || 'rgba(5,150,105,0.2)') : 'rgba(31,41,55,0.5)',
                                    color: isActive ? (ss?.color || '#34d399') : '#6b7280',
                                    border: isActive ? `1px solid ${ss?.dot || '#059669'}40` : '1px solid rgba(75,85,99,0.2)',
                                }}
                            >
                                {s === 'ALL' ? `All (${statCounts.ALL})` : `${ss.label} (${statCounts[s]})`}
                            </button>
                        );
                    })}

                    {/* Result count */}
                    {(search || activePos !== 'ALL' || activeStatus !== 'ALL') && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6b7280', alignSelf: 'center' }}>
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Add Player Modal ── */}
            {showAdd && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                }}>
                    <div style={{
                        background: 'rgba(17,24,39,0.98)', border: '1px solid rgba(55,65,81,0.6)',
                        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px',
                    }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 24px' }}>
                            ⚽ Add Player
                        </h2>
                        {error && (
                            <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.875rem' }}>
                                ⚠️ {error}
                            </div>
                        )}
                        <form onSubmit={handleAdd}>
                            {/* Photo Upload */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '8px' }}>
                                    Player Photo
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: '2px dashed rgba(75,85,99,0.5)', borderRadius: '12px',
                                        padding: '16px', textAlign: 'center', cursor: 'pointer',
                                        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                                        minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'rgba(31,41,55,0.4)',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#059669'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(75,85,99,0.5)'}
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" style={{ maxHeight: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                                    ) : (
                                        <div>
                                            <div style={{ fontSize: '1.75rem', marginBottom: '6px' }}>📸</div>
                                            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Click to upload photo</p>
                                            <p style={{ fontSize: '0.7rem', color: '#4b5563', margin: '2px 0 0' }}>JPG, PNG, WEBP · Max 5MB</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                                {imagePreview && (
                                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }}
                                        style={{ marginTop: '6px', fontSize: '0.7rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        ✕ Remove photo
                                    </button>
                                )}
                            </div>

                            {/* Name */}
                            <div style={{ marginBottom: '14px', position: 'relative' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Player Name *</label>
                                <input
                                    required placeholder="Erling Haaland"
                                    value={form.name}
                                    onChange={e => {
                                        setForm({ ...form, name: e.target.value });
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => { if (form.name.length >= 2) setShowDropdown(true); }}
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)', color: '#f9fafb', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                />
                                {/* Dropdown */}
                                {showDropdown && (form.name.length >= 2) && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                                        background: 'rgba(31,41,55,0.98)', border: '1px solid rgba(75,85,99,0.5)',
                                        borderRadius: '10px', overflow: 'hidden', zIndex: 110,
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                                    }}>
                                        {isSearching ? (
                                            <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>Searching...</div>
                                        ) : searchResults.length === 0 ? (
                                            <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '0.8rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>No API matches.</span>
                                                    <button type="button" onClick={() => setShowDropdown(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}>Close</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(75,85,99,0.3)' }}>
                                                    <span style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggestions</span>
                                                    <button type="button" onClick={() => setShowDropdown(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.9rem', cursor: 'pointer' }}>✕</button>
                                                </div>
                                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {searchResults.map((r, i) => (
                                                        <div key={i} onClick={() => handleSelectResult(r)} style={{
                                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                                                            borderBottom: '1px solid rgba(75,85,99,0.2)', cursor: 'pointer', transition: 'background 0.2s'
                                                        }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(75,85,99,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                            <img src={r.image || 'https://via.placeholder.com/30'} alt={r.name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                                            <div>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f9fafb' }}>{r.name}</div>
                                                                <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{r.team} · {r.position}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Position + Base Price */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Position</label>
                                    <select
                                        value={form.position}
                                        onChange={e => setForm({ ...form, position: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(31,41,55,0.9)', border: '1px solid rgba(75,85,99,0.5)', color: '#f9fafb', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                    >
                                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Base Price (M)</label>
                                    <input
                                        type="number" min="1" required
                                        value={form.basePrice}
                                        onChange={e => setForm({ ...form, basePrice: e.target.value })}
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', background: 'rgba(31,41,55,0.8)', border: '1px solid rgba(75,85,99,0.5)', color: '#f9fafb', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                        onFocus={e => e.target.style.borderColor = '#059669'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(75,85,99,0.5)'}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" disabled={uploading} style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                                    background: uploading ? 'rgba(5,150,105,0.4)' : 'linear-gradient(135deg, #059669, #047857)',
                                    color: '#fff', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
                                }}>
                                    {uploading ? '⏳ Uploading...' : 'Add Player'}
                                </button>
                                <button type="button" onClick={() => { setShowAdd(false); setImageFile(null); setImagePreview(''); setError(''); setForm({ name: '', position: 'CF', basePrice: 10, imageUrl: '' }); setShowDropdown(false); }} style={{
                                    flex: 1, padding: '12px', borderRadius: '10px',
                                    background: 'transparent', border: '1px solid rgba(75,85,99,0.5)',
                                    color: '#9ca3af', fontWeight: 600, cursor: 'pointer',
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                }}>
                    <div style={{
                        background: 'rgba(17,24,39,0.98)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '360px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb', margin: '0 0 8px' }}>Delete Player?</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 24px' }}>
                            This will permanently remove the player from the tournament.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(75,85,99,0.5)', background: 'transparent', color: '#9ca3af', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Player Grid ── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏳</div>
                    <p>Loading players...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 0',
                    background: 'rgba(17,24,39,0.6)', borderRadius: '16px',
                    border: '1px solid rgba(55,65,81,0.4)',
                }}>
                    <p style={{ fontSize: '2.5rem', margin: '0 0 12px' }}>
                        {players.length === 0 ? '👤' : '🔍'}
                    </p>
                    <p style={{ color: '#f9fafb', fontWeight: 700, margin: '0 0 4px' }}>
                        {players.length === 0 ? 'No players yet' : 'No players found'}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                        {players.length === 0
                            ? (user?.role === 'ADMIN' ? 'Add some above.' : 'Admin will add players.')
                            : 'Try adjusting your search or filters.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="player-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '14px',
                    }}>
                        {paginated.map((p, i) => {
                            const ss = STATUS_STYLES[p.status] || STATUS_STYLES.AVAILABLE;
                            const imgSrc = p.imageUrl || null;
                            return (
                                <div key={p._id} style={{
                                    background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(55,65,81,0.4)',
                                    borderRadius: '14px', overflow: 'hidden',
                                    transition: 'all 0.2s', cursor: 'default',
                                    animation: `fadeIn 0.3s ease both`,
                                    animationDelay: `${i * 0.03}s`,
                                    position: 'relative',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = 'rgba(5,150,105,0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(55,65,81,0.4)'; }}
                                >
                                    {/* Image area */}
                                    <div style={{ position: 'relative', background: 'linear-gradient(135deg, #1f2937, #111827)', aspectRatio: '4/3', overflow: 'hidden' }}>
                                        {imgSrc ? (
                                            <>
                                                {/* Skeleton shown while loading */}
                                                <div className="img-skeleton" style={{ position: 'absolute', inset: 0 }} />
                                                <img src={imgSrc} alt={p.name}
                                                    loading="lazy"
                                                    className="lazy-img"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', position: 'relative', zIndex: 1 }}
                                                    onLoad={e => e.target.classList.add('loaded')}
                                                    onError={e => { e.target.style.display = 'none'; }}
                                                />
                                            </>
                                        ) : null}
                                        <div style={{
                                            display: imgSrc ? 'none' : 'flex',
                                            height: '100%', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '2.5rem',
                                        }}>⚽</div>

                                        {/* Position badge */}
                                        <span style={{
                                            position: 'absolute', top: '8px', left: '8px',
                                            padding: '2px 7px', borderRadius: '6px',
                                            fontSize: '0.65rem', fontWeight: 800, color: '#fff',
                                            background: POS_COLORS[p.position] || '#6b7280',
                                        }}>{p.position}</span>

                                        {/* Status badge */}
                                        <span style={{
                                            position: 'absolute', top: '8px', right: '8px',
                                            padding: '2px 7px', borderRadius: '6px',
                                            fontSize: '0.65rem', fontWeight: 700,
                                            background: ss.bg, color: ss.color,
                                        }}>{ss.label}</span>

                                        {/* Admin delete btn */}
                                        {user?.role === 'ADMIN' && (
                                            <button
                                                onClick={() => setDeleteConfirm(p._id)}
                                                title="Delete player"
                                                style={{
                                                    position: 'absolute', bottom: '6px', right: '6px',
                                                    width: '26px', height: '26px', borderRadius: '6px',
                                                    border: 'none', background: 'rgba(239,68,68,0.85)',
                                                    color: '#fff', fontSize: '0.7rem', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backdropFilter: 'blur(4px)',
                                                }}
                                            >🗑</button>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding: '10px 12px' }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: '0 0 6px', color: '#f9fafb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.name}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Base</span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24' }}>{p.basePrice}M</span>
                                        </div>
                                        {p.status === 'SOLD' && p.soldTo && (
                                            <div style={{ marginTop: '5px', fontSize: '0.7rem', color: '#34d399', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                → {p.soldTo.name} · {p.soldPrice}M
                                            </div>
                                        )}
                                        {p.status === 'UNSOLD' && (
                                            <div style={{ marginTop: '5px', fontSize: '0.7rem', color: '#6b7280' }}>Unsold</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(75,85,99,0.4)',
                                    background: 'transparent', color: page === 1 ? '#374151' : '#9ca3af',
                                    cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
                                }}
                            >← Prev</button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setPage(p)}
                                    style={{
                                        width: '34px', height: '34px', borderRadius: '8px', border: 'none',
                                        background: page === p ? 'linear-gradient(135deg, #059669, #047857)' : 'rgba(31,41,55,0.8)',
                                        color: page === p ? '#fff' : '#9ca3af',
                                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                    }}
                                >{p}</button>
                            ))}

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{
                                    padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(75,85,99,0.4)',
                                    background: 'transparent', color: page === totalPages ? '#374151' : '#9ca3af',
                                    cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
                                }}
                            >Next →</button>

                            <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '4px' }}>
                                Page {page} of {totalPages} · {filtered.length} players
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
