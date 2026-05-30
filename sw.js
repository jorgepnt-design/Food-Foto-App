// ─── Foodporn Service Worker ──────────────────────────────────────
// v5 — Offline-Cache + Share-Target

const CACHE_VERSION = "foodporn-v6";
const SHARE_CACHE   = "foodporn-share-v1";

// Alle statischen App-Shell-Dateien die gecacht werden sollen
const PRECACHE = [
  "/Food-Foto-App/",
  "/Food-Foto-App/index.html",
  "/Food-Foto-App/app.js",
  "/Food-Foto-App/styles.css",
  "/Food-Foto-App/icon-192.png",
  "/Food-Foto-App/icon-512.png",
  "/Food-Foto-App/apple-touch-icon.png",
  "/Food-Foto-App/site.webmanifest"
];

// ── Install: App-Shell vorabladen ─────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: alte Caches löschen ────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k !== SHARE_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => clients.claim())
  );
});

// ── Fetch: Cache-First für App-Shell, Network-First für API ──────
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Share-Target POST → separat behandeln
  if (url.pathname === "/Food-Foto-App/share-target" && e.request.method === "POST") {
    e.respondWith(handleShareTarget(e.request));
    return;
  }

  // API-Requests (Render-Backend) → immer Network, kein Cache
  if (url.hostname.includes("onrender.com") || url.pathname.includes("/api/")) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: "offline", photos: [] }), {
          headers: { "Content-Type": "application/json" }
        })
      )
    );
    return;
  }

  // GCS-Bilder (storage.googleapis.com oder cdn) → Network-First mit Cache-Fallback
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("googleusercontent.com") ||
    url.hostname.includes("cloudfront.net") ||
    url.hostname.includes("cdn.")
  ) {
    e.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        fetch(e.request)
          .then((res) => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          })
          .catch(() => cache.match(e.request))
      )
    );
    return;
  }

  // App-Shell (HTML, JS, CSS, Icons) → Cache-First, dann Network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // Nur erfolgreiche, gleich-origin Responses cachen
        if (res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Fallback: index.html für Navigation-Requests
        if (e.request.mode === "navigate") {
          return caches.match("/Food-Foto-App/index.html");
        }
      });
    })
  );
});

// ── Share Target: empfängt Bilder die vom iPhone geteilt werden ──
async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images");
    const validFiles = files.filter((f) => f instanceof File && f.type.startsWith("image/"));
    if (validFiles.length > 0) {
      const cache = await caches.open(SHARE_CACHE);
      for (const file of validFiles) {
        const buf = await file.arrayBuffer();
        await cache.put(
          `/Food-Foto-App/pending-share/${encodeURIComponent(file.name)}`,
          new Response(buf, {
            headers: { "Content-Type": file.type, "X-File-Name": file.name }
          })
        );
      }
      await cache.put(
        "/Food-Foto-App/pending-share-manifest",
        new Response(JSON.stringify(validFiles.map((f) => f.name)), {
          headers: { "Content-Type": "application/json" }
        })
      );
    }
  } catch (e) {
    console.error("[SW Share]", e);
  }
  return Response.redirect("/Food-Foto-App/?shared=1", 303);
}
