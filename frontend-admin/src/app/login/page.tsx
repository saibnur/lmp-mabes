'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, KeyRound, Loader2, ArrowRight, Shield } from 'lucide-react';
import { authApi, normalizePhoneIndonesia } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.loginWithPassword(phone, password);
      if (data.success && data.customToken) {
        const auth = getFirebaseAuth();
        await signInWithCustomToken(auth, data.customToken);
        router.push('/');
        router.refresh();
      } else {
        setError((data as { message?: string }).message || 'Login gagal');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Nomor telepon atau password salah, atau Anda bukan admin';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-md">
        {/* Glow effect */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-navy opacity-20 blur-xl"></div>

        <div className="relative rounded-2xl border border-border-custom bg-surface p-8 shadow-2xl backdrop-blur">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <div className="flex items-center justify-center">
              <div className="relative flex h-20 w-24 overflow-hidden rounded-xl bg-surface-hover p-2 shadow-sm border border-border-custom items-center justify-center">
                <img
                  src="/logo-lmp.svg"
                  alt="LMP Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">Admin LMP Superapp</h1>
            <p className="text-sm text-text-muted">
              Masuk dengan nomor WhatsApp dan password admin
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-foreground">
                Nomor WhatsApp Admin
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border-custom bg-surface-hover py-3 pl-12 pr-4 text-foreground placeholder-text-muted/60 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border-custom bg-surface-hover py-3 pl-12 pr-4 text-foreground placeholder-text-muted/60 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 font-bold text-white shadow-lg shadow-brand-primary/20 transition hover:bg-brand-primary-light disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Masuk...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
