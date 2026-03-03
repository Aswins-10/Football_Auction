const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auctionService = require('../services/auctionService');

module.exports = (io) => {
    // Auth middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token) return next(new Error('Authentication error'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('User not found'));
            socket.user = user;
            next();
        } catch {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id} (${socket.user.email})`);

        // ── Join tournament room ───────────────────────────────────────────────
        socket.on('join:tournament', async (tournamentId) => {
            socket.join(tournamentId);

            // Send current state if active
            const state = auctionService.getState(tournamentId);
            if (state) socket.emit('auction:state', auctionService.sanitizeState(state));

            // Always send category stats on join
            try {
                const stats = await auctionService.getCategoryStats(tournamentId);
                socket.emit('auction:category_stats', stats);
            } catch { }
        });

        socket.on('leave:tournament', (tournamentId) => socket.leave(tournamentId));

        // ── TEAM OWNER: Place bid ──────────────────────────────────────────────
        socket.on('bid:place', async ({ tournamentId, teamId }) => {
            if (socket.user.role !== 'TEAM_OWNER')
                return socket.emit('bid:rejected', { reason: 'Only team owners can bid' });
            const result = await auctionService.placeBid(tournamentId, teamId, io);
            if (!result.success) socket.emit('bid:rejected', { reason: result.reason });
        });

        // ── TEAM OWNER: Quit bidding ───────────────────────────────────────────
        socket.on('bid:quit', async ({ tournamentId, teamId }) => {
            if (socket.user.role !== 'TEAM_OWNER') return;
            const result = await auctionService.quitBidding(tournamentId, teamId, io);
            if (!result.success) socket.emit('bid:rejected', { reason: result.reason });
        });

        // ── ADMIN: Initialize / get state ──────────────────────────────────────
        socket.on('auction:init', async ({ tournamentId }) => {
            if (socket.user.role !== 'ADMIN') return;
            try {
                const state = await auctionService.initializeAuction(tournamentId);
                socket.emit('auction:state', auctionService.sanitizeState(state));
                const stats = await auctionService.getCategoryStats(tournamentId);
                socket.emit('auction:category_stats', stats);
            } catch (err) {
                socket.emit('error', { message: err.message });
            }
        });

        // ── ADMIN: Select category ─────────────────────────────────────────────
        socket.on('auction:select_category', async ({ tournamentId, category }) => {
            if (socket.user.role !== 'ADMIN')
                return socket.emit('error', { message: 'Unauthorized' });
            const result = await auctionService.selectCategory(tournamentId, category, io);
            if (!result.success) socket.emit('error', { message: result.reason });
            else {
                // Broadcast to ALL in room so teams see the category lobby
                const lists = await auctionService.getCategoryPlayers(tournamentId, category);
                io.to(tournamentId).emit('auction:category_players', lists);
            }
        });

        // ── ADMIN: Get category player lists ──────────────────────────────────
        socket.on('auction:get_category_players', async ({ tournamentId, category }) => {
            if (socket.user.role !== 'ADMIN') return;
            const lists = await auctionService.getCategoryPlayers(tournamentId, category);
            socket.emit('auction:category_players', lists);
        });

        // ── ADMIN: Select a specific player to auction ────────────────────────
        socket.on('auction:select_player', async ({ tournamentId, playerId }) => {
            if (socket.user.role !== 'ADMIN')
                return socket.emit('error', { message: 'Unauthorized' });
            const result = await auctionService.selectPlayer(tournamentId, playerId, io);
            if (!result.success) socket.emit('error', { message: result.reason });
        });

        // ── ADMIN: Pause ───────────────────────────────────────────────────────
        socket.on('auction:pause', ({ tournamentId }) => {
            if (socket.user.role !== 'ADMIN') return;
            auctionService.pauseAuction(tournamentId, io);
        });

        // ── ADMIN: Resume ──────────────────────────────────────────────────────
        socket.on('auction:resume', ({ tournamentId }) => {
            if (socket.user.role !== 'ADMIN') return;
            auctionService.resumeAuction(tournamentId, io);
        });

        // ── ADMIN: Skip player ─────────────────────────────────────────────────
        socket.on('auction:skip', async ({ tournamentId }) => {
            if (socket.user.role !== 'ADMIN') return;
            await auctionService.skipPlayer(tournamentId, io);
        });

        // ── ADMIN: Reopen last player ──────────────────────────────────────────
        socket.on('auction:reopen', async ({ tournamentId }) => {
            if (socket.user.role !== 'ADMIN') return;
            const result = await auctionService.reopenLastPlayer(tournamentId, io);
            if (result && !result.success) socket.emit('error', { message: result.reason });
        });

        // ── ADMIN: End entire auction ──────────────────────────────────────────
        socket.on('auction:end', async ({ tournamentId }) => {
            if (socket.user.role !== 'ADMIN') return;
            await auctionService.endAuction(tournamentId, io);
        });

        // ── ADMIN: Reintroduce unsold player ──────────────────────────────────
        socket.on('auction:reintroduce_unsold', async ({ tournamentId, playerId }) => {
            if (socket.user.role !== 'ADMIN')
                return socket.emit('error', { message: 'Unauthorized' });
            const result = await auctionService.reintroduceUnsold(tournamentId, playerId, io);
            if (!result.success) socket.emit('error', { message: result.reason });
            else {
                // Refresh player lists for current category
                const state = auctionService.getState(tournamentId);
                if (state?.activeCategory) {
                    const lists = await auctionService.getCategoryPlayers(tournamentId, state.activeCategory);
                    socket.emit('auction:category_players', lists);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};
