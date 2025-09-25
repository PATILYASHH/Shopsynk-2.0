import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  DollarSign, 
  Users, 
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  totalDues: number
  totalSuppliers: number
  totalTransactions: number
  pendingPayments: number
  totalSpends: number
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
    totalSpends: 0,
    recentTransactions: [],
    upcomingDues: []
  })
  const [loading, setLoading] = useState(true)

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

      // Fetch total spends
      const { data: spendsData } = await supabase
        .from('spends')
        .select('amount')
        .eq('user_id', user.id)

      const totalSpends = spendsData?.reduce((sum, spend) => sum + parseFloat(spend.amount), 0) || 0

      setStats({
        totalDues: Math.max(0, totalDues),
        totalSuppliers: suppliersCount || 0,
        totalTransactions: transactionsCount || 0,
        pendingPayments,
        totalSpends,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Simplified */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm">Your business overview</p>
        </div>
      </div>

      {/* Stats Cards - Mobile-first grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-center">
            <DollarSign className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">Outstanding</p>
            <p className="text-lg font-bold text-red-600">₹{Math.round(stats.totalDues).toLocaleString()}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/suppliers')}
          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors w-full"
        >
          <div className="text-center">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">Suppliers</p>
            <p className="text-lg font-bold text-blue-600">{stats.totalSuppliers}</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/transactions')}
          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors w-full"
        >
          <div className="text-center">
            <Receipt className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">Transactions</p>
            <p className="text-lg font-bold text-green-600">{stats.totalTransactions}</p>
          </div>
        </button>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-center">
            <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <p className="text-lg font-bold text-orange-600">{stats.pendingPayments}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/spends')}
          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors w-full"
        >
          <div className="text-center">
            <DollarSign className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">Total Spends</p>
            <p className="text-lg font-bold text-purple-600">₹{Math.round(stats.totalSpends).toLocaleString()}</p>
          </div>
        </button>
      </div>

      {/* Single column layout for mobile, two columns for larger screens */}
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {/* Recent Transactions - Simplified */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-blue-600 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.slice(0, 4).map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getTransactionIcon(transaction.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{transaction.supplier?.name}</p>
                      <p className="text-sm text-gray-500">{getTransactionTypeLabel(transaction.type)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'new_purchase' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'new_purchase' ? '+' : '-'}₹{Math.round(parseFloat(transaction.amount)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-6 text-sm">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Outstanding Payments - Simplified */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Payments Due</h2>
            <AlertTriangle className="h-5 w-5 text-orange-400" />
          </div>
          <div className="space-y-3">
            {stats.upcomingDues.length > 0 ? (
              stats.upcomingDues.slice(0, 4).map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                  onClick={() => navigate(`/suppliers/${payment.supplier_id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{payment.supplier?.name}</p>
                    <p className="text-sm text-gray-500">Outstanding balance</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">
                      ₹{Math.round(parseFloat(payment.amount)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <AlertTriangle className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-50" />
                <p className="text-green-600 text-sm font-medium">All payments up to date!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard