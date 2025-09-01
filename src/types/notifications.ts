export interface NotificationData {
  id: string
  userId: string
  type: 'transaction_created' | 'transaction_updated' | 'transaction_deleted' | 'supplier_added' | 'payment_made'
  title: string
  message: string
  data?: {
    transactionId?: string
    supplierId?: string
    amount?: number
    supplierName?: string
    userAction?: string
    userName?: string
  }
  read: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationContextType {
  notifications: NotificationData[]
  unreadCount: number
  addNotification: (notification: Omit<NotificationData, 'id' | 'userId' | 'read' | 'createdAt' | 'updatedAt'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotification: (notificationId: string) => void
  clearAllNotifications: () => void
}
