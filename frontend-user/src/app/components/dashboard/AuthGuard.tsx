'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUserProfile } from './UserProfileProvider';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, loading, uid } = useUserProfile();

  useEffect(() => {
    if (!loading) {
      if (!uid) {
        router.replace('/login');
      } else if (profile && profile.hasPassword === false) {
        router.replace('/daftar');
      }
    }
  }, [profile, loading, uid, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (!uid || (profile && profile.hasPassword === false)) {
    return null;
  }

  return <>{children}</>;
}
