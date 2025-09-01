import { supabase } from '../lib/supabase'
import { NotificationData } from '../types/notifications'

export class NotificationService {
  // Send notification to specific users (other account owners)
  static async sendNotificationToAccountOwners(
    excludeUserId: string,
    notificationData: {
      type: NotificationData['type']
      title: string
      message: string
      data?: NotificationData['data']
    }
  ) {
    try {
      // First, get all users who have access to the same business/account
      // This assumes you have some way to identify shared accounts
      // For now, we'll get all users except the current one
      const { data: otherUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', excludeUserId)

      if (usersError) throw usersError
      if (!otherUsers || otherUsers.length === 0) return

      // Create notifications for each user
      const notifications = otherUsers.map(user => ({
        user_id: user.id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) throw error

      console.log(`Notifications sent to ${otherUsers.length} users`)
    } catch (error) {
      console.error('Error sending notifications:', error)
    }
  }

  // Send transaction notification
  static async notifyTransactionCreated(
    userId: string,
    userName: string,
    amount: number,
    supplierName: string,
    transactionId: string,
    supplierId: string
  ) {
    await this.sendNotificationToAccountOwners(userId, {
      type: 'transaction_created',
      title: 'New Transaction Added',
      message: `${userName} purchased ₹${amount.toLocaleString()} supplies from ${supplierName}`,
      data: {
        transactionId,
        supplierId,
        amount,
        supplierName,
        userAction: 'created',
        userName
      }
    })
  }

  // Send transaction update notification
  static async notifyTransactionUpdated(
    userId: string,
    userName: string,
    amount: number,
    supplierName: string,
    transactionId: string,
    supplierId: string
  ) {
    await this.sendNotificationToAccountOwners(userId, {
      type: 'transaction_updated',
      title: 'Transaction Updated',
      message: `${userName} updated transaction with ${supplierName} (₹${amount.toLocaleString()})`,
      data: {
        transactionId,
        supplierId,
        amount,
        supplierName,
        userAction: 'updated',
        userName
      }
    })
  }

  // Send transaction deletion notification
  static async notifyTransactionDeleted(
    userId: string,
    userName: string,
    amount: number,
    supplierName: string,
    supplierId: string
  ) {
    await this.sendNotificationToAccountOwners(userId, {
      type: 'transaction_deleted',
      title: 'Transaction Deleted',
      message: `${userName} deleted transaction with ${supplierName} (₹${amount.toLocaleString()})`,
      data: {
        supplierId,
        amount,
        supplierName,
        userAction: 'deleted',
        userName
      }
    })
  }

  // Send payment notification
  static async notifyPaymentMade(
    userId: string,
    userName: string,
    amount: number,
    supplierName: string,
    supplierId: string
  ) {
    await this.sendNotificationToAccountOwners(userId, {
      type: 'payment_made',
      title: 'Payment Made',
      message: `${userName} made payment of ₹${amount.toLocaleString()} to ${supplierName}`,
      data: {
        supplierId,
        amount,
        supplierName,
        userAction: 'payment',
        userName
      }
    })
  }

  // Send supplier addition notification
  static async notifySupplierAdded(
    userId: string,
    userName: string,
    supplierName: string,
    supplierId: string
  ) {
    await this.sendNotificationToAccountOwners(userId, {
      type: 'supplier_added',
      title: 'New Supplier Added',
      message: `${userName} added new supplier: ${supplierName}`,
      data: {
        supplierId,
        supplierName,
        userAction: 'added',
        userName
      }
    })
  }

  // Request browser notification permission
  static async requestNotificationPermission() {
    if ('Notification' in window && window.Notification.permission === 'default') {
      const permission = await window.Notification.requestPermission()
      return permission === 'granted'
    }
    return window.Notification.permission === 'granted'
  }
}
