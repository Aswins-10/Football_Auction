/**
 * Auction Engine Service – Category-Driven, Admin-Controlled
 *
 * State machine:
 *  WAITING         → Category selected, admin hasn't started bidding yet
 *  LIVE            → Player being auctioned, timer running
 *  PAUSED          → Timer frozen
 *  SOLD            → Transient (5s banner), then → WAITING
 *  UNSOLD          → Transient (5s banner), then → WAITING
 *  FINISHED        → Admin explicitly ended auction
 *
 * Admin must manually select each player. System never auto-progresses.
 */

const Player = require('../models/Player');
const Team = require('../models/Team');
const BidHistory = require('../models/BidHistory');
const Tournament = require('../models/Tournament');

// In-memory states: { [tournamentId]: state }
const auctionStates = {};

// ── Category Definitions ───────────────────────────────────────────────────────

const POSITION_CATEGORIES = {
    CF: ['CF'],
    Wingers: ['RW', 'LW'],
    'Attacking Mid': ['CAM'],
    'Center Mid': ['CM', 'CDM'],
    'Center Back': ['CB'],
    'Full Backs': ['LB', 'RB'],
    Goalkeeper: ['GK'],
};

function positionsForCategory(cat) {
    return POSITION_CATEGORIES[cat] || [];
}

// ── Bid Increment ──────────────────────────────────────────────────────────────

function getIncrement(price) {
    if (price < 25) return 2.5;
    if (price < 100) return 5;
    return 10;
}

// ── State Helpers ──────────────────────────────────────────────────────────────

function getState(tournamentId) {
    return auctionStates[tournamentId] || null;
}

function setState(tournamentId, data) {
    auctionStates[tournamentId] = data;
}

function clearState(tournamentId) {
    const s = auctionStates[tournamentId];
    if (s) {
        clearTimeout(s._timerHandle);
        clearInterval(s._tickInterval);
        delete auctionStates[tournamentId];
    }
}

function sanitizeState(state) {
    if (!state) return null;
    const { _timerHandle, _tickInterval, ...clean } = state;
    return clean;
}

// ── State Persistence (Free Tier Safety) ───────────────────────────────────────

async function saveStateToDB(tournamentId) {
    const s = getState(tournamentId);
    if (!s) return;
    try {
        await Tournament.findByIdAndUpdate(tournamentId, { auctionState: sanitizeState(s) });
    } catch (err) {
        console.error(`[AuctionService] Failed to save DB state for ${tournamentId}:`, err);
    }
}

async function restoreStatesOnBoot() {
    try {
        const activeTournaments = await Tournament.find({
            status: { $in: ['LIVE', 'PAUSED'] },
            auctionState: { $ne: null }
        });

        for (const t of activeTournaments) {
            const s = t.auctionState;
            // Clean transient fields
            s.bidBuffer = [];
            s.teamLastBidTime = {};
            s._timerHandle = null;
            s._tickInterval = null;

            // If server crashed during LIVE auction, fallback to PAUSED 
            // so admin can resume safely without losing timer/context
            if (s.status === 'LIVE') {
                s.status = 'PAUSED';
            }

            setState(t._id.toString(), s);
            console.log(`[AuctionService] Restored auction state for tournament: ${t.name || t._id}`);
        }
    } catch (err) {
        console.error('[AuctionService] Boot restore error:', err);
    }
}

// Fire on require
setTimeout(restoreStatesOnBoot, 2000);


function makeInitialState(tournament) {
    return {
        tournamentId: tournament._id.toString(),
        activeCategory: null,
        currentPlayerId: null,
        currentPlayer: null,
        currentPrice: 0,
        previousPrice: 0,
        previousLeaderTeamId: null,
        currentLeaderTeamId: null,
        timerEndTime: null,
        timeRemaining: tournament.timerDuration,
        timerDuration: tournament.timerDuration,
        // ── Cached once at init — never re-queried during bidding ──────────────
        squadSizeLimit: tournament.squadSizeLimit,
        status: 'WAITING',
        quitMap: {},
        previousState: null,
        bidBuffer: [],
        teamLastBidTime: {},
        _timerHandle: null,
        _tickInterval: null,
    };
}

