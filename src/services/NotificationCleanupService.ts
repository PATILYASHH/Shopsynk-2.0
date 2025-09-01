import { supabase } from '../lib/supabase'

export class NotificationCleanupService {
  // Auto-cleanup old notifications (runs periodically)
  static async cleanupOldNotifications() {
    try {
      // Delete notifications older than 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', sevenDaysAgo.toISOString())

      if (error) throw error

      console.log('✅ Old notifications cleaned up successfully')
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error)
    }
  }

  // Delete read notifications older than 3 days
  static async cleanupReadNotifications() {
    try {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('read', true)
        .lt('created_at', threeDaysAgo.toISOString())

      if (error) throw error

      console.log('✅ Read notifications cleaned up successfully')
    } catch (error) {
      console.error('❌ Error cleaning up read notifications:', error)
    }
  }

  // Keep only the latest notifications per user
  static async limitNotificationsPerUser(userId: string, limit: number = 50) {
    try {
      // Get all notifications for user, ordered by creation date
      const { data: allNotifications, error: fetchError } = await supabase
        .from('notifications')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      if (!allNotifications || allNotifications.length <= limit) return

      // Keep only the latest notifications, delete the rest
      const notificationsToDelete = allNotifications.slice(limit)
      const idsToDelete = notificationsToDelete.map(n => n.id)

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('id', idsToDelete)

      if (deleteError) throw deleteError

      console.log(`✅ Kept latest ${limit} notifications, removed ${idsToDelete.length} old ones`)
    } catch (error) {
      console.error('❌ Error limiting notifications per user:', error)
    }
  }

  // Limit notifications for all users
  static async limitAllUsersNotifications() {
    try {
      // Get all unique user IDs using distinct
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('user_id')

      if (notificationsError) throw notificationsError
      if (!notifications) return

      const uniqueUserIds = [...new Set(notifications.map((n: any) => n.user_id))]

      // Clean up for each user (keep 100 per user)
      for (const userId of uniqueUserIds) {
        if (typeof userId === 'string') {
          await this.limitNotificationsPerUser(userId, 100)
        }
      }
    } catch (error) {
      console.error('❌ Error limiting notifications for all users:', error)
    }
  }

  // Comprehensive cleanup - run this periodically
  static async performFullCleanup() {
    console.log('🧹 Starting notification database cleanup...')
    
    // 1. Delete notifications older than 7 days
    await this.cleanupOldNotifications()
    
    // 2. Delete read notifications older than 3 days
    await this.cleanupReadNotifications()
    
    // 3. Keep only latest 100 notifications per user
    await this.limitAllUsersNotifications()
    
    console.log('✅ Full notification cleanup completed')
  }

  // Auto-delete notifications when they're marked as read (aggressive cleanup)
  static async deleteReadNotification(notificationId: string) {
    try {
      // Wait 5 seconds then delete the read notification
      setTimeout(async () => {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)
          .eq('read', true)

        if (error) {
          console.error('Error auto-deleting read notification:', error)
        } else {
          console.log('✅ Auto-deleted read notification')
        }
      }, 5000) // 5 second delay
    } catch (error) {
      console.error('Error in auto-delete process:', error)
    }
  }

  // Get database usage stats
  static async getNotificationStats() {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })

      if (error) throw error

      const { count: readCount, error: readError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', true)

      if (readError) throw readError

      const { count: unreadCount, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)

      if (unreadError) throw unreadError

      const total = count || 0
      const read = readCount || 0
      const unread = unreadCount || 0
      const readPercentage = total > 0 ? Math.round((read / total) * 100) : 0

      return {
        total,
        read,
        unread,
        readPercentage
      }
    } catch (error) {
      console.error('Error getting notification stats:', error)
      return { total: 0, read: 0, unread: 0, readPercentage: 0 }
    }
  }
}
