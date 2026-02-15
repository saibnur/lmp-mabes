import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/member';
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
  verifyOtp: (
    phone: string,
    otp: string,
    forAdmin = false,
    register = true
  ) =>
    api.post<{
      success: boolean;
      message: string;
      customToken?: string;
      uid?: string;
      needsPassword?: boolean;
    }>('/api/auth/verify-otp', {
      phone: normalizePhoneIndonesia(phone),
      otp,
      forAdmin,
      register,
    }),
  setPassword: (idToken: string, password: string) =>
    api.post<{ success: boolean; message: string }>('/api/auth/set-password', { password }, {
      headers: { Authorization: `Bearer ${idToken}` },
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
    }),
  ensureUser: (idToken: string) =>
    api.post<{ success: boolean }>('/api/auth/ensure-user', {}, {
      headers: { Authorization: `Bearer ${idToken}` },
    }),
};

export const paymentApi = {
  createTransaction: (idToken: string) =>
    api.post<{ success: boolean; token: string; redirect_url: string }>('/api/payment/create-transaction', {}, {
      headers: { Authorization: `Bearer ${idToken}` },
    }),
};

export const memberApi = {
  getRegions: (type: 'provinces' | 'regencies' | 'districts' | 'villages', parentId?: string) =>
    api.get<{ success: boolean; data: { id: string; name: string }[] }>('/api/members/regions', {
      params: { type, parent_id: parentId },
    }),
  updateProfile: (idToken: string, data: any) =>
    api.post<{ success: boolean; message: string; data: any }>('/api/members/update-profile', data, {
      headers: { Authorization: `Bearer ${idToken}` },
    }),
};

export const mediaApi = {
  getSignUpload: (idToken: string, folder = 'members') =>
    api.get<{
      success: boolean;
      signature: string;
      timestamp: number;
      cloud_name: string;
      api_key: string;
      upload_preset: string;
    }>('/api/media/sign-upload', {
      params: { folder },
      headers: { Authorization: `Bearer ${idToken}` },
    }),
};
