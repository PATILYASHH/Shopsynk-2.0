import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BackupService } from '../lib/backupService'
import { GoogleDriveService, GoogleDriveConfig } from '../lib/googleDrive'
import { BusinessOwnersService, BusinessOwner, OwnerStats } from '../lib/businessOwners'
import { 
  User, 
  Mail,
  Shield, 
  Database, 
  Calendar, 
  AlertCircle, 
  Cloud,
  Download,
  RefreshCw,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Star
} from 'lucide-react'

const Profile = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    suppliersCount: 0,
    transactionsCount: 0,
    totalOutstanding: 0,
    lastLogin: ''
  })
  const [loading, setLoading] = useState(true)
  const [googleDriveConfig, setGoogleDriveConfig] = useState<GoogleDriveConfig>({
    isConnected: false,
    userEmail: '',
    lastBackup: '',
    autoBackupEnabled: true
  })
  const [backupHistory, setBackupHistory] = useState<any[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupMessage, setBackupMessage] = useState('')
  
  const backupService = BackupService.getInstance()
  const googleDriveService = GoogleDriveService.getInstance()
  const businessOwnersService = BusinessOwnersService.getInstance()

  // Business Owners state
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([])
  const [ownerStats, setOwnerStats] = useState<OwnerStats[]>([])
  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false)
  const [editingOwner, setEditingOwner] = useState<BusinessOwner | null>(null)
  const [ownerFormData, setOwnerFormData] = useState({
    owner_name: '',
    role: 'Owner'
  })
  const [ownersMessage, setOwnersMessage] = useState('')

  useEffect(() => {
    fetchUserStats()
    loadGoogleDriveSettings()
    loadBackupHistory()
    loadBusinessOwners()
  }, [user])

  const loadBusinessOwners = async () => {
    if (!user) return

    try {
      // Ensure primary owner exists
      await businessOwnersService.ensurePrimaryOwner(
        user.id, 
        user.email!, 
        user.user_metadata?.full_name
      )
      
      // Load all owners
      const owners = await businessOwnersService.getBusinessOwners(user.id)
      setBusinessOwners(owners)

      // Load owner statistics
      const stats = await businessOwnersService.getOwnerStats(user.id)
      setOwnerStats(stats)
    } catch (error) {
      console.error('Error loading business owners:', error)
      setOwnersMessage('Error loading business owners.')
    }
  }

  const loadGoogleDriveSettings = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setGoogleDriveConfig({
          isConnected: data.google_drive_connected || false,
          userEmail: data.google_drive_email || '',
          lastBackup: data.last_backup_date || '',
          autoBackupEnabled: data.auto_backup_enabled || true
        })
      }
    } catch (error) {
      console.error('Error loading Google Drive settings:', error)
    }
  }

  const loadBackupHistory = async () => {
    if (!user) return

    try {
      const history = await backupService.getBackupHistory(user.id)
      setBackupHistory(history)
    } catch (error) {
      console.error('Error loading backup history:', error)
    }
  }

  const handleConnectGoogleDrive = async () => {
    setIsConnecting(true)
    setBackupMessage('')

    try {
      const result = await googleDriveService.authenticate()
      
      if (result.success) {
        // Save Google Drive connection to database
        await supabase.from('user_settings').upsert({
          user_id: user?.id,
          google_drive_connected: true,
          google_drive_email: result.userEmail,
          updated_at: new Date().toISOString()
        })

        setGoogleDriveConfig(prev => ({
          ...prev,
          isConnected: true,
          userEmail: result.userEmail
        }))

        setBackupMessage('Successfully connected to Google Drive!')
        
        // Setup auto backup
        await backupService.setupAutoBackup(user!.id, user!.email!)
      } else {
        setBackupMessage('Failed to connect to Google Drive. Please try again.')
      }
    } catch (error) {
      console.error('Google Drive connection error:', error)
      setBackupMessage('An error occurred while connecting to Google Drive.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectGoogleDrive = async () => {
    try {
      googleDriveService.disconnect()
      
      await supabase.from('user_settings').upsert({
        user_id: user?.id,
        google_drive_connected: false,
        google_drive_email: null,
        updated_at: new Date().toISOString()
      })

      setGoogleDriveConfig(prev => ({
        ...prev,
        isConnected: false,
        userEmail: ''
      }))

      setBackupMessage('Disconnected from Google Drive.')
    } catch (error) {
      console.error('Error disconnecting Google Drive:', error)
      setBackupMessage('Error disconnecting from Google Drive.')
    }
  }

  const handleManualBackup = async () => {
    if (!user) return

    setIsBackingUp(true)
    setBackupMessage('')

    try {
      const result = await backupService.createBackup(user.id, user.email!)
      setBackupMessage(result.message)
      
      if (result.success) {
        await loadBackupHistory()
        await loadGoogleDriveSettings()
      }
    } catch (error) {
      console.error('Manual backup error:', error)
      setBackupMessage('An error occurred during backup.')
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleDownloadBackup = async () => {
    if (!user) return

    try {
      const backupData = await backupService.exportUserData(user.id, user.email!)
      if (backupData) {
        backupService.downloadBackupFile(backupData)
        setBackupMessage('Backup file downloaded successfully!')
      } else {
        setBackupMessage('Failed to create backup file.')
      }
    } catch (error) {
      console.error('Download backup error:', error)
      setBackupMessage('Error creating backup file.')
    }
  }

  const toggleAutoBackup = async () => {
    if (!user) return

    try {
      const newAutoBackupEnabled = !googleDriveConfig.autoBackupEnabled

      await supabase.from('user_settings').upsert({
        user_id: user.id,
        auto_backup_enabled: newAutoBackupEnabled,
        updated_at: new Date().toISOString()
      })

      setGoogleDriveConfig(prev => ({
        ...prev,
        autoBackupEnabled: newAutoBackupEnabled
      }))

      setBackupMessage(`Auto backup ${newAutoBackupEnabled ? 'enabled' : 'disabled'}.`)
    } catch (error) {
      console.error('Error toggling auto backup:', error)
      setBackupMessage('Error updating auto backup setting.')
    }
  }

  // Business Owner Management Functions
  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const result = await businessOwnersService.createBusinessOwner(user.id, ownerFormData)
      
      if (result.success) {
        setOwnersMessage('Owner added successfully!')
        await loadBusinessOwners()
        resetOwnerForm()
      } else {
        setOwnersMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding owner:', error)
      setOwnersMessage('An error occurred while adding the owner.')
    }
  }

  const handleEditOwner = (owner: BusinessOwner) => {
    setEditingOwner(owner)
    setOwnerFormData({
      owner_name: owner.owner_name,
      role: owner.role
    })
    setShowAddOwnerModal(true)
  }

  const handleUpdateOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOwner) return

    try {
      const result = await businessOwnersService.updateBusinessOwner(
        editingOwner.id,
        ownerFormData
      )
      
      if (result.success) {
        setOwnersMessage('Owner updated successfully!')
        await loadBusinessOwners()
        resetOwnerForm()
      } else {
        setOwnersMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating owner:', error)
      setOwnersMessage('An error occurred while updating the owner.')
    }
  }

  const handleDeleteOwner = async (ownerId: string) => {
    if (!confirm('Are you sure you want to remove this owner? This action cannot be undone.')) {
      return
    }

    try {
      const result = await businessOwnersService.deactivateBusinessOwner(ownerId)
      
      if (result.success) {
        setOwnersMessage('Owner removed successfully.')
        await loadBusinessOwners()
      } else {
        setOwnersMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error removing owner:', error)
      setOwnersMessage('An error occurred while removing the owner.')
    }
  }

  const resetOwnerForm = () => {
    setOwnerFormData({
      owner_name: '',
      role: 'Owner'
    })
    setEditingOwner(null)
    setShowAddOwnerModal(false)
  }

  const getOwnerStats = (ownerId: string) => {
    return ownerStats.find(stat => stat.owner_id === ownerId) || {
      total_transactions: 0,
      total_purchases: 0,
      total_payments: 0,
      total_purchase_amount: 0,
      total_payment_amount: 0
    }
  }

  const fetchUserStats = async () => {
    if (!user) return

    try {
      // Get suppliers count
      const { count: suppliersCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Get transactions count
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Calculate total outstanding
      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount, is_paid')
        .eq('user_id', user.id)

      let totalOutstanding = 0
      transactions?.forEach((transaction) => {
        if (transaction.type === 'new_purchase' && !transaction.is_paid) {
          totalOutstanding += parseFloat(transaction.amount.toString())
        } else if (transaction.type === 'pay_due' || transaction.type === 'settle_bill') {
          totalOutstanding -= parseFloat(transaction.amount.toString())
        }
      })

      setStats({
        suppliersCount: suppliersCount || 0,
        transactionsCount: transactionsCount || 0,
        totalOutstanding: Math.max(0, totalOutstanding),
        lastLogin: user.last_sign_in_at || user.created_at || ''
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and view activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="font-medium text-green-600">Active</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Account Created</p>
                <p className="font-medium text-gray-900">
                  {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                </p>
              </div>
            </div>

            {stats.lastLogin && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Last Sign In</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(stats.lastLogin)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Activity Summary</h2>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Database className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Suppliers</p>
                <p className="text-2xl font-bold text-blue-700">{stats.suppliersCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-green-700">{stats.transactionsCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-red-600 font-medium">Outstanding Amount</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(stats.totalOutstanding)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Owners Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Business Owners</h2>
              <p className="text-sm text-gray-600">Manage owners and track their activities</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddOwnerModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Owner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {businessOwners.map((owner) => {
            const stats = getOwnerStats(owner.id)
            return (
              <div key={owner.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      {owner.is_primary ? (
                        <Star className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <User className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{owner.owner_name}</h3>
                      <p className="text-sm text-gray-600">{owner.role}</p>
                      {owner.is_primary && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                  {!owner.is_primary && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditOwner(owner)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit owner"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOwner(owner.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Remove owner"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center">
                      <p className="text-blue-600 font-medium">{stats.total_purchases}</p>
                      <p className="text-gray-500">Purchases</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-600 font-medium">{stats.total_payments}</p>
                      <p className="text-gray-500">Payments</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-purple-600 font-medium">
                        {formatCurrency(stats.total_purchase_amount - stats.total_payment_amount)}
                      </p>
                      <p className="text-gray-500">Net Activity</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {businessOwners.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No business owners found</p>
            <p className="text-sm text-gray-400 mt-1">Add owners to track who handles transactions</p>
          </div>
        )}
      </div>

      {/* Google Drive Integration & Backup Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Drive Connection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Google Drive Backup</h2>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Cloud className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {googleDriveConfig.isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="text-sm text-gray-600">Connection Status</p>
                <p className={`font-medium ${googleDriveConfig.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {googleDriveConfig.isConnected ? 'Connected' : 'Not Connected'}
                </p>
                {googleDriveConfig.isConnected && googleDriveConfig.userEmail && (
                  <p className="text-xs text-gray-500">{googleDriveConfig.userEmail}</p>
                )}
              </div>
            </div>

            {/* Auto Backup Setting */}
            {googleDriveConfig.isConnected && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Auto Backup</p>
                    <p className="text-xs text-gray-500">Daily at midnight</p>
                  </div>
                </div>
                <button
                  onClick={toggleAutoBackup}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    googleDriveConfig.autoBackupEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      googleDriveConfig.autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Last Backup */}
            {googleDriveConfig.lastBackup && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Last Backup</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(googleDriveConfig.lastBackup)}
                  </p>
                </div>
              </div>
            )}

            {/* Connection Buttons */}
            <div className="flex space-x-3">
              {!googleDriveConfig.isConnected ? (
                <button
                  onClick={handleConnectGoogleDrive}
                  disabled={isConnecting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4 mr-2" />
                      Connect Google Drive
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleManualBackup}
                    disabled={isBackingUp}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 flex items-center justify-center"
                  >
                    {isBackingUp ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Backing up...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Backup Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDisconnectGoogleDrive}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>

            {/* Download Local Backup */}
            <button
              onClick={handleDownloadBackup}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Local Backup
            </button>
          </div>
        </div>

        {/* Backup History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Backup History</h2>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Settings className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="space-y-3">
            {backupHistory.length > 0 ? (
              backupHistory.slice(0, 5).map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      backup.status === 'completed' ? 'bg-green-500' : 
                      backup.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(backup.backup_date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {backup.suppliers_count} suppliers, {backup.transactions_count} transactions
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    backup.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    backup.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {backup.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No backups yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Connect Google Drive to start automatic backups
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup Status Message */}
      {backupMessage && (
        <div className={`border rounded-lg p-4 ${
          backupMessage.includes('Success') || backupMessage.includes('successfully') 
            ? 'bg-green-50 border-green-200' 
            : backupMessage.includes('Error') || backupMessage.includes('Failed')
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            {backupMessage.includes('Success') || backupMessage.includes('successfully') ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : backupMessage.includes('Error') || backupMessage.includes('Failed') ? (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                backupMessage.includes('Success') || backupMessage.includes('successfully')
                  ? 'text-green-800'
                  : backupMessage.includes('Error') || backupMessage.includes('Failed')
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}>
                {backupMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Owner Status Message */}
      {ownersMessage && (
        <div className={`border rounded-lg p-4 ${
          ownersMessage.includes('Success') || ownersMessage.includes('successfully') 
            ? 'bg-green-50 border-green-200' 
            : ownersMessage.includes('Error') || ownersMessage.includes('Failed')
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            {ownersMessage.includes('Success') || ownersMessage.includes('successfully') ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : ownersMessage.includes('Error') || ownersMessage.includes('Failed') ? (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                ownersMessage.includes('Success') || ownersMessage.includes('successfully')
                  ? 'text-green-800'
                  : ownersMessage.includes('Error') || ownersMessage.includes('Failed')
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}>
                {ownersMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Owner Modal */}
      {showAddOwnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingOwner ? 'Edit Owner' : 'Add New Owner'}
            </h2>
            
            <form onSubmit={editingOwner ? handleUpdateOwner : handleAddOwner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerFormData.owner_name}
                  onChange={(e) => setOwnerFormData({ ...ownerFormData, owner_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter owner's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role/Title
                </label>
                <input
                  type="text"
                  value={ownerFormData.role}
                  onChange={(e) => setOwnerFormData({ ...ownerFormData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Owner, Partner, Manager"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetOwnerForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingOwner ? 'Update Owner' : 'Add Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your data is securely stored and encrypted. Always sign out when using shared devices.
              If you notice any unusual activity, please contact support immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile