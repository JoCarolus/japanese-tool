const CACHE_VERSION = 'trilingo-v3'
const CACHE_NAME = CACHE_VERSION

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Install - cache static assets and skip waiting immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate - delete ALL old caches and claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('Deleting old cache:', key)
          return caches.delete(key)
        })
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch - network first for HTML and API, cache first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Always network for API routes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Always network first for HTML pages (ensures fresh app shell)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/').then(r => r || fetch(event.request))
      )
    )
    return
  }

  // Cache first for static assets (images, fonts, etc.)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      }).catch(() => cached)
    })
  )
})

// Listen for skip-waiting message from the app
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting()
})
