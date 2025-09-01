import { supabase } from '../lib/supabase'

export interface PushSubscriptionData {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent?: string
  created_at?: string
}

export class PushNotificationService {
  private static instance: PushNotificationService
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    try {
      // Check if service workers and push notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications are not supported in this browser')
        return false
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully')

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  // Request notification permission from user
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    let permission = Notification.permission
    
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission === 'granted') {
      console.log('Notification permission granted')
      return true
    } else {
      console.warn('Notification permission denied')
      return false
    }
  }

  // Subscribe to push notifications
  async subscribe(userId: string): Promise<boolean> {
    try {
      if (!this.registration) {
        await this.initialize()
      }

      if (!this.registration) {
        throw new Error('Service worker registration failed')
      }

      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription()
      if (existingSubscription) {
        // Update existing subscription in database
        await this.saveSubscription(existingSubscription, userId)
        return true
      }

      // Create new subscription
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // VAPID public key - you'll need to generate this
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80YS_qZfKsRBF2uMi85KZJw-q9_-k9Q_nM8F1jQk2dGvQQQ6VDNt-3hc'
        ) as BufferSource
      })

      // Save subscription to database
      await this.saveSubscription(subscription, userId)
      
      console.log('Push notification subscription successful')
      return true
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return false
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      if (!this.registration) {
        return false
      }

      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await this.removeSubscription(userId)
        console.log('Push notification unsubscribed successfully')
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  // Save subscription to Supabase
  private async saveSubscription(subscription: PushSubscription, userId: string): Promise<void> {
    const keys = subscription.getKey ? {
      p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
      auth: this.arrayBufferToBase64(subscription.getKey('auth'))
    } : { p256dh: '', auth: '' }

    const subscriptionData: PushSubscriptionData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: navigator.userAgent
    }

    // Upsert subscription (insert or update if exists)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      })

    if (error) {
      throw new Error(`Failed to save push subscription: ${error.message}`)
    }
  }

  // Remove subscription from database
  private async removeSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Failed to remove push subscription:', error)
    }
  }

  // Check if user is subscribed
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.registration) {
        return false
      }

      const subscription = await this.registration.pushManager.getSubscription()
      return subscription !== null
    } catch (error) {
      console.error('Failed to check subscription status:', error)
      return false
    }
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<{
    supported: boolean
    permission: NotificationPermission
    subscribed: boolean
  }> {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    const permission = supported ? Notification.permission : 'denied'
    const subscribed = supported ? await this.isSubscribed() : false

    return { supported, permission, subscribed }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return ''
    
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

export const pushNotificationService = PushNotificationService.getInstance()