// ── Category Stats ─────────────────────────────────────────────────────────────

async function getCategoryStats(tournamentId) {
    const players = await Player.find({ tournamentId }).select('position status');
    const stats = {};

    for (const [cat, positions] of Object.entries(POSITION_CATEGORIES)) {
        const inCat = players.filter(p => positions.includes(p.position));
        stats[cat] = {
            total: inCat.length,
            available: inCat.filter(p => p.status === 'AVAILABLE').length,
            unsold: inCat.filter(p => p.status === 'UNSOLD').length,
            sold: inCat.filter(p => p.status === 'SOLD').length,
        };
    }
    return stats;
}

// ── Timer ──────────────────────────────────────────────────────────────────────

function startTimer(tournamentId, io, onExpire) {
    const state = getState(tournamentId);
    if (!state) return;

    clearTimeout(state._timerHandle);
    clearInterval(state._tickInterval);
    state.timerEndTime = Date.now() + state.timeRemaining * 1000;

    const tickInterval = setInterval(() => {
        const s = getState(tournamentId);
        if (!s || s.status !== 'LIVE') { clearInterval(tickInterval); return; }
        const remaining = Math.max(0, Math.ceil((s.timerEndTime - Date.now()) / 1000));
        s.timeRemaining = remaining;
        io.to(tournamentId).emit('auction:tick', { timeRemaining: remaining });
        if (remaining <= 0) clearInterval(tickInterval);
    }, 1000);

    state._tickInterval = tickInterval;

    state._timerHandle = setTimeout(async () => {
        clearInterval(tickInterval);
        await onExpire(tournamentId, io);
    }, state.timeRemaining * 1000);
}

function stopTimer(tournamentId) {
    const state = getState(tournamentId);
    if (!state) return;
    clearTimeout(state._timerHandle);
    clearInterval(state._tickInterval);
}

function pauseTimer(tournamentId) {
    const state = getState(tournamentId);
    if (!state) return;
    clearTimeout(state._timerHandle);
    clearInterval(state._tickInterval);
    state.timeRemaining = Math.max(0, Math.ceil((state.timerEndTime - Date.now()) / 1000));
    state.timerEndTime = null;
}

// ── Timer Expiry ───────────────────────────────────────────────────────────────

async function handleTimerExpiry(tournamentId, io) {
    const state = getState(tournamentId);
    if (!state || state.status !== 'LIVE') return;

    if (state.currentLeaderTeamId) {
        await soldPlayer(tournamentId, io, state.currentLeaderTeamId, state.currentPrice);
    } else {
        await unsoldPlayer(tournamentId, io);
    }
}

// ── Sold ───────────────────────────────────────────────────────────────────────

