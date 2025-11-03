// カスタムService Worker for PWA
const CACHE_NAME = 'qupid-pwa-v2'
const urlsToCache = [
  '/',
  '/icon.png',
  '/apple-icon.png'
]

// Service Worker インストール
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('Service Worker: Skip waiting')
        return self.skipWaiting()
      })
  )
})

// Service Worker アクティベート
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Claiming clients')
      return self.clients.claim()
    })
  )
})

// フェッチイベント
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Fetching:', event.request.url)
  
  const url = new URL(event.request.url)
  
  // APIリクエスト（localhost:8000など）はService Workerでインターセプトせず、直接fetchする
  if (event.request.url.includes('/auth/') || 
      event.request.url.includes('localhost:8000') ||
      event.request.url.includes('/api/') ||
      event.request.url.includes('/users/') ||
      !event.request.url.startsWith(self.location.origin)) {
    console.log('Service Worker: API request, bypassing cache:', event.request.url)
    // 直接fetchして返す
    event.respondWith(fetch(event.request))
    return
  }

  // HTMLドキュメント（ページ）は常にネットワークから取得（キャッシュしない）
  if (event.request.destination === 'document' || 
      event.request.headers.get('accept')?.includes('text/html')) {
    console.log('Service Worker: HTML document, bypassing cache:', event.request.url)
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
      }).catch(() => {
        // ネットワークエラーの場合のみオフラインページを返す
        return caches.match('/offline')
      })
    )
    return
  }

  // Next.jsの内部アセット（_next/static, _next/image, _next/data）もキャッシュしない
  if (url.pathname.includes('/_next/') || 
      url.pathname.includes('/_next/static/') ||
      url.pathname.includes('/_next/image') ||
      url.pathname.includes('/_next/data')) {
    console.log('Service Worker: Next.js asset, bypassing cache:', event.request.url)
    event.respondWith(fetch(event.request, { cache: 'no-store' }))
    return
  }

  // その他のリクエスト（静的リソースのみ）をキャッシュ
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにヒットした場合はキャッシュを返す
        if (response) {
          console.log('Service Worker: Cache hit:', event.request.url)
          return response
        }

        // キャッシュにない場合はネットワークから取得
        console.log('Service Worker: Cache miss, fetching from network:', event.request.url)
        return fetch(event.request)
          .then((response) => {
            // 有効なレスポンスかチェック
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // 静的リソース（画像、フォントなど）のみキャッシュに保存
            const contentType = response.headers.get('content-type') || ''
            if (event.request.method === 'GET' && 
                (contentType.startsWith('image/') || 
                 contentType.startsWith('font/') ||
                 contentType.includes('font') ||
                 contentType.startsWith('application/font'))) {
              const responseToCache = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache)
                })
            }

            return response
          })
      })
      .catch(() => {
        // ネットワークエラーの場合はオフラインページを返す（ドキュメントの場合のみ）
        if (event.request.destination === 'document') {
          return caches.match('/offline')
        }
        // その他の場合はエラーを返す
        return new Response('Network error', { status: 408 })
      })
  )
})

// メッセージイベント
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})