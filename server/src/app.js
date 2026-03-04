const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments');
const teamRoutes = require('./routes/teams');
const playerRoutes = require('./routes/players');
const playerSearchRoute = require('./routes/playerSearch');
const teamSearchRoute = require('./routes/teamSearch');

// Pre-warm club cache so the first autocomplete request is instant
setTimeout(() => {
    fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/team-search?q=pre')
        .catch(() => { }); // fire and forget, ignore errors
}, 3000);


const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/tournaments/:tournamentId/teams', teamRoutes);
app.use('/api/tournaments/:tournamentId/players', playerRoutes);
app.use('/api/player-search', playerSearchRoute);
app.use('/api/team-search', teamSearchRoute);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
