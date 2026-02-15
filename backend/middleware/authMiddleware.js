const { getAuth } = require('../config/firebase');

/**
 * Middleware to verify Firebase ID Token
 */
exports.verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'ID Token tidak ditemukan' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        req.uid = decodedToken.uid;
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(401).json({ success: false, message: 'ID Token tidak valid' });
    }
};
