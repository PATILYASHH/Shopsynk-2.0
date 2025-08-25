import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User, Mail, Shield, Database, Calendar, AlertCircle } from 'lucide-react'

const Profile = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    suppliersCount: 0,
    transactionsCount: 0,
    totalOutstanding: 0,
    lastLogin: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [user])

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