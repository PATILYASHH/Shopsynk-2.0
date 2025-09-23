import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Person, LoanTransaction } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { BusinessOwnersService, BusinessOwner } from '../lib/businessOwners'
import {
  ArrowLeft,
  Phone,
  Building,
  MapPin,
  User,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  HandCoins,
  Edit,
  Trash2
} from 'lucide-react'

const PersonDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [person, setPerson] = useState<Person | null>(null)
  const [transactions, setTransactions] = useState<LoanTransaction[]>([])
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loanAmount, setLoanAmount] = useState('')
  const [loanOwnerId, setLoanOwnerId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentOwnerId, setPaymentOwnerId] = useState('')
  const [loanDescription, setLoanDescription] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [loanDueDate, setLoanDueDate] = useState('')
  const [currentBalance, setCurrentBalance] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    company: '',
    phone: '',
    address: ''
  })
  const [personStats, setPersonStats] = useState({
    totalLoansGiven: 0,
    totalPaymentsReceived: 0,
    totalOutstanding: 0,
    transactionCount: 0
  })
  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    transaction: LoanTransaction | null
  }>({ show: false, x: 0, y: 0, transaction: null })
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<LoanTransaction | null>(null)
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
      fetchPersonData()
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
    const handleLoanModal = () => setShowLoanModal(true)
    const handlePaymentModal = () => setShowPaymentModal(true)

    window.addEventListener('openPurchaseModal', handleLoanModal)
    window.addEventListener('openPaymentModal', handlePaymentModal)

    return () => {
      window.removeEventListener('openPurchaseModal', handleLoanModal)
      window.removeEventListener('openPaymentModal', handlePaymentModal)
    }
  }, [])

  const fetchPersonData = useCallback(async () => {
    if (!user || !id) return

    try {
      setLoading(true)

      // Fetch person details
      const { data: personData, error: personError } = await supabase
        .from('persons')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (personError) throw personError
      setPerson(personData)

      // Fetch loan transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('loan_transactions')
        .select(`
          *,
          owner:owner_id (
            owner_name
          )
        `)
        .eq('person_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])

      // Fetch business owners
      const owners = await BusinessOwnersService.getInstance().getBusinessOwners(user.id)
      console.log('Fetched business owners:', owners)
      setBusinessOwners(owners)

      // Set default owner from localStorage or first available
      const lastOwner = getLastSelectedOwner()
      if (lastOwner && owners.find((o: BusinessOwner) => o.id === lastOwner)) {
        setLoanOwnerId(lastOwner)
        setPaymentOwnerId(lastOwner)
      } else if (owners.length > 0) {
        setLoanOwnerId(owners[0].id)
        setPaymentOwnerId(owners[0].id)
      }

      // Calculate current balance and stats
      calculateBalanceAndStats(transactionsData || [])

    } catch (error) {
      console.error('Error fetching person data:', error)
    } finally {
      setLoading(false)
    }
  }, [id, user])

  const calculateBalanceAndStats = (transactions: LoanTransaction[]) => {
    let balance = 0
    let totalLoansGiven = 0
    let totalPaymentsReceived = 0

    transactions.forEach(transaction => {
      if (transaction.type === 'Gives') {
        balance += parseFloat(transaction.amount.toString())
        totalLoansGiven += parseFloat(transaction.amount.toString())
      } else if (transaction.type === 'Takes') {
        balance -= parseFloat(transaction.amount.toString())
        totalPaymentsReceived += parseFloat(transaction.amount.toString())
      }
    })

    setCurrentBalance(balance)
    setPersonStats({
      totalLoansGiven,
      totalPaymentsReceived,
      totalOutstanding: Math.abs(balance),
      transactionCount: transactions.length
    })
  }

  const handleGiveLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('User:', user)
    console.log('Person:', person)
    console.log('Loan Amount:', loanAmount)
    console.log('Loan Owner ID:', loanOwnerId)
    console.log('Business Owners:', businessOwners)
    
    if (!user || !person || !loanAmount || !loanOwnerId) {
      alert('Please fill in all required fields')
      return
    }

    const amount = parseFloat(loanAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }

    setIsSubmitting(true)
    try {
      const transactionData = {
        user_id: user.id,
        person_id: person.id,
        owner_id: loanOwnerId,
        type: 'Gives',
        amount: amount,
        description: loanDescription || 'Gives',
        due_date: loanDueDate || null
      }
      
      console.log('Inserting transaction:', transactionData)
      
      const { error } = await supabase
        .from('loan_transactions')
        .insert([transactionData])

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Transaction inserted successfully')

      // Reset form
      setLoanAmount('')
      setLoanDescription('')
      setLoanDueDate('')
      setShowLoanModal(false)

      // Refresh data
      await fetchPersonData()

    } catch (error) {
      console.error('Error giving loan:', error)
      alert('Error creating transaction: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !person || !paymentAmount || !paymentOwnerId) {
      alert('Please fill in all required fields')
      return
    }

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('loan_transactions')
        .insert([{
          user_id: user.id,
          person_id: person.id,
          owner_id: paymentOwnerId,
          type: 'Takes',
          amount: amount,
          description: paymentDescription || 'Takes'
        }])

      if (error) throw error

      // Reset form
      setPaymentAmount('')
      setPaymentDescription('')
      setShowPaymentModal(false)

      // Refresh data
      await fetchPersonData()

    } catch (error) {
      console.error('Error receiving payment:', error)
      alert('Error creating transaction: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPerson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!person) return

    try {
      const { error } = await supabase
        .from('persons')
        .update({
          name: editFormData.name,
          company: editFormData.company,
          phone: editFormData.phone,
          address: editFormData.address
        })
        .eq('id', person.id)

      if (error) throw error

      setShowEditModal(false)
      await fetchPersonData()
    } catch (error) {
      console.error('Error updating person:', error)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const { error } = await supabase
        .from('loan_transactions')
        .delete()
        .eq('id', transactionId)

      if (error) throw error

      await fetchPersonData()
      closeContextMenu()
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransaction) return

    try {
      const { error } = await supabase
        .from('loan_transactions')
        .update({
          amount: parseFloat(editTransactionAmount),
          description: editTransactionDescription
        })
        .eq('id', editingTransaction.id)

      if (error) throw error

      setShowEditTransactionModal(false)
      setEditingTransaction(null)
      await fetchPersonData()
    } catch (error) {
      console.error('Error updating transaction:', error)
    }
  }

  const openContextMenu = (e: React.MouseEvent, transaction: LoanTransaction) => {
    e.preventDefault()
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      transaction
    })
  }

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, transaction: null })
  }

  const openEditTransactionModal = () => {
    if (contextMenu.transaction) {
      setEditingTransaction(contextMenu.transaction)
      setEditTransactionAmount(contextMenu.transaction.amount.toString())
      setEditTransactionDescription(contextMenu.transaction.description || '')
      setShowEditTransactionModal(true)
      closeContextMenu()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Person not found</h2>
          <button
            onClick={() => navigate('/persons')}
            className="text-green-600 hover:text-green-700"
          >
            Back to Persons
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 sm:h-16 gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/persons')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Back to Persons</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{person.name}</h1>
                {person.company && (
                  <p className="text-sm text-gray-600">{person.company}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
              <button
                onClick={() => {
                  setEditFormData({
                    name: person.name,
                    company: person.company || '',
                    phone: person.phone || '',
                    address: person.address || ''
                  })
                  setShowEditModal(true)
                }}
                className="flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Person Info & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Person Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Person Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{person.name}</p>
                    <p className="text-gray-500">Full Name</p>
                  </div>
                </div>

                {person.company && (
                  <div className="flex items-center text-sm">
                    <Building className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{person.company}</p>
                      <p className="text-gray-500">Company</p>
                    </div>
                  </div>
                )}

                {person.phone && (
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                      <Phone className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                    </div>
                  </div>
                )}

                {person.address && (
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                      <MapPin className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-gray-500">Address</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Loan Summary
              </h2>

              {/* Outstanding Amount - Prominent Top Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Outstanding Amount</h3>
                  <div className="flex items-center justify-center mb-2">
                    <div className={`px-6 py-3 rounded-full text-lg font-bold ${
                      currentBalance > 0
                        ? currentBalance > 10000
                          ? 'bg-red-100 text-red-700'
                          : currentBalance > 1000
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-orange-100 text-orange-700'
                        : currentBalance < 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      ₹{Math.abs(currentBalance).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {currentBalance > 0 ? 'Gives Outstanding' : currentBalance < 0 ? 'Takes Outstanding' : 'All Settled'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentBalance > 0 ? 'Person owes you this amount' : currentBalance < 0 ? 'You owe the person this amount' : 'No outstanding balance'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Gives</span>
                  <span className="font-semibold text-red-600">₹{personStats.totalLoansGiven.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Takes</span>
                  <span className="font-semibold text-green-600">₹{personStats.totalPaymentsReceived.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 pt-2 border-t border-gray-200">
                  <span>Total Transactions</span>
                  <span>{personStats.transactionCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-green-600" />
                  Transaction History
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No transactions yet</h3>
                    <p className="text-sm text-gray-500">Start by giving a loan or recording a payment.</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                      onContextMenu={(e) => openContextMenu(e, transaction)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'Gives'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {transaction.type === 'Gives' ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5" />
                            )}
                          </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.type === 'Gives' ? 'Gives' : 'Takes'}
                            </p>
                            <p className="text-sm text-gray-600">{transaction.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-xs text-gray-500 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                              {transaction.owner && (
                                <p className="text-xs text-gray-500 flex items-center">
                                  <User className="h-3 w-3 mr-1" />
                                  {transaction.owner.owner_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'Gives' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {transaction.type === 'Gives' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={openEditTransactionModal}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Transaction
          </button>
          <button
            onClick={() => handleDeleteTransaction(contextMenu.transaction!.id)}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Transaction
          </button>
        </div>
      )}

      {/* Give Loan Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <HandCoins className="h-5 w-5 mr-2 text-green-600" />
                Gives
              </h2>

              <form onSubmit={handleGiveLoan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter loan amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Owner *
                  </label>
                  <select
                    value={loanOwnerId}
                    onChange={(e) => {
                      setLoanOwnerId(e.target.value)
                      saveLastSelectedOwner(e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    {businessOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.owner_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={loanDescription}
                    onChange={(e) => setLoanDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Loan description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={loanDueDate}
                    onChange={(e) => setLoanDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowLoanModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Processing...' : 'Gives'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                Takes
              </h2>

              <form onSubmit={handleReceivePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter payment amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Owner *
                  </label>
                  <select
                    value={paymentOwnerId}
                    onChange={(e) => {
                      setPaymentOwnerId(e.target.value)
                      saveLastSelectedOwner(e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {businessOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.owner_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Payment description (optional)"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Processing...' : 'Takes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Edit className="h-5 w-5 mr-2 text-green-600" />
                Edit Person
              </h2>

              <form onSubmit={handleEditPerson} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={editFormData.company}
                    onChange={(e) => setEditFormData({...editFormData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditTransactionModal && editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Edit className="h-5 w-5 mr-2 text-green-600" />
                Edit Transaction
              </h2>

              <form onSubmit={handleEditTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTransactionAmount}
                    onChange={(e) => setEditTransactionAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editTransactionDescription}
                    onChange={(e) => setEditTransactionDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditTransactionModal(false)
                      setEditingTransaction(null)
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonDetail