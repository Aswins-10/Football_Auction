const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    assignedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pendingUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    budgetRemaining: { type: Number, required: true },
    squadCount: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
