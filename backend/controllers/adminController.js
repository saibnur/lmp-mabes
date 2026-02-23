const { getFirestore } = require('../config/firebase');
const admin = require('firebase-admin');

const db = getFirestore();

/* ═══════════════════════════════════════════
   MEMBERS
   ═══════════════════════════════════════════ */

/**
 * GET /api/admin/members
 * Query params: search, email, phone, province_id, city_id, district_id, village_id
 */
exports.getAllMembers = async (req, res) => {
    try {
        const { search, email, phone, province_id, city_id, district_id, village_id } = req.query;

        let query = db.collection('users');

        // Region filters via Firestore queries
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

        // Client-side search filter (Firestore doesn't support LIKE)
        if (search && search.trim()) {
            const q = search.toLowerCase().trim();
            members = members.filter(m =>
                (m.displayName && m.displayName.toLowerCase().includes(q)) ||
                (m.no_kta && m.no_kta.toLowerCase().includes(q))
            );
        }

        // Email filter
        if (email && email.trim()) {
            const q = email.toLowerCase().trim();
            members = members.filter(m =>
                m.email && m.email.toLowerCase().includes(q)
            );
        }

        // Phone filter — normalize: if starts with 0, replace with 62
        if (phone && phone.trim()) {
            const raw = phone.trim();
            const normalized = raw.startsWith('0') ? '62' + raw.slice(1) : raw;
            members = members.filter(m => {
                const ph = (m.phoneNumber || m.phone || '').replace(/\s+/g, '');
                return ph.includes(normalized) || ph.includes(raw);
            });
        }

        // Remove sensitive fields
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

/**
 * PUT /api/admin/members/:uid/role
 */
exports.updateMemberRole = async (req, res) => {
    try {
        const { uid } = req.params;
        const { role, kepengurusan } = req.body;

        if (!uid) {
            return res.status(400).json({ success: false, message: 'UID wajib diisi' });
        }

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'Member tidak ditemukan' });
        }

        const userData = userDoc.data();

        if (userData.membershipStatus !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Tidak bisa mengubah role/kepengurusan. Member belum membayar iuran keanggotaan (status bukan active).',
            });
        }

        const updatePayload = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (role && ['admin', 'member'].includes(role)) {
            updatePayload.role = role;
        }

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

        await userRef.update(updatePayload);
        res.status(200).json({ success: true, message: 'Role/kepengurusan berhasil diperbarui' });
    } catch (error) {
        console.error('[AdminController] updateMemberRole error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui role' });
    }
};

/* ═══════════════════════════════════════════
   STATS — Dual-series (active + pending)
   ═══════════════════════════════════════════ */

/**
 * GET /api/admin/stats
 * Query params: range = hourly | weekly | monthly | yearly
 *               date  = YYYY-MM-DD  (only for hourly)
 */
exports.getStats = async (req, res) => {
    try {
        const { range = 'weekly', date } = req.query;

        const snapshot = await db.collection('users').get();
        let totalMembers = 0;
        let activeMembers = 0;
        let pendingMembers = 0;
        let expiredMembers = 0;
        let totalAdmins = 0;

        // Collect { ts, membershipStatus } for chart
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
                if (data.createdAt.toDate) {
                    ts = data.createdAt.toDate();
                } else if (data.createdAt._seconds) {
                    ts = new Date(data.createdAt._seconds * 1000);
                } else {
                    ts = new Date(data.createdAt);
                }
                if (!isNaN(ts.getTime())) {
                    registrations.push({
                        ts,
                        status: data.membershipStatus || 'pending',
                    });
                }
            }
        });

        const registrationData = buildChartData(registrations, range, date);

        res.status(200).json({
            success: true,
            data: {
                totalMembers,
                activeMembers,
                pendingMembers,
                expiredMembers,
                totalAdmins,
                registrationData,
            },
        });
    } catch (error) {
        console.error('[AdminController] getStats error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil statistik' });
    }
};

/**
 * Build a dual-series dataset: [{label, active, pending}, ...]
 */
