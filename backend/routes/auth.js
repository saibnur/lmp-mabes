const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { getFirestore, getAuth } = require('../config/firebase');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const OTP_EXPIRY_MINUTES = 5;

router.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Auth API ready',
    endpoints: [
      'POST /send-otp',
      'POST /verify-otp',
      'POST /set-password',
      'POST /ensure-user',
      'POST /login-with-password',
    ],
  });
});

/** Verifikasi Firebase ID Token dari header Authorization: Bearer <token> */
async function verifyIdToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
}

/**
 * POST /api/auth/set-password
 * Body: { password: string }. Header: Authorization: Bearer <Firebase ID Token>
 * Set hasPassword: true dan passwordHash untuk user.
 */
router.post('/set-password', verifyIdToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const db = getFirestore();
    await db.collection('users').doc(req.uid).set(
      {
        passwordHash,
        hasPassword: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    res.json({ success: true, message: 'Password berhasil diset' });
  } catch (err) {
    console.error('[Auth] set-password error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal menyimpan password' });
  }
});

/**
 * POST /api/auth/login-with-password
 * Body: { phone: string, password: string }
 */
router.post('/login-with-password', async (req, res) => {
  try {
    const { phone, password, forAdmin } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Nomor telepon dan password wajib diisi' });
    }

    const normalizedPhone = normalizePhone(phone);
    const db = getFirestore();
    const auth = getAuth();

    // Cari user di Firebase Auth (untuk dapatin UID)
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByPhoneNumber(`+${normalizedPhone}`);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Nomor telepon tidak terdaftar' });
    }

    // Ambil data user dari Firestore (untuk cek passwordHash)
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(400).json({ success: false, message: 'Data user tidak ditemukan' });
    }

    const userData = userDoc.data();

    // Cek role jika login admin
    if (forAdmin === true && userData.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke halaman admin' });
    }

    if (!userData.hasPassword || !userData.passwordHash) {
      return res.status(400).json({ success: false, message: 'Akun belum memiliki password. Silakan daftar ulang atau reset password.' });
    }

    // Verifikasi password
    const isMatched = await bcrypt.compare(password, userData.passwordHash);
    if (!isMatched) {
      return res.status(400).json({ success: false, message: 'Password salah' });
    }

    // Login sukses: buat Custom Token
    const customToken = await auth.createCustomToken(firebaseUser.uid);

    res.json({
      success: true,
      message: 'Login berhasil',
      customToken,
      uid: firebaseUser.uid,
    });
  } catch (err) {
    console.error('[Auth] login-with-password error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

/**
 * POST /api/auth/ensure-user
 * Header: Authorization: Bearer <Firebase ID Token> (dari Google sign-in).
 * Buat dokumen users/{uid} jika belum ada, dengan role: member.
 */
router.post('/ensure-user', verifyIdToken, async (req, res) => {
  try {
    const { uid } = req;
    const { name, email, picture } = req.firebaseUser;
    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({
        displayName: name || null,
        email: email || null,
        photoURL: picture || null,
        role: 'member',
        status: 'active',
        membershipStatus: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Auth] ensure-user error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal memastikan user' });
  }
});

/**
 * Normalize phone ke format Indonesia: 62xxxxxxxxxx (hanya digit).
 * Menerima: 08123456789, 8123456789, 628123456789, +62 812-345-6789.
 */
function normalizePhone(phone) {
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (!p.startsWith('62')) p = '62' + p;
  return p;
}

/** Validasi nomor Indonesia: 62 + 9–12 digit (min 11, max 14 karakter) */
function isValidIndonesianPhone(normalized) {
  if (!/^62\d+$/.test(normalized)) return false;
  const len = normalized.length;
  return len >= 11 && len <= 14;
}

/** Generate 6-digit OTP */
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * POST /api/auth/send-otp
 * Body: { phone: string }
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon wajib diisi',
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!isValidIndonesianPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Format nomor tidak valid. Gunakan nomor Indonesia (contoh: 08123456789 atau 628123456789)',
      });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const db = getFirestore();
    await db.collection('otps').doc(normalizedPhone).set({
      code: otp,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (!FONNTE_TOKEN) {
      console.warn('[Auth] FONNTE_TOKEN tidak di-set, OTP tidak dikirim');
      return res.json({
        success: true,
        message: 'OTP berhasil dibuat (mode dev, tidak dikirim WA)',
        devOtp: process.env.NODE_ENV === 'development' ? otp : undefined,
      });
    }

    const target = normalizedPhone.startsWith('62') ? normalizedPhone.slice(2) : normalizedPhone;
    const message = `Kode OTP LMP Superapp Anda: *${otp}*\n\nKode berlaku ${OTP_EXPIRY_MINUTES} menit. Jangan bagikan kode ini ke siapapun.`;

    const response = await axios.post(
      'https://api.fonnte.com/send',
      new URLSearchParams({
        target,
        message,
        countryCode: '62',
      }).toString(),
      {
        headers: {
          Authorization: FONNTE_TOKEN,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const data = response.data;
    if (data.status === false) {
      console.error('[Auth] Fonnte error:', data);
      return res.status(500).json({
        success: false,
        message: data.message || 'Gagal mengirim OTP ke WhatsApp',
      });
    }

    res.json({
      success: true,
      message: 'OTP telah dikirim ke WhatsApp Anda',
    });
  } catch (err) {
    console.error('[Auth] send-otp error:', err);
    const message = err.response?.data?.message || err.message || 'Terjadi kesalahan server';
    res.status(500).json({ success: false, message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { phone: string, otp: string, forAdmin?: boolean, register?: boolean }
 * register=true (daftar): buat user baru jika belum ada. register=false (login): hanya untuk nomor yang sudah terdaftar.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, forAdmin, register } = req.body;
    // OTP sekarang hanya untuk daftar
    if (register !== true) {
      return res.status(400).json({
        success: false,
        message: 'Login hanya dapat dilakukan menggunakan password.',
      });
    }

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon dan OTP wajib diisi',
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!isValidIndonesianPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Format nomor tidak valid. Gunakan nomor Indonesia (contoh: 08123456789 atau 628123456789)',
      });
    }

    const isRegister = true;

    const db = getFirestore();
    const auth = getAuth();

    const otpDoc = await db.collection('otps').doc(normalizedPhone).get();
    if (!otpDoc.exists) {
      return res.status(400).json({
        success: false,
        message: 'Kode OTP tidak ditemukan atau sudah kedaluwarsa',
      });
    }

    const { code, expiresAt } = otpDoc.data();
    if (expiresAt.toDate() < new Date()) {
      await db.collection('otps').doc(normalizedPhone).delete();
      return res.status(400).json({
        success: false,
        message: 'Kode OTP telah kedaluwarsa',
      });
    }

    if (String(otp).trim() !== String(code)) {
      return res.status(400).json({
        success: false,
        message: 'Kode OTP tidak valid',
      });
    }

    await db.collection('otps').doc(normalizedPhone).delete();

    const usersRef = db.collection('users');
    let firebaseUser;

    if (!isRegister) {
      // Login: nomor harus sudah terdaftar (ada di Firebase Auth)
      try {
        firebaseUser = await auth.getUserByPhoneNumber(`+${normalizedPhone}`);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Nomor belum terdaftar. Silakan daftar terlebih dahulu.',
        });
      }
    } else {
      // Daftar: buat user baru jika belum ada
      try {
        firebaseUser = await auth.getUserByPhoneNumber(`+${normalizedPhone}`);
      } catch {
        firebaseUser = null;
      }
      if (!firebaseUser) {
        firebaseUser = await auth.createUser({
          phoneNumber: `+${normalizedPhone}`,
        });
      }
      const userDoc = await usersRef.doc(firebaseUser.uid).get();
      if (!userDoc.exists) {
        await usersRef.doc(firebaseUser.uid).set({
          phone: normalizedPhone,
          phoneNumber: normalizedPhone,
          displayName: null,
          role: 'member',
          status: 'active',
          membershipStatus: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const existing = userDoc.data();
        if (existing?.hasPassword) {
          return res.status(400).json({
            success: false,
            message: 'Nomor sudah terdaftar. Silakan login.',
          });
        }
      }
    }

    if (forAdmin === true) {
      const userData = (await usersRef.doc(firebaseUser.uid).get()).data();
      if (userData?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses ke halaman admin',
        });
      }
    }

    const latestUser = (await usersRef.doc(firebaseUser.uid).get()).data();
    const needsPassword = !latestUser?.hasPassword;

    const customToken = await auth.createCustomToken(firebaseUser.uid);

    res.json({
      success: true,
      message: 'Login berhasil',
      customToken,
      uid: firebaseUser.uid,
      needsPassword,
    });
  } catch (err) {
    console.error('[Auth] verify-otp error:', err);
    const message = err.response?.data?.message || err.message || 'Terjadi kesalahan server';
    res.status(500).json({ success: false, message });
  }
});

module.exports = router;
