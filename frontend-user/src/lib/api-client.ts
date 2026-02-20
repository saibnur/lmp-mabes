import axios from 'axios';

/**
 * API Client standard untuk LMP Superapp.
 * Secara otomatis menggunakan NEXT_PUBLIC_API_URL sebagai base.
 */

// Normalisasi URL: pastikan tidak ada double slash atau trailing slash yang salah
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Jika URL mengandung /api/auth atau sejenisnya, bersihkan ke root API path jika perlu.
// Namun biasanya kita ingin root-nya adalah base path API.
const baseURL = rawBaseUrl.replace(/\/$/, '');

export const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Interceptor untuk logging/debugging (optional)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('[API Error]:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
