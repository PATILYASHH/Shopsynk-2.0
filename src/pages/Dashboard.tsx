import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  DollarSign, 
  Users, 
  Receipt,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight
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
      month: 'short',
      day: 'numeric'
    })
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
        return 'New Purchase'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <button
          onClick={() => navigate('/transactions/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalDues)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/suppliers/${transaction.supplier_id}`)}
                >
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium text-gray-900">{transaction.supplier?.name}</p>
                      <p className="text-sm text-gray-600">{getTransactionTypeLabel(transaction.type)}</p>
                      {transaction.owner?.owner_name && (
                        <p className="text-xs text-blue-600">
                          {transaction.type === 'new_purchase' ? 'Purchased by: ' : 'Paid by: '}
                          {transaction.owner.owner_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'new_purchase' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'new_purchase' ? '+' : '-'}
                      {formatCurrency(parseFloat(transaction.amount))}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Outstanding Payments</h2>
            <AlertTriangle className="h-5 w-5 text-orange-400" />
          </div>
          <div className="space-y-4">
            {stats.upcomingDues.length > 0 ? (
              stats.upcomingDues.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/suppliers/${payment.supplier_id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{payment.supplier?.name}</p>
                    <p className="text-sm text-gray-600">{payment.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">
                      {formatCurrency(parseFloat(payment.amount))}
                    </p>
                    <p className="text-sm text-gray-500">
                      {payment.due_date ? `Due: ${formatDate(payment.due_date)}` : 'No due date'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No outstanding payments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard