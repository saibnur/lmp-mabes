const { getAuth, getFirestore } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Middleware to verify Firebase ID Token AND check admin role.
 */
exports.verifyAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'ID Token tidak ditemukan' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        req.uid = decodedToken.uid;
        req.user = decodedToken;

        // Check admin role in Firestore
        const db = getFirestore();
        const userDoc = await db.collection('users').doc(req.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Anda bukan admin.',
            });
        }

        next();
    } catch (error) {
        console.error('[AdminMiddleware] Error:', error);
        return res.status(401).json({ success: false, message: 'ID Token tidak valid' });
    }
};
