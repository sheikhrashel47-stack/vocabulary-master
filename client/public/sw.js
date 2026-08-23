const CACHE_NAME = "vocabulary-master-phase1-v2";
const scopePath = new URL(self.registration.scope).pathname;
const appShell = [scopePath, `${scopePath}index.html`];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(appShell)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE_NAME)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match(`${scopePath}index.html`)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") (await caches.open(CACHE_NAME)).put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) event.respondWith(networkFirst(event.request));
  else if (url.hostname === "mocktest84-g8afqveb.manus.space") event.respondWith(cacheFirst(event.request));
});
