const { getFirestore } = require('../config/firebase');
const admin = require('firebase-admin');

const db = getFirestore();

/* ═══════════════════════════════════════════
   MEMBERS
   ═══════════════════════════════════════════ */

exports.getAllMembers = async (req, res) => {
    try {
        const { search, email, phone, province_id, city_id, district_id, village_id } = req.query;

        let query = db.collection('users');

        if (village_id) {
            query = query.where('organization.village_id', '==', village_id);
        } else if (district_id) {
            query = query.where('organization.district_id', '==', district_id);
        } else if (city_id) {
            query = query.where('organization.city_id', '==', city_id);
        } else if (province_id) {
            query = query.where('organization.province_id', '==', province_id);
        }

        const snapshot = await query.get();
        let members = [];

        snapshot.forEach(doc => {
            members.push({ uid: doc.id, ...doc.data() });
        });

        if (search && search.trim()) {
            const q = search.toLowerCase().trim();
            members = members.filter(m =>
                (m.displayName && m.displayName.toLowerCase().includes(q)) ||
                (m.no_kta && m.no_kta.toLowerCase().includes(q))
            );
        }

        if (email && email.trim()) {
            const q = email.toLowerCase().trim();
            members = members.filter(m => m.email && m.email.toLowerCase().includes(q));
        }

        if (phone && phone.trim()) {
            const raw = phone.trim();
            const normalized = raw.startsWith('0') ? '62' + raw.slice(1) : raw;
            members = members.filter(m => {
                const ph = (m.phoneNumber || m.phone || '').replace(/\s+/g, '');
                return ph.includes(normalized) || ph.includes(raw);
            });
        }

        members = members.map(m => {
            const { passwordHash, ...safe } = m;
            return safe;
        });

        res.status(200).json({ success: true, data: members });
    } catch (error) {
        console.error('[AdminController] getAllMembers error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data member' });
    }
};

exports.updateMemberRole = async (req, res) => {
    try {
        const { uid } = req.params;
        const { role, kepengurusan } = req.body;

        if (!uid) return res.status(400).json({ success: false, message: 'UID wajib diisi' });

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) return res.status(404).json({ success: false, message: 'Member tidak ditemukan' });

        const userData = userDoc.data();
        if (userData.membershipStatus !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Tidak bisa mengubah role/kepengurusan. Member belum membayar iuran keanggotaan.',
            });
        }

        const updatePayload = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

        if (role && ['admin', 'member'].includes(role)) updatePayload.role = role;

        if (kepengurusan !== undefined) {
            if (kepengurusan === null) {
                updatePayload.kepengurusan = admin.firestore.FieldValue.delete();
            } else {
                updatePayload.kepengurusan = {
                    ...kepengurusan,
                    assignedAt: new Date().toISOString(),
                    assignedBy: req.uid,
                };
            }
        }

        // --- NEW LOGIC: Dual write to organization
        if (req.body.organization !== undefined) {
            updatePayload.organization = {
                ...(userData.organization || {}),
                ...req.body.organization,
                updatedAt: new Date().toISOString()
            };
        }

        await userRef.update(updatePayload);
        res.status(200).json({ success: true, message: 'Role/kepengurusan berhasil diperbarui' });
    } catch (error) {
        console.error('[AdminController] updateMemberRole error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui role' });
    }
};

/* ═══════════════════════════════════════════
   STATS
   ═══════════════════════════════════════════ */

/**
 * GET /api/admin/stats
 *
 * Query params:
 *   range = daily | weekly | monthly | yearly   (default: weekly)
 *
 * Range semantics (sesuai spesifikasi dashboard):
 *   daily   → 7 hari terakhir,      sumbu X = nama hari  (Sen, Sel, ...)
 *   weekly  → 8 minggu terakhir,    sumbu X = rentang    (01-07 Jan)
 *   monthly → 12 bulan terakhir,    sumbu X = nama bulan (Jan, Feb, ...)
 *   yearly  → 5 tahun terakhir,     sumbu X = tahun      (2024, 2025, ...)
 */
