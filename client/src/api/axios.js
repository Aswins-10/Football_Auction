import axios from 'axios';
import API_BASE from '../config/api';

const api = axios.create({
    baseURL: `${API_BASE}/api`,
    withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally and network errors gracefully
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (!err.response) {
            // Network Error (Server might be down or waking up from cold start on Render)
            console.error('Network Error: API might be unavailable.');
            alert('Cannot reach the server. It might be warming up. Please try again in a few seconds.');
        } else if (err.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
