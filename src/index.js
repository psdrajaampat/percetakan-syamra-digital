// ==========================================================
// Syamra Digital — Worker utama
// Menangani API (/api/*), gambar R2 (/images/*), dan
// menyajikan file statis (index.html, admin panel, dll)
// ==========================================================

import {
  json,
  errorJson,
  isAuthenticated,
  createSessionToken,
  sessionCookieHeader,
  clearSessionCookieHeader,
  CONTENT_KEY,
  DEFAULT_CONTENT,
} from "./utils.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const { method } = request;

    try {
      if (pathname === "/api/login" && method === "POST") return handleLogin(request, env);
      if (pathname === "/api/logout" && method === "POST") return handleLogout();
      if (pathname === "/api/me" && method === "GET") return handleMe(request, env);
      if (pathname === "/api/content" && method === "GET") return handleContentGet(env);
      if (pathname === "/api/content" && method === "POST") return handleContentPost(request, env);
      if (pathname === "/api/upload" && method === "POST") return handleUploadPost(request, env);
      if (pathname === "/api/upload" && method === "DELETE") return handleUploadDelete(request, env);
      if (pathname.startsWith("/images/") && method === "GET") return handleImageGet(pathname, env);
    } catch (err) {
      return errorJson("Server error: " + (err && err.message ? err.message : String(err)), 500);
    }

    // Selain rute di atas, sajikan file statis (index.html, admin/, css, js, assets)
    return env.ASSETS.fetch(request);
  },
};

// ---------- /api/login ----------
async function handleLogin(request, env) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return errorJson(
      "Server belum dikonfigurasi. Set ADMIN_PASSWORD & SESSION_SECRET sebagai secret di Cloudflare.",
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorJson("Body request tidak valid", 400);
  }

  const password = (body && body.password) || "";
  if (password !== env.ADMIN_PASSWORD) {
    await new Promise((r) => setTimeout(r, 400));
    return errorJson("Password salah", 401);
  }

  const token = await createSessionToken(env.SESSION_SECRET);
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookieHeader(token) });
}

// ---------- /api/logout ----------
async function handleLogout() {
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookieHeader() });
}

// ---------- /api/me ----------
async function handleMe(request, env) {
  const authed = await isAuthenticated(request, env);
  return json({ authenticated: authed });
}

// ---------- /api/content ----------
async function handleContentGet(env) {
  if (!env.SITE_CONTENT) return json(DEFAULT_CONTENT);
  const raw = await env.SITE_CONTENT.get(CONTENT_KEY);
  if (!raw) return json(DEFAULT_CONTENT);
  try {
    return json(JSON.parse(raw));
  } catch {
    return json(DEFAULT_CONTENT);
  }
}

async function handleContentPost(request, env) {
  const authed = await isAuthenticated(request, env);
  if (!authed) return errorJson("Unauthorized", 401);

  if (!env.SITE_CONTENT) {
    return errorJson("KV namespace SITE_CONTENT belum di-bind ke Worker ini.", 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorJson("Body request tidak valid (harus JSON)", 400);
  }

  const required = ["harga", "layanan", "galeri", "owner", "kontak"];
  for (const key of required) {
    if (!(key in body)) return errorJson(`Field "${key}" wajib ada`, 400);
  }

  await env.SITE_CONTENT.put(CONTENT_KEY, JSON.stringify(body));
  return json({ ok: true });
}

// ---------- /api/upload ----------
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

function extFromType(type) {
  switch (type) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    default: return "bin";
  }
}

function randomId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

async function handleUploadPost(request, env) {
  const authed = await isAuthenticated(request, env);
  if (!authed) return errorJson("Unauthorized", 401);

  if (!env.UPLOADS) {
    return errorJson("R2 bucket UPLOADS belum di-bind ke Worker ini.", 500);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return errorJson("Request harus multipart/form-data", 400);
  }

  const file = form.get("file");
  const category = (form.get("category") || "misc").toString().replace(/[^a-z0-9_-]/gi, "") || "misc";

  if (!file || typeof file === "string") {
    return errorJson("File tidak ditemukan pada field 'file'", 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorJson("Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.", 400);
  }
  if (file.size > MAX_BYTES) {
    return errorJson("Ukuran file terlalu besar (maks 8MB).", 400);
  }

  const key = `${category}/${Date.now()}-${randomId()}.${extFromType(file.type)}`;

  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return json({ ok: true, key, url: `/images/${key}` });
}

async function handleUploadDelete(request, env) {
  const authed = await isAuthenticated(request, env);
  if (!authed) return errorJson("Unauthorized", 401);

  if (!env.UPLOADS) {
    return errorJson("R2 bucket UPLOADS belum di-bind ke Worker ini.", 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorJson("Body request tidak valid", 400);
  }

  const key = body && body.key;
  if (!key || typeof key !== "string" || key.includes("..")) {
    return errorJson("Key file tidak valid", 400);
  }

  await env.UPLOADS.delete(key);
  return json({ ok: true });
}

// ---------- /images/* ----------
async function handleImageGet(pathname, env) {
  if (!env.UPLOADS) {
    return new Response("R2 bucket UPLOADS belum dikonfigurasi", { status: 500 });
  }

  const key = pathname.replace(/^\/images\//, "");
  if (!key) return new Response("Not found", { status: 404 });

  const object = await env.UPLOADS.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
