const { getFirestore } = require('./config/firebase');
const db = getFirestore();

async function test() {
    try {
        const snapshot = await db.collection('berita').limit(1).get();
        console.log('Successfully connected to Firestore');
        console.log('Berita count (limit 1):', snapshot.size);
    } catch (err) {
        console.error('Firestore connection error:', err);
    }
}

test();
