# StemsatoPTN — LMS & Progress Tracker SNBT/UTBK

Platform privat untuk melacak progres belajar mandiri SNBT/UTBK menggunakan
materi video YouTube + tracking 3 status (**Belajar**, **Latsol**, **Review**),
lengkap dengan dashboard, radar chart, streak harian, dan papan peringkat teman.

## Tech Stack

- **Next.js 14** (App Router) + **React 18**
- **Tailwind CSS** + **lucide-react** (ikon) + **Recharts** (radar chart)
- **Supabase** — PostgreSQL, Auth (Google OAuth + Email/Password), Row Level Security
- **YouTube IFrame Player API** — resume playback + auto-complete
- Siap deploy ke **Vercel**

---

## 1. Prasyarat

- Node.js 18.18+ (diuji di Node 24)
- Akun **Supabase** gratis → https://supabase.com

---

## 2. Setup Supabase

1. Buat project baru di Supabase.
2. Buka **SQL Editor → New query**, tempel seluruh isi
   [`supabase/schema.sql`](supabase/schema.sql), lalu **Run**.
   Ini membuat semua tabel, RLS, trigger auto-profil, dan fungsi leaderboard.
3. Ambil kredensial di **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Aktifkan Google OAuth (opsional tapi direkomendasikan)

1. Supabase **Authentication → Providers → Google** → aktifkan, isi Client ID & Secret
   (dari Google Cloud Console → OAuth consent + Credentials).
2. Di Google Cloud, tambahkan **Authorized redirect URI**:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (dan URL Vercel saat produksi)
   - Redirect URLs: tambahkan `http://localhost:3000/auth/callback`

> **Email/Password**: aktif secara default. Jika ingin tanpa verifikasi email saat
> testing, matikan "Confirm email" di **Authentication → Providers → Email**.

---

## 3. Konfigurasi Environment

```bash
cp .env.local.example .env.local
```

Isi `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 4. Jalankan Lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000 → otomatis diarahkan ke `/login`.

### Alur pertama kali
1. **Daftar** (email/password atau Google).
2. Isi **onboarding**: Nama, PTN & Jurusan tujuan, Target tanggal (default **28 Feb 2027**).
3. Masuk ke **Progress-Ku** (dashboard).

---

## 5. Jadikan Akun Admin

Materi hanya bisa ditambah oleh admin (halaman `/admin/materials`).
Setelah mendaftar, jalankan di **SQL Editor** (ganti email-nya):

```sql
UPDATE profiles SET is_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'kamu@email.com');
```

Refresh — menu **Admin** akan muncul di navbar.

---

## 6. Cara Kerja Fitur Utama

| Fitur | Ringkas |
|---|---|
| **Auto-track video** | `hooks/useYouTubePlayer.js` — simpan posisi tiap **5 detik**, resume dari posisi terakhir, dan set `is_belajar = true` otomatis saat tonton **>85%**. |
| **3 Status** | `is_belajar` (otomatis / bisa manual), `is_latsol` & `is_review` (toggle manual). Disimpan di `user_progress`. |
| **Kesiapan Subtes** | `(Belajar + Latsol + Review) / (Total Submateri × 3) × 100%`. |
| **Streak** | Setiap ada aktivitas progres, tanggal hari ini di-`upsert` ke `user_streaks`; divisualisasikan grid ala GitHub. |
| **Leaderboard** | Fungsi `get_leaderboard()` (SECURITY DEFINER) mengagregasi semua user tanpa membuka RLS tabel dasar. |

---

## 7. Testing Manual (Checklist)

1. **Auth**: daftar → onboarding → dashboard; logout & login lagi.
2. **Admin**: di `/admin/materials`, tambah video (paste URL YouTube apa saja,
   pilih subtes). Video ID terparse otomatis + ada preview.
3. **Materi**: buka `/materi`, pilih subtes, klik **Tonton**. Tonton sampai
   >85% (atau seek mendekati akhir) → status **Belajar** tercentang sendiri.
   Tutup & buka lagi → video **melanjutkan** dari posisi terakhir.
4. **Toggle** Latsol / Review secara manual.
5. **Dashboard**: cek countdown, radar 7 subtes, tabel capaian, dan grid streak
   (kotak hari ini jadi hijau setelah ada aktivitas).
6. **Leaderboard**: buat akun kedua untuk melihat peringkat antar-user.

---

## 8. Deploy ke Vercel

1. Push repo ke GitHub.
2. Import ke Vercel → set **Environment Variables** yang sama seperti `.env.local`
   (ubah `NEXT_PUBLIC_SITE_URL` ke domain Vercel).
3. Tambahkan URL Vercel ke **Redirect URLs** & **Site URL** di Supabase Auth.

---

## Struktur Folder

```
app/
  (app)/                 # halaman butuh login (pakai layout + navbar bersama)
    dashboard/           # Progress-Ku: countdown, radar, tabel, streak grid
    materi/              # sidebar subtes, kartu, overlay video player
    leaderboard/         # tabel peringkat (via RPC get_leaderboard)
    admin/materials/     # form kelola materi (admin only)
    layout.js            # guard login + onboarding + navbar
  login/ register/       # auth
  onboarding/            # isi profil pertama kali
  auth/callback/         # tukar code OAuth -> session
hooks/useYouTubePlayer.js
lib/
  supabase/{client,server,middleware}.js
  constants.js utils.js youtube.js
middleware.js            # refresh session + proteksi route
supabase/schema.sql      # jalankan di Supabase SQL Editor
```

---

## Catatan Keamanan

- Proyek berjalan di **Next.js 14.2.35** (patch terbaru jalur 14.2.x).
  `npm audit` masih menandai beberapa advisory kelas **DoS** yang baru
  di-*fix* penuh di **Next 16** (major, breaking). Untuk aplikasi privat ini
  risikonya rendah; upgrade ke Next 16 bisa dilakukan terpisah bila perlu.
- Semua akses data dibatasi **Row Level Security**: user hanya bisa membaca/menulis
  progres & streak miliknya sendiri; hanya admin yang bisa menulis materi.
