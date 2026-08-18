# 🖨️ Percetakan Syamra Digital

Landing page resmi **Percetakan Syamra Digital** — Solusi Cetakan Anda di Raja Ampat, Papua Barat Daya.
Dilengkapi **panel admin** (`/admin`) untuk mengubah harga, layanan, galeri, profil owner,
dan kontak langsung dari browser, tanpa edit kode.

---

## 📁 Struktur Proyek

```
syamra-digital/
├── public/                 # Semua file yang disajikan ke pengunjung
│   ├── index.html            # Halaman utama (konten dinamis via /api/content)
│   ├── css/style.css
│   ├── js/
│   │   ├── content-loader.js   # Mengambil data dari API & merender ke halaman utama
│   │   └── main.js              # Interaktivitas tab layanan
│   ├── admin/                # Panel admin (login + kelola konten)
│   │   ├── index.html
│   │   ├── admin.css
│   │   └── admin.js
│   └── assets/                # Foto & gambar default
├── src/
│   ├── index.js             # Worker utama: routing API + serve file statis
│   └── utils.js              # Helper: auth, session, data default
├── wrangler.toml             # Konfigurasi Worker (binding KV & R2)
├── package.json
├── ADMIN-SETUP.md            # 📖 Panduan lengkap deploy & setup panel admin
└── README.md
```

---

## 🚀 Cara Deploy (Cloudflare Workers)

Website ini di-hosting sebagai **Cloudflare Worker** (dengan static assets) karena panel admin
butuh backend (KV untuk data, R2 untuk file gambar).

👉 **Ikuti panduan lengkap & berurutan di [`ADMIN-SETUP.md`](./ADMIN-SETUP.md)** untuk:
1. Membuat R2 bucket (upload foto) & KV namespace (data konten)
2. Mengisi ID KV ke `wrangler.toml`
3. Deploy lewat Cloudflare Dashboard (Connect to Git — tanpa perlu install apapun di komputer)
4. Mengatur password admin
5. Mengakses panel admin di `/admin`

---

## ✨ Fitur

- ✅ Desain responsif (mobile & desktop)
- ✅ Tab layanan interaktif (Percetakan, Advertising, Reklame)
- ✅ Daftar harga produk
- ✅ Galeri karya
- ✅ Profil pemilik
- ✅ Kontak & tombol WhatsApp langsung
- ✅ Section Program Sosial
- ✅ **Panel admin** untuk update harga, layanan, galeri, profil owner & kontak tanpa edit kode
- ✅ Upload foto galeri/owner langsung ke Cloudflare R2 lewat panel admin

---

## 📞 Kontak

| Channel | Info |
|--------|------|
| 📱 WhatsApp | [0813-4343-5960](https://wa.me/6281343435960) |
| 📘 Facebook | [rumahcetak.rajaampat.9](https://facebook.com/rumahcetak.rajaampat.9) |
| 📍 Alamat | Jl. Perumahan Sosial, Samping Gereja Alfa Omega, Waisai, Raja Ampat |

---

*© 2025 Percetakan Syamra Digital · Waisai, Raja Ampat 🌊*
