const express = require('express');
const router = express.Router();

/**
 * GET /api/player-search?q=messi
 * Proxies TheSportsDB (free, no API key) to search football players.
 * Returns: [{ name, image, nationality, position, team }]
 */
router.get('/', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return res.json([]);

    try {
        const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(q)}`;
        const response = await fetch(url);
        if (!response.ok) return res.json([]);

        const data = await response.json();
        if (!data.player) return res.json([]);

        // Filter to football (Soccer) players only and cap at 8 results
        const footballPlayers = data.player
            .filter(p => p.strSport === 'Soccer')
            .slice(0, 8)
            .map(p => ({
                name: p.strPlayer,
                image: p.strThumb || p.strCutout || null,
                nationality: p.strNationality || '',
                position: p.strPosition || '',
                team: p.strTeam || '',
            }));

        res.json(footballPlayers);
    } catch (err) {
        console.error('Player search error:', err.message);
        res.json([]);
    }
});

module.exports = router;
