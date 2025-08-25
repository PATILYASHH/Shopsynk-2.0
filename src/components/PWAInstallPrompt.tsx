import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if app is running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://')
    setIsStandalone(standalone)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Clean up
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true')
  }

  // Don't show if already installed or dismissed in this session
  if (isStandalone || sessionStorage.getItem('installPromptDismissed') === 'true') {
    return null
  }

  // Show different prompt for iOS
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg border border-blue-500">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Install Shopsynk</h3>
            <p className="text-xs mt-1 opacity-90">
              Install this app on your iPhone: tap <span className="font-bold">Share</span> and then <span className="font-bold">Add to Home Screen</span>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 p-1 hover:bg-blue-700 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Show install prompt for other devices
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg border border-blue-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <Download className="h-5 w-5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">Install Shopsynk App</h3>
              <p className="text-xs mt-1 opacity-90">
                Get the full app experience with offline access and notifications
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleInstallClick}
              className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-blue-700 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default PWAInstallPrompt
