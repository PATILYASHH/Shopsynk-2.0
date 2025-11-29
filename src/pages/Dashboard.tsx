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
  CheckCircle,
  Sparkles,
  Lightbulb,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { generateFinancialInsights, FinancialInsight } from '../lib/geminiService'
import ModeSelection from '../components/ModeSelection'
import PersonalDashboard from '../components/PersonalDashboard'

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
  const [insights, setInsights] = useState<FinancialInsight[]>([])
  const [showInsights, setShowInsights] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [showModeSelection, setShowModeSelection] = useState(false)
  const [checkingMode, setCheckingMode] = useState(true)
  const [userMode, setUserMode] = useState<'business' | 'personal' | null>(null)

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
    checkUserMode()
  }, [user])

  const checkUserMode = async () => {
    if (!user) return

    setCheckingMode(true)
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('mode')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No preference found, show mode selection
        setShowModeSelection(true)
        setCheckingMode(false)
      } else if (data) {
        // User has selected mode, set it and proceed with dashboard
        setUserMode(data.mode as 'business' | 'personal')
        if (data.mode === 'business') {
          fetchDashboardData()
        } else {
          // Personal mode - dashboard loads its own data
          setCheckingMode(false)
          setLoading(false)
        }
      }
    } catch (error) {
      console.error('Error checking user mode:', error)
      setUserMode('business') // Fallback to business mode
      fetchDashboardData()
    }
  }

  const handleModeSelected = (mode: 'business' | 'personal') => {
    setShowModeSelection(false)
    setUserMode(mode)
    if (mode === 'business') {
      fetchDashboardData()
    } else {
      // Personal mode - stop loading state
      setCheckingMode(false)
      setLoading(false)
    }
    
    // Dispatch event to reload layout
    window.dispatchEvent(new Event('settingsChanged'))
  }

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

      // Auto-load insights if API key is available
      const hasApiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (hasApiKey && !loadingInsights && insights.length === 0) {
        loadAIInsights(totalDues, suppliersCount || 0, allTransactionsForStats || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAIInsights = async (totalDues: number, supplierCount: number, transactions: any[]) => {
    setLoadingInsights(true)
    try {
      const { data: spends } = await supabase
        .from('spends')
        .select('amount')
        .eq('user_id', user?.id || '')
      
      const totalSpends = spends?.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) || 0

      const supplierTotals = new Map<string, { name: string; amount: number }>()
      transactions.forEach(t => {
        if (t.supplier_id) {
          const existing = supplierTotals.get(t.supplier_id) || { name: '', amount: 0 }
          existing.name = t.supplier?.name || 'Unknown'
          if (t.type === 'new_purchase') {
            existing.amount += parseFloat(t.amount)
          }
          supplierTotals.set(t.supplier_id, existing)
        }
      })

      const topSuppliers = Array.from(supplierTotals.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)

      const recentTransactions = transactions.slice(0, 10)
      const olderTransactions = transactions.slice(10, 20)
      const recentAvg = recentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / Math.max(1, recentTransactions.length)
      const olderAvg = olderTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / Math.max(1, olderTransactions.length)
      const trend = recentAvg > olderAvg * 1.2 ? 'increasing' : recentAvg < olderAvg * 0.8 ? 'decreasing' : 'stable'

      const generatedInsights = await generateFinancialInsights({
        totalDues,
        totalSpends,
        topSuppliers,
        recentTrend: trend
      })

      setInsights(generatedInsights)
      if (generatedInsights.length > 0) {
        setShowInsights(true)
      }
    } catch (error) {
      console.error('Error loading AI insights:', error)
    } finally {
      setLoadingInsights(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'tip': return <Lightbulb className="h-5 w-5 text-blue-600" />
      default: return <Sparkles className="h-5 w-5 text-purple-600" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'tip': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-purple-50 border-purple-200 text-purple-800'
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

  // Show mode selection if needed
  if (showModeSelection) {
    return <ModeSelection userId={user!.id} onComplete={handleModeSelected} />
  }

  if (loading || checkingMode) {
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

  // Render PersonalDashboard for personal mode users
  if (userMode === 'personal') {
    return <PersonalDashboard />
  }

  return (
    <div className="space-y-6 animate-slide-up-fade">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <p className="text-blue-100 text-xs sm:text-sm lg:text-base">Welcome back! Here's your business overview</p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-32 sm:w-40 h-32 sm:h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-32 sm:w-40 h-32 sm:h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* AI Insights Section */}
      {showInsights && insights.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3 sm:p-6 border-2 border-purple-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">AI Insights</h2>
            </div>
            <button
              onClick={() => setShowInsights(false)}
              className="p-1 hover:bg-purple-200 rounded-full transition-colors touch-manipulation"
            >
              <X className="h-4 w-4 text-purple-600" />
            </button>
          </div>
          <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 sm:p-4 rounded-lg border-2 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm mb-1">{insight.title}</h3>
                    <p className="text-xs mb-2 opacity-90">{insight.message}</p>
                    {insight.actionable && (
                      <p className="text-xs font-medium flex items-center space-x-1">
                        <span>💡</span>
                        <span>{insight.actionable}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards - Enhanced with Gradients */}
      <div className={`grid gap-4 sm:gap-6 ${featureSettings.suppliers ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'
        }`}>
        {/* Outstanding Dues Card */}
        <div className="stat-card group bg-gradient-to-br from-red-50 to-pink-50 border-red-200 animate-scale-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-red-600 text-xs font-medium bg-red-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              Due
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-0.5 sm:mb-1">Outstanding</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 mb-0.5 sm:mb-1">
            ₹{Math.round(stats.totalDues).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">{stats.pendingPayments} pending</p>
        </div>

        {/* Suppliers Card */}
        {featureSettings.suppliers && (
          <button
            onClick={() => navigate('/suppliers')}
            className="stat-card group bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-2xl active:scale-95 sm:hover:scale-105 animate-scale-in touch-manipulation"
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mb-0.5 sm:mb-1">Suppliers</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-0.5 sm:mb-1">
              {stats.totalSuppliers}
            </p>
            <p className="text-xs text-blue-500 group-hover:underline">View all →</p>
          </button>
        )}

        {/* Transactions Card */}
        <button
          onClick={() => navigate('/transactions')}
          className="stat-card group bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-2xl active:scale-95 sm:hover:scale-105 animate-scale-in touch-manipulation"
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-0.5 sm:mb-1">Transactions</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-0.5 sm:mb-1">
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