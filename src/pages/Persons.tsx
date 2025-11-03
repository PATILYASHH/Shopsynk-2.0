import React, { useState, useEffect } from 'react'
import { supabase, Person } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Plus,
  Search,
  Users,
  Phone,
  MapPin
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface PersonWithLoans extends Person {
  loanAmount: number
}

const Persons = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [persons, setPersons] = useState<PersonWithLoans[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('loans_desc')
  const [filterBy, setFilterBy] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    fetchPersons()
  }, [user])

  // Handle URL query parameter for adding person
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true)
      // Clean up URL without reloading
      navigate('/persons', { replace: true })
    }
  }, [location.search, navigate])

  const fetchPersons = async () => {
    if (!user) return

    try {
      // Fetch persons
      const { data: personsData, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .eq('user_id', user.id)

      if (personsError) throw personsError

      // Fetch all loan transactions to calculate loan amounts
      const { data: transactions, error: transactionsError } = await supabase
        .from('loan_transactions')
        .select('*')
        .eq('user_id', user.id)

      if (transactionsError) throw transactionsError

      // Calculate loan amounts for each person
      const personLoans = new Map()

      transactions?.forEach((transaction) => {
        const personId = transaction.person_id

        if (!personLoans.has(personId)) {
          personLoans.set(personId, 0)
        }

        if (transaction.type === 'Gives') {
          personLoans.set(personId,
            personLoans.get(personId) + parseFloat(transaction.amount)
          )
        } else if (transaction.type === 'Takes') {
          personLoans.set(personId,
            personLoans.get(personId) - parseFloat(transaction.amount)
          )
        }
      })

      // Combine persons with their loan amounts (net balance)
      const personsWithLoans = (personsData || []).map(person => ({
        ...person,
        loanAmount: personLoans.get(person.id) || 0
      }))

      setPersons(personsWithLoans)
    } catch (error) {
      console.error('Error fetching persons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { error } = await supabase
        .from('persons')
        .insert([{ ...formData, user_id: user.id }])

      if (error) throw error

      await fetchPersons()
      resetForm()
    } catch (error) {
      console.error('Error adding person:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      phone: '',
      address: ''
    })
    setShowAddModal(false)
  }

  // Filter and sort persons
  const filteredAndSortedPersons = persons
    .filter((person) => {
      const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           person.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           person.phone?.includes(searchTerm) ||
                           person.address?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterBy === 'all' ||
                           (filterBy === 'gives_outstanding' && person.loanAmount > 0) ||
                           (filterBy === 'takes_outstanding' && person.loanAmount < 0) ||
                           (filterBy === 'settled' && person.loanAmount === 0) ||
                           (filterBy === 'high_amount' && Math.abs(person.loanAmount) > 10000) ||
                           (filterBy === 'medium_amount' && Math.abs(person.loanAmount) > 1000 && Math.abs(person.loanAmount) <= 10000) ||
                           (filterBy === 'low_amount' && Math.abs(person.loanAmount) > 0 && Math.abs(person.loanAmount) <= 1000)

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'loans_desc':
          return b.loanAmount - a.loanAmount
        case 'loans_asc':
          return a.loanAmount - b.loanAmount
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        default:
          return b.loanAmount - a.loanAmount
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Persons</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your loan relationships</p>
          </div>
          <div className="hidden sm:flex items-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-3 rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-md transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Person
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, company, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-base"
            />
          </div>
        </div>

        {/* Filters - Mobile Optimized */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-base"
            >
              <option value="all">🏢 All Persons</option>
              <option value="gives_outstanding">� Gives Outstanding</option>
              <option value="takes_outstanding">� Takes Outstanding</option>
              <option value="settled">✅ All Settled</option>
              <option value="high_amount">🔥 High Amount ({'>'}₹10K)</option>
              <option value="medium_amount">⚠️ Medium Amount (₹1K-₹10K)</option>
              <option value="low_amount">📊 Low Amount ({'<'}₹1K)</option>
            </select>
          </div>

          <div className="flex-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-base"
            >
              <option value="loans_desc">📈 Highest Amount First</option>
              <option value="loans_asc">📉 Lowest Amount First</option>
              <option value="name_asc">🔤 Name A to Z</option>
              <option value="name_desc">🔤 Name Z to A</option>
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">{persons.length}</p>
            <p className="text-xs font-medium text-green-700">Total Persons</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-blue-600">
              {persons.filter(p => p.loanAmount > 0).length}
            </p>
            <p className="text-xs font-medium text-blue-700">Gives Outstanding</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">
              {persons.filter(p => p.loanAmount < 0).length}
            </p>
            <p className="text-xs font-medium text-green-700">Takes Outstanding</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center">
            <p className="text-lg font-bold text-purple-600">
              ₹{Math.round(persons.reduce((sum, p) => sum + Math.abs(p.loanAmount), 0)).toLocaleString()}
            </p>
            <p className="text-xs font-medium text-purple-700">Total Amount</p>
          </div>
        </div>
      </div>

      {/* Persons Grid - Mobile First Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredAndSortedPersons.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No persons found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search or filters' : 'Use the + button below to add your first person'}
            </p>
          </div>
        ) : (
          filteredAndSortedPersons.map((person) => (
            <div
              key={person.id}
              onClick={() => navigate(`/persons/${person.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-300 hover:shadow-lg transition-all duration-200 cursor-pointer group transform hover:scale-105"
            >
              {/* Person Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-green-600 transition-colors">
                    {person.name}
                  </h3>
                  {person.company && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {person.company}
                    </p>
                  )}
                </div>

                {/* Outstanding Amount Badge */}
                <div className="ml-4 text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    person.loanAmount > 0
                      ? person.loanAmount > 10000
                        ? 'bg-red-100 text-red-700'
                        : person.loanAmount > 1000
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-orange-100 text-orange-700'
                      : person.loanAmount < 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    ₹{Math.round(Math.abs(person.loanAmount)).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {person.loanAmount > 0 ? 'Gives Outstanding' : person.loanAmount < 0 ? 'Takes Outstanding' : 'All Settled'}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="flex space-x-2">
                {person.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Phone className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                )}

                {person.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-purple-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Action Hint */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center group-hover:text-green-400 transition-colors">
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
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-2xl hover:from-green-600 hover:to-green-700 flex items-center justify-center z-40 transform hover:scale-110 transition-all duration-200"
        style={{ boxShadow: '0 10px 25px rgba(34, 197, 94, 0.5)' }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Person Modal - Enhanced Mobile Design */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-2xl sm:rounded-t-2xl z-10">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Person</h2>
                  <p className="text-sm text-gray-600 mt-1">Fill in the person details</p>
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
                  Person Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-base transition-colors"
                  placeholder="Enter person's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-base transition-colors"
                  placeholder="Enter company name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-base transition-colors"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={3}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-base transition-colors resize-none"
                  placeholder="Enter address"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold transition-all duration-200"
                >
                  Add Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Persons