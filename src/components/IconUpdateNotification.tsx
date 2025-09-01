import { useEffect, useState } from 'react'

const IconUpdateNotification = () => {
  const [showNotification, setShowNotification] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has seen the icon update notification
    const hasSeenUpdate = localStorage.getItem('icon-update-v1-seen')
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true

    if (!hasSeenUpdate && isPWA) {
      // Show notification after 3 seconds
      const timer = setTimeout(() => {
        setShowNotification(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    setShowNotification(false)
    localStorage.setItem('icon-update-v1-seen', 'true')
  }

  const handleReinstall = () => {
    handleDismiss()
    // Show instructions for reinstalling
    alert(`To see our new logo:
1. Remove Shopsynk from your home screen
2. Visit shopsynk.netlify.app in your browser
3. Add to Home Screen again
4. Enjoy the updated branding!`)
  }

  if (!showNotification || dismissed) return null

  return (
    <div className="fixed top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-xl z-50 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="bg-white/20 rounded-full p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">🎉 New Logo Available!</h4>
          <p className="text-xs mt-1 opacity-90">
            We've updated our branding! Reinstall the app to see our new logo on your home screen.
          </p>
          <div className="flex space-x-2 mt-3">
            <button 
              onClick={handleReinstall}
              className="bg-white/20 text-xs px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
            >
              How to Update
            </button>
            <button 
              onClick={handleDismiss}
              className="text-xs px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default IconUpdateNotification
