'use client';

export default function BeritaSkeleton() {
    return (
        <div className="animate-pulse space-y-8 px-4 py-8 md:px-8 lg:px-12">
            {/* Title skeleton */}
            <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-48 rounded bg-slate-200" />
                <div className="mx-auto h-4 w-64 rounded bg-slate-200" />
            </div>

            {/* News cards skeleton */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                        <div className="h-48 w-full bg-slate-200" />
                        <div className="space-y-3 p-5">
                            <div className="h-3 w-20 rounded bg-slate-200" />
                            <div className="h-5 w-full rounded bg-slate-200" />
                            <div className="space-y-2">
                                <div className="h-3 w-full rounded bg-slate-200" />
                                <div className="h-3 w-3/4 rounded bg-slate-200" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
