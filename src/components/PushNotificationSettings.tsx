import React, { useState, useEffect } from 'react'
import { pushNotificationService } from '../services/PushNotificationService'
import { useAuth } from '../contexts/AuthContext'

interface PushNotificationSettingsProps {
  className?: string
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ 
  className = "" 
}) => {
  const { user } = useAuth()
  const [status, setStatus] = useState({
    supported: false,
    permission: 'default' as NotificationPermission,
    subscribed: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    const currentStatus = await pushNotificationService.getSubscriptionStatus()
    setStatus(currentStatus)
  }

  const handleEnableNotifications = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      // Initialize service
      const initialized = await pushNotificationService.initialize()
      if (!initialized) {
        throw new Error('Push notifications not supported')
      }

      // Request permission
      const permissionGranted = await pushNotificationService.requestPermission()
      if (!permissionGranted) {
        throw new Error('Permission denied')
      }

      // Subscribe
      const subscribed = await pushNotificationService.subscribe(user.id)
      if (!subscribed) {
        throw new Error('Failed to subscribe')
      }

      await checkStatus()
    } catch (error) {
      console.error('Failed to enable push notifications:', error)
      alert('Failed to enable push notifications. Please try again.')
    }
    setLoading(false)
  }

  const handleDisableNotifications = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const success = await pushNotificationService.unsubscribe(user.id)
      if (!success) {
        throw new Error('Failed to unsubscribe')
      }
      await checkStatus()
    } catch (error) {
      console.error('Failed to disable push notifications:', error)
      alert('Failed to disable push notifications. Please try again.')
    }
    setLoading(false)
  }

  if (!status.supported) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Push notifications not supported
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Your browser doesn't support push notifications.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {status.subscribed ? (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M13.828 8.172a1 1 0 011.414 0A5.983 5.983 0 0117 12a5.983 5.983 0 01-1.758 3.828 1 1 0 11-1.414-1.414A3.987 3.987 0 0015 12a3.987 3.987 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">
              Push Notifications
            </h3>
            <p className="text-sm text-gray-600">
              {status.subscribed 
                ? 'Get notified even when the app is closed'
                : 'Enable to receive notifications when app is closed'
              }
            </p>
            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
              <span>Permission: {status.permission}</span>
              <span>Status: {status.subscribed ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          {status.permission === 'denied' ? (
            <div className="text-xs text-red-600 text-right">
              <p>Permission denied.</p>
              <p>Please enable in browser settings.</p>
            </div>
          ) : (
            <button
              onClick={status.subscribed ? handleDisableNotifications : handleEnableNotifications}
              disabled={loading}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                status.subscribed
                  ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                  : 'text-white bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
              } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {status.subscribed ? 'Disable' : 'Enable'}
            </button>
          )}
        </div>
      </div>
      
      {status.subscribed && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                ✨ You'll receive notifications for new transactions, payments, and supplier updates even when the app is closed!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PushNotificationSettings
