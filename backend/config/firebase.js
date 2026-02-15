const admin = require('firebase-admin');
const path = require('path');

let initialized = false;

function getFirebaseAdmin() {
  if (!initialized) {
    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
    const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
    const serviceAccount = require(resolvedPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
  }
  return admin;
}

function getAuth() {
  return getFirebaseAdmin().auth();
}

function getFirestore() {
  return getFirebaseAdmin().firestore();
}

module.exports = {
  getFirebaseAdmin,
  getAuth,
  getFirestore,
};
