// PhysicaAI Service Worker v2
// Caches the app shell so it loads instantly on phones
// even with a slow connection.

const CACHE_NAME = "physica-ai-v2";
const STATIC_CACHE = "physica-static-v2";

// App shell — files that make the UI work offline
const APP_SHELL = [
  "/",
  "/manifest.json",
  // Google Fonts (pre-cache on first load)
  "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800;900&family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap",
];

// ── INSTALL: cache the app shell ────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Use individual adds so one failure doesn't block everything
      return Promise.allSettled(
        APP_SHELL.map((url) =>
          cache.add(url).catch((e) => {
            console.warn("[SW] Failed to cache:", url, e);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: clean up old caches ───────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: network-first for API, cache-first for assets ────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ❌ Never intercept:
  //   • API calls to Anthropic (always need live network)
  //   • Our own /api/* proxy routes
  //   • Chrome extensions
  if (
    url.hostname === "api.anthropic.com" ||
    url.pathname.startsWith("/api/") ||
    url.protocol === "chrome-extension:"
  ) {
    return; // fall through to network
  }

  // ✅ API routes on our own domain: network only
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // ✅ Navigation requests (HTML pages): network first, fallback to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // ✅ Static assets (_next/static, fonts, images): cache first, then network
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // ✅ Everything else: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── PUSH NOTIFICATIONS (optional, future use) ───────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || "PhysicaAI", {
    body: data.body || "Time to review your flashcards!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    data: { url: data.url || "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});