exports.getStats = async (req, res) => {
    try {
        const { range = 'weekly' } = req.query;

        const snapshot = await db.collection('users').get();

        let totalMembers = 0;
        let activeMembers = 0;
        let pendingMembers = 0;
        let expiredMembers = 0;
        let totalAdmins = 0;

        // Kumpulkan { ts: Date, status: string } untuk chart
        const registrations = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            totalMembers++;
            if (data.role === 'admin') totalAdmins++;
            if (data.membershipStatus === 'active') activeMembers++;
            else if (data.membershipStatus === 'pending') pendingMembers++;
            else if (data.membershipStatus === 'expired') expiredMembers++;

            if (data.createdAt) {
                let ts;
                if (typeof data.createdAt.toDate === 'function') {
                    ts = data.createdAt.toDate();
                } else if (data.createdAt._seconds) {
                    ts = new Date(data.createdAt._seconds * 1000);
                } else {
                    ts = new Date(data.createdAt);
                }
                if (!isNaN(ts.getTime())) {
                    registrations.push({ ts, status: data.membershipStatus || 'pending' });
                }
            }
        });

        const registrationData = buildChartData(registrations, range);

        res.status(200).json({
            success: true,
            data: {
                totalMembers,
                activeMembers,
                pendingMembers,
                expiredMembers,
                totalAdmins,
                registrationData,   // [{ label, active, pending }]
            },
        });
    } catch (error) {
        console.error('[AdminController] getStats error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil statistik' });
    }
};

/* ─────────────────────────────────────────────────────────
   buildChartData — membangun dataset dual-series untuk Recharts
   Selalu membuat bucket kosong terlebih dahulu agar tidak ada
   titik bolong di grafik meski tidak ada pendaftaran di periode itu.
───────────────────────────────────────────────────────── */
function buildChartData(registrations, range) {
    const now = new Date();

    // ── Helper ──────────────────────────────────────────────
    const fmtDate = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const increment = (bucket, status) => {
        if (status === 'active') bucket.active++;
        else if (status === 'pending') bucket.pending++;
    };

    // ── DAILY: 7 hari terakhir ──────────────────────────────
    if (range === 'daily') {
        const DAY_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        // Buat 7 bucket: [6 hari lalu … hari ini]
        const buckets = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return { label: DAY_ID[d.getDay()], dateStr: fmtDate(d), active: 0, pending: 0 };
        });

        const bucketMap = Object.fromEntries(buckets.map(b => [b.dateStr, b]));

        registrations.forEach(({ ts, status }) => {
            const key = fmtDate(ts);
            if (bucketMap[key]) increment(bucketMap[key], status);
        });

        return buckets.map(({ label, active, pending }) => ({ label, active, pending }));
    }

    // ── WEEKLY: 8 minggu terakhir ───────────────────────────
    if (range === 'weekly') {
        const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

        // Buat 8 bucket, masing-masing 7 hari, dari yang terlama ke terbaru
        const buckets = Array.from({ length: 8 }, (_, i) => {
            // i=0 → 7 minggu lalu, i=7 → minggu ini
            const end = new Date(now);
            end.setDate(now.getDate() - (7 - i) * 7);
            end.setHours(23, 59, 59, 999);

            const start = new Date(end);
            start.setDate(end.getDate() - 6);
            start.setHours(0, 0, 0, 0);

            const label = `${String(start.getDate()).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')} ${MONTH_SHORT[end.getMonth()]}`;
            return { label, start, end, active: 0, pending: 0 };
        });

        registrations.forEach(({ ts, status }) => {
            const bucket = buckets.find(b => ts >= b.start && ts <= b.end);
            if (bucket) increment(bucket, status);
        });

        return buckets.map(({ label, active, pending }) => ({ label, active, pending }));
    }

    // ── MONTHLY: 12 bulan terakhir ──────────────────────────
    if (range === 'monthly') {
        const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

        // Buat 12 bucket: [11 bulan lalu … bulan ini]
        const buckets = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            return {
                label: MONTH_SHORT[d.getMonth()],
                year: d.getFullYear(),
                month: d.getMonth(),
                active: 0,
                pending: 0,
            };
        });

        const bucketMap = Object.fromEntries(
            buckets.map(b => [`${b.year}-${b.month}`, b])
        );

        registrations.forEach(({ ts, status }) => {
            const key = `${ts.getFullYear()}-${ts.getMonth()}`;
            if (bucketMap[key]) increment(bucketMap[key], status);
        });

        return buckets.map(({ label, active, pending }) => ({ label, active, pending }));
    }

    // ── YEARLY: 5 tahun terakhir ────────────────────────────
    if (range === 'yearly') {
        const currentYear = now.getFullYear();

        const buckets = Array.from({ length: 5 }, (_, i) => ({
            label: String(currentYear - (4 - i)),
            year: currentYear - (4 - i),
            active: 0,
            pending: 0,
        }));

        const bucketMap = Object.fromEntries(buckets.map(b => [b.year, b]));

        registrations.forEach(({ ts, status }) => {
            const bucket = bucketMap[ts.getFullYear()];
            if (bucket) increment(bucket, status);
        });

        return buckets.map(({ label, active, pending }) => ({ label, active, pending }));
    }

    return [];
}

