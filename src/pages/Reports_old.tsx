import React, { useState, useEffect } from 'react'
import { supabase, Transaction, Supplier } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  FileSpreadsheet,
  Filter
} from 'lucide-react'
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, Legend, Tooltip, Pie } from 'recharts'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'

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
  pieChartData: Array<{
    name: string
    value: number
    color: string
  }>
}

const Reports = () => {
  const { user } = useAuth()
  const [reportData, setReportData] = useState<ReportData>({
    totalPurchases: 0,
    totalPayments: 0,
    netOutstanding: 0,
    supplierBreakdown: [],
    pieChartData: []
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
        .sort((a, b) => b.purchases - a.purchases)

      const netOutstanding = supplierBreakdown.reduce((sum, supplier) => sum + supplier.outstanding, 0)

      // Generate pie chart data from purchases only
      const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
      ]
      
      const pieChartData = supplierBreakdown
        .filter(supplier => supplier.purchases > 0)
        .slice(0, 10) // Top 10 suppliers
        .map((supplier, index) => ({
          name: supplier.supplier,
          value: supplier.purchases,
          color: colors[index % colors.length]
        }))

      setReportData({
        totalPurchases,
        totalPayments,
        netOutstanding: Math.max(0, netOutstanding),
        supplierBreakdown,
        pieChartData
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

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      transactions.map(transaction => ({
        Date: new Date(transaction.created_at).toLocaleDateString('en-IN'),
        Supplier: transaction.supplier?.name || 'Unknown',
        Type: getTransactionTypeLabel(transaction.type),
        Description: transaction.description,
        Amount: parseFloat(transaction.amount.toString()),
        Status: transaction.is_paid ? 'Paid' : 'Unpaid',
        'Due Date': transaction.due_date ? new Date(transaction.due_date).toLocaleDateString('en-IN') : ''
      }))
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')

    // Add summary sheet
    const summaryData = [
      { Metric: 'Total Purchases', Value: reportData.totalPurchases },
      { Metric: 'Total Payments', Value: reportData.totalPayments },
      { Metric: 'Net Outstanding', Value: reportData.netOutstanding }
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    XLSX.writeFile(workbook, `transactions-report-${dateFrom}-to-${dateTo}.xlsx`)
  }

  const exportToPDF = () => {
    const pdf = new jsPDF()
    
    // Add title
    pdf.setFontSize(20)
    pdf.text('Transaction Report', 20, 20)
    
    // Add date range
    pdf.setFontSize(12)
    pdf.text(`Period: ${dateFrom} to ${dateTo}`, 20, 35)
    
    // Add summary
    pdf.setFontSize(14)
    pdf.text('Summary', 20, 55)
    pdf.setFontSize(10)
    pdf.text(`Total Purchases: ₹${reportData.totalPurchases.toLocaleString()}`, 20, 70)
    pdf.text(`Total Payments: ₹${reportData.totalPayments.toLocaleString()}`, 20, 80)
    pdf.text(`Net Outstanding: ₹${reportData.netOutstanding.toLocaleString()}`, 20, 90)
    
    // Add supplier breakdown
    pdf.setFontSize(14)
    pdf.text('Top Suppliers by Purchases', 20, 110)
    pdf.setFontSize(10)
    
    let yPosition = 125
    reportData.supplierBreakdown.slice(0, 15).forEach((supplier, index) => {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.text(`${index + 1}. ${supplier.supplier}: ₹${supplier.purchases.toLocaleString()}`, 20, yPosition)
      yPosition += 10
    })
    
    pdf.save(`transactions-report-${dateFrom}-to-${dateTo}.pdf`)
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
          <p className="text-gray-600 mt-1">Analyze your supplier transactions and purchases</p>
        </div>
        
        {/* Enhanced Export Options */}
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            disabled={transactions.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4 mr-2" />
            CSV
          </button>
          <button
            onClick={exportToExcel}
            disabled={transactions.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </button>
          <button
            onClick={exportToPDF}
            disabled={transactions.length === 0}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Date Filter</h2>
          <div className="flex items-center space-x-4 ml-auto">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.totalPurchases)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalPayments)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Outstanding Due</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.netOutstanding)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Purchase Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Purchase Distribution by Suppliers</h2>
                <p className="text-gray-600 mt-1">Shows purchase amounts from each supplier</p>
              </div>
              <PieChart className="h-6 w-6 text-gray-400" />
            </div>
            
            {reportData.pieChartData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={reportData.pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) => 
                          `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                      >
                        {reportData.pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Purchases']} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Top Suppliers List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers</h3>
                  <div className="space-y-3">
                    {reportData.pieChartData.slice(0, 8).map((supplier) => (
                      <div key={supplier.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-3" 
                            style={{ backgroundColor: supplier.color }}
                          ></div>
                          <span className="font-medium text-gray-900">{supplier.name}</span>
                        </div>
                        <span className="text-gray-600 font-semibold">{formatCurrency(supplier.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No purchase data available for the selected period</p>
              </div>
            )}
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

          {/* Supplier Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Detailed Supplier Breakdown</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
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