const CACHE_NAME = "foodporn-share-v1";

// Share Target: empfängt Bilder die vom iPhone geteilt werden
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === "/Food-Foto-App/share-target" && event.request.method === "POST") {
    event.respondWith(handleShareTarget(event.request));
    return;
  }
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images");
    const validFiles = files.filter((f) => f instanceof File && f.type.startsWith("image/"));

    if (validFiles.length > 0) {
      const cache = await caches.open(CACHE_NAME);
      // Jede Datei einzeln cachen
      for (const file of validFiles) {
        const buf = await file.arrayBuffer();
        await cache.put(
          `/Food-Foto-App/pending-share/${encodeURIComponent(file.name)}`,
          new Response(buf, {
            headers: {
              "Content-Type": file.type,
              "X-File-Name": file.name
            }
          })
        );
      }
      // Manifest der wartenden Dateien speichern
      const manifest = validFiles.map((f) => f.name);
      await cache.put(
        "/Food-Foto-App/pending-share-manifest",
        new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/json" } })
      );
    }
  } catch (e) {
    console.error("[SW Share]", e);
  }
  // Zurück zur App weiterleiten
  return Response.redirect("/Food-Foto-App/?shared=1", 303);
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
