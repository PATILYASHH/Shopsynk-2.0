import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Show splash screen for 2.5 seconds (similar to WhatsApp)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 300) // Wait for fade-out animation
    }, 2500)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-100 to-orange-200 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300 pointer-events-none">
        <div className="text-center animate-fade-out">
          <img 
            src="/splash/splash-640x1136.png" 
            alt="Shopsynk" 
            className="w-32 h-32 mx-auto mb-6 animate-pulse"
            onError={(e) => {
              // Fallback to a simple logo if image fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="text-2xl font-bold text-orange-600 mb-2">Shopsynk</div>
          <div className="text-orange-500">Supplier Management</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-yellow-100 to-orange-200 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="text-center animate-bounce-slow">
        <img 
          src="/splash/splash-640x1136.png" 
          alt="Shopsynk" 
          className="w-32 h-32 mx-auto mb-6 drop-shadow-lg"
          onError={(e) => {
            // Fallback to text logo if image fails to load
            e.currentTarget.style.display = 'none'
            const fallback = document.createElement('div')
            fallback.className = "w-32 h-32 mx-auto mb-6 bg-orange-400 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg"
            fallback.textContent = "S"
            e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget)
          }}
        />
        <div className="text-2xl font-bold text-orange-600 mb-2 animate-pulse">Shopsynk</div>
        <div className="text-orange-500 animate-fade-in-delayed">Supplier Management</div>
        
        {/* Loading animation */}
        <div className="mt-8 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
