import { apiClient } from './client';
import { normalizePhoneIndonesia } from '@/lib/utils';
import type { OtpResponse, VerifyOtpResponse, LoginResponse, ApiResponse } from '@/lib/types';

export const authApi = {
    sendOtp: (phone: string) =>
        apiClient.post<OtpResponse>('/api/auth/send-otp', {
            phone: normalizePhoneIndonesia(phone),
        }),

    verifyOtp: (phone: string, otp: string, forAdmin = false, register = true) =>
        apiClient.post<VerifyOtpResponse>('/api/auth/verify-otp', {
            phone: normalizePhoneIndonesia(phone),
            otp,
            forAdmin,
            register,
        }),

    setPassword: (idToken: string, password: string) =>
        apiClient.post<ApiResponse>('/api/auth/set-password', { password }, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),

    loginWithPassword: (phone: string, password: string) =>
        apiClient.post<LoginResponse>('/api/auth/login-with-password', {
            phone: normalizePhoneIndonesia(phone),
            password,
        }),

    ensureUser: (idToken: string) =>
        apiClient.post<ApiResponse>('/api/auth/ensure-user', {}, {
            headers: { Authorization: `Bearer ${idToken}` },
        }),
};
