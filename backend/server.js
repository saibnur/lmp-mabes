require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: izinkan frontend User (3000) dan Admin (3001) serta domain vercel
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight
app.options('(.*)', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes (shared: /api/auth)
let authRoutes;
try {
  authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('[LMP Backend] Auth routes mounted at /api/auth');
} catch (err) {
  console.error('[LMP Backend] Failed to load auth routes:', err.message);
}

// Payment routes
let paymentRoutes;
try {
  paymentRoutes = require('./routes/paymentRoutes');
  app.use('/api/payment', paymentRoutes);
  console.log('[LMP Backend] Payment routes mounted at /api/payment');
} catch (err) {
  console.error('[LMP Backend] Failed to load payment routes:', err.message);
}

// Member routes
let memberRoutes;
try {
  memberRoutes = require('./routes/memberRoutes');
  app.use('/api/members', memberRoutes);
  console.log('[LMP Backend] Member routes mounted at /api/members');
} catch (err) {
  console.error('[LMP Backend] Failed to load member routes:', err.message);
}

// Media routes
let mediaRoutes;
try {
  mediaRoutes = require('./routes/mediaRoutes');
  app.use('/api/media', mediaRoutes);
  console.log('[LMP Backend] Media routes mounted at /api/media');
} catch (err) {
  console.error('[LMP Backend] Failed to load media routes:', err.message);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'LMP Backend is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// TODO: mount routes (e.g. /member, /admin, /webhook)

// 404 fallback (untuk debug)
app.use((req, res) => {
  console.log('[LMP Backend] 404:', req.method, req.path);
  res.status(404).json({ success: false, message: 'Not found', path: req.path });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LMP Backend] Server running on http://localhost:${PORT}`);
  console.log(`[LMP Backend] Health: http://localhost:${PORT}/health`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
