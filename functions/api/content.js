import { json, errorJson, isAuthenticated, CONTENT_KEY, DEFAULT_CONTENT } from "../_utils.js";

// GET /api/content — publik, dipakai oleh index.html untuk render konten
export async function onRequestGet({ env }) {
  if (!env.SITE_CONTENT) {
    return json(DEFAULT_CONTENT);
  }
  const raw = await env.SITE_CONTENT.get(CONTENT_KEY);
  if (!raw) {
    return json(DEFAULT_CONTENT);
  }
  try {
    return json(JSON.parse(raw));
  } catch {
    return json(DEFAULT_CONTENT);
  }
}

// POST /api/content — hanya admin, simpan konten baru ke KV
export async function onRequestPost({ request, env }) {
  const authed = await isAuthenticated(request, env);
  if (!authed) return errorJson("Unauthorized", 401);

  if (!env.SITE_CONTENT) {
    return errorJson("KV namespace SITE_CONTENT belum di-bind di Cloudflare Pages.", 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorJson("Body request tidak valid (harus JSON)", 400);
  }

  // Validasi ringan struktur data
  const required = ["harga", "layanan", "galeri", "owner", "kontak"];
  for (const key of required) {
    if (!(key in body)) return errorJson(`Field "${key}" wajib ada`, 400);
  }

  await env.SITE_CONTENT.put(CONTENT_KEY, JSON.stringify(body));
  return json({ ok: true });
}
