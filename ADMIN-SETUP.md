# 🔐 Panduan Setup Panel Admin (Cloudflare Pages + KV + R2)

Website ini sekarang punya **panel admin** di `/admin` untuk mengubah harga, layanan,
galeri foto, profil owner, dan info kontak — tanpa perlu edit kode / push ke GitHub lagi.

Karena butuh backend (menyimpan data & file gambar), website perlu di-hosting di
**Cloudflare Pages** (bukan lagi GitHub Pages, karena GitHub Pages tidak bisa
menjalankan server function).

Alur datanya:
- **Cloudflare KV** → menyimpan data teks (harga, layanan, owner, kontak, daftar galeri) sebagai JSON.
- **Cloudflare R2** → menyimpan file foto yang diupload dari panel admin.
- **Cloudflare Pages Functions** → API (`/api/...`) yang menghubungkan panel admin ke KV & R2.

---

## Langkah 1 — Deploy ke Cloudflare Pages

1. Push folder project ini ke repo GitHub Anda (repo yang sudah ada, `percetakan-syamra-digital`, bisa dipakai).
2. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
3. Pilih repo `percetakan-syamra-digital`.
4. Pengaturan build:
   - **Framework preset:** None
   - **Build command:** *(kosongkan)*
   - **Build output directory:** `/`
5. Klik **Save and Deploy**. Deployment pertama akan sukses, tapi panel admin belum berfungsi
   penuh sampai Langkah 2–4 selesai (karena KV, R2, dan password belum diatur).

---

## Langkah 2 — Buat KV Namespace (untuk data konten)

1. Di dashboard Cloudflare → **Workers & Pages** → tab **KV** → **Create a namespace**.
2. Nama: `SITE_CONTENT` (bebas, hanya label).
3. Setelah dibuat, kembali ke project Pages Anda → **Settings** → **Functions** →
   **KV namespace bindings** → **Add binding**:
   - Variable name: `SITE_CONTENT`
   - KV namespace: pilih namespace yang baru dibuat

---

## Langkah 3 — Buat R2 Bucket (untuk file foto)

1. Dashboard Cloudflare → **R2** → **Create bucket**.
2. Nama bucket: `syamra-uploads`.
3. *(Tidak perlu diaktifkan sebagai "Public Bucket"* — foto tetap bisa diakses publik lewat
   `/images/...` karena website ini punya route khusus yang mengambilnya dari R2, jadi lebih aman.)
4. Kembali ke project Pages → **Settings** → **Functions** → **R2 bucket bindings** → **Add binding**:
   - Variable name: `UPLOADS`
   - R2 bucket: pilih `syamra-uploads`

---

## Langkah 4 — Set Password Admin & Session Secret

Masih di **Settings** project Pages → **Environment variables** → **Add variable**
(pilih tipe **Encrypt** untuk keduanya, lalu simpan untuk environment **Production**):

| Nama variabel | Isi |
|---|---|
| `ADMIN_PASSWORD` | Password untuk login ke `/admin` — pilih yang kuat |
| `SESSION_SECRET` | String acak panjang (min. 32 karakter), contoh: hasil dari `openssl rand -hex 32` atau generator string acak online |

---

## Langkah 5 — Redeploy

Binding KV/R2 dan environment variable baru aktif setelah **deployment baru** dibuat.
Buka tab **Deployments** → klik **Retry deployment** pada deployment terakhir,
atau cukup push commit kosong ke GitHub agar Cloudflare Pages build ulang otomatis.

---

## Langkah 6 — Selesai! 🎉

- Website utama: `https://<nama-project>.pages.dev/`
- Panel admin: `https://<nama-project>.pages.dev/admin/`

Login pakai `ADMIN_PASSWORD` yang sudah diatur di Langkah 4. Semua perubahan yang
disimpan dari panel admin akan langsung tampil ke semua pengunjung website — tidak perlu
push kode atau redeploy lagi.

Jika sudah punya domain sendiri, tambahkan lewat **Custom domains** di project Pages Anda.

---

## Catatan Keamanan

- Panel admin memakai satu password (sesuai permintaan) — pastikan `ADMIN_PASSWORD` kuat dan tidak dibagikan sembarangan.
- Sesi login otomatis kedaluwarsa setelah 8 jam.
- File yang diupload dibatasi maks. 8MB dan hanya format gambar (JPG, PNG, WEBP, GIF).