async function soldPlayer(tournamentId, io, teamId, price) {
    const state = getState(tournamentId);
    if (!state) return;

    stopTimer(tournamentId);
    state.status = 'SOLD';

    try {
        await Player.findByIdAndUpdate(state.currentPlayerId, {
            status: 'SOLD',
            soldTo: teamId,
            soldPrice: price,
        });

        // ATOMIC budget deduction — the $gte guard ensures budgetRemaining never goes negative.
        // If somehow the budget is already less than price (edge case), the update simply won't
        // match and updatedTeam will be null, so we check and abort safely.
        const updatedTeam = await Team.findOneAndUpdate(
            { _id: teamId, budgetRemaining: { $gte: price } },  // guard: must still afford it
            { $inc: { budgetRemaining: -price, squadCount: 1 } },
            { new: true }   // return the updated document
        );

        if (!updatedTeam) {
            // Safety net: budget was already too low (shouldn't happen, but just in case)
            console.error(`soldPlayer: Team ${teamId} insufficient budget at SOLD time. Rollback.`);
            await Player.findByIdAndUpdate(state.currentPlayerId, { status: 'AVAILABLE', soldTo: null, soldPrice: null });
            state.status = 'LIVE';
            startTimer(tournamentId, io, handleTimerExpiry);
            return;
        }

        // Flush buffered bids to DB
        if (state.bidBuffer.length > 0) {
            await BidHistory.insertMany(state.bidBuffer).catch(err => console.error('Bulk insert failed', err));
            state.bidBuffer = [];
        }

        const updatedPlayer = await Player.findById(state.currentPlayerId).populate('soldTo', 'name logo');
        // updatedTeam is already fresh from the atomic findOneAndUpdate above

        // Save for reopen
        state.previousState = {
            currentPlayerId: state.currentPlayerId,
            currentPlayer: updatedPlayer,
            currentPrice: price,
            currentLeaderTeamId: teamId,
            quitMap: { ...state.quitMap },
            bidBuffer: [],
        };

        // Broadcast SOLD event
        io.to(tournamentId).emit('auction:sold', { player: updatedPlayer, team: updatedTeam, soldPrice: price });
        io.to(tournamentId).emit('bid:log', {
            message: `🎊 ${updatedPlayer.name} SOLD to ${updatedTeam.name} for ${price}M!`,
            type: 'sold',
            category: state.activeCategory,
        });

        // !! Broadcast the updated budget immediately so all clients reflect it in real-time
        io.to(tournamentId).emit('auction:team_budget', {
            teamId: updatedTeam._id.toString(),
            budgetRemaining: updatedTeam.budgetRemaining,
            squadCount: updatedTeam.squadCount,
        });

        const stats = await getCategoryStats(tournamentId);
        io.to(tournamentId).emit('auction:category_stats', stats);

        saveStateToDB(tournamentId);

        // After 5s go back to WAITING
        setTimeout(() => {
            const s = getState(tournamentId);
            if (!s || s.status !== 'SOLD') return;
            s.status = 'WAITING';
            s.currentPlayerId = null;
            s.currentPlayer = null;
            s.currentPrice = 0;
            s.currentLeaderTeamId = null;
            s.bidBuffer = [];

            saveStateToDB(tournamentId);
            io.to(tournamentId).emit('auction:state', sanitizeState(s));
        }, 5000);

    } catch (err) {
        console.error('soldPlayer error:', err);
    }
}

// ── Unsold ─────────────────────────────────────────────────────────────────────

async function unsoldPlayer(tournamentId, io) {
    const state = getState(tournamentId);
    if (!state) return;

    stopTimer(tournamentId);
    state.status = 'UNSOLD';

    try {
        await Player.findByIdAndUpdate(state.currentPlayerId, { status: 'UNSOLD' });
        const player = await Player.findById(state.currentPlayerId);

        // Clear bid buffer since no sale logic executed
        state.bidBuffer = [];

        state.previousState = {
            currentPlayerId: state.currentPlayerId,
            currentPlayer: player,
            currentPrice: player.basePrice,
            currentLeaderTeamId: null,
            quitMap: { ...state.quitMap },
            bidBuffer: [],
        };

        io.to(tournamentId).emit('auction:unsold', { player });
        io.to(tournamentId).emit('bid:log', { message: `📋 ${player.name} went UNSOLD`, type: 'unsold', category: state.activeCategory });

        const stats = await getCategoryStats(tournamentId);
        io.to(tournamentId).emit('auction:category_stats', stats);

        saveStateToDB(tournamentId);

        setTimeout(() => {
            const s = getState(tournamentId);
            if (!s || s.status !== 'UNSOLD') return;
            s.status = 'WAITING';
            s.currentPlayerId = null;
            s.currentPlayer = null;
            s.currentPrice = 0;
            s.currentLeaderTeamId = null;

            saveStateToDB(tournamentId);
            io.to(tournamentId).emit('auction:state', sanitizeState(s));
        }, 5000);

    } catch (err) {
        console.error('unsoldPlayer error:', err);
    }
}

