'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /dashboard/profil is no longer used.
 * The unified profil page is at /daftar/profil (works as both registration AND edit mode).
 */
export default function DashboardProfilRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/daftar/profil');
  }, [router]);

  return null;
}
