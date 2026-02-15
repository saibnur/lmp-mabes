'use client';

import { usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { UserProfileProvider, useUserProfile } from '@/components/dashboard/UserProfileProvider';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Member',
  '/dashboard/profil': 'Edit Profil',
  '/dashboard/pembayaran': 'Pembayaran',
};

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Member';
  const { profile } = useUserProfile();
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
      <div className="flex flex-1 flex-col pt-16 md:pt-0 md:ml-64 relative min-h-screen">
        <DashboardHeader title={title} profile={headerProfile} />
        <main className="flex-1 px-4 md:px-8 pb-32 md:pb-12">{children}</main>
      </div>
    </>
  );
}

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <UserProfileProvider>
      <div className="flex min-h-screen bg-slate-50">
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </div>
    </UserProfileProvider>
  );
}