// ── Select Player (Admin) ──────────────────────────────────────────────────────

async function selectPlayer(tournamentId, playerId, io) {
    let state = getState(tournamentId);

    if (!state) {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return { success: false, reason: 'Tournament not found' };
        state = makeInitialState(tournament);
        setState(tournamentId, state);
    }

    // Stop any running timer
    stopTimer(tournamentId);

    const player = await Player.findOne({ _id: playerId, tournamentId });
    if (!player) return { success: false, reason: 'Player not found' };

    // Reset player to AVAILABLE so auction runs cleanly
    await Player.findByIdAndUpdate(playerId, { status: 'AVAILABLE', soldTo: null, soldPrice: null });
    player.status = 'AVAILABLE';
    player.soldTo = null;
    player.soldPrice = null;

    // Save prev state for reopen
    if (state.currentPlayerId) {
        state.previousState = {
            currentPlayerId: state.currentPlayerId,
            currentPlayer: state.currentPlayer,
            currentPrice: state.currentPrice,
            currentLeaderTeamId: state.currentLeaderTeamId,
            quitMap: { ...state.quitMap },
            bidBuffer: [...state.bidBuffer],
        };
    }

    state.currentPlayerId = player._id.toString();
    state.currentPlayer = player;
    state.currentPrice = player.basePrice;
    state.currentLeaderTeamId = null;
    state.quitMap[player._id.toString()] = [];
    state.bidBuffer = [];
    state.teamLastBidTime = {};
    state.timeRemaining = state.timerDuration;
    state.status = 'LIVE';

    await Tournament.findByIdAndUpdate(tournamentId, { status: 'LIVE' });

    io.to(tournamentId).emit('auction:next', { player, state: sanitizeState(state) });
    io.to(tournamentId).emit('bid:log', {
        message: `🎯 Auction started for ${player.name}`,
        type: 'system',
        category: state.activeCategory,
    });

    saveStateToDB(tournamentId);
    startTimer(tournamentId, io, handleTimerExpiry);
    return { success: true };
}

// ── Select Category (Admin) ────────────────────────────────────────────────────

async function selectCategory(tournamentId, category, io) {
    let state = getState(tournamentId);

    if (!state) {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return { success: false, reason: 'Tournament not found' };
        state = makeInitialState(tournament);
        setState(tournamentId, state);
    }

    if (state.status === 'LIVE') {
        return { success: false, reason: 'Cannot switch category while auction is live' };
    }

    state.activeCategory = category;
    io.to(tournamentId).emit('auction:category_selected', { category, state: sanitizeState(state) });
    io.to(tournamentId).emit('bid:log', {
        message: `⚙️ Admin switched to category: ${category}`,
        type: 'system',
        category,
    });
    return { success: true };
}

// ── Reintroduce Unsold (Admin) ─────────────────────────────────────────────────

