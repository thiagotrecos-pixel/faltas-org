/* Falta.org — service worker do PWA.
 *
 * Estratégia:
 *  - App shell (precached): documentos HTML, manifest e ícones — serve offline.
 *  - Navegações (HTML): network-first, com fallback para o cache offline.
 *  - API do PocketBase (/api/): network-only — dados nunca vêm do cache velho.
 *  - Estáticos (JS/CSS/imagens da origem): stale-while-revalidate.
 */

const VERSAO_CACHE = 'faltaorg-v2'
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon.svg',
  '/icons/maskable.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSAO_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== VERSAO_CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // 1. API do PocketBase — nunca cacheia (evita servir dado velho).
  if (url.pathname.startsWith('/api/')) return

  // 2. Navegações (HTML) — network-first com fallback offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone()
          caches.open(VERSAO_CACHE).then((cache) => cache.put('/index.html', copia))
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    )
    return
  }

  // 3. Demais requisições da própria origem — stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cacheado) => {
        const rede = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              const copia = res.clone()
              caches.open(VERSAO_CACHE).then((cache) => cache.put(req, copia))
            }
            return res
          })
          .catch(() => cacheado)
        return cacheado || rede
      }),
    )
  }
})
