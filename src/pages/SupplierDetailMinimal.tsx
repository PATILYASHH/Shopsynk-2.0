import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Supplier, Transaction } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { BusinessOwnersService } from '../lib/businessOwners'
import { 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  User,
  Receipt
} from 'lucide-react'

const SupplierDetailMinimal = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchSupplierData()
    }
  }, [id, user])

  const fetchSupplierData = async () => {
    if (!user || !id) return

    try {
      setLoading(true)
      
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

      // Fetch business owners
      const businessOwnersService = BusinessOwnersService.getInstance()
      await businessOwnersService.getBusinessOwners(user.id)

      setSupplier(supplierData)
      setTransactions(transactionsData || [])
      
    } catch (error) {
      console.error('Error fetching supplier data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="text-lg font-semibold text-gray-900">
            {supplier.name}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Supplier Details</h2>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <User className="h-5 w-5 mr-3" />
                <span>{supplier.name}</span>
              </div>
              
              {supplier.phone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="h-5 w-5 mr-3" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              
              {supplier.email && (
                <div className="flex items-center text-gray-700">
                  <Mail className="h-5 w-5 mr-3" />
                  <span>{supplier.email}</span>
                </div>
              )}
              
              {supplier.address && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-5 w-5 mr-3" />
                  <span>{supplier.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          
          <div className="p-6">
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {transaction.type === 'new_purchase' ? 'Purchase' : 'Payment'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.type === 'new_purchase' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'new_purchase' ? '+' : '-'}
                          {formatCurrency(parseFloat(transaction.amount.toString()))}
                        </div>
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
  )
}

export default SupplierDetailMinimal
