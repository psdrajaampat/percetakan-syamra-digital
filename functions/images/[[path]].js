// Menyajikan file dari R2 bucket UPLOADS secara publik di /images/<key>
export async function onRequestGet({ params, env }) {
  if (!env.UPLOADS) {
    return new Response("R2 bucket UPLOADS belum dikonfigurasi", { status: 500 });
  }

  const pathParts = Array.isArray(params.path) ? params.path : [params.path];
  const key = pathParts.filter(Boolean).join("/");
  if (!key) return new Response("Not found", { status: 404 });

  const object = await env.UPLOADS.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
