const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Player = require('../models/Player');

const createTournament = async (req, res) => {
    try {
        const { name, totalSlots, budgetPerTeam, squadSizeLimit, timerDuration } = req.body;
        if (!name || !totalSlots || !budgetPerTeam || !squadSizeLimit)
            return res.status(400).json({ message: 'Missing required fields' });

        const tournament = await Tournament.create({
            name,
            totalSlots,
            budgetPerTeam,
            squadSizeLimit,
            timerDuration: timerDuration || 20,
            createdBy: req.user._id,
        });
        res.status(201).json(tournament);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find().sort({ createdAt: -1 });
        res.json(tournaments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
        res.json(tournament);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateTournament = async (req, res) => {
    try {
        const { name, totalSlots, budgetPerTeam, squadSizeLimit, timerDuration } = req.body;
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        if (name) tournament.name = name;
        if (totalSlots) tournament.totalSlots = totalSlots;
        if (budgetPerTeam) tournament.budgetPerTeam = budgetPerTeam;
        if (squadSizeLimit) tournament.squadSizeLimit = squadSizeLimit;
        if (timerDuration) tournament.timerDuration = timerDuration;

        await tournament.save();
        res.json(tournament);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cascade delete: players → teams → tournament
const deleteTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        await Player.deleteMany({ tournamentId: req.params.id });
        await Team.deleteMany({ tournamentId: req.params.id });
        await Tournament.findByIdAndDelete(req.params.id);

        res.json({ message: 'Tournament deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createTournament, getTournaments, getTournament, updateTournament, deleteTournament };
