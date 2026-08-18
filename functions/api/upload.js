import { json, errorJson, isAuthenticated } from "../_utils.js";

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

// POST /api/upload — multipart/form-data: file, category ("galeri" | "owner" | "misc")
export async function onRequestPost({ request, env }) {
  const authed = await isAuthenticated(request, env);
  if (!authed) return errorJson("Unauthorized", 401);

  if (!env.UPLOADS) {
    return errorJson("R2 bucket UPLOADS belum di-bind di Cloudflare Pages.", 500);
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

// DELETE /api/upload  { key: "galeri/xxxx.jpg" }
export async function onRequestDelete({ request, env }) {
  const authed = await isAuthenticated(request, env);
  if (!authed) return errorJson("Unauthorized", 401);

  if (!env.UPLOADS) {
    return errorJson("R2 bucket UPLOADS belum di-bind di Cloudflare Pages.", 500);
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
