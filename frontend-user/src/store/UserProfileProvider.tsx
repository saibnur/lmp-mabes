'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase';

export interface UserProfile {
  displayName: string | null;
  phoneNumber?: string | null;
  phone?: string | null;
  role?: string;
  status?: string;
  membershipStatus?: 'pending' | 'active' | 'expired';
  email?: string | null;
  photoURL?: string | null;
  nik?: string;
  no_kta?: string;
  ktpURL?: string;
  hasPassword?: boolean;
  profileComplete?: boolean;
  isPaid?: boolean;
  registrationDate?: Date | null;
  membershipExpiry?: Date | null;
  organization?: {
    province_id: string;
    province_name: string;
    regency_id: string;
    regency_name: string;
    district_id: string;
    district_name: string;
    village_id: string;
    village_name: string;
    level?: string;
  };
}

const UserProfileContext = createContext<{
  profile: UserProfile | null;
  uid: string | null;
  loading: boolean;
  providerId: string | null;
}>({ profile: null, uid: null, loading: true, providerId: null });

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used inside UserProfileProvider');
  return ctx;
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubSnapRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubAuth = auth.onAuthStateChanged((user) => {
      unsubSnapRef.current?.();
      unsubSnapRef.current = null;
      if (!user) {
        setUid(null);
        setProviderId(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUid(user.uid);
      setProviderId(user.providerData[0]?.providerId || null);
      const db = getFirestoreDb();
      const ref = doc(db, 'users', user.uid);
      unsubSnapRef.current = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            const toDate = (ts: any) => {
              if (!ts) return null;
              if (typeof ts.toDate === 'function') return ts.toDate();
              if (ts instanceof Date) return ts;
              return null;
            };
            setProfile({
              displayName: d.displayName ?? null,
              phoneNumber: d.phoneNumber ?? d.phone ?? null,
              phone: d.phone ?? d.phoneNumber ?? null,
              role: d.role ?? 'member',
              status: d.status ?? 'active',
              membershipStatus: d.membershipStatus ?? 'pending',
              email: d.email ?? null,
              photoURL: d.photoURL ?? null,
              nik: d.nik,
              no_kta: d.no_kta,
              ktpURL: d.ktpURL,
              hasPassword: d.hasPassword ?? false,
              profileComplete: d.profileComplete ?? false,
              isPaid: d.isPaid ?? false,
              registrationDate: toDate(d.registrationDate),
              membershipExpiry: toDate(d.membershipExpiry),
              organization: d.organization,
            });
          } else {
            setProfile({
              displayName: null,
              phoneNumber: null,
              role: 'member',
              status: 'active',
              membershipStatus: 'pending',
              hasPassword: false,
              isPaid: false,
            });
          }
          setLoading(false);
        },
        () => {
          setProfile(null);
          setLoading(false);
        }
      );
    });
    return () => {
      unsubAuth();
      unsubSnapRef.current?.();
    };
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, uid, loading, providerId }}>
      {children}
    </UserProfileContext.Provider>
  );
}
