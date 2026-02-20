import { useState, useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [idToken, setIdToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getFirebaseAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                setUid(user.uid);
                const token = await user.getIdToken();
                setIdToken(token);
            } else {
                setUser(null);
                setUid(null);
                setIdToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, uid, idToken, loading };
}
