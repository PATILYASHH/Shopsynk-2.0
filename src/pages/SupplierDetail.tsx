import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  const [showProfile, setShowProfile] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    transaction: Transaction | null
  }>({ show: false, x: 0, y: 0, transaction: null })
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editTransactionAmount, setEditTransactionAmount] = useState('')
  const [editTransactionDescription, setEditTransactionDescription] = useState('')

  // Utility functions for local storage
  const saveLastSelectedOwner = (ownerId: string) => {
    localStorage.setItem('shopsynk_last_selected_owner', ownerId)
  }

  const getLastSelectedOwner = () => {
    return localStorage.getItem('shopsynk_last_selected_owner') || ''
  }

  useEffect(() => {
    if (id) {
      fetchSupplierData()
    }
  }, [id, user])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu()
      }
    }

    if (contextMenu.show) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [contextMenu.show])

  // Listen for custom events from Layout component
  useEffect(() => {
    const handleOpenPurchaseModal = () => {
      setShowPurchaseModal(true)
    }

    const handleOpenPaymentModal = () => {
      setShowPaymentModal(true)
    }

    window.addEventListener('openPurchaseModal', handleOpenPurchaseModal)
    window.addEventListener('openPaymentModal', handleOpenPaymentModal)

    return () => {
      window.removeEventListener('openPurchaseModal', handleOpenPurchaseModal)
      window.removeEventListener('openPaymentModal', handleOpenPaymentModal)
    }
  }, [])

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

      // Set default owner from local storage if available
      const lastSelectedOwner = getLastSelectedOwner()
      if (lastSelectedOwner && owners && owners.some(owner => owner.id === lastSelectedOwner)) {
        setPaymentOwnerId(lastSelectedOwner)
        setPurchaseOwnerId(lastSelectedOwner)
      }

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
    if (!user || !id || !paymentAmount || !paymentOwnerId) return

    try {
      // Save the selected owner to local storage for future use
      saveLastSelectedOwner(paymentOwnerId)

      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          supplier_id: id,
          type: 'pay_due',
          amount: parseFloat(paymentAmount),
          description: paymentDescription || 'Payment made',
          is_paid: true,
          owner_id: paymentOwnerId
        }])

      if (error) throw error

      await fetchSupplierData()
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentDescription('')
      // Keep the owner selected for next transaction
    } catch (error) {
      console.error('Error processing payment:', error)
    }
  }

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id || !purchaseAmount || !purchaseOwnerId) return

    try {
      // Save the selected owner to local storage for future use
      saveLastSelectedOwner(purchaseOwnerId)

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
          owner_id: purchaseOwnerId
        }])

      if (error) throw error

      await fetchSupplierData()
      setShowPurchaseModal(false)
      setPurchaseAmount('')
      setPurchaseDescription('')
      setPurchaseDueDate('')
      // Keep the owner selected for next transaction
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

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, transaction: Transaction) => {
    e.preventDefault()
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      transaction
    })
  }

  const handleLongPress = (transaction: Transaction) => {
    // For mobile long press, show context menu at center of screen
    setContextMenu({
      show: true,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      transaction
    })
  }

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, transaction: null })
  }

  const editTransaction = () => {
    if (contextMenu.transaction) {
      setEditingTransaction(contextMenu.transaction)
      setEditTransactionAmount(contextMenu.transaction.amount.toString())
      setEditTransactionDescription(contextMenu.transaction.description || '')
      setShowEditTransactionModal(true)
      closeContextMenu()
    }
  }

  const deleteTransaction = async () => {
    if (!contextMenu.transaction || !user) return

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this transaction? This action cannot be undone.'
    )

    if (!confirmDelete) {
      closeContextMenu()
      return
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', contextMenu.transaction.id)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchSupplierData()
      closeContextMenu()
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  // Custom hook for long press
  const useLongPress = (onLongPress: () => void, delay = 500) => {
    const [longPressTriggered, setLongPressTriggered] = useState(false)
    const timeout = useRef<NodeJS.Timeout>()
    const target = useRef<EventTarget>()

    const start = useCallback(
      (event: React.TouchEvent | React.MouseEvent) => {
        if (event.type === 'mousedown' && (event as React.MouseEvent).button !== 0) {
          return
        }

        timeout.current = setTimeout(() => {
          onLongPress()
          setLongPressTriggered(true)
        }, delay)

        target.current = event.target
      },
      [onLongPress, delay]
    )

    const clear = useCallback(
      (event: React.TouchEvent | React.MouseEvent) => {
        timeout.current && clearTimeout(timeout.current)
        if (longPressTriggered) {
          event.preventDefault()
          event.stopPropagation()
        }
        setLongPressTriggered(false)
      },
      [longPressTriggered]
    )

    return {
      onMouseDown: (e: React.MouseEvent) => start(e),
      onTouchStart: (e: React.TouchEvent) => start(e),
      onMouseUp: (e: React.MouseEvent) => clear(e),
      onTouchEnd: (e: React.TouchEvent) => clear(e),
      onMouseLeave: (e: React.MouseEvent) => clear(e)
    }
  }

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransaction || !user || !editTransactionAmount) return

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(editTransactionAmount),
          description: editTransactionDescription || null
        })
        .eq('id', editingTransaction.id)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchSupplierData()
      setShowEditTransactionModal(false)
      setEditingTransaction(null)
      setEditTransactionAmount('')
      setEditTransactionDescription('')
    } catch (error) {
      console.error('Error updating transaction:', error)
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

  const handleCall = () => {
    if (supplier?.phone) {
      window.location.href = `tel:${supplier.phone}`
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

  // Transaction Item Component (to properly use hooks)
  const TransactionItem = ({ transaction }: { transaction: any }) => {
    const longPressProps = useLongPress(() => handleLongPress(transaction))
    
    return (
      <div 
        key={transaction.id} 
        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer select-none"
        onContextMenu={(e) => handleContextMenu(e, transaction)}
        {...longPressProps}
      >
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WhatsApp-style Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          {/* Clickable Profile Section */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center space-x-3 flex-1 text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            {/* Profile Avatar */}
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {supplier.name.charAt(0).toUpperCase()}
            </div>
            
            {/* Name and Status */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">{supplier.name}</h1>
              <p className="text-sm text-gray-500 truncate">
                {supplier.contact_person ? `Contact: ${supplier.contact_person}` : 'Business Supplier'}
              </p>
            </div>
          </button>

          {/* Call Button */}
          <button
            onClick={supplier.phone ? handleCall : undefined}
            className={`p-3 rounded-full transition-colors ${
              supplier.phone 
                ? 'hover:bg-green-100 text-green-600 cursor-pointer' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            disabled={!supplier.phone}
            title={supplier.phone ? `Call ${supplier.phone}` : 'No phone number available'}
          >
            <Phone className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Profile Modal - WhatsApp Style */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden">
            {/* Profile Header */}
            <div className="bg-blue-500 text-white p-6 text-center">
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                {supplier.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold">{supplier.name}</h2>
              {supplier.contact_person && (
                <p className="text-blue-100 text-sm mt-1">{supplier.contact_person}</p>
              )}
            </div>

            {/* Profile Details */}
            <div className="p-4 space-y-4">
              {supplier.phone && (
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{supplier.phone}</p>
                    <p className="text-sm text-gray-500">Mobile</p>
                  </div>
                  <button
                    onClick={handleCall}
                    className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors"
                  >
                    Call
                  </button>
                </div>
              )}

              {supplier.email && (
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{supplier.email}</p>
                    <p className="text-sm text-gray-500">Email</p>
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{supplier.address}</p>
                    <p className="text-sm text-gray-500">Address</p>
                  </div>
                </div>
              )}

              {/* Due Amount */}
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Outstanding Amount</p>
                <p className={`text-2xl font-bold ${
                  supplierStats.totalDue > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(supplierStats.totalDue)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowProfile(false)
                    openEditModal()
                  }}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false)
                    handleDeleteSupplier()
                  }}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Profile
                </button>
              </div>
              <button
                onClick={() => setShowProfile(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 space-y-6">

      {/* Outstanding Amount & Desktop Actions - Right below navbar */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 w-full">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-600 mb-2">Outstanding Amount</p>
            <p className={`text-4xl font-bold ${
              supplierStats.totalDue > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {formatCurrency(supplierStats.totalDue)}
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="flex items-center justify-center bg-red-500 text-white px-5 py-3 rounded-xl hover:bg-red-600 font-semibold shadow-md transition-all"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add Purchase
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center justify-center bg-green-500 text-white px-5 py-3 rounded-xl hover:bg-green-600 font-semibold shadow-md transition-all"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Pay Due
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Paid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(supplierStats.totalPaid)}</p>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Purchases</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(supplierStats.totalPurchases)}</p>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Receipt className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{supplierStats.transactionCount}</p>
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
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            </div>

            <div className="p-6">
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
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
                  Payment Made By *
                </label>
                <select
                  value={paymentOwnerId}
                  onChange={(e) => setPaymentOwnerId(e.target.value)}
                  required
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
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
                  Purchase Made By *
                </label>
                <select
                  value={purchaseOwnerId}
                  onChange={(e) => setPurchaseOwnerId(e.target.value)}
                  required
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end sm:items-center justify-center p-4">
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
      
      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="fixed z-[70] bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-32"
          style={{ 
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            top: Math.min(contextMenu.y, window.innerHeight - 100)
          }}
        >
          <button
            onClick={editTransaction}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
          >
            <Edit className="h-4 w-4 mr-3 text-blue-600" />
            Edit Transaction
          </button>
          <button
            onClick={deleteTransaction}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
          >
            <Trash2 className="h-4 w-4 mr-3 text-red-600" />
            Delete Transaction
          </button>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditTransactionModal && editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Edit Transaction
            </h2>
            
            <form onSubmit={handleEditTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editTransactionAmount}
                    onChange={(e) => setEditTransactionAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editTransactionDescription}
                  onChange={(e) => setEditTransactionDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Transaction description"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Type: <span className="font-medium">{getTransactionTypeLabel(editingTransaction.type)}</span>
                </p>
                <p className="text-sm text-blue-700">
                  Date: <span className="font-medium">{formatDate(editingTransaction.created_at)}</span>
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditTransactionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default SupplierDetail