import { useState, useEffect } from 'react'
import { supabase, Transaction, Supplier, LoanTransaction, Spend } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { BusinessOwnersService, BusinessOwner } from '../lib/businessOwners'
import { NotificationService } from '../services/NotificationService'
import SimpleTransactionForm from '../components/SimpleTransactionForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Calendar,
  Filter,
  Edit3,
  Trash2,
  MoreVertical,
  Users,
  User,
  DollarSign
} from 'lucide-react'

const Transactions = () => {
  const { user } = useAuth()
  const [userMode, setUserMode] = useState<'business' | 'personal'>('business')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loanTransactions, setLoanTransactions] = useState<LoanTransaction[]>([])
  const [spends, setSpends] = useState<Spend[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'suppliers' | 'persons' | 'spends'>('persons')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

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
          // Set default tab based on mode
          if (data.mode === 'personal') {
            setActiveTab('persons')
          } else {
            setActiveTab('suppliers')
          }
        }
      } catch (error) {
        console.error('Error loading user mode:', error)
      }
    }

    loadUserMode()
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
      // Fetch supplier transactions with supplier and owner info
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

      // Fetch person loan transactions with person and owner info
      const { data: loanTransactionsData, error: loanTransactionsError } = await supabase
        .from('loan_transactions')
        .select(`
          *,
          person:persons(name),
          owner:business_owners(owner_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (loanTransactionsError) throw loanTransactionsError

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

      // Fetch personal spends
      const { data: spendsData, error: spendsError } = await supabase
        .from('spends')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (spendsError) throw spendsError
      
      setTransactions(transactionsData || [])
      setLoanTransactions(loanTransactionsData || [])
      setSpends(spendsData || [])
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

  // Combine and filter all transactions
  const allTransactions = [
    ...transactions.map(t => ({ ...t, transactionType: 'supplier' as const })),
    ...loanTransactions.map(t => ({ ...t, transactionType: 'person' as const })),
    ...spends.map(s => ({ ...s, transactionType: 'spend' as const, type: s.category }))
  ]

  const filteredTransactions = allTransactions.filter((transaction) => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.transactionType === 'supplier' && transaction.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.transactionType === 'person' && transaction.person?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.transactionType === 'spend' && 'category' in transaction && transaction.category?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (transaction.transactionType !== 'spend' && transaction.owner?.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesTab = activeTab === 'spends' 
      ? transaction.transactionType === 'spend'
      : transaction.transactionType === activeTab.slice(0, -1) // 'suppliers' -> 'supplier', 'persons' -> 'person'
    
    const matchesType = typeFilter === 'all' || 
                       (activeTab === 'spends' ? ('category' in transaction && transaction.category === typeFilter) : transaction.type === typeFilter)
    
    return matchesSearch && matchesTab && matchesType
  }).sort((a, b) => {
    const dateA = a.transactionType === 'spend' ? new Date(a.date) : new Date(a.created_at)
    const dateB = b.transactionType === 'spend' ? new Date(b.date) : new Date(b.created_at)
    return dateB.getTime() - dateA.getTime()
  })

  const getTransactionIcon = (type: string, transactionType: string) => {
    if (transactionType === 'spend') {
      return <DollarSign className="h-4 w-4 text-green-600" />
    }
    if (transactionType === 'person') {
      switch (type) {
        case 'Gives':
          return <ArrowUpRight className="h-4 w-4 text-red-500" />
        case 'Takes':
          return <ArrowDownRight className="h-4 w-4 text-green-500" />
        default:
          return <Receipt className="h-4 w-4 text-gray-500" />
      }
    } else {
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
  }

  const getTransactionTypeLabel = (type: string, transactionType: string) => {
    if (transactionType === 'spend') {
      return type // For spends, type is the category
    }
    if (transactionType === 'person') {
      switch (type) {
        case 'Gives':
          return 'Gives'
        case 'Takes':
          return 'Takes'
        default:
          return type
      }
    } else {
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
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 text-sm">Track all your business transactions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6">
        <div className="overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max px-1">
            {userMode === 'business' && (
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'suppliers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Suppliers
              </button>
            )}
            <button
              onClick={() => setActiveTab('persons')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'persons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Persons
            </button>
            <button
              onClick={() => setActiveTab('spends')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'spends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Spends
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto pl-9 pr-10 py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
          >
            <option value="all">All Types</option>
            {activeTab === 'suppliers' ? (
              <>
                <option value="new_purchase">Purchases</option>
                <option value="pay_due">Payments</option>
              </>
            ) : activeTab === 'persons' ? (
              <>
                <option value="Gives">Gives</option>
                <option value="Takes">Takes</option>
              </>
            ) : (
              <>
                <option value="General">General</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills & Utilities">Bills & Utilities</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Travel">Travel</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Other">Other</option>
              </>
            )}
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
            <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                    {getTransactionIcon(transaction.type, transaction.transactionType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Mobile Layout: Stack name and badge vertically */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {transaction.transactionType === 'supplier' 
                            ? transaction.supplier?.name 
                            : transaction.transactionType === 'person'
                            ? transaction.person?.name
                            : transaction.description}
                        </h3>
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full font-medium flex-shrink-0 ${
                          transaction.transactionType === 'supplier'
                            ? 'bg-blue-100 text-blue-700'
                            : transaction.transactionType === 'person'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {transaction.transactionType === 'supplier' 
                            ? 'Supplier' 
                            : transaction.transactionType === 'person'
                            ? 'Person'
                            : 'Spend'}
                        </span>
                      </div>
                      <p className={`font-semibold text-base sm:text-lg flex-shrink-0 ${
                        (transaction.transactionType === 'supplier' && transaction.type === 'new_purchase') ||
                        (transaction.transactionType === 'person' && transaction.type === 'Gives')
                          ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {(transaction.transactionType === 'supplier' && transaction.type === 'new_purchase') ||
                         (transaction.transactionType === 'person' && transaction.type === 'Gives')
                          ? '+' : '-'}₹{Math.round(transaction.amount).toLocaleString()}
                      </p>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{getTransactionTypeLabel(transaction.type, transaction.transactionType)}</p>
                    
                    {transaction.description && (
                      <p className="text-xs sm:text-sm text-gray-500 mb-2 line-clamp-2">{transaction.description}</p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {transaction.transactionType === 'spend' 
                            ? formatDate(transaction.date) 
                            : formatDate(transaction.created_at)}
                        </span>
                      </div>
                      {transaction.transactionType !== 'spend' && transaction.owner?.owner_name && (
                        <span className="text-blue-600 font-medium truncate">
                          by {transaction.owner.owner_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions Menu - Only for supplier transactions */}
                {transaction.transactionType === 'supplier' && (
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
                          onClick={() => handleEditTransaction(transaction as Transaction)}
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
                )}
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
