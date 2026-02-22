import axios from 'axios';

/**
 * API Client standard untuk LMP Superapp.
 * Secara otomatis menggunakan NEXT_PUBLIC_API_URL sebagai base.
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
        console.error('[API Error]:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
