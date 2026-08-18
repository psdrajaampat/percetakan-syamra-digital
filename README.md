# 🖨️ Percetakan Syamra Digital

Landing page resmi **Percetakan Syamra Digital** — Solusi Cetakan Anda di Raja Ampat, Papua Barat Daya.
Sekarang dilengkapi **panel admin** (`/admin`) untuk mengubah harga, layanan, galeri, profil owner,
dan kontak langsung dari browser, tanpa edit kode.

---

## 📁 Struktur Proyek

```
syamra-digital/
├── index.html          # Halaman utama (konten dinamis via /api/content)
├── css/style.css        # Styling halaman utama
├── js/
│   ├── content-loader.js  # Mengambil data dari API & merender ke halaman utama
│   └── main.js             # Interaktivitas tab layanan
├── admin/                # Panel admin (login + kelola konten)
│   ├── index.html
│   ├── admin.css
│   └── admin.js
├── functions/             # Cloudflare Pages Functions (backend API)
│   ├── _utils.js
│   ├── api/login.js, logout.js, me.js, content.js, upload.js
│   └── images/[[path]].js   # Menyajikan file dari R2 secara publik
├── assets/                # Foto & gambar default
├── wrangler.toml          # Konfigurasi binding KV & R2
├── ADMIN-SETUP.md         # 📖 Panduan lengkap deploy & setup panel admin
└── README.md
```

---

## 🚀 Cara Deploy (Cloudflare Pages)

Website ini butuh **Cloudflare Pages** (bukan GitHub Pages) karena panel admin
menggunakan Pages Functions + KV + R2 sebagai backend.

👉 **Ikuti panduan lengkap di [`ADMIN-SETUP.md`](./ADMIN-SETUP.md)** untuk:
1. Deploy repo ke Cloudflare Pages
2. Membuat KV namespace (data konten) & R2 bucket (upload foto)
3. Mengatur password admin
4. Mengakses panel admin di `/admin`

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
