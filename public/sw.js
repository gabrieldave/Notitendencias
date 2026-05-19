/* Service worker mínimo: criterio de instalación PWA sin cache agresivo. */
const CACHE = "notitendencias-pwa-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(["/ia", "/branding/logo-icon.png"]).catch(() => undefined),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((r) => r ?? caches.match("/ia"))),
  );
});
