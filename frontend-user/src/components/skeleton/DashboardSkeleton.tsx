'use client';

export default function DashboardSkeleton() {
    return (
        <div className="animate-pulse space-y-6 p-6">
            {/* Header skeleton */}
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-200" />
                <div className="space-y-2">
                    <div className="h-5 w-40 rounded bg-slate-200" />
                    <div className="h-4 w-28 rounded bg-slate-200" />
                </div>
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6">
                        <div className="mb-4 h-10 w-10 rounded-full bg-slate-200" />
                        <div className="mb-2 h-4 w-24 rounded bg-slate-200" />
                        <div className="h-6 w-16 rounded bg-slate-200" />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6">
                <div className="mb-4 h-5 w-32 rounded bg-slate-200" />
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-4 w-full rounded bg-slate-200" />
                    ))}
                </div>
            </div>
        </div>
    );
}
