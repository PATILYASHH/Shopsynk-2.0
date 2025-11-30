import { DollarSign } from 'lucide-react'

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-green-500 border-r-blue-500"></div>
        {/* Inner pulsing circle */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-400 to-blue-500 animate-pulse"></div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <DollarSign className="h-8 w-8 text-white animate-bounce" />
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-gray-600 font-medium">Loading your finances</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner