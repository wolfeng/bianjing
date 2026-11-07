// 汴京图考 (Bianjing) - PWA Service Worker
const CACHE_NAME = 'bianjing-pwa-v1.2'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/data/places_wgs84.geojson',
  '/data/places_gcj02.geojson',
  '/data/bianjing_wgs84.geojson',
  '/data/bianjing_gcj02.geojson',
  '/data/legend.json',
  '/data/places.csv',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon_gate.png',
  '/icons/icon_palace.png',
  '/icons/icon_pagoda.png',
  '/icons/icon_bridge.png',
  '/icons/icon_water_gate.png',
  '/icons/icon_tavern.png',
  '/icons/icon_courtyard.png',
  '/icons/icon_garden.png',
  '/icons/icon_street.png',
  '/icons/icon_daqingdian.png',
  '/icons/icon_tieta.png',
  '/icons/icon_fanta.png'
]

// 1. Install: Precache App Shell & Core Data
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// 2. Activate: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// 3. Fetch strategy:
// - App Shell & Local Assets: Stale-While-Revalidate (instant offline access, background updates)
// - Tianditu Map Tiles: Network first with Cache fallback (dynamic caching of explored tiles)
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // A. Tianditu Map Tiles (Caching explored regions)
  if (url.hostname.includes('tianditu.gov.cn')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const networkRes = await fetch(req)
          if (networkRes.ok) {
            cache.put(req, networkRes.clone())
          }
          return networkRes
        } catch (err) {
          const cachedRes = await cache.match(req)
          if (cachedRes) return cachedRes
          throw err
        }
      })
    )
    return
  }

  // B. Navigation requests (HTML SPA fallback)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html')
      })
    )
    return
  }

  // C. Local assets and data files: Cache First with Background Update (Stale-While-Revalidate)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        const fetchPromise = fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes.clone()))
          }
          return networkRes
        }).catch(() => null)

        return cachedRes || fetchPromise
      })
    )
  }
})
