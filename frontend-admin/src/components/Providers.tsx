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
                    position="bottom-center"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#0f172a', /* border-slate-900 */
                            color: '#ffffff',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: '500',
                            borderRadius: '0.75rem',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                            border: 'none',
                        },
                        success: {
                            iconTheme: { primary: '#10b981', secondary: '#ffffff' },
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
                        },
                    }}
                />
            </AuthProvider>
        </QueryClientProvider>
    );
}
