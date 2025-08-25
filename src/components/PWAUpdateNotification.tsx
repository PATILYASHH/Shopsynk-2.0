import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'

const PWAUpdateNotification = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for waiting service worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          setShowUpdatePrompt(true)
        }

        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker)
                setShowUpdatePrompt(true)
              }
            })
          }
        })
      })

      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }, [])

  const handleUpdateClick = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      setShowUpdatePrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdatePrompt(false)
  }

  if (!showUpdatePrompt) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg border border-green-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <RefreshCw className="h-5 w-5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">App Update Available</h3>
            <p className="text-xs mt-1 opacity-90">
              A new version of Shopsynk is ready to install
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleUpdateClick}
            className="bg-white text-green-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
          >
            Update
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-green-700 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PWAUpdateNotification
