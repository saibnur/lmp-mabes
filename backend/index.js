require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getFirebaseAdmin, admin } = require('./config/firebase');

const app = express();

// --- 1. PRE-INITIALIZE FIREBASE ---
// Kita inisialisasi di awal agar error terdeteksi sejak startup
getFirebaseAdmin();

// --- 2. KONFIGURASI CORS ---
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://lmp-user.vercel.app',
    'https://lmp-admin.vercel.app',
    /\.vercel\.app$/,        // Production Preview Branches
    /\.lovable\.app$/        // Lovable Editor
];

app.use(cors({
    origin: (origin, callback) => {
        // Izinkan request tanpa origin (seperti Postman)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(o =>
            typeof o === 'string' ? o === origin : o.test(origin)
        );

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn('[CORS] Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Preflight untuk semua route
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 3. MOUNTING ROUTES ---
// Import routers
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/paymentRoutes');
const memberRoutes = require('./routes/memberRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount routers strictly after middleware
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

console.log('[Backend] All routes mounted successfully including Admin Dashboard');

// --- 4. HEALTH CHECK ---
app.get('/health', (req, res) => {
    res.json({
        ok: true,
        message: 'LMP Backend (Vercel) stands ready',
        firebase: admin.apps.length > 0 ? 'connected' : 'error',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send('Backend LMP Mabes Berjalan di Vercel!');
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global Error]:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;