/* ═══════════════════════════════════════════
   NIK VERIFICATION
   ═══════════════════════════════════════════ */

exports.checkNikDuplicates = async (req, res) => {
    try {
        const { nik } = req.query;

        if (nik) {
            const snapshot = await db.collection('users').where('nik', '==', nik).get();
            const matches = [];
            snapshot.forEach(doc => {
                const d = doc.data();
                matches.push({ uid: doc.id, displayName: d.displayName, phoneNumber: d.phoneNumber || d.phone, no_kta: d.no_kta });
            });
            res.status(200).json({
                success: true,
                data: [{ nik, isDuplicate: matches.length > 1, matchingMembers: matches }],
            });
        } else {
            const snapshot = await db.collection('users').where('nik', '!=', '').get();
            const nikMap = {};
            snapshot.forEach(doc => {
                const d = doc.data();
                if (d.nik) {
                    if (!nikMap[d.nik]) nikMap[d.nik] = [];
                    nikMap[d.nik].push({ uid: doc.id, displayName: d.displayName, phoneNumber: d.phoneNumber || d.phone, no_kta: d.no_kta, ktpURL: d.ktpURL, membershipStatus: d.membershipStatus });
                }
            });
            const duplicates = Object.entries(nikMap)
                .filter(([, members]) => members.length > 1)
                .map(([nik, matchingMembers]) => ({ nik, isDuplicate: true, matchingMembers }));
            res.status(200).json({ success: true, data: duplicates });
        }
    } catch (error) {
        console.error('[AdminController] checkNikDuplicates error:', error);
        res.status(500).json({ success: false, message: 'Gagal melakukan verifikasi NIK' });
    }
};

/* ═══════════════════════════════════════════
   NEWS CMS
   ═══════════════════════════════════════════ */

exports.getNews = async (req, res) => {
    try {
        const snapshot = await db.collection('news').orderBy('createdAt', 'desc').get();
        const news = [];
        snapshot.forEach(doc => { news.push({ id: doc.id, ...doc.data() }); });
        res.status(200).json({ success: true, data: news });
    } catch (error) {
        console.error('[AdminController] getNews error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil berita' });
    }
};

exports.createNews = async (req, res) => {
    try {
        const { title, content, category, imageURL, published } = req.body;
        if (!title || !content || !category)
            return res.status(400).json({ success: false, message: 'Title, content, dan category wajib diisi' });

        const adminDoc = await db.collection('users').doc(req.uid).get();
        const adminName = adminDoc.exists ? adminDoc.data().displayName || 'Admin' : 'Admin';

        const docRef = await db.collection('news').add({
            title, content, category,
            imageURL: imageURL || '',
            published: published !== false,
            author: adminName, authorUid: req.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).json({ success: true, message: 'Berita berhasil dibuat', id: docRef.id });
    } catch (error) {
        console.error('[AdminController] createNews error:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat berita' });
    }
};

exports.updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, imageURL, published } = req.body;

        const ref = db.collection('news').doc(id);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });

        const updateData = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (category !== undefined) updateData.category = category;
        if (imageURL !== undefined) updateData.imageURL = imageURL;
        if (published !== undefined) updateData.published = published;

        await ref.update(updateData);
        res.status(200).json({ success: true, message: 'Berita berhasil diperbarui' });
    } catch (error) {
        console.error('[AdminController] updateNews error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui berita' });
    }
};

exports.deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const ref = db.collection('news').doc(id);
        const doc = await ref.get();
        if (!doc.exists) return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
        await ref.delete();
        res.status(200).json({ success: true, message: 'Berita berhasil dihapus' });
    } catch (error) {
        console.error('[AdminController] deleteNews error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus berita' });
    }
};