// Service Worker v7 — deaktiviert, deregistriert sich selbst
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => clients.claim())
  );
});
// Alle Requests direkt ans Netzwerk — kein Caching
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.pathname === "/Food-Foto-App/share-target" && e.request.method === "POST") {
    // Share-Target bleibt funktionsfähig
    return;
  }
  // Kein cache.match — immer Netzwerk
});