async function reintroduceUnsold(tournamentId, playerId, io) {
    const state = getState(tournamentId);
    if (!state) return { success: false, reason: 'No auction state' };
    if (!state.activeCategory) return { success: false, reason: 'No active category' };

    const positions = positionsForCategory(state.activeCategory);

    // Check: all original AVAILABLE players (now AVAILABLE, UNSOLD, or SOLD)
    // must have been auctioned at least once (i.e., no player remaining in AVAILABLE status
    // that hasn't been put up for auction = all are either UNSOLD or SOLD).
    const availableInCat = await Player.countDocuments({
        tournamentId,
        position: { $in: positions },
        status: 'AVAILABLE',
    });

    if (availableInCat > 0) {
        return {
            success: false,
            reason: `${availableInCat} AVAILABLE player(s) in this category must be auctioned first`,
        };
    }

    const player = await Player.findOne({ _id: playerId, tournamentId, status: 'UNSOLD' });
    if (!player) return { success: false, reason: 'Player not found or not UNSOLD' };

    await Player.findByIdAndUpdate(playerId, {
        status: 'AVAILABLE',
        soldTo: null,
        soldPrice: null,
    });

    const stats = await getCategoryStats(tournamentId);
    io.to(tournamentId).emit('auction:category_stats', stats);
    io.to(tournamentId).emit('bid:log', {
        message: `♻️ ${player.name} reintroduced to auction`,
        type: 'system',
        category: state.activeCategory,
    });

    // Return updated player list for admin
    const updatedPlayer = await Player.findById(playerId);
    io.to(tournamentId).emit('auction:player_reintroduced', { player: updatedPlayer });
    return { success: true };
}

// ── Bid ────────────────────────────────────────────────────────────────────────

async function placeBid(tournamentId, teamId, io) {
    const state = getState(tournamentId);
    if (!state) return { success: false, reason: 'No active auction' };
    if (state.status !== 'LIVE') return { success: false, reason: 'Auction is not live' };

    // 1. Rate Limiting (300ms cooldown per team)
    const now = Date.now();
    const lastBidTime = state.teamLastBidTime[teamId] || 0;
    if (now - lastBidTime < 300) {
        return { success: false, reason: 'Please wait before placing another bid.' };
    }

    const playerId = state.currentPlayerId;
    const quits = state.quitMap[playerId] || [];

    if (quits.includes(teamId.toString()))
        return { success: false, reason: 'You have quit this player' };

    try {
        const nextPrice = +(state.currentPrice + getIncrement(state.currentPrice)).toFixed(1);

        // ── ATOMIC VALIDATION ─────────────────────────────────────────────────
        // budget check is atomic — single conditional read prevents double-spend
        const team = await Team.findOne({
            _id: teamId,
            budgetRemaining: { $gte: nextPrice },
        });
        if (!team) return { success: false, reason: 'Insufficient budget or team not found' };

        // ── squadSizeLimit read from cached state — no DB round-trip ──────────
        if (team.squadCount >= state.squadSizeLimit)
            return { success: false, reason: 'Squad is full' };

        // Save previous price+leader so quit can revert
        state.previousPrice = state.currentPrice;
        state.previousLeaderTeamId = state.currentLeaderTeamId;

        state.currentPrice = nextPrice;
        state.currentLeaderTeamId = teamId.toString();
        state.teamLastBidTime[teamId] = now;

        // Reset timer
        stopTimer(tournamentId);
        state.timeRemaining = state.timerDuration;

        // Buffer DB write → flushed to BidHistory in bulk on SOLD
        state.bidBuffer.push({
            tournamentId,
            playerId,
            teamId,
            amount: nextPrice,
            createdAt: new Date(),
        });

        io.to(tournamentId).emit('bid:log', {
            message: `⚡ ${team.name} bid ${nextPrice}M for ${state.currentPlayer.name}`,
            type: 'bid',
            category: state.activeCategory,
        });

        // ── DELTA BROADCAST: only send the 2 fields that changed ──────────────
        // This replaces the expensive full sanitizeState() broadcast on every bid.
        // Full `auction:state` is only sent on join / reconnect / status changes.
        io.to(tournamentId).emit('auction:bid', {
            currentPrice: nextPrice,
            currentLeaderTeamId: teamId.toString(),
        });

        saveStateToDB(tournamentId);
        startTimer(tournamentId, io, handleTimerExpiry);

        await checkAutoSell(tournamentId, io);
        return { success: true };
    } catch (err) {
        console.error('placeBid error:', err);
        return { success: false, reason: 'Server error' };
    }
}

// ── Quit ───────────────────────────────────────────────────────────────────────

