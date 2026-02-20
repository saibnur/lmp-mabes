'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, KeyRound, Loader2, ArrowRight, Lock } from 'lucide-react';
import { authApi, normalizePhoneIndonesia } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import Toast from '@/components/Toast';
import { useUserProfile } from '@/components/dashboard/UserProfileProvider';

export default function DaftarPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const { profile, loading: profileLoading } = useUserProfile();

  useEffect(() => {
    if (!profileLoading && profile) {
      if (profile.hasPassword) {
        router.replace('/dashboard');
      } else {
        setStep('password');
      }
    }
  }, [profile, profileLoading, router]);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const showOtpToast = () => {
    setToast(true);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.sendOtp(phone);
      if (data.success) {
        setStep('otp');
        setDevOtp(data.devOtp ?? null);
        startCountdown();
        showOtpToast();
      } else {
        setError((data as { message?: string }).message || 'Gagal mengirim OTP');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengirim OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(phone, otp, false, true);
      if (data.success && data.customToken) {
        const auth = getFirebaseAuth();
        await signInWithCustomToken(auth, data.customToken);
        if (data.needsPassword) {
          setStep('password');
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        setError((data as { message?: string }).message || 'Verifikasi gagal');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Kode OTP tidak valid';
      if (msg.includes('sudah terdaftar')) {
        setError(msg);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi tidak sama');
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        router.replace('/daftar');
        return;
      }
      const idToken = await user.getIdToken();
      await authApi.setPassword(idToken, password);
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal menyimpan. Coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_#fef2f2_0%,_transparent_50%,_#fef2f2_100%)] opacity-60" />
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-red-600">Daftar Anggota</h1>
            <p className="mt-2 text-sm text-slate-600">
              {step === 'phone' && 'Masukkan nomor WhatsApp untuk mendaftar'}
              {step === 'otp' && 'Masukkan kode OTP yang dikirim ke WhatsApp Anda'}
              {step === 'password' && 'Buat password untuk akun Anda'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Kirim OTP
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {devOtp && (
                <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Dev: OTP = <strong>{devOtp}</strong>
                </div>
              )}
              <div>
                <label htmlFor="otp" className="mb-2 block text-sm font-medium text-slate-700">
                  Kode OTP (6 digit)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-center text-lg tracking-[0.5em] text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Verifikasi
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setDevOtp(null);
                  }}
                  className="text-slate-600 underline transition hover:text-red-600"
                >
                  Ganti nomor
                </button>
                {countdown > 0 ? (
                  <span className="text-slate-500">Kirim ulang ({countdown}s)</span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setError('');
                      setLoading(true);
                      try {
                        const { data } = await authApi.sendOtp(phone);
                        if (data.success) {
                          setDevOtp(data.devOtp ?? null);
                          startCountdown();
                          showOtpToast();
                        }
                      } catch {
                        setError('Gagal mengirim ulang OTP');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="text-red-600 underline transition hover:text-red-700 disabled:opacity-50"
                  >
                    Kirim ulang
                  </button>
                )}
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password (min. 6 karakter)
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-slate-700">
                  Konfirmasi Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Daftar & Masuk
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-red-600 hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
      <Toast
        message="OTP telah dikirim ke WhatsApp Anda"
        visible={toast}
        onClose={() => setToast(false)}
        duration={3000}
      />
    </div>
  );
}
