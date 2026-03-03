const mongoose = require('mongoose');

const POSITIONS = ['CF', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];

const playerSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    name: { type: String, required: true, trim: true },
    position: { type: String, enum: POSITIONS, required: true },
    nationality: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    basePrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ['AVAILABLE', 'UNSOLD', 'SOLD'],
        default: 'AVAILABLE',
    },
    soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    soldPrice: { type: Number, default: null },
    orderIndex: { type: Number, required: true },
}, { timestamps: true });

playerSchema.index({ tournamentId: 1, orderIndex: 1 });

module.exports = mongoose.model('Player', playerSchema);
