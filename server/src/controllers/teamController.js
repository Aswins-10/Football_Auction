const Team = require('../models/Team');
const Tournament = require('../models/Tournament');

const createTeam = async (req, res) => {
    try {
        const { name, logo } = req.body;
        const tournament = await Tournament.findById(req.params.tournamentId);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        const existingCount = await Team.countDocuments({ tournamentId: req.params.tournamentId });
        if (existingCount >= tournament.totalSlots)
            return res.status(400).json({ message: 'Team slots full' });

        const team = await Team.create({
            tournamentId: req.params.tournamentId,
            name,
            logo: logo || '',
            budgetRemaining: tournament.budgetPerTeam,
        });
        res.status(201).json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getTeams = async (req, res) => {
    try {
        const teams = await Team.find({ tournamentId: req.params.tournamentId })
            .populate('assignedUserId', 'username email')
            .populate('pendingUserId', 'username email');
        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const requestTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (team.assignedUserId) return res.status(400).json({ message: 'Team already taken' });
        if (team.pendingUserId) return res.status(400).json({ message: 'Team already has pending request' });

        const alreadyRequested = await Team.findOne({
            tournamentId: team.tournamentId,
            $or: [{ assignedUserId: req.user._id }, { pendingUserId: req.user._id }],
        });
        if (alreadyRequested) return res.status(400).json({ message: 'You already have a team or pending request in this tournament' });

        team.pendingUserId = req.user._id;
        await team.save();
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const approveTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });
        if (!team.pendingUserId) return res.status(400).json({ message: 'No pending request' });

        team.assignedUserId = team.pendingUserId;
        team.pendingUserId = null;
        await team.save();
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const rejectTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });
        team.pendingUserId = null;
        await team.save();
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get team for a specific user in a tournament
const getMyTeam = async (req, res) => {
    try {
        const team = await Team.findOne({
            tournamentId: req.params.tournamentId,
            assignedUserId: req.user._id,
        });
        res.json(team || null);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addBudget = async (req, res) => {
    try {
        const { amount } = req.body;
        if (amount === undefined || amount === null || isNaN(amount) || Number(amount) === 0)
            return res.status(400).json({ message: 'Provide a valid non-zero amount' });

        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        const newBudget = team.budgetRemaining + Number(amount);
        if (newBudget < 0)
            return res.status(400).json({ message: `Cannot reduce below 0. Team only has ${team.budgetRemaining}M remaining.` });

        team.budgetRemaining = newBudget;
        await team.save();
        res.json(team);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createTeam, getTeams, requestTeam, approveTeam, rejectTeam, getMyTeam, addBudget };
