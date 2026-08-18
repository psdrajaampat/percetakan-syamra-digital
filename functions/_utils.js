// ==========================================================
// Syamra Digital — Shared utilities for Cloudflare Pages Functions
// ==========================================================

export const CONTENT_KEY = "site-content";
export const SESSION_COOKIE = "syamra_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 jam

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json;charset=UTF-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

export function errorJson(message, status = 400) {
  return json({ ok: false, error: message }, status);
}

// ---------- Session signing (HMAC-SHA256 via Web Crypto) ----------

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Buat token sesi: "<expiryEpoch>.<hmacHex>" */
export async function createSessionToken(secret) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(expires)));
  return `${expires}.${toHex(sig)}`;
}

/** Verifikasi token sesi dari cookie */
export async function verifySessionToken(token, secret) {
  if (!token || !token.includes(".")) return false;
  const [expiresStr, sigHex] = token.split(".");
  const expires = Number(expiresStr);
  if (!expires || Date.now() / 1000 > expires) return false;

  const key = await hmacKey(secret);
  const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expiresStr));
  const expectedHex = toHex(expectedSig);

  if (expectedHex.length !== sigHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ sigHex.charCodeAt(i);
  }
  return diff === 0;
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = v;
  });
  return out;
}

/** Cek apakah request punya sesi admin yang valid */
export async function isAuthenticated(request, env) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) return false;
  return verifySessionToken(token, env.SESSION_SECRET);
}

export function sessionCookieHeader(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// ---------- Default content (dipakai kalau KV masih kosong) ----------

export const DEFAULT_CONTENT = {
  harga: [
    { icon: "🚩", nama: "Spanduk / Baliho", harga: "Rp 80.000", satuan: "per meter" },
    { icon: "🪧", nama: "Standing Banner", harga: "Rp 450.000", satuan: "1 paket lengkap" },
    { icon: "💳", nama: "ID Card", harga: "Rp 50.000", satuan: "per buah" },
    { icon: "📛", nama: "Papan Nama Dada", harga: "Rp 100.000", satuan: "per buah" },
    { icon: "🔖", nama: "Stempel Flash", harga: "Rp 150.000", satuan: "per buah" },
  ],
  layanan: {
    cetak: [
      { icon: "🚩", judul: "Spanduk", desc: "Cetak spanduk berbagai ukuran, warna tajam & tahan cuaca" },
      { icon: "🪟", judul: "Baliho", desc: "Baliho besar untuk promosi outdoor yang maksimal" },
      { icon: "🔖", judul: "Stempel Flash", desc: "Stempel cepat, rapi, dan tahan lama untuk kebutuhan kantor" },
      { icon: "📋", judul: "Fotocopy", desc: "Layanan fotocopy cepat dengan hasil bersih & jelas" },
      { icon: "✏️", judul: "ATK", desc: "Penyediaan alat tulis kantor lengkap untuk kebutuhan Anda" },
      { icon: "⌨️", judul: "Pengetikan", desc: "Layanan pengetikan dokumen, surat, & laporan profesional" },
    ],
    ads: [
      { icon: "🚀", judul: "Banner", desc: "Banner promosi menarik untuk berbagai keperluan acara & bisnis" },
      { icon: "🗞️", judul: "Poster", desc: "Poster full color dengan desain kreatif & eye-catching" },
      { icon: "💌", judul: "Undangan", desc: "Undangan pernikahan, acara, & kegiatan dengan desain elegan" },
      { icon: "📛", judul: "Papan Nama Dada", desc: "Name tag & papan nama dada profesional untuk instansi & acara" },
      { icon: "💳", judul: "ID Card", desc: "Kartu identitas pegawai, panitia & anggota organisasi" },
      { icon: "🏆", judul: "Plakat", desc: "Plakat penghargaan & kenang-kenangan berkualitas tinggi" },
      { icon: "📝", judul: "Nota", desc: "Buku nota kwitansi custom untuk kebutuhan usaha Anda" },
    ],
    reklame: [
      { icon: "💡", judul: "Neon Box", desc: "Papan reklame bercahaya untuk visibilitas bisnis 24 jam" },
      { icon: "👕", judul: "Sablon", desc: "Cetak sablon kaos, seragam, & merchandise custom" },
      { icon: "🏛️", judul: "Gapura", desc: "Pembuatan gapura untuk acara, desa, & instansi" },
      { icon: "🔩", judul: "Las", desc: "Jasa las untuk konstruksi rangka reklame & signage" },
      { icon: "🪧", judul: "Papan Nama Kantor", desc: "Papan nama kantor, toko & instansi yang profesional" },
      { icon: "📊", judul: "Papan Struktur", desc: "Papan struktur organisasi instansi & perusahaan" },
      { icon: "💐", judul: "Papan Buket & Krans Bunga", desc: "Buket ucapan & krans bunga untuk berbagai momen spesial" },
    ],
  },
  galeri: [
    { url: "assets/galeri/galeri-1.jpg", label: "Festival Suling Tambur" },
    { url: "assets/galeri/galeri-2.jpg", label: "Spanduk Gratis Natal" },
    { url: "assets/galeri/galeri-3.jpg", label: "Spanduk Gratis Idul Fitri" },
  ],
  owner: {
    nama: "Ismail Syam",
    title: "Founder & Owner — Percetakan Syamra Digital",
    bio: "Ismail Syam adalah pelaku industri kreatif lokal yang aktif membangun ekosistem percetakan & advertising di Raja Ampat. Dikenal luas karena kepedulian sosialnya, beliau telah konsisten menjalankan program spanduk gratis untuk rumah ibadah selama 8 tahun berturut-turut sebagai wujud nyata cinta terhadap masyarakat Raja Ampat.",
    fotoUrl: "assets/owner/owner.jpg",
  },
  kontak: {
    alamat: "Jl. Perumahan Sosial, Samping Gereja Alfa Omega, Waisai, Kab. Raja Ampat, Papua Barat Daya",
    whatsapp: "6281343435960",
    facebook: "rumahcetak.rajaampat.9",
  },
};
