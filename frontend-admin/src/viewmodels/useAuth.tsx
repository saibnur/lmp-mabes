'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

interface AuthState {
    user: User | null;
    idToken: string | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
    user: null,
    idToken: null,
    loading: true,
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [idToken, setIdToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getFirebaseAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const token = await firebaseUser.getIdToken();
                setIdToken(token);
            } else {
                setUser(null);
                setIdToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Refresh token every 50 minutes
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(async () => {
            const token = await user.getIdToken(true);
            setIdToken(token);
        }, 50 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    const logout = useCallback(async () => {
        const auth = getFirebaseAuth();
        await signOut(auth);
        setUser(null);
        setIdToken(null);
    }, []);

    return (
        <AuthContext.Provider value= {{ user, idToken, loading, logout }
}>
    { children }
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
    return useContext(AuthContext);
}
