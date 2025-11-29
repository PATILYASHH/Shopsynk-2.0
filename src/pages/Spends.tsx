import React, { useState, useEffect } from 'react'
import { supabase, Spend } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus,
  DollarSign,
  Calendar,
  Trash2,
  Receipt,
  TrendingUp,
  Filter,
  Sparkles,
  Check,
  X,
  Loader2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { analyzeSpendDescription, SpendSuggestion, SPEND_CATEGORIES, parseSpendFromText, ParsedSpend } from '../lib/geminiService'

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
  const [aiSuggestion, setAiSuggestion] = useState<SpendSuggestion | null>(null)
  const [parsedSpend, setParsedSpend] = useState<ParsedSpend | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [useAI, setUseAI] = useState(() => {
    const saved = localStorage.getItem('shopsynk_use_ai_category')
    return saved !== null ? saved === 'true' : true
  })
  const [naturalInput, setNaturalInput] = useState('')
  const [useSmartInput, setUseSmartInput] = useState(() => {
    const saved = localStorage.getItem('shopsynk_smart_input')
    return saved === 'true'
  })

  const categories = SPEND_CATEGORIES

  // Save AI preferences to localStorage
  useEffect(() => {
    localStorage.setItem('shopsynk_use_ai_category', String(useAI))
  }, [useAI])

  useEffect(() => {
    localStorage.setItem('shopsynk_smart_input', String(useSmartInput))
  }, [useSmartInput])

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

  // Auto-scroll to top when modal opens
  useEffect(() => {
    if (showAddModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showAddModal])

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
    setAiSuggestion(null)
    setParsedSpend(null)
    setShowSuggestion(false)
    setNaturalInput('')
    // Don't reset useSmartInput - it should persist
    setShowAddModal(false)
  }

  const handleSmartInputChange = async (input: string) => {
    setNaturalInput(input)
    
    // Parse when user has typed enough (e.g., "bought phone 2000")
    if (useAI && input.trim().length >= 10) {
      setIsAnalyzing(true)
      try {
        const parsed = await parseSpendFromText(input)
        setParsedSpend(parsed)
        setShowSuggestion(true)
      } catch (error) {
        console.error('Error parsing spend:', error)
      } finally {
        setIsAnalyzing(false)
      }
    } else {
      setParsedSpend(null)
      setShowSuggestion(false)
    }
  }

  const handleDescriptionChange = async (description: string) => {
    setFormData({ ...formData, description })
    
    // Auto-analyze when description has meaningful text (3+ words or 15+ chars)
    if (useAI && !useSmartInput && (description.trim().length >= 15 || description.trim().split(' ').length >= 3)) {
      setIsAnalyzing(true)
      try {
        const suggestion = await analyzeSpendDescription(description)
        setAiSuggestion(suggestion)
        setShowSuggestion(true)
      } catch (error) {
        console.error('Error analyzing description:', error)
      } finally {
        setIsAnalyzing(false)
      }
    } else if (!useSmartInput) {
      setAiSuggestion(null)
      setShowSuggestion(false)
    }
  }

  const acceptSmartSuggestion = () => {
    if (parsedSpend) {
      setFormData({
        ...formData,
        description: parsedSpend.title,
        amount: parsedSpend.amount !== null ? parsedSpend.amount.toString() : '',
        category: parsedSpend.category
      })
      setShowSuggestion(false)
      setUseSmartInput(false)
      setNaturalInput('')
    }
  }

  const acceptAISuggestion = () => {
    if (aiSuggestion) {
      setFormData({
        ...formData,
        category: aiSuggestion.category,
        description: aiSuggestion.description
      })
      setShowSuggestion(false)
    }
  }

  const rejectSuggestion = () => {
    setShowSuggestion(false)
    setParsedSpend(null)
    setAiSuggestion(null)
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 pt-4 sm:pt-20 overflow-y-auto z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md my-2 sm:my-8">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add Personal Spend</h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                >
                  <Plus className="h-5 w-5 text-gray-500 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Smart Input Toggle */}
                <div className="flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                      <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-900">Smart Input</p>
                      <p className="text-xs text-gray-600 truncate">AI extracts title, amount & category</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUseSmartInput(!useSmartInput)
                      if (useSmartInput) {
                        setNaturalInput('')
                        setParsedSpend(null)
                        setShowSuggestion(false)
                      }
                    }}
                    className={`flex-shrink-0 ml-3 px-4 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 active:scale-95 ${
                      useSmartInput 
                        ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {useSmartInput ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Smart Input Field */}
                {useSmartInput ? (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                      Tell us what you spent on *
                    </label>
                    <div className="relative">
                      <textarea
                        value={naturalInput}
                        onChange={(e) => handleSmartInputChange(e.target.value)}
                        disabled={isSubmitting}
                        required
                        rows={3}
                        className="w-full p-3 sm:p-4 border-2 border-purple-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base transition-colors resize-none"
                        placeholder="Example: bought phone 2000 rs&#10;lunch at restaurant 350&#10;auto rickshaw 50"
                      />
                      {isAnalyzing && (
                        <div className="absolute top-2 right-2">
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 animate-spin" />
                        </div>
                      )}
                    </div>
                    <p className="mt-1.5 sm:mt-2 text-xs text-purple-600 flex items-start space-x-1">
                      <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>AI extracts title, amount & category</span>
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-800">
                          Description *
                        </label>
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <button
                            type="button"
                            onClick={() => setUseAI(!useAI)}
                            className={`flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                              useAI 
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Sparkles className="h-3 w-3" />
                            <span className="hidden sm:inline">AI Category</span>
                            <span className="sm:hidden">AI</span>
                          </button>
                          {isAnalyzing && (
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 animate-spin" />
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        disabled={isSubmitting}
                        required
                        className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base transition-colors"
                        placeholder={useAI ? "e.g., Restaurant lunch" : "What did you spend on?"}
                      />
                      {useAI && (
                        <p className="mt-1 text-xs text-gray-500">
                          💡 AI suggests category
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Smart Spend Parsing Result */}
                {showSuggestion && parsedSpend && useSmartInput && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">AI Parsed</h3>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          parsedSpend.confidence === 'high' ? 'bg-green-100 text-green-700' :
                          parsedSpend.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {parsedSpend.confidence}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-white p-2 sm:p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Title</p>
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{parsedSpend.title}</p>
                      </div>
                      <div className="bg-white p-2 sm:p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Amount</p>
                        <p className="font-semibold text-green-600 text-xs sm:text-sm">
                          {parsedSpend.amount !== null ? `₹${parsedSpend.amount}` : 'Not found'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-2 sm:p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Category</p>
                      <p className="font-semibold text-purple-700 text-xs sm:text-sm">{parsedSpend.category}</p>
                    </div>
                    
                    <p className="text-xs text-gray-600 italic line-clamp-2">{parsedSpend.reasoning}</p>
                    
                    <div className="flex space-x-2 pt-1 sm:pt-2">
                      <button
                        type="button"
                        onClick={acceptSmartSuggestion}
                        className="flex-1 bg-purple-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center space-x-2 font-medium text-sm touch-manipulation"
                      >
                        <Check className="h-4 w-4" />
                        <span>Use This</span>
                      </button>
                      <button
                        type="button"
                        onClick={rejectSuggestion}
                        className="p-2 sm:px-4 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:scale-95 transition-all touch-manipulation"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Category Suggestion Card (Regular Mode) */}
                {showSuggestion && aiSuggestion && !useSmartInput && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">AI Suggestion</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          aiSuggestion.confidence === 'high' ? 'bg-green-100 text-green-700' :
                          aiSuggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {aiSuggestion.confidence} confidence
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Suggested Category:</p>
                        <p className="font-semibold text-purple-700 text-lg">{aiSuggestion.category}</p>
                      </div>
                      
                      {aiSuggestion.description !== formData.description && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Cleaned Description:</p>
                          <p className="text-sm text-gray-800">{aiSuggestion.description}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Reasoning:</p>
                        <p className="text-xs text-gray-700 italic">{aiSuggestion.reasoning}</p>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={acceptAISuggestion}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={rejectSuggestion}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                )}

                {!useSmartInput && (
                  <>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        disabled={isSubmitting}
                        required
                        min="0"
                        step="0.01"
                        className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base transition-colors"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base transition-colors"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                    ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base transition-colors"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm sm:text-base touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (useSmartInput && (!formData.description || !formData.amount))}
                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 active:scale-95 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold transition-all duration-200 text-sm sm:text-base touch-manipulation"
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