import AuthGuard from '@/components/dashboard/AuthGuard';
import DashboardLayoutClient from './DashboardLayoutClient';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <AuthGuard>
    <DashboardLayoutClient>{children}</DashboardLayoutClient>
    // </AuthGuard>
  );
}
