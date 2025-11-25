import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  DollarSign,
  Users,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  totalDues: number
  totalSuppliers: number
  totalTransactions: number
  pendingPayments: number
  recentTransactions: any[]
  upcomingDues: any[]
}

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalDues: 0,
    totalSuppliers: 0,
    totalTransactions: 0,
    pendingPayments: 0,
    recentTransactions: [],
    upcomingDues: []
  })
  const [loading, setLoading] = useState(true)
  const [featureSettings, setFeatureSettings] = useState({
    suppliers: true,
    spends: true,
    persons: true,
    reports: true,
    dataStorage: true,
    documentation: true
  })

  // Load feature settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('shopsynk_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setFeatureSettings(parsed.features || featureSettings)
      } catch (error) {
        console.error('Error loading feature settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Fetch suppliers count
      const { count: suppliersCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Fetch total transactions count
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Calculate total dues and pending payments using corrected logic
      const { data: allTransactionsForStats } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)

      // Calculate net balances per supplier for accurate totals
      const supplierBalancesForStats = new Map()

      allTransactionsForStats?.forEach((transaction) => {
        const supplierId = transaction.supplier_id

        if (!supplierBalancesForStats.has(supplierId)) {
          supplierBalancesForStats.set(supplierId, 0)
        }

        if (transaction.type === 'new_purchase') {
          supplierBalancesForStats.set(supplierId,
            supplierBalancesForStats.get(supplierId) + parseFloat(transaction.amount)
          )
        } else if (transaction.type === 'pay_due' || transaction.type === 'settle_bill') {
          supplierBalancesForStats.set(supplierId,
            supplierBalancesForStats.get(supplierId) - parseFloat(transaction.amount)
          )
        }
      })

      // Calculate totals from net balances
      let totalDues = 0
      let pendingPayments = 0

      supplierBalancesForStats.forEach((balance) => {
        if (balance > 0.01) { // Only count positive balances
          totalDues += balance
          pendingPayments++
        }
      })

      // Fetch recent transactions with supplier and owner info
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select(`
          *,
          supplier:suppliers(name),
          owner:business_owners(owner_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch outstanding payments - calculate net amounts per supplier
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select(`
          *,
          supplier:suppliers(name),
          owner:business_owners(owner_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Calculate outstanding amounts per supplier
      const supplierBalances = new Map()

      allTransactions?.forEach((transaction) => {
        const supplierId = transaction.supplier_id
        const supplierName = transaction.supplier?.name

        if (!supplierBalances.has(supplierId)) {
          supplierBalances.set(supplierId, {
            supplier_id: supplierId,
            supplier_name: supplierName,
            balance: 0,
            lastTransaction: transaction,
            dueDate: null
          })
        }

        const balance = supplierBalances.get(supplierId)

        if (transaction.type === 'new_purchase') {
          balance.balance += parseFloat(transaction.amount)
          // Keep track of the earliest due date for unpaid purchases
          if (transaction.due_date && (!balance.dueDate || transaction.due_date < balance.dueDate)) {
            balance.dueDate = transaction.due_date
          }
        } else if (transaction.type === 'pay_due' || transaction.type === 'settle_bill') {
          balance.balance -= parseFloat(transaction.amount)
        }
      })

      // Filter suppliers with positive balances (outstanding amounts)
      const outstandingPayments = Array.from(supplierBalances.values())
        .filter(balance => balance.balance > 0.01) // Only show if balance > 1 paisa
        .map(balance => ({
          id: `outstanding-${balance.supplier_id}`,
          supplier_id: balance.supplier_id,
          supplier: { name: balance.supplier_name },
          amount: balance.balance.toFixed(2),
          description: 'Outstanding balance',
          due_date: balance.dueDate,
          type: 'outstanding'
        }))
        .sort((a, b) => {
          // Sort by due date first (nulls last), then by amount
          if (a.due_date && !b.due_date) return -1
          if (!a.due_date && b.due_date) return 1
          if (a.due_date && b.due_date) {
            if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date)
          }
          return parseFloat(b.amount) - parseFloat(a.amount)
        })
        .slice(0, 10)

      setStats({
        totalDues: Math.max(0, totalDues),
        totalSuppliers: suppliersCount || 0,
        totalTransactions: transactionsCount || 0,
        pendingPayments,
        recentTransactions: recentTransactions || [],
        upcomingDues: outstandingPayments || []
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'new_purchase':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case 'pay_due':
      case 'settle_bill':
        return <ArrowDownRight className="h-4 w-4 text-green-500" />
      default:
        return <Receipt className="h-4 w-4 text-gray-500" />
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'new_purchase':
        return 'Purchase'
      case 'pay_due':
        return 'Payment'
      case 'settle_bill':
        return 'Settlement'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up-fade">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-2xl p-4 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <p className="text-blue-100 text-sm sm:text-base">Welcome back! Here's your business overview</p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Cards - Enhanced with Gradients */}
      <div className={`grid gap-4 sm:gap-6 ${featureSettings.suppliers ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'
        }`}>
        {/* Outstanding Dues Card */}
        <div className="stat-card group bg-gradient-to-br from-red-50 to-pink-50 border-red-200 animate-scale-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-red-600 text-xs font-medium bg-red-100 px-2 py-1 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              Due
            </div>
          </div>
          <p className="text-sm text-gray-600 font-medium mb-1">Outstanding</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">
            ₹{Math.round(stats.totalDues).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">{stats.pendingPayments} pending</p>
        </div>

        {/* Suppliers Card */}
        {featureSettings.suppliers && (
          <button
            onClick={() => navigate('/suppliers')}
            className="stat-card group bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-2xl hover:scale-105 animate-scale-in"
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">Suppliers</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
              {stats.totalSuppliers}
            </p>
            <p className="text-xs text-blue-500 group-hover:underline">View all →</p>
          </button>
        )}

        {/* Transactions Card */}
        <button
          onClick={() => navigate('/transactions')}
          className="stat-card group bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-2xl hover:scale-105 animate-scale-in"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm text-gray-600 font-medium mb-1">Transactions</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
            {stats.totalTransactions}
          </p>
          <p className="text-xs text-green-500 group-hover:underline">View all →</p>
        </button>

        {/* Pending Payments Card */}
        <div className="stat-card group bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 animate-scale-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-orange-600 text-xs font-medium bg-orange-100 px-2 py-1 rounded-full">
              <Clock className="h-3 w-3" />
              Pending
            </div>
          </div>
          <p className="text-sm text-gray-600 font-medium mb-1">Pending</p>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
            {stats.pendingPayments}
          </p>
          <p className="text-xs text-gray-500">suppliers</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions - Enhanced */}
        <div className="card-modern animate-slide-in-left">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              <button
                onClick={() => navigate('/transactions')}
                className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors flex items-center gap-1 group"
              >
                View All
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="space-y-3">
              {stats.recentTransactions.length > 0 ? (
                stats.recentTransactions.slice(0, 5).map((transaction, index) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-102 cursor-pointer group animate-slide-in-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate('/transactions')}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${transaction.type === 'new_purchase'
                          ? 'bg-red-100'
                          : 'bg-green-100'
                        }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {transaction.supplier?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getTransactionTypeLabel(transaction.type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${transaction.type === 'new_purchase' ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {transaction.type === 'new_purchase' ? '+' : '-'}₹{Math.round(parseFloat(transaction.amount)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Receipt className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No transactions yet</p>
                  <p className="text-gray-400 text-sm mt-1">Start by adding your first transaction</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outstanding Payments - Enhanced */}
        <div className="card-modern animate-slide-in-right">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Payments Due</h2>
              </div>
              <div className="flex items-center gap-2 text-orange-600 text-sm font-medium bg-orange-100 px-3 py-1.5 rounded-full">
                <Clock className="h-4 w-4" />
                {stats.upcomingDues.length}
              </div>
            </div>
            <div className="space-y-3">
              {stats.upcomingDues.length > 0 ? (
                stats.upcomingDues.slice(0, 5).map((payment, index) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-300 hover:scale-102 cursor-pointer group animate-slide-in-right"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/suppliers/${payment.supplier_id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                        {payment.supplier?.name}
                      </p>
                      <p className="text-sm text-gray-500">Outstanding balance</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-red-600">
                        ₹{Math.round(parseFloat(payment.amount)).toLocaleString()}
                      </p>
                      <ArrowUpRight className="h-4 w-4 text-orange-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 animate-pulse-glow">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-green-600 font-bold text-lg">All Clear!</p>
                  <p className="text-gray-500 text-sm mt-1">All payments are up to date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard