import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { BeritaArticle } from './types';

const COLLECTION_NAME = 'berita';

/**
 * Buat artikel baru
 */
export async function createArticle(data: Omit<BeritaArticle, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getFirestoreDb();
    const colRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Ambil semua artikel berdasarkan status (default 'published')
 */
export async function getArticles(status: 'published' | 'draft' = 'published', maxLimit = 50) {
    const db = getFirestoreDb();
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(
        colRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(maxLimit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as BeritaArticle[];
}

/**
 * Ambil artikel berdasarkan ID
 */
export async function getArticleById(id: string) {
    const db = getFirestoreDb();
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    } as BeritaArticle;
}

/**
 * Ambil artikel milik user tertentu
 */
export async function getArticlesByAuthor(authorId: string) {
    const db = getFirestoreDb();
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(
        colRef,
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as BeritaArticle[];
}

/**
 * Update artikel
 */
export async function updateArticle(id: string, data: Partial<Omit<BeritaArticle, 'id' | 'createdAt'>>) {
    const db = getFirestoreDb();
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Hapus artikel
 */
export async function deleteArticle(id: string) {
    const db = getFirestoreDb();
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
}
