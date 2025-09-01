import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Supplier, Transaction } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { BusinessOwnersService, BusinessOwner } from '../lib/businessOwners'
import { 
  ArrowLeft,
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
  Edit,
  Trash2
} from 'lucide-react'

const SupplierDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentOwnerId, setPaymentOwnerId] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchaseOwnerId, setPurchaseOwnerId] = useState('')
  const [purchaseDescription, setPurchaseDescription] = useState('')
  const [purchaseDueDate, setPurchaseDueDate] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [currentBalance, setCurrentBalance] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  })
  const [supplierStats, setSupplierStats] = useState({
    totalPurchases: 0,
    totalPaid: 0,
    totalDue: 0,
    transactionCount: 0
  })

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

      // Fetch transactions for this supplier with owner info
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          owner:business_owners(owner_name)
        `)
        .eq('supplier_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      // Fetch business owners for dropdowns
      const businessOwnersService = BusinessOwnersService.getInstance()
      const owners = await businessOwnersService.getBusinessOwners(user.id)

      setSupplier(supplierData)
      setTransactions(transactionsData || [])
      setBusinessOwners(owners || [])

      // Calculate comprehensive statistics
      let totalPurchases = 0
      let totalPaid = 0
      let currentDue = 0

      transactionsData?.forEach((transaction) => {
        const amount = parseFloat(transaction.amount.toString())
        
        if (transaction.type === 'new_purchase') {
          totalPurchases += amount
          if (!transaction.is_paid) {
            currentDue += amount
          }
        } else if (transaction.type === 'pay_due' || transaction.type === 'settle_bill') {
          totalPaid += amount
          currentDue -= amount
        }
      })

      setCurrentBalance(Math.max(0, currentDue))
      setSupplierStats({
        totalPurchases,
        totalPaid,
        totalDue: Math.max(0, currentDue),
        transactionCount: transactionsData?.length || 0
      })
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
          is_paid: true,
          owner_id: paymentOwnerId || null
        }])

      if (error) throw error

      await fetchSupplierData()
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentOwnerId('')
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
          is_paid: false,
          owner_id: purchaseOwnerId || null
        }])

      if (error) throw error

      await fetchSupplierData()
      setShowPurchaseModal(false)
      setPurchaseAmount('')
      setPurchaseOwnerId('')
      setPurchaseDescription('')
      setPurchaseDueDate('')
    } catch (error) {
      console.error('Error adding purchase:', error)
    }
  }

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id) return

    try {
      const { error } = await supabase
        .from('suppliers')
        .update(editFormData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchSupplierData()
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating supplier:', error)
    }
  }

  const handleDeleteSupplier = async () => {
    if (!user || !id) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${supplier?.name}? This will also delete all associated transactions. This action cannot be undone.`
    )

    if (!confirmDelete) return

    try {
      // Delete all transactions first
      await supabase
        .from('transactions')
        .delete()
        .eq('supplier_id', id)
        .eq('user_id', user.id)

      // Then delete the supplier
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      navigate('/suppliers')
    } catch (error) {
      console.error('Error deleting supplier:', error)
    }
  }

  const openEditModal = () => {
    if (supplier) {
      setEditFormData({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || ''
      })
      setShowEditModal(true)
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
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="flex space-x-2">
            <button
              onClick={openEditModal}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              title="Edit Supplier"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDeleteSupplier}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              title="Delete Supplier"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
          <div className="flex space-x-2">
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
      </div>

      {/* Enhanced Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Purchases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(supplierStats.totalPurchases)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(supplierStats.totalPaid)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Outstanding Due */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding Due</p>
              <p className={`text-2xl font-bold ${supplierStats.totalDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {formatCurrency(supplierStats.totalDue)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${supplierStats.totalDue > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <DollarSign className={`h-6 w-6 ${supplierStats.totalDue > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{supplierStats.transactionCount}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Receipt className="h-6 w-6 text-gray-600" />
            </div>
          </div>
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

          {/* Payment Status Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Status</h3>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Rate</span>
                <span className="text-sm font-medium">
                  {supplierStats.totalPurchases > 0 
                    ? `${Math.round((supplierStats.totalPaid / supplierStats.totalPurchases) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ 
                    width: supplierStats.totalPurchases > 0 
                      ? `${Math.min((supplierStats.totalPaid / supplierStats.totalPurchases) * 100, 100)}%`
                      : '0%'
                  }}
                ></div>
              </div>
              <div className="text-center pt-2">
                <p className={`text-2xl font-bold ${supplierStats.totalDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {supplierStats.totalDue > 0 ? formatCurrency(supplierStats.totalDue) : 'All Clear!'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {supplierStats.totalDue > 0 ? 'Outstanding Balance' : 'No pending dues'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Pay Due
                  </button>
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    New Purchase
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">{transactions.length > 0 ? (
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
                          {transaction.owner?.owner_name && (
                            <p className="text-xs text-blue-600 mt-1">
                              {transaction.type === 'new_purchase' ? 'Purchased by: ' : 'Paid by: '}
                              {transaction.owner.owner_name}
                            </p>
                          )}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Made By
                </label>
                <select
                  value={paymentOwnerId}
                  onChange={(e) => setPaymentOwnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select who made this payment</option>
                  {businessOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.owner_name} {owner.is_primary && '(Primary)'} - {owner.role}
                    </option>
                  ))}
                </select>
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
                  Purchase Made By
                </label>
                <select
                  value={purchaseOwnerId}
                  onChange={(e) => setPurchaseOwnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select who made this purchase</option>
                  {businessOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.owner_name} {owner.is_primary && '(Primary)'} - {owner.role}
                    </option>
                  ))}
                </select>
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

      {/* Edit Supplier Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit Supplier</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSupplier} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={editFormData.contact_person}
                  onChange={(e) => setEditFormData({...editFormData, contact_person: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  rows={3}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Supplier
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