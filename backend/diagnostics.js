const { getFirestore } = require('./config/firebase');

async function runDiagnostics() {
    const db = getFirestore();
    console.log('--- FIRESTORE DATA DIAGNOSTICS ---');

    const types = ['provinces', 'regencies', 'districts', 'villages'];

    for (const type of types) {
        try {
            const snapshot = await db.collection(type).count().get();
            console.log(`Total ${type}: ${snapshot.data().count}`);

            // Sample check for non-Aceh/Sumut (Aceh: 11, Sumut: 12)
            if (type !== 'provinces') {
                const parentField = type === 'regencies' ? 'province_id' :
                    type === 'districts' ? 'regency_id' : 'district_id';

                // Let's check for Jabar (Province 32)
                if (type === 'regencies') {
                    const jabarRegencies = await db.collection('regencies').where('province_id', '==', '32').count().get();
                    console.log(`  - Regencies in Jabar (32): ${jabarRegencies.data().count}`);
                }
            }
        } catch (err) {
            console.error(`Error counting ${type}:`, err.message);
        }
    }

    console.log('\n--- SAMPLE DATA CHECK ---');
    const samples = [
        { type: 'provinces', id: '31', name: 'DKI JAKARTA' },
        { type: 'provinces', id: '32', name: 'JAWA BARAT' },
        { type: 'provinces', id: '35', name: 'JAWA TIMUR' }
    ];

    for (const s of samples) {
        const doc = await db.collection('provinces').doc(s.id).get();
        console.log(`${s.name} (${s.id}): ${doc.exists ? 'EXISTS' : 'MISSING'}`);
    }

    process.exit(0);
}

runDiagnostics();
