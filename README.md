# LMP Superapp (Monorepo)

Backend (Express) + Frontend User (Next.js) + Frontend Admin (Next.js).

## Struktur

- **`/backend`** – Node.js/Express (Firebase Admin, Midtrans, Cloudinary, Fonnte, API Wilayah)
- **`/frontend-user`** – Next.js (port **3000**), untuk pengguna
- **`/frontend-admin`** – Next.js (port **3001**), untuk admin

## Menjalankan

### Semua bersamaan (dari folder root)

```bash
npm run dev
```

Menjalankan backend (port 5000), frontend-user (3000), dan frontend-admin (3001) dengan **concurrently**.

### Per service (terminal terpisah)

```bash
# Terminal 1 – Backend
cd backend && npm run dev

# Terminal 2 – Frontend User
cd frontend-user && npm run dev

# Terminal 3 – Frontend Admin
cd frontend-admin && npm run dev
```

## Endpoint

- **Backend health**: [http://localhost:5000/health](http://localhost:5000/health)
- **Frontend User**: [http://localhost:3000](http://localhost:3000)
- **Frontend Admin**: [http://localhost:3001](http://localhost:3001)

## Environment

- **Backend**: `/backend/.env` (lihat .cursor/rules untuk daftar variabel)
- **Frontend User**: `/frontend-user/.env.local`
- **Frontend Admin**: `/frontend-admin/.env.local`

CORS backend mengizinkan origin: `http://localhost:3000`, `http://localhost:3001`.

## Autentikasi (OTP WhatsApp)

- **User**: `/login` → input nomor WA → kirim OTP → verifikasi → redirect ke Home
- **Admin**: `/login` → sama, namun hanya user dengan `role: 'admin'` di Firestore yang dapat masuk

### Membuat User Admin (untuk testing)

1. Login sebagai user biasa lewat frontend-user
2. Buka Firestore → collection `users` → cari dokumen dengan UID user yang login
3. Edit field `role` dari `user` menjadi `admin`
4. Sekarang nomor tersebut bisa login ke frontend-admin
