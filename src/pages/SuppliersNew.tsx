import React, { useState, useEffect } from 'react'
import { supabase, Supplier } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  Filter,
  SortDesc
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SupplierWithDues extends Supplier {
  dueAmount: number
}

const Suppliers = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState<SupplierWithDues[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('dues_desc')
  const [filterBy, setFilterBy] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [user])

  const fetchSuppliers = async () => {
    if (!user) return

    try {
      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)

      if (suppliersError) throw suppliersError

      // Fetch all transactions to calculate dues
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)

      if (transactionsError) throw transactionsError

      // Calculate due amounts for each supplier
      const supplierBalances = new Map()
      
      transactions?.forEach((transaction) => {
        const supplierId = transaction.supplier_id
        
        if (!supplierBalances.has(supplierId)) {
          supplierBalances.set(supplierId, 0)
        }
        
        if (transaction.type === 'new_purchase') {
          supplierBalances.set(supplierId, 
            supplierBalances.get(supplierId) + parseFloat(transaction.amount)
          )
        } else if (transaction.type === 'pay_due' || transaction.type === 'settle_bill') {
          supplierBalances.set(supplierId, 
            supplierBalances.get(supplierId) - parseFloat(transaction.amount)
          )
        }
      })

      // Combine suppliers with their due amounts
      const suppliersWithDues = (suppliersData || []).map(supplier => ({
        ...supplier,
        dueAmount: Math.max(0, supplierBalances.get(supplier.id) || 0)
      }))

      setSuppliers(suppliersWithDues)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { error } = await supabase
        .from('suppliers')
        .insert([{ ...formData, user_id: user.id }])

      if (error) throw error

      await fetchSuppliers()
      resetForm()
    } catch (error) {
      console.error('Error adding supplier:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    })
    setShowAddModal(false)
  }

  // Filter and sort suppliers
  const filteredAndSortedSuppliers = suppliers
    .filter((supplier) => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.phone?.includes(searchTerm) ||
                           supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterBy === 'all' ||
                           (filterBy === 'with_dues' && supplier.dueAmount > 0) ||
                           (filterBy === 'no_dues' && supplier.dueAmount === 0) ||
                           (filterBy === 'high_dues' && supplier.dueAmount > 10000) ||
                           (filterBy === 'medium_dues' && supplier.dueAmount > 1000 && supplier.dueAmount <= 10000) ||
                           (filterBy === 'low_dues' && supplier.dueAmount > 0 && supplier.dueAmount <= 1000)
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'dues_desc':
          return b.dueAmount - a.dueAmount
        case 'dues_asc':
          return a.dueAmount - b.dueAmount
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        default:
          return b.dueAmount - a.dueAmount
      }
    })

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 text-sm">Manage your supplier relationships</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white min-w-[140px]"
            >
              <option value="all">All Suppliers</option>
              <option value="with_dues">With Dues</option>
              <option value="no_dues">No Dues</option>
              <option value="high_dues">High Dues (&gt;₹10K)</option>
              <option value="medium_dues">Medium Dues (₹1K-₹10K)</option>
              <option value="low_dues">Low Dues (&lt;₹1K)</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <SortDesc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white min-w-[140px]"
            >
              <option value="dues_desc">Highest Dues</option>
              <option value="dues_asc">Lowest Dues</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="space-y-3">
        {filteredAndSortedSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No suppliers found</p>
            <p className="text-gray-400 text-sm">
              {searchTerm ? 'Try adjusting your search or filters' : 'Add your first supplier to get started'}
            </p>
          </div>
        ) : (
          filteredAndSortedSuppliers.map((supplier) => (
            <button
              key={supplier.id}
              onClick={() => navigate(`/suppliers/${supplier.id}`)}
              className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-lg truncate">{supplier.name}</h3>
                    <div className="text-right ml-4">
                      <p className={`font-bold text-lg ${
                        supplier.dueAmount > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ₹{Math.round(supplier.dueAmount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {supplier.dueAmount > 0 ? 'Due Amount' : 'No Dues'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {supplier.contact_person && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{supplier.contact_person}</span>
                      </div>
                    )}
                    
                    {supplier.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    
                    {supplier.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    
                    {supplier.address && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{supplier.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add New Supplier</h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={3}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Business address"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Suppliers
