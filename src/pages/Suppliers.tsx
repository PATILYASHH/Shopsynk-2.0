import React, { useState, useEffect } from 'react'
import { supabase, Supplier } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  MapPin
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface SupplierWithDues extends Supplier {
  dueAmount: number
}

const Suppliers = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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

  // Handle URL query parameter for adding supplier
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true)
      // Clean up URL without reloading
      navigate('/suppliers', { replace: true })
    }
  }, [location.search, navigate])

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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Suppliers</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your business relationships</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, contact, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-base"
            />
          </div>
        </div>

        {/* Filters - Mobile Optimized */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-base"
            >
              <option value="all">🏢 All Suppliers</option>
              <option value="with_dues">💰 With Dues</option>
              <option value="no_dues">✅ No Dues</option>
              <option value="high_dues">🔥 High Dues ({'>'}₹10K)</option>
              <option value="medium_dues">⚠️ Medium Dues (₹1K-₹10K)</option>
              <option value="low_dues">📊 Low Dues ({'<'}₹1K)</option>
            </select>
          </div>
          
          <div className="flex-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-base"
            >
              <option value="dues_desc">📈 Highest Dues First</option>
              <option value="dues_asc">📉 Lowest Dues First</option>
              <option value="name_asc">🔤 Name A to Z</option>
              <option value="name_desc">🔤 Name Z to A</option>
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-blue-600">{suppliers.length}</p>
            <p className="text-xs font-medium text-blue-700">Total Suppliers</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-red-600">
              {suppliers.filter(s => s.dueAmount > 0).length}
            </p>
            <p className="text-xs font-medium text-red-700">With Dues</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">
              {suppliers.filter(s => s.dueAmount === 0).length}
            </p>
            <p className="text-xs font-medium text-green-700">All Clear</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center">
            <p className="text-lg font-bold text-purple-600">
              ₹{Math.round(suppliers.reduce((sum, s) => sum + s.dueAmount, 0)).toLocaleString()}
            </p>
            <p className="text-xs font-medium text-purple-700">Total Dues</p>
          </div>
        </div>
      </div>

      {/* Suppliers Grid - Mobile First Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredAndSortedSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search or filters' : 'Use the + button below to add your first supplier'}
            </p>
          </div>
        ) : (
          filteredAndSortedSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              onClick={() => navigate(`/suppliers/${supplier.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group transform hover:scale-105"
            >
              {/* Supplier Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors">
                    {supplier.name}
                  </h3>
                  {supplier.contact_person && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {supplier.contact_person}
                    </p>
                  )}
                </div>
                
                {/* Due Amount Badge */}
                <div className="ml-4 text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    supplier.dueAmount > 0 
                      ? supplier.dueAmount > 10000 
                        ? 'bg-red-100 text-red-700' 
                        : supplier.dueAmount > 1000 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    ₹{Math.round(supplier.dueAmount).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {supplier.dueAmount > 0 ? 'Due Amount' : 'All Clear'}
                  </p>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="space-y-2">
                {supplier.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                      <Phone className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="font-medium">{supplier.phone}</span>
                  </div>
                )}
                
                {supplier.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                      <Mail className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="truncate font-medium">{supplier.email}</span>
                  </div>
                )}
                
                {supplier.address && (
                  <div className="flex items-start text-sm text-gray-600">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                      <MapPin className="h-4 w-4 text-purple-500" />
                    </div>
                    <span className="line-clamp-2 font-medium">{supplier.address}</span>
                  </div>
                )}
              </div>

              {/* Quick Action Hint */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center group-hover:text-blue-400 transition-colors">
                  Tap to view details & manage
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-2xl hover:from-blue-600 hover:to-blue-700 flex items-center justify-center z-40 transform hover:scale-110 transition-all duration-200"
        style={{ boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)' }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Supplier Modal - Enhanced Mobile Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-2xl sm:rounded-t-2xl z-10">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Supplier</h2>
                  <p className="text-sm text-gray-600 mt-1">Fill in the supplier details</p>
                </div>
                <button
                  onClick={resetForm}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <span className="text-xl text-gray-500">×</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-base transition-colors"
                  placeholder="Enter supplier or company name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Contact Person
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-base"
                    placeholder="Primary contact person"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-base"
                    placeholder="Mobile or landline number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-base"
                    placeholder="contact@supplier.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Business Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={4}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-base resize-none"
                    placeholder="Complete business address including city and state"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="order-2 sm:order-1 flex-1 px-6 py-4 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="order-1 sm:order-2 flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium shadow-lg transition-all duration-200"
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
