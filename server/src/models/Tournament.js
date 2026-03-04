const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    totalSlots: { type: Number, required: true },
    budgetPerTeam: { type: Number, required: true },
    squadSizeLimit: { type: Number, required: true },
    timerDuration: { type: Number, default: 20 },
    status: {
        type: String,
        enum: ['UPCOMING', 'LIVE', 'FINISHED'],
        default: 'UPCOMING',
    },
    auctionState: { type: Object, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
