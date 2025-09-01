import { useState, useEffect } from 'react'
import { Trash2, BarChart3, Clock, Database, RefreshCw } from 'lucide-react'
import { NotificationCleanupService } from '../services/NotificationCleanupService'

interface NotificationStats {
  total: number
  read: number
  unread: number
  readPercentage: number
}

const NotificationCleanupPanel = () => {
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    read: 0,
    unread: 0,
    readPercentage: 0
  })
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [lastCleanup, setLastCleanup] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    
    // Check last cleanup time
    const lastCleanupTime = localStorage.getItem('last_notification_cleanup')
    if (lastCleanupTime) {
      setLastCleanup(lastCleanupTime)
    }
  }, [])

  const loadStats = async () => {
    const notificationStats = await NotificationCleanupService.getNotificationStats()
    setStats(notificationStats)
  }

  const handleManualCleanup = async () => {
    setIsCleaningUp(true)
    
    try {
      await NotificationCleanupService.performFullCleanup()
      
      // Update last cleanup time
      const now = new Date().toLocaleString()
      localStorage.setItem('last_notification_cleanup', now)
      setLastCleanup(now)
      
      // Reload stats
      setTimeout(loadStats, 1000)
      
      alert('✅ Database cleanup completed successfully!')
    } catch (error) {
      console.error('Cleanup error:', error)
      alert('❌ Cleanup failed. Please try again.')
    } finally {
      setIsCleaningUp(false)
    }
  }

  const handleQuickCleanup = async () => {
    setIsCleaningUp(true)
    
    try {
      // Just clean read notifications older than 1 day
      await NotificationCleanupService.cleanupReadNotifications()
      setTimeout(loadStats, 1000)
      alert('✅ Quick cleanup completed!')
    } catch (error) {
      console.error('Quick cleanup error:', error)
      alert('❌ Quick cleanup failed.')
    } finally {
      setIsCleaningUp(false)
    }
  }

  const getStorageRecommendation = () => {
    if (stats.total > 500) {
      return {
        level: 'high',
        message: 'High storage usage detected. Recommend immediate cleanup.',
        color: 'text-red-600 bg-red-50 border-red-200'
      }
    } else if (stats.total > 200) {
      return {
        level: 'medium',
        message: 'Moderate storage usage. Consider cleanup.',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      }
    } else {
      return {
        level: 'low',
        message: 'Storage usage is optimal.',
        color: 'text-green-600 bg-green-50 border-green-200'
      }
    }
  }

  const recommendation = getStorageRecommendation()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notification Storage</h3>
            <p className="text-sm text-gray-500">Manage database efficiency</p>
          </div>
        </div>
        <button
          onClick={loadStats}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh stats"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-600">Unread</span>
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{stats.unread}</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600">Read</span>
          </div>
          <div className="text-2xl font-bold text-green-700 mt-1">{stats.read}</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-purple-600">Read %</span>
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{stats.readPercentage}%</div>
        </div>
      </div>

      {/* Storage Recommendation */}
      <div className={`rounded-lg border p-4 mb-6 ${recommendation.color}`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-current"></div>
          <span className="font-medium">Storage Status</span>
        </div>
        <p className="text-sm mt-1">{recommendation.message}</p>
      </div>

      {/* Cleanup Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Full Cleanup</h4>
            <p className="text-sm text-gray-500">
              Remove old notifications, keep latest 100 per user
            </p>
          </div>
          <button
            onClick={handleManualCleanup}
            disabled={isCleaningUp}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isCleaningUp ? 'Cleaning...' : 'Full Cleanup'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Quick Cleanup</h4>
            <p className="text-sm text-gray-500">
              Remove only read notifications older than 3 days
            </p>
          </div>
          <button
            onClick={handleQuickCleanup}
            disabled={isCleaningUp}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>{isCleaningUp ? 'Cleaning...' : 'Quick Cleanup'}</span>
          </button>
        </div>
      </div>

      {/* Last Cleanup Info */}
      {lastCleanup && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last cleanup: {lastCleanup}
          </p>
        </div>
      )}

      {/* Auto Cleanup Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Auto-cleanup active</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          • Read notifications auto-deleted after 5 seconds<br />
          • User notifications limited to 50 per user<br />
          • Cleanup runs every 30 minutes
        </p>
      </div>
    </div>
  )
}

export default NotificationCleanupPanel
