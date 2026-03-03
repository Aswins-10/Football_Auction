const Player = require('../models/Player');

const addPlayers = async (req, res) => {
    try {
        const { players } = req.body; // array of players
        if (!Array.isArray(players) || players.length === 0)
            return res.status(400).json({ message: 'Players array required' });

        // Get current max orderIndex
        const maxPlayer = await Player.findOne({ tournamentId: req.params.tournamentId }).sort({ orderIndex: -1 });
        let nextIndex = maxPlayer ? maxPlayer.orderIndex + 1 : 0;

        const toInsert = players.map((p) => ({
            ...p,
            tournamentId: req.params.tournamentId,
            orderIndex: p.orderIndex !== undefined ? p.orderIndex : nextIndex++,
            status: 'AVAILABLE',
        }));

        const created = await Player.insertMany(toInsert);
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getPlayers = async (req, res) => {
    try {
        const players = await Player.find({ tournamentId: req.params.tournamentId })
            .sort({ orderIndex: 1 })
            .populate('soldTo', 'name logo');
        res.json(players);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deletePlayer = async (req, res) => {
    try {
        await Player.findByIdAndDelete(req.params.playerId);
        res.json({ message: 'Player deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { addPlayers, getPlayers, deletePlayer };
