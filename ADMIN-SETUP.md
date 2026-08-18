# 🔐 Panduan Setup Panel Admin (Cloudflare Workers + KV + R2)

Website ini punya **panel admin** di `/admin` untuk mengubah harga, layanan,
galeri foto, profil owner, dan info kontak — tanpa perlu edit kode lagi setelah setup awal ini selesai.

Situs ini berjalan sebagai **Cloudflare Worker** (bukan GitHub Pages), karena butuh backend untuk
menyimpan data & file gambar. Semua proses build/deploy dilakukan otomatis oleh server Cloudflare
setiap kali Anda push ke GitHub — **Anda tidak perlu install apapun atau mengetik command di komputer sendiri.**

Alur datanya:
- **Cloudflare KV** → menyimpan data teks (harga, layanan, owner, kontak, daftar galeri) sebagai JSON.
- **Cloudflare R2** → menyimpan file foto yang diupload dari panel admin.
- **Worker (`src/index.js`)** → menangani API (`/api/...`), menyajikan gambar (`/images/...`),
  dan menyajikan file statis (halaman utama, panel admin) dari folder `public/`.

⚠️ **Penting: urutan langkah di bawah harus diikuti sesuai urutan**, karena KV namespace & R2 bucket
harus sudah ada sebelum Worker pertama kali di-deploy (kalau belum ada, deploy akan gagal).

---

## Langkah 1 — Buat R2 Bucket

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → menu **R2** (di sidebar kiri, atau lewat **Storage & databases**).
2. Klik **Create bucket**.
3. Nama bucket: **`syamra-uploads`** (harus persis sama, karena sudah ditulis di `wrangler.toml`).
4. Lokasi: biarkan default. Klik **Create bucket**.
5. *(Tidak perlu diaktifkan sebagai "Public Bucket"* — foto tetap bisa diakses publik lewat
   `/images/...` karena Worker punya route khusus yang mengambilnya dari R2, jadi lebih aman.)

---

## Langkah 2 — Buat KV Namespace

1. Di dashboard Cloudflare → **Storage & databases** → **KV** → **Create a namespace**.
2. Nama: `SITE_CONTENT` (bebas, hanya label) → **Add**.
3. Setelah dibuat, **salin/copy ID namespace** yang muncul di daftar (contoh: `a1b2c3d4e5f6...`).

---

## Langkah 3 — Isi ID KV ke `wrangler.toml`

1. Buka repo GitHub Anda di browser → buka file **`wrangler.toml`** → klik ikon pensil (**Edit**).
2. Cari baris ini:
   ```
   id = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID"
   ```
3. Ganti `REPLACE_WITH_YOUR_KV_NAMESPACE_ID` dengan ID yang Anda salin di Langkah 2. Contoh hasil akhir:
   ```
   id = "a1b2c3d4e5f6..."
   ```
4. Klik **Commit changes** langsung di branch `main`.

---

## Langkah 4 — Deploy Worker

1. Dashboard Cloudflare → **Workers & Pages** (atau **Compute** → **Workers & Pages**) → **Create application**.
2. Pilih **Connect to Git** → pilih repo `percetakan-syamra-digital`.
3. Isi:
   - **Project name:** `percetakan-syamra-digital` (bebas)
   - **Build command:** biarkan kosong
   - **Deploy command:** biarkan default `npx wrangler deploy` — **ini dijalankan otomatis oleh Cloudflare, bukan oleh Anda**
4. Klik **Deploy**. Tunggu sampai selesai (biasanya 1–2 menit).

---

## Langkah 5 — Bind KV & R2 ke Worker

Deploy pertama akan sukses untuk halaman statis, tapi API belum berfungsi penuh sampai binding aktif
(sebenarnya sudah otomatis terbaca dari `wrangler.toml` di Langkah 3–4, tapi cek untuk memastikan):

1. Buka project Worker Anda → tab **Settings** → **Bindings**.
2. Pastikan ada:
   - **KV Namespace** dengan variable name `SITE_CONTENT`
   - **R2 Bucket** dengan variable name `UPLOADS`
3. Kalau belum ada, klik **Add** dan tambahkan manual (pilih namespace/bucket yang sudah dibuat di Langkah 1–2).

---

## Langkah 6 — Set Password Admin & Session Secret

1. Masih di project Worker → **Settings** → **Variables and Secrets** → **Add**.
2. Tambahkan dua secret (pilih tipe **Secret**, bukan **Text**, supaya nilainya terenkripsi):

| Nama variabel | Isi |
|---|---|
| `ADMIN_PASSWORD` | Password untuk login ke `/admin` — pilih yang kuat |
| `SESSION_SECRET` | String acak panjang (min. 32 karakter), contoh: hasil dari generator string acak online |

3. Klik **Save and deploy** (atau **Deploy** jika diminta) supaya secret aktif.

---

## Langkah 7 — Selesai! 🎉

- Website utama: `https://<nama-project>.<subdomain-anda>.workers.dev/`
- Panel admin: `https://<nama-project>.<subdomain-anda>.workers.dev/admin/`

Login pakai `ADMIN_PASSWORD` yang sudah diatur di Langkah 6. Semua perubahan yang
disimpan dari panel admin akan langsung tampil ke semua pengunjung website — tidak perlu
push kode atau redeploy lagi setelahnya.

Jika sudah punya domain sendiri, tambahkan lewat tab **Settings → Domains & Routes** di project Worker Anda.

---

## Catatan Keamanan

- Panel admin memakai satu password (sesuai permintaan) — pastikan `ADMIN_PASSWORD` kuat dan tidak dibagikan sembarangan.
- Sesi login otomatis kedaluwarsa setelah 8 jam.
- File yang diupload dibatasi maks. 8MB dan hanya format gambar (JPG, PNG, WEBP, GIF).

## Kalau Deploy Gagal

- **Error terkait KV namespace ID** → pastikan Langkah 3 sudah benar (ID sudah diganti, bukan lagi placeholder).
- **Error terkait R2 bucket** → pastikan nama bucket di R2 persis `syamra-uploads`.
- **Halaman tampil tapi panel admin error "Unauthorized" terus** → cek Langkah 6, pastikan `ADMIN_PASSWORD` & `SESSION_SECRET` sudah disimpan sebagai *Secret* dan Worker sudah redeploy setelahnya.
