import { useState, useEffect } from 'react'
import { supabase, Transaction } from '../lib/supabase'
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
  Users,
  User,
  Filter
} from 'lucide-react'
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, Tooltip, Pie } from 'recharts'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

interface ReportData {
  totalPurchases: number
  totalPayments: number
  totalGives: number
  totalTakes: number
  totalSpends: number
  netOutstanding: number
  supplierBreakdown: Array<{
    supplier: string
    purchases: number
    payments: number
    outstanding: number
  }>
  personBreakdown: Array<{
    person: string
    gives: number
    takes: number
    outstanding: number
  }>
  spendBreakdown: Array<{
    category: string
    amount: number
  }>
  pieChartData: Array<{
    name: string
    value: number
    color: string
  }>
  categoryFilter: 'suppliers' | 'persons' | 'spends'
}

const Reports = () => {
  const { user } = useAuth()
  const [userMode, setUserMode] = useState<'business' | 'personal'>('business')
  const [reportData, setReportData] = useState<ReportData>({
    totalPurchases: 0,
    totalPayments: 0,
    totalGives: 0,
    totalTakes: 0,
    totalSpends: 0,
    netOutstanding: 0,
    supplierBreakdown: [],
    personBreakdown: [],
    spendBreakdown: [],
    pieChartData: [],
    categoryFilter: 'persons'
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loanTransactions, setLoanTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showExportDropdown, setShowExportDropdown] = useState(false)

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    setDateTo(today.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    const loadUserMode = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('mode')
          .eq('user_id', user.id)
          .single()

        if (!error && data) {
          setUserMode(data.mode)
          // Set default filter based on mode
          if (data.mode === 'personal') {
            setReportData(prev => ({ ...prev, categoryFilter: 'persons' }))
          } else {
            setReportData(prev => ({ ...prev, categoryFilter: 'suppliers' }))
          }
        }
      } catch (error) {
        console.error('Error loading user mode:', error)
      }
    }

    loadUserMode()
  }, [user])

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchReportData()
    }
  }, [user, dateFrom, dateTo])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showExportDropdown) {
        setShowExportDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportDropdown])

  const fetchReportData = async (filter?: 'suppliers' | 'persons' | 'spends') => {
    if (!user) return

    const currentFilter = filter || reportData.categoryFilter

    try {
      setLoading(true)
      
      // Fetch supplier transactions within date range
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          supplier:suppliers(name)
        `)
        .eq('user_id', user.id)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      // Fetch person loan transactions within date range
      const { data: loanTransactionsData, error: loanTransactionsError } = await supabase
        .from('loan_transactions')
        .select(`
          *,
          person:persons(name)
        `)
        .eq('user_id', user.id)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (loanTransactionsError) throw loanTransactionsError

      // Fetch personal spends within date range
      const { data: spendsData, error: spendsError } = await supabase
        .from('spends')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false })

      if (spendsError) throw spendsError

      setTransactions(transactionsData || [])
      setLoanTransactions(loanTransactionsData || [])

      // Calculate supplier report data
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

      // Calculate person report data
      const personMap = new Map()
      let totalGives = 0
      let totalTakes = 0

      loanTransactionsData?.forEach((transaction) => {
        const personName = transaction.person?.name || 'Unknown'
        const amount = parseFloat(transaction.amount.toString())

        if (!personMap.has(personName)) {
          personMap.set(personName, {
            person: personName,
            gives: 0,
            takes: 0,
            outstanding: 0
          })
        }

        const personData = personMap.get(personName)

        if (transaction.type === 'Gives') {
          personData.gives += amount
          totalGives += amount
          personData.outstanding += amount
        } else if (transaction.type === 'Takes') {
          personData.takes += amount
          totalTakes += amount
          personData.outstanding -= amount
        }

        personMap.set(personName, personData)
      })

      const supplierBreakdown = Array.from(supplierMap.values())
        .sort((a, b) => b.purchases - a.purchases)

      const personBreakdown = Array.from(personMap.values())
        .sort((a, b) => b.gives - a.gives)

      // Calculate spends report data
      const spendMap = new Map()
      let totalSpends = 0

      spendsData?.forEach((spend) => {
        const category = spend.category
        const amount = parseFloat(spend.amount.toString())

        if (!spendMap.has(category)) {
          spendMap.set(category, {
            category: category,
            amount: 0
          })
        }

        const spendData = spendMap.get(category)
        spendData.amount += amount
        totalSpends += amount

        spendMap.set(category, spendData)
      })

      const spendBreakdown = Array.from(spendMap.values())
        .sort((a, b) => b.amount - a.amount)

      const supplierOutstanding = supplierBreakdown.reduce((sum, supplier) => sum + supplier.outstanding, 0)
      const personOutstanding = personBreakdown.reduce((sum, person) => sum + person.outstanding, 0)
      const netOutstanding = supplierOutstanding + personOutstanding

      // Generate pie chart data based on category filter
      const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
      ]
      
      let pieChartData: Array<{
        name: string
        value: number
        color: string
      }> = []
      if (currentFilter === 'suppliers') {
        pieChartData = supplierBreakdown
          .filter(supplier => supplier.purchases > 0)
          .slice(0, 5)
          .map((supplier, index) => ({
            name: supplier.supplier,
            value: supplier.purchases,
            color: colors[index % colors.length]
          }))
      } else if (currentFilter === 'persons') {
        pieChartData = personBreakdown
          .filter(person => person.gives > 0)
          .slice(0, 5)
          .map((person, index) => ({
            name: person.person,
            value: person.gives,
            color: colors[index % colors.length]
          }))
      } else if (currentFilter === 'spends') {
        pieChartData = spendBreakdown
          .filter(spend => spend.amount > 0)
          .slice(0, 5)
          .map((spend, index) => ({
            name: spend.category,
            value: spend.amount,
            color: colors[index % colors.length]
          }))
      }

      setReportData({
        totalPurchases,
        totalPayments,
        totalGives,
        totalTakes,
        totalSpends,
        netOutstanding: Math.max(0, netOutstanding),
        supplierBreakdown,
        personBreakdown,
        spendBreakdown,
        pieChartData,
        categoryFilter: currentFilter
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    const currentFilter = reportData.categoryFilter
    const headers = [
      'Date',
      'Entity',
      'Type',
      'Description',
      'Amount',
      'Status',
      'Transaction Type'
    ]

    let csvData: any[] = []

    if (currentFilter === 'suppliers') {
      const supplierCsvData = transactions.map(transaction => [
        new Date(transaction.created_at).toLocaleDateString('en-IN'),
        transaction.supplier?.name || 'Unknown',
        getTransactionTypeLabel(transaction.type),
        transaction.description,
        parseFloat(transaction.amount.toString()),
        transaction.is_paid ? 'Paid' : 'Unpaid',
        'Supplier'
      ])
      csvData = [...csvData, ...supplierCsvData]
    }

    if (currentFilter === 'persons') {
      const personCsvData = loanTransactions.map((transaction: any) => [
        new Date(transaction.created_at).toLocaleDateString('en-IN'),
        transaction.person?.name || 'Unknown',
        transaction.type,
        transaction.description || '',
        parseFloat(transaction.amount.toString()),
        'Completed',
        'Person'
      ])
      csvData = [...csvData, ...personCsvData]
    }

    if (currentFilter === 'spends') {
      // Fetch spends data for export
      const { data: spendsData } = await supabase
        .from('spends')
        .select('*')
        .gte('created_at', `${dateFrom}T00:00:00.000Z`)
        .lte('created_at', `${dateTo}T23:59:59.999Z`)
        .eq('user_id', user?.id)

      if (spendsData) {
        const spendCsvData = spendsData.map((spend: any) => [
          new Date(spend.created_at).toLocaleDateString('en-IN'),
          spend.category,
          'Spend',
          spend.description,
          parseFloat(spend.amount.toString()),
          'Completed',
          'Spend'
        ])
        csvData = [...csvData, ...spendCsvData]
      }
    }

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map((cell: string | number) => `"${cell}"`).join(','))
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

  const exportToExcel = async () => {
    const currentFilter = reportData.categoryFilter
    let allTransactions: any[] = []

    if (currentFilter === 'suppliers') {
      const supplierData = transactions.map(transaction => ({
        Date: new Date(transaction.created_at).toLocaleDateString('en-IN'),
        Entity: transaction.supplier?.name || 'Unknown',
        Type: getTransactionTypeLabel(transaction.type),
        Description: transaction.description,
        Amount: parseFloat(transaction.amount.toString()),
        Status: transaction.is_paid ? 'Paid' : 'Unpaid',
        'Transaction Type': 'Supplier'
      }))
      allTransactions = [...allTransactions, ...supplierData]
    }

    if (currentFilter === 'persons') {
      const personData = loanTransactions.map((transaction: any) => ({
        Date: new Date(transaction.created_at).toLocaleDateString('en-IN'),
        Entity: transaction.person?.name || 'Unknown',
        Type: transaction.type,
        Description: transaction.description || '',
        Amount: parseFloat(transaction.amount.toString()),
        Status: 'Completed',
        'Transaction Type': 'Person'
      }))
      allTransactions = [...allTransactions, ...personData]
    }

    if (currentFilter === 'spends') {
      const { data: spendsData } = await supabase
        .from('spends')
        .select('*')
        .gte('created_at', `${dateFrom}T00:00:00.000Z`)
        .lte('created_at', `${dateTo}T23:59:59.999Z`)
        .eq('user_id', user?.id)

      if (spendsData) {
        const spendData = spendsData.map((spend: any) => ({
          Date: new Date(spend.created_at).toLocaleDateString('en-IN'),
          Category: spend.category,
          Description: spend.description,
          Amount: parseFloat(spend.amount.toString()),
          'Transaction Type': 'Spend'
        }))
        allTransactions = [...allTransactions, ...spendData]
      }
    }    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(allTransactions), 'Transactions')

    // Add summary sheet
    const summaryData = []
    if (currentFilter === 'suppliers') {
      summaryData.push(
        { Metric: 'Total Purchases', Value: reportData.totalPurchases },
        { Metric: 'Total Payments', Value: reportData.totalPayments }
      )
    }
    if (currentFilter === 'persons') {
      summaryData.push(
        { Metric: 'Total Gives', Value: reportData.totalGives },
        { Metric: 'Total Takes', Value: reportData.totalTakes }
      )
    }
    if (currentFilter === 'spends') {
      summaryData.push(
        { Metric: 'Total Spends', Value: reportData.totalSpends }
      )
    }
    summaryData.push({ Metric: 'Net Outstanding', Value: reportData.netOutstanding })

    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    XLSX.writeFile(workbook, `transactions-report-${dateFrom}-to-${dateTo}.xlsx`)
  }

  const exportToPDF = async () => {
    const currentFilter = reportData.categoryFilter
    const pdf = new jsPDF()
    
    // Add title
    pdf.setFontSize(20)
    pdf.text(`${currentFilter === 'suppliers' ? 'Supplier' : currentFilter === 'persons' ? 'Person' : 'Spends'} Transaction Report`, 20, 20)
    
    // Add date range
    pdf.setFontSize(12)
    pdf.text(`Period: ${dateFrom} to ${dateTo}`, 20, 35)
    
    // Add summary
    pdf.setFontSize(14)
    pdf.text('Summary', 20, 55)
    pdf.setFontSize(10)
    let yPosition = 70

    if (currentFilter === 'suppliers') {
      pdf.text(`Total Purchases: ₹${reportData.totalPurchases.toLocaleString()}`, 20, yPosition)
      yPosition += 10
      pdf.text(`Total Payments: ₹${reportData.totalPayments.toLocaleString()}`, 20, yPosition)
      yPosition += 10
    }

    if (currentFilter === 'persons') {
      pdf.text(`Total Gives: ₹${reportData.totalGives.toLocaleString()}`, 20, yPosition)
      yPosition += 10
      pdf.text(`Total Takes: ₹${reportData.totalTakes.toLocaleString()}`, 20, yPosition)
      yPosition += 10
    }

    if (currentFilter === 'spends') {
      pdf.text(`Total Spends: ₹${reportData.totalSpends.toLocaleString()}`, 20, yPosition)
      yPosition += 10
    }

    pdf.text(`Net Outstanding: ₹${reportData.netOutstanding.toLocaleString()}`, 20, yPosition)
    yPosition += 20
    
    // Add breakdown
    if (currentFilter === 'suppliers' && reportData.supplierBreakdown.length > 0) {
      pdf.setFontSize(14)
      pdf.text('Top Suppliers by Purchases', 20, yPosition)
      pdf.setFontSize(10)
      yPosition += 15
      
      reportData.supplierBreakdown.slice(0, 10).forEach((supplier, index) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(`${index + 1}. ${supplier.supplier}: ₹${supplier.purchases.toLocaleString()}`, 20, yPosition)
        yPosition += 10
      })
    } else if (currentFilter === 'persons' && reportData.personBreakdown.length > 0) {
      pdf.setFontSize(14)
      pdf.text('Top Persons by Loans Given', 20, yPosition)
      pdf.setFontSize(10)
      yPosition += 15
      
      reportData.personBreakdown.slice(0, 10).forEach((person, index) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(`${index + 1}. ${person.person}: ₹${person.gives.toLocaleString()}`, 20, yPosition)
        yPosition += 10
      })
    } else if (currentFilter === 'spends' && reportData.spendBreakdown.length > 0) {
      pdf.setFontSize(14)
      pdf.text('Top Spend Categories', 20, yPosition)
      pdf.setFontSize(10)
      yPosition += 15
      
      reportData.spendBreakdown.slice(0, 10).forEach((spend, index) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(`${index + 1}. ${spend.category}: ₹${spend.amount.toLocaleString()}`, 20, yPosition)
        yPosition += 10
      })
    }
    
    pdf.save(`${currentFilter === 'suppliers' ? 'supplier' : currentFilter === 'persons' ? 'person' : 'spends'}-transaction-report-${dateFrom}-to-${dateTo}.pdf`)
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Analyze your supplier transactions and purchases</p>
        </div>
        
        {/* Export Dropdown */}
        <div className="relative export-dropdown">
          <button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            disabled={transactions.length === 0}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          
          {showExportDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-2">
                <button
                  onClick={() => {
                    exportToCSV()
                    setShowExportDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
                >
                  <FileText className="h-4 w-4 mr-3 text-green-600" />
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    exportToExcel()
                    setShowExportDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-3 text-blue-600" />
                  Export as Excel
                </button>
                <button
                  onClick={() => {
                    exportToPDF()
                    setShowExportDropdown(false)
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
                >
                  <Download className="h-4 w-4 mr-3 text-red-600" />
                  Export as PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {userMode === 'business' && (
            <button
              onClick={() => {
                setReportData(prev => ({ ...prev, categoryFilter: 'suppliers' }))
                fetchReportData('suppliers')
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                reportData.categoryFilter === 'suppliers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Suppliers
            </button>
          )}
          <button
            onClick={() => {
              setReportData(prev => ({ ...prev, categoryFilter: 'persons' }))
              fetchReportData('persons')
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              reportData.categoryFilter === 'persons'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Persons
          </button>
          <button
            onClick={() => {
              setReportData(prev => ({ ...prev, categoryFilter: 'spends' }))
              fetchReportData('spends')
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              reportData.categoryFilter === 'spends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Spends
          </button>
        </nav>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <label className="text-sm font-medium text-gray-700 w-12 flex-shrink-0">From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <label className="text-sm font-medium text-gray-700 w-12 flex-shrink-0">To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {reportData.categoryFilter === 'suppliers' && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(reportData.totalPurchases)}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Payments</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(reportData.totalPayments)}</p>
                    </div>
                    <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                </div>
              </>
            )}

            {reportData.categoryFilter === 'persons' && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Gives</p>
                      <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(reportData.totalGives)}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Takes</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(reportData.totalTakes)}</p>
                    </div>
                    <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                </div>
              </>
            )}

            {reportData.categoryFilter === 'spends' && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Spends</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-600">{formatCurrency(reportData.totalSpends)}</p>
                    </div>
                    <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                </div>
              </>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(reportData.netOutstanding)}</p>
                </div>
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Purchase Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {reportData.categoryFilter === 'suppliers' ? 'Purchase Distribution by Suppliers' :
                   reportData.categoryFilter === 'persons' ? 'Loan Distribution by Persons' :
                   'Spend Distribution by Categories'}
                </h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {reportData.categoryFilter === 'suppliers' ? 'Shows purchase amounts from each supplier' :
                   reportData.categoryFilter === 'persons' ? 'Shows loan amounts given to each person' :
                   'Shows spending amounts by category'}
                </p>
              </div>
              <PieChart className="h-6 w-6 text-gray-400 mt-2 sm:mt-0" />
            </div>
            
            {reportData.pieChartData.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <div className="h-60 sm:h-72 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={reportData.pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), 
                          reportData.categoryFilter === 'suppliers' ? 'Purchases' :
                          reportData.categoryFilter === 'persons' ? 'Loans Given' :
                          'Spends']}
                        labelFormatter={(label) => `${label}`}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Top Suppliers/Persons List */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    {reportData.categoryFilter === 'suppliers' ? 'Top Suppliers' :
                     reportData.categoryFilter === 'persons' ? 'Top Persons' :
                     'Top Spend Categories'}
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {reportData.pieChartData.slice(0, 8).map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center min-w-0 flex-1">
                          <div 
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 sm:mr-3 flex-shrink-0" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</span>
                        </div>
                        <span className="text-gray-600 font-semibold text-sm sm:text-base ml-2 flex-shrink-0">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {reportData.categoryFilter === 'suppliers' 
                    ? 'No purchase data available for the selected period'
                    : reportData.categoryFilter === 'persons'
                    ? 'No loan data available for the selected period'
                    : 'No spend data available for the selected period'}
                </p>
              </div>
            )}
          </div>

          {/* Supplier Breakdown */}
          {reportData.categoryFilter === 'suppliers' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Detailed Supplier Breakdown</h2>
                <BarChart3 className="h-5 w-5 text-gray-400 mt-2 sm:mt-0" />
              </div>

              {reportData.supplierBreakdown.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {reportData.supplierBreakdown.map((supplier, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{supplier.supplier}</h3>
                        <span className="text-xs sm:text-sm font-medium text-blue-600 mt-1 sm:mt-0">
                          Outstanding: {formatCurrency(supplier.outstanding)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
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
                <div className="text-center py-6 sm:py-8">
                  <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No data available for the selected period</p>
                </div>
              )}
            </div>
          )}

          {/* Person Breakdown */}
          {reportData.categoryFilter === 'persons' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Detailed Person Breakdown</h2>
                <BarChart3 className="h-5 w-5 text-gray-400 mt-2 sm:mt-0" />
              </div>

              {reportData.personBreakdown.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {reportData.personBreakdown.map((person, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{person.person}</h3>
                        <span className="text-xs sm:text-sm font-medium text-blue-600 mt-1 sm:mt-0">
                          Outstanding: {formatCurrency(person.outstanding)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-gray-600">Total Gives</p>
                          <p className="font-medium text-red-600">{formatCurrency(person.gives)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Takes</p>
                          <p className="font-medium text-green-600">{formatCurrency(person.takes)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No data available for the selected period</p>
                </div>
              )}
            </div>
          )}

          {/* Spends Breakdown */}
          {reportData.categoryFilter === 'spends' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Detailed Spends Breakdown</h2>
                <BarChart3 className="h-5 w-5 text-gray-400 mt-2 sm:mt-0" />
              </div>

              {reportData.spendBreakdown.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {reportData.spendBreakdown.map((spend, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{spend.category}</h3>
                        <span className="text-xs sm:text-sm font-medium text-purple-600 mt-1 sm:mt-0">
                          Total: {formatCurrency(spend.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No data available for the selected period</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Reports
