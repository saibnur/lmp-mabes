// hooks/useKtaPreview.ts
'use client';

import { useState, useEffect } from 'react';
import type { Member } from '@/models/member.types';
import { KtaCardConfig, DEFAULT_KTA_CONFIG } from '@/features/kta/types/KtaCardConfig';

export function useKtaPreview() {
    const [previewMember, setPreviewMember] = useState<Member | null>(null);
    const [ktaConfig, setKtaConfig] = useState<KtaCardConfig>(DEFAULT_KTA_CONFIG);

    useEffect(() => {
        let cancelled = false;

        fetch('/api/kta-config')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data: KtaCardConfig) => {
                if (!cancelled) setKtaConfig(prev => ({ ...prev, ...data }));
            })
            .catch(() => {
                if (!cancelled) setKtaConfig(DEFAULT_KTA_CONFIG);
            });

        return () => { cancelled = true; };
    }, []);

    return {
        previewMember,
        setPreviewMember,
        ktaConfig,
        openPreview: (m: Member) => setPreviewMember(m),
        closePreview: () => setPreviewMember(null),
    };
}