import { supabase } from './supabase'
import { GoogleDriveService, BackupData } from './googleDrive'

export class BackupService {
  private static instance: BackupService
  private googleDriveService: GoogleDriveService

  private constructor() {
    this.googleDriveService = GoogleDriveService.getInstance()
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  // Export all user data
  async exportUserData(userId: string, userEmail: string): Promise<BackupData | null> {
    try {
      // Fetch all suppliers
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)

      if (suppliersError) throw suppliersError

      // Fetch all transactions with supplier details
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          supplier:suppliers(name, contact_person, phone, email)
        `)
        .eq('user_id', userId)

      if (transactionsError) throw transactionsError

      const backupData: BackupData = {
        suppliers: suppliers || [],
        transactions: transactions || [],
        exportDate: new Date().toISOString(),
        userEmail
      }

      return backupData
    } catch (error) {
      console.error('Error exporting user data:', error)
      return null
    }
  }

  // Create backup and upload to Google Drive
  async createBackup(userId: string, userEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.googleDriveService.isConnected()) {
        return {
          success: false,
          message: 'Google Drive not connected. Please connect first.'
        }
      }

      // Export user data
      const backupData = await this.exportUserData(userId, userEmail)
      if (!backupData) {
        return {
          success: false,
          message: 'Failed to export user data.'
        }
      }

      // Create backup on Google Drive
      const result = await this.googleDriveService.createBackup(backupData)
      
      if (result.success) {
        // Store backup record in database
        await this.recordBackup(userId, result.fileId || '', backupData)
        
        return {
          success: true,
          message: 'Backup created successfully on Google Drive!'
        }
      } else {
        return {
          success: false,
          message: 'Failed to upload backup to Google Drive.'
        }
      }
    } catch (error) {
      console.error('Backup creation error:', error)
      return {
        success: false,
        message: 'An error occurred during backup creation.'
      }
    }
  }

  // Record backup information in database
  private async recordBackup(userId: string, fileId: string, backupData: BackupData): Promise<void> {
    try {
      // Create backups table entry
      await supabase.from('user_backups').insert([
        {
          user_id: userId,
          backup_date: new Date().toISOString(),
          google_drive_file_id: fileId,
          suppliers_count: backupData.suppliers.length,
          transactions_count: backupData.transactions.length,
          backup_size: JSON.stringify(backupData).length,
          status: 'completed'
        }
      ])
    } catch (error) {
      console.error('Error recording backup:', error)
    }
  }

  // Setup automatic backup
  async setupAutoBackup(userId: string, userEmail: string): Promise<void> {
    const backupCallback = async () => {
      console.log('Running automatic backup...')
      const result = await this.createBackup(userId, userEmail)
      console.log('Auto backup result:', result.message)
      
      // Send email notification (mock implementation)
      await this.sendBackupNotification(userEmail, result.success)
    }

    await this.googleDriveService.scheduleAutoBackup(backupCallback)
  }

  // Send backup notification email (mock implementation)
  private async sendBackupNotification(userEmail: string, success: boolean): Promise<void> {
    // In production, you would integrate with an email service like SendGrid, Nodemailer, etc.
    console.log(`Backup notification sent to ${userEmail}: ${success ? 'Success' : 'Failed'}`)
    
    // Example with Supabase Edge Functions or external email service:
    /*
    try {
      const emailData = {
        to: userEmail,
        subject: success ? 'Shopsynk Backup Completed' : 'Shopsynk Backup Failed',
        html: success 
          ? `<p>Your Shopsynk data has been successfully backed up to Google Drive.</p>`
          : `<p>Your Shopsynk backup failed. Please check your Google Drive connection.</p>`
      }
      
      // Send via Supabase Edge Function or external service
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      })
    } catch (error) {
      console.error('Failed to send backup notification:', error)
    }
    */
  }

  // Get backup history
  async getBackupHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_backups')
        .select('*')
        .eq('user_id', userId)
        .order('backup_date', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching backup history:', error)
      return []
    }
  }

  // Download backup data as JSON
  downloadBackupFile(backupData: BackupData): void {
    const jsonString = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `shopsynk-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}
