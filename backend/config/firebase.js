const admin = require('firebase-admin');
const path = require('path');

/**
 * Inisialisasi Firebase Admin SDK secara aman untuk lingkungan Serverless (Vercel).
 * Membaca dari environment variable FIREBASE_SERVICE_ACCOUNT (JSON string) 
 * atau fallback ke file lokal serviceAccountKey.json (Development).
 */
function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    try {
      let serviceAccount;

      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Parse JSON dari environment variable
        try {
          const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
          // Jika dibungkus kutip (terkadang terjadi di Vercel), bersihkan
          const cleanJson = rawJson.startsWith('"') && rawJson.endsWith('"')
            ? JSON.parse(rawJson)
            : rawJson;

          serviceAccount = typeof cleanJson === 'string' ? JSON.parse(cleanJson) : cleanJson;

          // Fix private_key: ganti literal \n dengan real newline
          if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
          }
          console.log('[Firebase] Parsed service account successfully');
        } catch (parseError) {
          console.error('[Firebase] JSON Parse Error:', parseError.message);
          // Cek jika kontennya adalah base64
          try {
            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString();
            serviceAccount = JSON.parse(decoded);
            if (serviceAccount.private_key) {
              serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            console.log('[Firebase] Initialized using base64 FIREBASE_SERVICE_ACCOUNT');
          } catch (base64Error) {
            console.error('[Firebase] Base64 Decode Error:', base64Error.message);
            throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON or Base64');
          }
        }
      } else {
        // Fallback untuk local development
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
        const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
        serviceAccount = require(resolvedPath);
        console.log('[Firebase] Initialized using local file:', serviceAccountPath);
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error) {
      console.error('[Firebase] Critical! Firebase Admin initialization failed:', error.message);
      // Kita biarkan app tetap berjalan agar health check bisa melaporkan error, 
      // tapi fungsi yang butuh auth akan gagal.
    }
  }
  return admin;
}

const getAuth = () => getFirebaseAdmin().auth();
const getFirestore = () => getFirebaseAdmin().firestore();

module.exports = {
  getFirebaseAdmin,
  getAuth,
  getFirestore,
  admin // Export admin untuk akses FieldValue dsb
};
