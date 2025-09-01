const CACHE_NAME = 'shopsynk-v1.0.0'
const OFFLINE_URL = '/offline.html'

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Add your main CSS and JS files here (they'll be generated during build)
]

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('[ServiceWorker] Cache failed:', error)
      })
  )
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Take control of all pages under this SW's scope
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip requests to external domains (like Supabase)
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('[ServiceWorker] Found in cache:', event.request.url)
          return response
        }

        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache successful responses
              if (event.request.url.indexOf('http') === 0) {
                cache.put(event.request, responseToCache)
              }
            })

          return response
        }).catch(() => {
          // If both cache and network fail, show offline page for navigate requests
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL)
          }
        })
      })
  )
})

// Background sync for when network is restored
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag)
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event)
  
  const options = {
    body: event.data ? event.data.text() : 'Something has happened!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Shopsynk',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Shopsynk', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received:', event)

  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received:', event)
  
  if (!event.data) {
    return
  }

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/pwa opning/SHOP.png',
    badge: '/pwa opning/SHOP.png',
    image: data.image,
    tag: data.tag || 'shopsynk-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/pwa opning/SHOP.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/pwa opning/SHOP.png'
      }
    ],
    data: {
      url: data.url || '/',
      notificationId: data.notificationId
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  // Handle notification click - open the app or specific page
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      
      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )

  // Mark notification as read if we have the notification ID
  if (event.notification.data?.notificationId) {
    // Send message to main app to mark as read
    event.waitUntil(
      clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'MARK_NOTIFICATION_READ',
            notificationId: event.notification.data.notificationId
          })
        })
      })
    )
  }
})

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  console.log('[ServiceWorker] Notification closed:', event)
  // Optional: Track notification dismissals
})

// Function to handle background sync
async function doBackgroundSync() {
  try {
    // Here you can implement background sync logic
    // For example, sync pending transactions when network is restored
    console.log('[ServiceWorker] Performing background sync')
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error)
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
