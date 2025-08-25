import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Supplier, Transaction } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft,
  Plus,
  Phone,
  Mail,
  MapPin,
  User,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

const SupplierDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchaseDescription, setPurchaseDescription] = useState('')
  const [purchaseDueDate, setPurchaseDueDate] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [currentBalance, setCurrentBalance] = useState(0)

  useEffect(() => {
    if (id) {
      fetchSupplierData()
    }
  }, [id, user])

  const fetchSupplierData = async () => {
    if (!user || !id) return

    try {
      // Fetch supplier details
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (supplierError) throw supplierError

      // Fetch transactions for this supplier
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('supplier_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      setSupplier(supplierData)
      setTransactions(transactionsData || [])

      // Calculate current balance
      let balance = 0
      transactionsData?.forEach((transaction) => {
        if (transaction.type === 'new_purchase' && !transaction.is_paid) {
          balance += parseFloat(transaction.amount.toString())
        } else if (transaction.type === 'pay_due' || transaction.type === 'settle_bill') {
          balance -= parseFloat(transaction.amount.toString())
        }
      })
      setCurrentBalance(Math.max(0, balance))
    } catch (error) {
      console.error('Error fetching supplier data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id || !paymentAmount) return

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          supplier_id: id,
          type: 'pay_due',
          amount: parseFloat(paymentAmount),
          description: paymentDescription || 'Payment made',
          is_paid: true
        }])

      if (error) throw error

      await fetchSupplierData()
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentDescription('')
    } catch (error) {
      console.error('Error processing payment:', error)
    }
  }

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id || !purchaseAmount) return

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          supplier_id: id,
          type: 'new_purchase',
          amount: parseFloat(purchaseAmount),
          description: purchaseDescription || 'New purchase',
          due_date: purchaseDueDate || null,
          is_paid: false
        }])

      if (error) throw error

      await fetchSupplierData()
      setShowPurchaseModal(false)
      setPurchaseAmount('')
      setPurchaseDescription('')
      setPurchaseDueDate('')
    } catch (error) {
      console.error('Error adding purchase:', error)
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
        return <ArrowUpRight className="h-5 w-5 text-red-500" />
      case 'pay_due':
      case 'settle_bill':
        return <ArrowDownRight className="h-5 w-5 text-green-500" />
      default:
        return <Receipt className="h-5 w-5 text-gray-500" />
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

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'new_purchase':
        return 'text-red-600'
      case 'pay_due':
      case 'settle_bill':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Supplier not found</h3>
        <button
          onClick={() => navigate('/suppliers')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Suppliers
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
            <p className="text-gray-600 mt-1">Supplier Details & Transaction History</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Due
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Purchase
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Info & Balance */}
        <div className="lg:col-span-1 space-y-6">
          {/* Supplier Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{supplier.name}</h2>
                {supplier.contact_person && (
                  <p className="text-gray-600">{supplier.contact_person}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {supplier.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <span className="text-gray-700">{supplier.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Balance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Balance</h3>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(currentBalance)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {currentBalance > 0 ? 'Outstanding Amount' : 'All Settled'}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Transactions</span>
                <span className="font-medium">{transactions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Purchases</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(
                    transactions
                      .filter(t => t.type === 'new_purchase')
                      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Payments</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(
                    transactions
                      .filter(t => t.type === 'pay_due' || t.type === 'settle_bill')
                      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <Receipt className="h-5 w-5 text-gray-400" />
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {getTransactionTypeLabel(transaction.type)}
                            </span>
                            {!transaction.is_paid && transaction.type === 'new_purchase' && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                Unpaid
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">{transaction.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(transaction.created_at)}
                            </span>
                            {transaction.due_date && (
                              <span>Due: {formatDate(transaction.due_date)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'new_purchase' ? '+' : '-'}
                          {formatCurrency(parseFloat(transaction.amount.toString()))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet with this supplier</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Pay Due to {supplier.name}
            </h2>
            
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter payment amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Payment description (optional)"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  Current outstanding: <span className="font-medium">{formatCurrency(currentBalance)}</span>
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              New Purchase from {supplier.name}
            </h2>
            
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter purchase amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={purchaseDescription}
                  onChange={(e) => setPurchaseDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Purchase description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={purchaseDueDate}
                  onChange={(e) => setPurchaseDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierDetail