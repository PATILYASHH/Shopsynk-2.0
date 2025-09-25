import React, { useState, useEffect } from 'react'
import { supabase, Spend } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Receipt,
  TrendingUp,
  Filter
} from 'lucide-react'
import * as XLSX from 'xlsx'

const Spends = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [spends, setSpends] = useState<Spend[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')
  const [filterBy, setFilterBy] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'General',
    date: new Date().toISOString().split('T')[0]
  })

  const categories = [
    'General',
    'Food & Dining',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Personal Care',
    'Home & Garden',
    'Other'
  ]

  useEffect(() => {
    fetchSpends()
  }, [user])

  // Handle URL query parameter for adding spend
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true)
      // Clean up URL without reloading
      navigate('/spends', { replace: true })
    }
  }, [location.search, navigate])

  const fetchSpends = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('spends')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSpends(data || [])
    } catch (error) {
      console.error('Error fetching spends:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || isSubmitting) return

    setIsSubmitting(true)
    try {
      const spendData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id: user.id
      }

      const { error } = await supabase
        .from('spends')
        .insert([spendData])

      if (error) throw error

      await fetchSpends()
      resetForm()
    } catch (error) {
      console.error('Error adding spend:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'General',
      date: new Date().toISOString().split('T')[0]
    })
    setShowAddModal(false)
  }

  const deleteSpend = async (id: string) => {
    if (!confirm('Are you sure you want to delete this spend?')) return

    try {
      const { error } = await supabase
        .from('spends')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchSpends()
    } catch (error) {
      console.error('Error deleting spend:', error)
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

  // Filter and sort spends
  const filteredAndSortedSpends = spends
    .filter((spend) => {
      const matchesSearch = spend.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           spend.category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterBy === 'all' || spend.category === filterBy

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'amount_desc':
          return b.amount - a.amount
        case 'amount_asc':
          return a.amount - b.amount
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

  const totalSpends = filteredAndSortedSpends.reduce((sum, spend) => sum + spend.amount, 0)

  const exportToCSV = () => {
    const csvData = filteredAndSortedSpends.map(spend => ({
      Date: new Date(spend.date).toLocaleDateString('en-IN'),
      Description: spend.description,
      Category: spend.category,
      Amount: spend.amount
    }))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(csvData), 'Spends')
    XLSX.writeFile(workbook, `personal-spends-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Personal Spends</h1>
          <p className="text-gray-600 mt-1">Track your personal expenses and spending habits</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            disabled={spends.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Spends</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(totalSpends)}</p>
            </div>
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {formatCurrency(
                  filteredAndSortedSpends
                    .filter(spend => {
                      const spendDate = new Date(spend.date)
                      const now = new Date()
                      return spendDate.getMonth() === now.getMonth() &&
                             spendDate.getFullYear() === now.getFullYear()
                    })
                    .reduce((sum, spend) => sum + spend.amount, 0)
                )}
              </p>
            </div>
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Average per Day</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">
                {formatCurrency(totalSpends / Math.max(1, spends.length))}
              </p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 flex-1">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search spends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex space-x-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
                <option value="category">By Category</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Spends List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredAndSortedSpends.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedSpends.map((spend) => (
                <div key={spend.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {spend.description}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {spend.category} • {new Date(spend.date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-3 sm:mt-0">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(spend.amount)}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => deleteSpend(spend.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete spend"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No spends found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterBy !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Start tracking your personal expenses by adding your first spend.'}
              </p>
              {!searchTerm && filterBy === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Spend
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Spend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Personal Spend</h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5 text-gray-500 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={isSubmitting}
                    required
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-base transition-colors"
                    placeholder="What did you spend on?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    disabled={isSubmitting}
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-base transition-colors"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    disabled={isSubmitting}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-base transition-colors"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    disabled={isSubmitting}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-base transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold transition-all duration-200"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Spend'}
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

export default Spends