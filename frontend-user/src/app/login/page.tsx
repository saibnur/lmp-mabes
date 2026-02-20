'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { authApi, normalizePhoneIndonesia } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import { signInWithCustomToken, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useUserProfile } from '@/components/dashboard/UserProfileProvider';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { profile, loading: profileLoading } = useUserProfile();

  useEffect(() => {
    if (!profileLoading && profile) {
      if (profile.hasPassword) {
        router.replace('/dashboard');
      } else {
        router.replace('/daftar');
      }
    }
  }, [profile, profileLoading, router]);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      const user = auth.currentUser;
      if (!user) throw new Error('Login gagal');
      const idToken = await user.getIdToken();
      await authApi.ensureUser(idToken);
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal masuk dengan Google';
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.loginWithPassword(phone, password);
      if (data.success && data.customToken) {
        const auth = getFirebaseAuth();
        await signInWithCustomToken(auth, data.customToken);
        router.push('/dashboard');
        router.refresh();
      } else {
        setError((data as { message?: string }).message || 'Login gagal');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Nomor telepon atau password salah';
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
            <h1 className="text-2xl font-bold tracking-tight text-red-600">Masuk</h1>
            <p className="mt-2 text-sm text-slate-600">
              Masuk dengan nomor WA dan password Anda
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Masuk...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-white px-2 text-slate-500">atau</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-700 transition hover:border-red-300 hover:bg-red-50/50 disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Masuk dengan Google
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Belum punya akun?{' '}
            <Link href="/daftar" className="font-semibold text-red-600 hover:underline">
              Daftar Anggota
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
