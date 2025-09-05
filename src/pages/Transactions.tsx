import { useState, useEffect } from 'react'
import { supabase, Transaction, Supplier } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { BusinessOwnersService, BusinessOwner } from '../lib/businessOwners'
import { NotificationService } from '../services/NotificationService'
import SimpleTransactionForm from '../components/SimpleTransactionForm'
import { 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Calendar,
  Filter,
  Edit3,
  Trash2,
  MoreVertical
} from 'lucide-react'

const Transactions = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.dropdown-menu')) {
        setShowDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const fetchData = async () => {
    if (!user) return

    try {
      // Fetch transactions with supplier and owner info
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          supplier:suppliers(name),
          owner:business_owners(owner_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      // Fetch suppliers for dropdown
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (suppliersError) throw suppliersError

      // Fetch business owners for dropdown
      const businessOwnersService = BusinessOwnersService.getInstance()
      const owners = await businessOwnersService.getBusinessOwners(user.id)
      
      setTransactions(transactionsData || [])
      setSuppliers(suppliersData || [])
      setBusinessOwners(owners || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async (formData: any) => {
    if (!user) return

    try {
      if (editingTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from('transactions')
          .update({
            amount: parseFloat(formData.amount),
            description: formData.description,
            type: formData.type,
            supplier_id: formData.supplier_id,
            owner_id: formData.owner_id
          })
          .eq('id', editingTransaction.id)

        if (error) throw error

        setEditingTransaction(null)
      } else {
        // Create new transaction
        const { data: newTransaction, error } = await supabase
          .from('transactions')
          .insert([{ 
            ...formData, 
            user_id: user.id,
            amount: parseFloat(formData.amount)
          }])
          .select(`
            *,
            supplier:suppliers(name),
            owner:business_owners(owner_name)
          `)
          .single()

        if (error) throw error

        // Send notification to other account owners
        const supplier = suppliers.find(s => s.id === formData.supplier_id)
        const owner = businessOwners.find(o => o.id === formData.owner_id)
        
        if (supplier && owner && user.email) {
          const amount = parseFloat(formData.amount)
          
          if (formData.type === 'new_purchase') {
            await NotificationService.notifyTransactionCreated(
              user.id,
              owner.owner_name,
              amount,
              supplier.name,
              newTransaction.id,
              supplier.id
            )
          } else if (formData.type === 'pay_due') {
            await NotificationService.notifyPaymentMade(
              user.id,
              owner.owner_name,
              amount,
              supplier.name,
              supplier.id
            )
          }
        }
      }

      await fetchData()
      setShowAddModal(false)
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowAddModal(true)
    setShowDropdown(null)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (error) throw error

      await fetchData()
      setShowDropdown(null)
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.owner?.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    
    return matchesSearch && matchesType
  })

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 text-sm">Track all your business transactions</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="all">All Types</option>
            <option value="new_purchase">Purchases</option>
            <option value="pay_due">Payments</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No transactions found</p>
            <p className="text-gray-400 text-sm">
              {searchTerm ? 'Try adjusting your search' : 'Add your first transaction to get started'}
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-1">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {transaction.supplier?.name}
                      </h3>
                      <p className={`font-semibold text-lg ${
                        transaction.type === 'new_purchase' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'new_purchase' ? '+' : '-'}₹{Math.round(transaction.amount).toLocaleString()}
                      </p>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">{getTransactionTypeLabel(transaction.type)}</p>
                    
                    {transaction.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{transaction.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(transaction.created_at)}
                      </div>
                      {transaction.owner?.owner_name && (
                        <span className="text-blue-600 font-medium">
                          by {transaction.owner.owner_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions Menu */}
                <div className="relative ml-3">
                  <button
                    onClick={() => setShowDropdown(showDropdown === transaction.id ? null : transaction.id)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>
                  
                  {showDropdown === transaction.id && (
                    <div className="dropdown-menu absolute right-0 top-8 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center rounded-t-lg"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center rounded-b-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Transaction Modal */}
      <SimpleTransactionForm
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingTransaction(null)
        }}
        onSubmit={handleAddTransaction}
        suppliers={suppliers}
        businessOwners={businessOwners}
        editingTransaction={editingTransaction}
      />
    </div>
  )
}

export default Transactions
