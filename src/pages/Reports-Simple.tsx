import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  Download,
  BarChart3
} from 'lucide-react'

interface ReportData {
  totalPurchases: number
  totalPayments: number
  netOutstanding: number
  monthlyData: { month: string; purchases: number; payments: number }[]
  supplierStats: { name: string; outstanding: number; totalPurchases: number }[]
}

const Reports = () => {
  const { user } = useAuth()
  const [reportData, setReportData] = useState<ReportData>({
    totalPurchases: 0,
    totalPayments: 0,
    netOutstanding: 0,
    monthlyData: [],
    supplierStats: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('3months')

  useEffect(() => {
    fetchReportData()
  }, [user, selectedPeriod])

  const fetchReportData = async () => {
    if (!user) return

    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch (selectedPeriod) {
        case '1month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3)
          break
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6)
          break
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      // Fetch all transactions for the period
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          supplier:suppliers(name)
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate totals
      let totalPurchases = 0
      let totalPayments = 0
      const supplierBalances = new Map()

      transactions?.forEach((transaction) => {
        if (transaction.type === 'new_purchase') {
          totalPurchases += parseFloat(transaction.amount)
          
          // Track supplier stats
          const supplierId = transaction.supplier_id
          const supplierName = transaction.supplier?.name || 'Unknown'
          
          if (!supplierBalances.has(supplierId)) {
            supplierBalances.set(supplierId, {
              name: supplierName,
              outstanding: 0,
              totalPurchases: 0
            })
          }
          
          const supplier = supplierBalances.get(supplierId)
          supplier.totalPurchases += parseFloat(transaction.amount)
          supplier.outstanding += parseFloat(transaction.amount)
        } else if (transaction.type === 'pay_due' || transaction.type === 'settle_bill') {
          totalPayments += parseFloat(transaction.amount)
          
          // Reduce outstanding for supplier
          const supplierId = transaction.supplier_id
          if (supplierBalances.has(supplierId)) {
            const supplier = supplierBalances.get(supplierId)
            supplier.outstanding -= parseFloat(transaction.amount)
          }
        }
      })

      // Generate monthly data (simplified for mobile)
      const monthlyData = []
      const currentDate = new Date()
      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthName = monthDate.toLocaleDateString('en-IN', { month: 'short' })
        
        const monthTransactions = transactions?.filter(t => {
          const transactionDate = new Date(t.created_at)
          return transactionDate.getMonth() === monthDate.getMonth() &&
                 transactionDate.getFullYear() === monthDate.getFullYear()
        }) || []

        const monthPurchases = monthTransactions
          .filter(t => t.type === 'new_purchase')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        const monthPayments = monthTransactions
          .filter(t => t.type === 'pay_due' || t.type === 'settle_bill')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        monthlyData.push({
          month: monthName,
          purchases: monthPurchases,
          payments: monthPayments
        })
      }

      // Convert supplier stats to array and sort
      const supplierStats = Array.from(supplierBalances.values())
        .filter(supplier => supplier.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 5)

      setReportData({
        totalPurchases,
        totalPayments,
        netOutstanding: totalPurchases - totalPayments,
        monthlyData,
        supplierStats
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    const csvContent = [
      'Shopsynk Business Report',
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      `Period: ${selectedPeriod}`,
      '',
      'Summary:',
      `Total Purchases,₹${reportData.totalPurchases.toFixed(2)}`,
      `Total Payments,₹${reportData.totalPayments.toFixed(2)}`,
      `Net Outstanding,₹${reportData.netOutstanding.toFixed(2)}`,
      '',
      'Monthly Breakdown:',
      'Month,Purchases,Payments',
      ...reportData.monthlyData.map(item => 
        `${item.month},₹${item.purchases.toFixed(2)},₹${item.payments.toFixed(2)}`
      ),
      '',
      'Top Outstanding Suppliers:',
      'Supplier,Outstanding Amount,Total Purchases',
      ...reportData.supplierStats.map(supplier => 
        `${supplier.name},₹${supplier.outstanding.toFixed(2)},₹${supplier.totalPurchases.toFixed(2)}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopsynk-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 text-sm">Business insights and analytics</p>
        </div>
        <button
          onClick={exportReport}
          className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center hover:bg-green-700 w-full sm:w-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: '1month', label: '1 Month' },
          { value: '3months', label: '3 Months' },
          { value: '6months', label: '6 Months' },
          { value: '1year', label: '1 Year' }
        ].map((period) => (
          <button
            key={period.value}
            onClick={() => setSelectedPeriod(period.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedPeriod === period.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Purchases</p>
              <p className="text-xl font-bold text-red-600">₹{Math.round(reportData.totalPurchases).toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-xl font-bold text-green-600">₹{Math.round(reportData.totalPayments).toLocaleString()}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Net Outstanding</p>
              <p className="text-xl font-bold text-orange-600">₹{Math.round(reportData.netOutstanding).toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Monthly Trends - Simplified for mobile */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Trends</h2>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          {reportData.monthlyData.map((month, index) => (
            <div key={index} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{month.month}</span>
                <div className="text-right">
                  <div className="text-sm text-red-600">
                    Purchases: ₹{Math.round(month.purchases).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">
                    Payments: ₹{Math.round(month.payments).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Simple progress bars */}
              <div className="space-y-1">
                <div className="flex items-center text-xs text-red-600">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (month.purchases / Math.max(reportData.totalPurchases / 3, 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (month.payments / Math.max(reportData.totalPayments / 3, 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Outstanding Suppliers */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top Outstanding Suppliers</h2>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        
        {reportData.supplierStats.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No outstanding amounts found</p>
        ) : (
          <div className="space-y-3">
            {reportData.supplierStats.map((supplier, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{supplier.name}</p>
                  <p className="text-sm text-gray-600">
                    Total purchases: ₹{Math.round(supplier.totalPurchases).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    ₹{Math.round(supplier.outstanding).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">outstanding</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
