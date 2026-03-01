import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Inisialisasi Firebase Admin SDK (lazy, singleton).
 * Menggunakan FIREBASE_SERVICE_ACCOUNT_JSON di env (JSON string).
 */
function getAdminDb() {
    let app: App;
    if (getApps().length === 0) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccount) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env variable is not set');
        }
        app = initializeApp({
            credential: cert(JSON.parse(serviceAccount)),
        });
    } else {
        app = getApps()[0] as App;
    }
    return getFirestore(app);
}

const COLLECTION = 'config';
const DOC_ID = 'kta';

/**
 * POST /api/kta-config
 * Simpan KtaCardConfig ke Firestore: config/kta
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid config payload' }, { status: 400 });
        }

        const db = getAdminDb();
        const payload = { ...body, _updatedAt: new Date().toISOString() };
        await db.collection(COLLECTION).doc(DOC_ID).set(payload);

        return NextResponse.json({
            success: true,
            message: 'Config berhasil disimpan ke Firestore',
            updatedAt: payload._updatedAt,
        });
    } catch (error) {
        console.error('[kta-config POST]', error);
        return NextResponse.json(
            { error: 'Gagal menyimpan config', detail: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/kta-config
 * Baca KtaCardConfig dari Firestore: config/kta
 */
export async function GET() {
    try {
        const db = getAdminDb();
        const snap = await db.collection(COLLECTION).doc(DOC_ID).get();
        if (!snap.exists) {
            return NextResponse.json({ error: 'Config tidak ditemukan' }, { status: 404 });
        }
        return NextResponse.json(snap.data());
    } catch (error) {
        console.error('[kta-config GET]', error);
        return NextResponse.json(
            { error: 'Gagal membaca config', detail: String(error) },
            { status: 500 }
        );
    }
}
