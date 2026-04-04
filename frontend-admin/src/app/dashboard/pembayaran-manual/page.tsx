'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PembayaranManualPage from '@/features/pembayaran/PembayaranManualPage';
import { getFirebaseAuth } from '@/lib/firebase';

const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'midtrans';

export default function PembayaranManualRoute() {
    const router = useRouter();
    const [idToken, setIdToken] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Redirect jika mode bukan manual
        if (PAYMENT_MODE !== 'manual') {
            router.replace('/dashboard');
            return;
        }

        // Ambil ID token dari auth
        const auth = getFirebaseAuth();
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                router.replace('/login');
                return;
            }
            const token = await user.getIdToken();
            setIdToken(token);
            setReady(true);
        });

        return () => unsub();
    }, [router]);

    if (!ready || !idToken) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    return <PembayaranManualPage idToken={idToken} />;
}
