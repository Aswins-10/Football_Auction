const express = require('express');
const router = express.Router();

// ── In-memory cache ──────────────────────────────────────────────────────────
let cachedTeams = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Use league NAME endpoint — this works on the free tier (key=3)
// Endpoint: search_all_teams.php?l=<League Name>
const LEAGUES = [
    'English Premier League',
    'Spanish La Liga',
    'German Bundesliga',
    'Italian Serie A',
    'French Ligue 1',
    'UEFA Champions League',
    'Dutch Eredivisie',
    'Portuguese Primeira Liga',
    'Turkish Super Lig',
    'English League Championship',
];

async function fetchAllClubs() {
    const results = [];
    for (const league of LEAGUES) {
        try {
            const url = `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(league)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.teams) continue;

            for (const t of data.teams) {
                if (t.strSport !== 'Soccer') continue;
                results.push({
                    name: t.strTeam,
                    // strBadge is the correct field — NOT strTeamBadge
                    logo: t.strBadge || t.strLogo || null,
                    country: t.strCountry || '',
                    league: t.strLeague || league,
                });
            }
        } catch (err) {
            console.error(`Team search: failed to fetch "${league}":`, err.message);
        }
    }

    // Deduplicate by name
    const seen = new Set();
    return results.filter(t => {
        if (seen.has(t.name)) return false;
        seen.add(t.name);
        return true;
    });
}

/**
 * GET /api/team-search?q=city
 * Returns clubs whose name includes the query (case-insensitive substring match).
 */
router.get('/', async (req, res) => {
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q || q.length < 2) return res.json([]);

    // Refresh cache if stale
    if (!cachedTeams.length || Date.now() - cacheTimestamp > CACHE_TTL_MS) {
        console.log('[TeamSearch] Refreshing club cache from TheSportsDB...');
        try {
            const freshClubs = await fetchAllClubs();

            if (freshClubs.length > 0) {
                cachedTeams = freshClubs;
                cacheTimestamp = Date.now();
                console.log(`[TeamSearch] Cached ${cachedTeams.length} clubs.`);
            } else if (cachedTeams.length > 0) {
                console.warn('[TeamSearch] Upstream API returned 0 results. Falling back to stale cache.');
                cacheTimestamp = Date.now(); // Reset TTL to prevent immediate spamming
            }
        } catch (err) {
            console.error('[TeamSearch] Critical TheSportsDB fetch error:', err.message);
            if (cachedTeams.length > 0) {
                console.warn('[TeamSearch] Falling back to stale cache due to network error.');
                cacheTimestamp = Date.now();
            }
            // If no cache exists yet, we just serve an empty array this time
        }
    }

    const filtered = cachedTeams
        .filter(t => t.name.toLowerCase().includes(q))
        .slice(0, 10);

    res.json(filtered);
});

module.exports = router;