async function quitBidding(tournamentId, teamId, io) {
    const state = getState(tournamentId);
    if (!state) return { success: false, reason: 'No active auction' };
    if (state.status !== 'LIVE') return { success: false, reason: 'Auction is not live' };

    const playerId = state.currentPlayerId;
    if (!state.quitMap[playerId]) state.quitMap[playerId] = [];
    if (state.quitMap[playerId].includes(teamId.toString()))
        return { success: false, reason: 'Already quit' };

    state.quitMap[playerId].push(teamId.toString());

    const team = await Team.findById(teamId);

    // If quitting team was the current leader, revert their bid
    if (state.currentLeaderTeamId === teamId.toString()) {
        state.currentPrice = state.previousPrice || state.currentPlayer?.basePrice || 0;
        state.currentLeaderTeamId = state.previousLeaderTeamId || null;
        state.previousPrice = 0;
        state.previousLeaderTeamId = null;
        // Pop the latest bid out of buffer if it was theirs
        if (state.bidBuffer.length > 0) {
            const lastBid = state.bidBuffer[state.bidBuffer.length - 1];
            if (lastBid.teamId.toString() === teamId.toString()) {
                state.bidBuffer.pop();
            }
        }

        // Reset timer using exact timestamp approach
        stopTimer(tournamentId);
        state.timeRemaining = state.timerDuration;
        startTimer(tournamentId, io, handleTimerExpiry);
        if (team) {
            io.to(tournamentId).emit('bid:log', {
                message: `🚫 ${team.name} quit — bid REVERTED to ${state.currentPrice}M`,
                type: 'quit',
                category: state.activeCategory,
            });
        }
    } else {
        if (team) {
            io.to(tournamentId).emit('bid:log', {
                message: `🚫 ${team.name} stepped out of bidding`,
                type: 'quit',
                category: state.activeCategory,
            });
        }
    }

    // Delta broadcast — quit changes price, leader, and quitMap
    io.to(tournamentId).emit('auction:bid', {
        currentPrice: state.currentPrice,
        currentLeaderTeamId: state.currentLeaderTeamId,
        quitMap: state.quitMap,
    });

    saveStateToDB(tournamentId);
    await checkAutoSell(tournamentId, io);
    return { success: true };

}

// ── Auto-sell ──────────────────────────────────────────────────────────────────

async function checkAutoSell(tournamentId, io) {
    const state = getState(tournamentId);
    if (!state || state.status !== 'LIVE') return;
    if (!state.currentLeaderTeamId) return;

    const allTeams = await Team.find({ tournamentId, assignedUserId: { $ne: null } });
    const playerId = state.currentPlayerId;
    const quits = state.quitMap[playerId] || [];

    const activeTeams = allTeams.filter(
        t => !quits.includes(t._id.toString()) && t._id.toString() !== state.currentLeaderTeamId
    );

    if (activeTeams.length === 0 && allTeams.length > 1) {
        stopTimer(tournamentId);
        await soldPlayer(tournamentId, io, state.currentLeaderTeamId, state.currentPrice);
    }
}

// ── Admin Controls ─────────────────────────────────────────────────────────────

async function initializeAuction(tournamentId) {
    const existing = getState(tournamentId);
    if (existing) return existing;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    const state = makeInitialState(tournament);
    setState(tournamentId, state);
    return state;
}

function pauseAuction(tournamentId, io) {
    const state = getState(tournamentId);
    if (!state || state.status !== 'LIVE') return null;
    pauseTimer(tournamentId);
    state.status = 'PAUSED';
    io.to(tournamentId).emit('auction:paused', sanitizeState(state));
    io.to(tournamentId).emit('bid:log', { message: '⏸ Auction paused by admin', type: 'system', category: state.activeCategory });
    return sanitizeState(state);
}

