'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AuthProvider } from '@/viewmodels/useAuth';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e293b',
                            color: '#e2e8f0',
                            border: '1px solid #334155',
                        },
                        success: {
                            iconTheme: { primary: '#22c55e', secondary: '#1e293b' },
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
                        },
                    }}
                />
            </AuthProvider>
        </QueryClientProvider>
    );
}
