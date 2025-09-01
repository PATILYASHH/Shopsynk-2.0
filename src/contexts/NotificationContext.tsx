import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { NotificationData, NotificationContextType } from '../types/notifications'
import { NotificationCleanupService } from '../services/NotificationCleanupService'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const { user } = useAuth()

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Load notifications when user logs in
  useEffect(() => {
    if (!user?.id) return

    loadNotifications()
    setupRealtimeSubscription()
    
    // Run cleanup when user logs in
    NotificationCleanupService.limitNotificationsPerUser(user.id, 50)
    
    // Set up periodic cleanup (every 30 minutes)
    const cleanupInterval = setInterval(() => {
      NotificationCleanupService.limitNotificationsPerUser(user.id, 50)
    }, 30 * 60 * 1000) // 30 minutes

    return () => {
      clearInterval(cleanupInterval)
    }
  }, [user?.id])

  const loadNotifications = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const formattedNotifications: NotificationData[] = data.map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: notification.read,
        createdAt: notification.created_at,
        updatedAt: notification.updated_at
      }))

      setNotifications(formattedNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user?.id) return

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          const newNotification: NotificationData = {
            id: payload.new.id,
            userId: payload.new.user_id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            data: payload.new.data,
            read: payload.new.read,
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at
          }
          
          setNotifications(prev => [newNotification, ...prev])
          
          // Show browser notification if supported
          if ('Notification' in window && window.Notification.permission === 'granted') {
            new window.Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/pwa opning/SHOP.png',
              tag: newNotification.id
            })
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const addNotification = async (notificationData: Omit<NotificationData, 'id' | 'userId' | 'read' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          read: false
        })
        .select()
        .single()

      if (error) throw error

      const newNotification: NotificationData = {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        read: data.read,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      setNotifications(prev => [newNotification, ...prev])
    } catch (error) {
      console.error('Error adding notification:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )

      // Auto-delete read notification after 5 seconds (aggressive cleanup)
      NotificationCleanupService.deleteReadNotification(notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const clearNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      )
    } catch (error) {
      console.error('Error clearing notification:', error)
    }
  }

  const clearAllNotifications = async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setNotifications([])
    } catch (error) {
      console.error('Error clearing all notifications:', error)
    }
  }

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
