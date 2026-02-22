'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useUserProfile } from '@/app/components/dashboard/UserProfileProvider';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useUserProfile();

  useEffect(() => {
    if (!loading && profile && profile.hasPassword === false) {
      router.replace('/daftar');
    }
  }, [profile, loading, router]);

  return (
    <>
      {children}
    </>
  );
}

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayoutInner>{children}</DashboardLayoutInner>
  );
}