function resumeAuction(tournamentId, io) {
    const state = getState(tournamentId);
    if (!state || state.status !== 'PAUSED') return null;
    state.status = 'LIVE';
    startTimer(tournamentId, io, handleTimerExpiry);
    io.to(tournamentId).emit('auction:resumed', sanitizeState(state));
    io.to(tournamentId).emit('bid:log', { message: '▶ Auction resumed by admin', type: 'system', category: state.activeCategory });
    return sanitizeState(state);
}

async function skipPlayer(tournamentId, io) {
    const state = getState(tournamentId);
    if (!state || !['LIVE', 'PAUSED'].includes(state.status)) return null;
    stopTimer(tournamentId);
    await unsoldPlayer(tournamentId, io);
}

async function reopenLastPlayer(tournamentId, io) {
    const state = getState(tournamentId);
    if (!state || !state.previousState) return { success: false, reason: 'Nothing to reopen' };

    stopTimer(tournamentId);

    const prev = state.previousState;
    const player = await Player.findById(prev.currentPlayerId);
    if (!player) return { success: false, reason: 'Player not found' };

    await Player.findByIdAndUpdate(prev.currentPlayerId, {
        status: 'AVAILABLE',
        soldTo: null,
        soldPrice: null,
    });

    // If previous was sold, refund team budget and clear DB bid hits
    if (prev.currentLeaderTeamId && player.status === 'SOLD') {
        await Team.findByIdAndUpdate(prev.currentLeaderTeamId, {
            $inc: { budgetRemaining: prev.currentPrice, squadCount: -1 },
        });
        // Remove the successful bid if it was already bulk inserted to DB
        await BidHistory.deleteMany({ playerId: prev.currentPlayerId });
    }

    state.currentPlayerId = prev.currentPlayerId;
    state.currentPlayer = player;
    state.currentPrice = player.basePrice;
    state.currentLeaderTeamId = null;
    state.quitMap[prev.currentPlayerId] = [];
    state.bidBuffer = []; // reset buffer
    state.teamLastBidTime = {};
    state.timeRemaining = state.timerDuration;
    state.status = 'LIVE';
    state.previousState = null;

    io.to(tournamentId).emit('auction:next', { player, state: sanitizeState(state) });
    io.to(tournamentId).emit('bid:log', { message: `🔄 ${player.name} reopened for bidding`, type: 'system', category: state.activeCategory });
    startTimer(tournamentId, io, handleTimerExpiry);

    const stats = await getCategoryStats(tournamentId);
    io.to(tournamentId).emit('auction:category_stats', stats);

    return { success: true };
}

async function endAuction(tournamentId, io) {
    const state = getState(tournamentId);
    if (state) {
        stopTimer(tournamentId);
        state.status = 'FINISHED';
        io.to(tournamentId).emit('auction:state', sanitizeState(state));
        clearState(tournamentId); // Full memory cleanup
    }
    await Tournament.findByIdAndUpdate(tournamentId, { status: 'FINISHED' });
    io.to(tournamentId).emit('auction:ended', { message: 'Auction ended by admin' });
}

// ── Get category player lists ──────────────────────────────────────────────────

async function getCategoryPlayers(tournamentId, category) {
    const positions = positionsForCategory(category);
    const players = await Player.find({
        tournamentId,
        position: { $in: positions },
        status: { $in: ['AVAILABLE', 'UNSOLD'] },
    }).sort({ status: 1, orderIndex: 1 }).select('_id name position basePrice status');
    return {
        available: players.filter(p => p.status === 'AVAILABLE'),
        unsold: players.filter(p => p.status === 'UNSOLD'),
    };
}

// ── Exports ────────────────────────────────────────────────────────────────────

module.exports = {
    POSITION_CATEGORIES,
    getState,
    sanitizeState,
    getCategoryStats,
    getCategoryPlayers,
    initializeAuction,
    selectCategory,
    selectPlayer,
    reintroduceUnsold,
    pauseAuction,
    resumeAuction,
    skipPlayer,
    reopenLastPlayer,
    endAuction,
    placeBid,
    quitBidding,
};
