'use client';

interface DashboardHeaderProps {
  title: string;
  profile?: {
    displayName: string | null;
    phoneNumber?: string | null;
    photoURL?: string | null;
  } | null;
}

export default function DashboardHeader({ title, profile }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur-xl md:static md:bg-transparent md:border-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic hidden md:block">
          {title}
        </h1>
        {/* Mobile Title - Only shows if not desktop */}
        <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic md:hidden">
          {title}
        </h1>
        {profile && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {profile.displayName || 'Member'}
              </p>
              {profile.phoneNumber && (
                <p className="text-xs text-slate-500">{profile.phoneNumber}</p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-600">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">
                  {(profile.displayName || 'M').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
