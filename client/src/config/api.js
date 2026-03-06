const API_BASE = import.meta.env.VITE_API_URL;

export const API_ENDPOINTS = {
    login: `${API_BASE}/api/auth/login`,
    signup: `${API_BASE}/api/auth/register`,
    tournaments: `${API_BASE}/api/tournaments`,
    authMe: `${API_BASE}/api/auth/me`,
    teams: `${API_BASE}/api/teams`,
    players: `${API_BASE}/api/players`,
    playerSearch: `${API_BASE}/api/player-search`
};

export default API_BASE;