function buildChartData(registrations, range, dateParam) {
    const now = new Date();

    if (range === 'hourly') {
        // Target date: from query param or today (WIB = UTC+7)
        const targetDate = dateParam ? new Date(dateParam + 'T00:00:00+07:00') : new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) + 'T00:00:00+07:00');
        const targetStr = targetDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

        // 24 hourly buckets
        const buckets = Array.from({ length: 24 }, (_, h) => ({
            label: String(h).padStart(2, '0') + ':00',
            active: 0,
            pending: 0,
        }));

        registrations.forEach(({ ts, status }) => {
            const dayStr = ts.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            if (dayStr !== targetStr) return;
            const hour = parseInt(ts.toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit' }), 10);
            const s = status === 'active' ? 'active' : 'pending';
            if (buckets[hour]) buckets[hour][s]++;
        });

        return buckets;
    }

    if (range === 'weekly') {
        // Monday–Sunday of current week
        const dayOfWeek = now.getDay(); // 0=Sun
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
        monday.setHours(0, 0, 0, 0);

        const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const buckets = DAYS.map((label, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return { label, date: d.toLocaleDateString('en-CA'), active: 0, pending: 0 };
        });

        registrations.forEach(({ ts, status }) => {
            const dayStr = ts.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            const bucket = buckets.find(b => b.date === dayStr);
            if (!bucket) return;
            const s = status === 'active' ? 'active' : 'pending';
            bucket[s]++;
        });

        return buckets.map(({ label, active, pending }) => ({ label, active, pending }));
    }

    if (range === 'monthly') {
        // Day 1 – last day of current month
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const buckets = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return { label: String(day), date: dateStr, active: 0, pending: 0 };
        });

        registrations.forEach(({ ts, status }) => {
            const dayStr = ts.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            const bucket = buckets.find(b => b.date === dayStr);
            if (!bucket) return;
            const s = status === 'active' ? 'active' : 'pending';
            bucket[s]++;
        });

        return buckets.map(({ label, active, pending }) => ({ label, active, pending }));
    }

    if (range === 'yearly') {
        // Jan–Dec of current year
        const year = now.getFullYear();
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const buckets = MONTHS.map((label, i) => ({ label, month: i, active: 0, pending: 0 }));

        registrations.forEach(({ ts, status }) => {
            if (ts.getFullYear() !== year) return;
            const m = ts.getMonth();
            const s = status === 'active' ? 'active' : 'pending';
            buckets[m][s]++;
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
                matches.push({
                    uid: doc.id,
                    displayName: d.displayName,
                    phoneNumber: d.phoneNumber || d.phone,
                    no_kta: d.no_kta,
                });
            });

            res.status(200).json({
                success: true,
                data: [{
                    nik,
                    isDuplicate: matches.length > 1,
                    matchingMembers: matches,
                }],
            });
        } else {
            const snapshot = await db.collection('users').where('nik', '!=', '').get();
            const nikMap = {};

            snapshot.forEach(doc => {
                const d = doc.data();
                if (d.nik) {
                    if (!nikMap[d.nik]) nikMap[d.nik] = [];
                    nikMap[d.nik].push({
                        uid: doc.id,
                        displayName: d.displayName,
                        phoneNumber: d.phoneNumber || d.phone,
                        no_kta: d.no_kta,
                        ktpURL: d.ktpURL,
                        membershipStatus: d.membershipStatus,
                    });
                }
            });

            const duplicates = Object.entries(nikMap)
                .filter(([, members]) => members.length > 1)
                .map(([nik, matchingMembers]) => ({
                    nik,
                    isDuplicate: true,
                    matchingMembers,
                }));

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
        snapshot.forEach(doc => {
            news.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json({ success: true, data: news });
    } catch (error) {
        console.error('[AdminController] getNews error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil berita' });
    }
};

exports.createNews = async (req, res) => {
    try {
        const { title, content, category, imageURL, published } = req.body;
        if (!title || !content || !category) {
            return res.status(400).json({ success: false, message: 'Title, content, dan category wajib diisi' });
        }

        const adminDoc = await db.collection('users').doc(req.uid).get();
        const adminName = adminDoc.exists ? adminDoc.data().displayName || 'Admin' : 'Admin';

        const docRef = await db.collection('news').add({
            title,
            content,
            category,
            imageURL: imageURL || '',
            published: published !== false,
            author: adminName,
            authorUid: req.uid,
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
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
        }

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
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
        }

        await ref.delete();
        res.status(200).json({ success: true, message: 'Berita berhasil dihapus' });
    } catch (error) {
        console.error('[AdminController] deleteNews error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus berita' });
    }
};
