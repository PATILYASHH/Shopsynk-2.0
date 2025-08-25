import React, { useState, useEffect } from 'react'
import { supabase, Transaction, Supplier } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart
} from 'lucide-react'

interface ReportData {
  totalPurchases: number
  totalPayments: number
  netOutstanding: number
  supplierBreakdown: Array<{
    supplier: string
    purchases: number
    payments: number
    outstanding: number
  }>
}

const Reports = () => {
  const { user } = useAuth()
  const [reportData, setReportData] = useState<ReportData>({
    totalPurchases: 0,
    totalPayments: 0,
    netOutstanding: 0,
    supplierBreakdown: []
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    setDateTo(today.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchReportData()
    }
  }, [user, dateFrom, dateTo])

  const fetchReportData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch transactions within date range
      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select(`
          *,
          supplier:suppliers(name)
        `)
        .eq('user_id', user.id)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (error) throw error

      setTransactions(transactionsData || [])

      // Calculate report data
      const supplierMap = new Map()
      let totalPurchases = 0
      let totalPayments = 0

      transactionsData?.forEach((transaction) => {
        const supplierName = transaction.supplier?.name || 'Unknown'
        const amount = parseFloat(transaction.amount.toString())

        if (!supplierMap.has(supplierName)) {
          supplierMap.set(supplierName, {
            supplier: supplierName,
            purchases: 0,
            payments: 0,
            outstanding: 0
          })
        }

        const supplierData = supplierMap.get(supplierName)

        if (transaction.type === 'new_purchase') {
          supplierData.purchases += amount
          totalPurchases += amount
          if (!transaction.is_paid) {
            supplierData.outstanding += amount
          }
        } else if (transaction.type === 'pay_due' || transaction.type === 'settle_bill') {
          supplierData.payments += amount
          totalPayments += amount
          supplierData.outstanding -= amount
        }

        supplierMap.set(supplierName, supplierData)
      })

      const supplierBreakdown = Array.from(supplierMap.values())
        .sort((a, b) => b.outstanding - a.outstanding)

      const netOutstanding = supplierBreakdown.reduce((sum, supplier) => sum + supplier.outstanding, 0)

      setReportData({
        totalPurchases,
        totalPayments,
        netOutstanding: Math.max(0, netOutstanding),
        supplierBreakdown
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Supplier',
      'Type',
      'Description',
      'Amount',
      'Status',
      'Due Date'
    ]

    const csvData = transactions.map(transaction => [
      new Date(transaction.created_at).toLocaleDateString('en-IN'),
      transaction.supplier?.name || 'Unknown',
      getTransactionTypeLabel(transaction.type),
      transaction.description,
      parseFloat(transaction.amount.toString()),
      transaction.is_paid ? 'Paid' : 'Unpaid',
      transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('en-IN') : ''
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions-report-${dateFrom}-to-${dateTo}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Analyze your supplier transactions and dues</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={transactions.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {transactions.length} transactions found
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(reportData.totalPurchases)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.totalPayments)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Outstanding</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(reportData.netOutstanding)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Supplier Breakdown</h2>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>

            {reportData.supplierBreakdown.length > 0 ? (
              <div className="space-y-4">
                {reportData.supplierBreakdown.map((supplier, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{supplier.supplier}</h3>
                      <span className="text-sm font-medium text-blue-600">
                        Outstanding: {formatCurrency(supplier.outstanding)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Purchases</p>
                        <p className="font-medium text-red-600">{formatCurrency(supplier.purchases)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Payments</p>
                        <p className="font-medium text-green-600">{formatCurrency(supplier.payments)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No data available for the selected period</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Reports