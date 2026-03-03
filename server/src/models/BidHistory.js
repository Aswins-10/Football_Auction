const mongoose = require('mongoose');

const bidHistorySchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
});

bidHistorySchema.index({ playerId: 1 });
bidHistorySchema.index({ tournamentId: 1 });

module.exports = mongoose.model('BidHistory', bidHistorySchema);
