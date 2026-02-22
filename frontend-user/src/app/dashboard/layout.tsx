import AuthGuard from '@/features/dashboard/components/AuthGuard';
import DashboardLayoutClient from './DashboardLayoutClient';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </AuthGuard>
  );
}
