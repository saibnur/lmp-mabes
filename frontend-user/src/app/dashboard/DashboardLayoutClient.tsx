'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserProfile } from '@/components/dashboard/UserProfileProvider';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Member',
  '/dashboard/profil': 'Edit Profil',
  '/dashboard/pembayaran': 'Pembayaran',
};

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useUserProfile();

  useEffect(() => {
    if (!loading && profile && profile.hasPassword === false) {
      router.replace('/daftar');
    }
  }, [profile, loading, router]);

  const title = PAGE_TITLES[pathname] ?? 'Member';
  const headerProfile = profile
    ? {
      displayName: profile.displayName,
      phoneNumber: profile.phoneNumber || profile.phone,
      photoURL: profile.photoURL,
    }
    : null;

  return (
    <>
      <DashboardSidebar />
      <div className="flex flex-1 flex-col lg:pt-0 lg:ml-64 relative min-h-screen">
        <DashboardHeader title={title} profile={headerProfile} />
        <main className="flex-1 px-4 lg:px-8 pb-32 lg:pb-12">{children}</main>
      </div>
    </>
  );
}

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </div>
  );
}
