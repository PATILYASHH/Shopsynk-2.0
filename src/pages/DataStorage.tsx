import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { BackupService } from '../lib/backupService'
import { 
  HardDrive, 
  Download, 
  Database, 
  Users,
  ShoppingBag,
  Receipt,
  CloudDownload,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface StorageStats {
  totalTransactions: number
  totalSuppliers: number
  totalOwners: number
  estimatedSizeKB: number
  lastBackup: string | null
  dataBreakdown: {
    transactions: { count: number; sizeKB: number }
    suppliers: { count: number; sizeKB: number }
    owners: { count: number; sizeKB: number }
    settings: { count: number; sizeKB: number }
  }
}

const DataStorage = () => {
  const { user } = useAuth()
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadFormat, setDownloadFormat] = useState('pdf')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupStatus, setBackupStatus] = useState<string>('')

  useEffect(() => {
    fetchStorageStats()
  }, [user])

  const fetchStorageStats = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get counts for each data type
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: suppliersCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: ownersCount } = await supabase
        .from('business_owners')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Get last backup info
      const { data: lastBackupData } = await supabase
        .from('user_backups')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Estimate storage sizes (rough calculation)
      const avgTransactionSize = 0.5 // KB per transaction
      const avgSupplierSize = 0.3 // KB per supplier  
      const avgOwnerSize = 0.2 // KB per owner
      const settingsSize = 0.1 // KB for settings

      const transactionsSizeKB = (transactionsCount || 0) * avgTransactionSize
      const suppliersSizeKB = (suppliersCount || 0) * avgSupplierSize
      const ownersSizeKB = (ownersCount || 0) * avgOwnerSize

      const totalSizeKB = transactionsSizeKB + suppliersSizeKB + ownersSizeKB + settingsSize

      setStorageStats({
        totalTransactions: transactionsCount || 0,
        totalSuppliers: suppliersCount || 0,
        totalOwners: ownersCount || 0,
        estimatedSizeKB: totalSizeKB,
        lastBackup: lastBackupData?.created_at || null,
        dataBreakdown: {
          transactions: { count: transactionsCount || 0, sizeKB: transactionsSizeKB },
          suppliers: { count: suppliersCount || 0, sizeKB: suppliersSizeKB },
          owners: { count: ownersCount || 0, sizeKB: ownersSizeKB },
          settings: { count: 1, sizeKB: settingsSize }
        }
      })
    } catch (error) {
      console.error('Error fetching storage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format: string) => {
    if (!user) return

    try {
      setIsDownloading(true)
      
      // Fetch all user data
      const [transactionsRes, suppliersRes, ownersRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, supplier:suppliers(name), owner:business_owners(owner_name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('business_owners')
          .select('*')
          .eq('user_id', user.id)
          .order('owner_name')
      ])

      const exportData = {
        exportDate: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        summary: storageStats,
        data: {
          transactions: transactionsRes.data || [],
          suppliers: suppliersRes.data || [],
          businessOwners: ownersRes.data || []
        }
      }

      if (format === 'json') {
        downloadJSON(exportData)
      } else if (format === 'csv') {
        downloadCSV(exportData)
      } else if (format === 'pdf') {
        downloadPDF(exportData)
      }

    } catch (error) {
      console.error('Error downloading data:', error)
      alert('Error downloading data. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopsynk-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCSV = (data: any) => {
    // Create CSV for transactions
    let csv = 'Type,Supplier,Amount,Description,Date,Due Date,Status,Handled By\\n'
    data.data.transactions.forEach((t: any) => {
      csv += `${t.type},"${t.supplier?.name || 'Unknown'}",${t.amount},"${t.description}",${t.created_at},${t.due_date || ''},${t.is_paid ? 'Paid' : 'Unpaid'},"${t.owner?.owner_name || 'Unknown'}"\\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopsynk-transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPDF = (data: any) => {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shopsynk Data Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #2563eb; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; }
          .summary { background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Shopsynk Data Export</h1>
        <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>User:</strong> ${user?.email || 'Unknown'}</p>
        
        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Total Transactions:</strong> ${storageStats?.totalTransactions}</p>
          <p><strong>Total Suppliers:</strong> ${storageStats?.totalSuppliers}</p>
          <p><strong>Total Owners:</strong> ${storageStats?.totalOwners}</p>
          <p><strong>Estimated Size:</strong> ${(storageStats?.estimatedSizeKB || 0).toFixed(2)} KB</p>
        </div>

        <h2>Recent Transactions</h2>
        <table>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Supplier</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Handled By</th>
          </tr>
          ${data.data.transactions.slice(0, 50).map((t: any) => `
            <tr>
              <td>${new Date(t.created_at).toLocaleDateString()}</td>
              <td>${t.type}</td>
              <td>${t.supplier?.name || 'Unknown'}</td>
              <td>₹${t.amount}</td>
              <td>${t.is_paid ? 'Paid' : 'Unpaid'}</td>
              <td>${t.owner?.owner_name || 'Unknown'}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopsynk-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleManualBackup = async () => {
    if (!user) return

    try {
      setIsBackingUp(true)
      setBackupStatus('Preparing backup...')
      
      const backupService = BackupService.getInstance()
      
      setBackupStatus('Creating backup...')
      await backupService.createBackup(user.id, user.email || 'unknown@email.com')
      
      setBackupStatus('Backup completed successfully!')
      setTimeout(() => setBackupStatus(''), 3000)
      
      // Refresh stats to show new backup date
      await fetchStorageStats()
      
    } catch (error) {
      console.error('Error creating manual backup:', error)
      setBackupStatus('Backup failed. Please try again.')
      setTimeout(() => setBackupStatus(''), 3000)
    } finally {
      setIsBackingUp(false)
    }
  }

  const formatBytes = (kb: number) => {
    if (kb < 1) return `${(kb * 1024).toFixed(0)} bytes`
    if (kb < 1024) return `${kb.toFixed(2)} KB`
    return `${(kb / 1024).toFixed(2)} MB`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading storage information...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Data Storage & Export</h1>
        <button
          onClick={fetchStorageStats}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <HardDrive className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Storage</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(storageStats?.estimatedSizeKB || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Receipt className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{storageStats?.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{storageStats?.totalSuppliers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Business Owners</p>
              <p className="text-2xl font-bold text-gray-900">{storageStats?.totalOwners}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Breakdown</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Receipt className="h-5 w-5 text-green-500 mr-3" />
              <span className="font-medium">Transactions Data</span>
            </div>
            <div className="text-right">
              <p className="font-medium">{storageStats?.dataBreakdown.transactions.count} records</p>
              <p className="text-sm text-gray-500">{formatBytes(storageStats?.dataBreakdown.transactions.sizeKB || 0)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <ShoppingBag className="h-5 w-5 text-purple-500 mr-3" />
              <span className="font-medium">Suppliers Data</span>
            </div>
            <div className="text-right">
              <p className="font-medium">{storageStats?.dataBreakdown.suppliers.count} records</p>
              <p className="text-sm text-gray-500">{formatBytes(storageStats?.dataBreakdown.suppliers.sizeKB || 0)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-orange-500 mr-3" />
              <span className="font-medium">Business Owners</span>
            </div>
            <div className="text-right">
              <p className="font-medium">{storageStats?.dataBreakdown.owners.count} records</p>
              <p className="text-sm text-gray-500">{formatBytes(storageStats?.dataBreakdown.owners.sizeKB || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export & Download */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pdf">PDF Report</option>
              <option value="csv">CSV (Spreadsheet)</option>
              <option value="json">JSON (Raw Data)</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleDownload(downloadFormat)}
              disabled={isDownloading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isDownloading ? 'Preparing...' : `Download ${downloadFormat.toUpperCase()}`}
            </button>
          </div>

          <div className="text-sm text-gray-500">
            <p>• PDF: Formatted report with summary and recent transactions</p>
            <p>• CSV: Spreadsheet format for analysis and import</p>
            <p>• JSON: Complete raw data for technical use</p>
          </div>
        </div>
      </div>

      {/* Manual Backup */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup Management</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Database className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-blue-900">Last Backup</p>
                <p className="text-sm text-blue-700">{formatDate(storageStats?.lastBackup || null)}</p>
              </div>
            </div>
            <button
              onClick={handleManualBackup}
              disabled={isBackingUp}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBackingUp ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CloudDownload className="h-4 w-4 mr-2" />
              )}
              {isBackingUp ? 'Creating Backup...' : 'Create Backup Now'}
            </button>
          </div>

          {backupStatus && (
            <div className={`flex items-center p-3 rounded-lg ${
              backupStatus.includes('failed') 
                ? 'bg-red-50 border border-red-200 text-red-700' 
                : backupStatus.includes('success') 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
            }`}>
              {backupStatus.includes('failed') ? (
                <AlertCircle className="h-5 w-5 mr-2" />
              ) : backupStatus.includes('success') ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              )}
              {backupStatus}
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p>• Automatic backups run daily when configured</p>
            <p>• Manual backups are stored in your connected Google Drive</p>
            <p>• Configure automatic backups in your Profile settings</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataStorage
