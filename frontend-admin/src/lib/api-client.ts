import axios from 'axios';

/**
 * Standard API Client for LMP Admin Dashboard.
 */

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const baseURL = rawBaseUrl.replace(/\/$/, '');

export const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('[Admin API Error]:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
