import { json, errorJson, createSessionToken, sessionCookieHeader } from "../_utils.js";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return errorJson(
      "Server belum dikonfigurasi. Set ADMIN_PASSWORD & SESSION_SECRET sebagai secret di Cloudflare Pages.",
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
    // delay kecil untuk memperlambat brute-force sederhana
    await new Promise((r) => setTimeout(r, 400));
    return errorJson("Password salah", 401);
  }

  const token = await createSessionToken(env.SESSION_SECRET);
  return json(
    { ok: true },
    200,
    { "Set-Cookie": sessionCookieHeader(token) }
  );
}
