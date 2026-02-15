import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/admin';
const baseUrl = apiUrl.replace(/\/member$|\/admin$/, '') || 'http://localhost:5000';

export const api = axios.create({
  baseURL: baseUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

/** Normalisasi nomor Indonesia ke 62xxxxxxxxxx (untuk request ke backend) */
export function normalizePhoneIndonesia(phone: string): string {
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (!p.startsWith('62')) p = '62' + p;
  return p;
}

export const authApi = {
  sendOtp: (phone: string) =>
    api.post<{ success: boolean; message: string; devOtp?: string }>('/api/auth/send-otp', {
      phone: normalizePhoneIndonesia(phone),
    }),
  verifyOtp: (phone: string, otp: string, forAdmin = true) =>
    api.post<{
      success: boolean;
      message: string;
      customToken?: string;
      uid?: string;
    }>('/api/auth/verify-otp', {
      phone: normalizePhoneIndonesia(phone),
      otp,
      forAdmin: true,
      register: true, // Admin login via OTP is now restricted to registration/first time if needed, but we really want password
    }),
  loginWithPassword: (phone: string, password: string) =>
    api.post<{
      success: boolean;
      message: string;
      customToken?: string;
      uid?: string;
    }>('/api/auth/login-with-password', {
      phone: normalizePhoneIndonesia(phone),
      password,
      forAdmin: true,
    }),
};
