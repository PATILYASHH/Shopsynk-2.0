import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Receipt,
  PieChart,
  ArrowUpRight,
  Eye,
  EyeOff,
  Settings,
  Sparkles,
  X,
  CheckCircle,
  AlertTriangle,
  Lightbulb
} from 'lucide-react'
import { generateFinancialInsights, FinancialInsight } from '../lib/geminiService'

interface DashboardWidget {
  id: string
  title: string
  enabled: boolean
  position: number
  size: 'small' | 'medium' | 'large'
}

interface PersonalStats {
  totalSpends: number
  monthlySpends: number
  todaySpends: number
  personsOwed: number
  personsOwing: number
  topCategory: { name: string; amount: number }
  spendTrend: 'up' | 'down' | 'stable'
  monthlyAverage: number
  categoryBreakdown: { category: string; amount: number; percentage: number }[]
}

const PersonalDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<PersonalStats>({
    totalSpends: 0,
    monthlySpends: 0,
    todaySpends: 0,
    personsOwed: 0,
    personsOwing: 0,
    topCategory: { name: 'None', amount: 0 },
    spendTrend: 'stable',
    monthlyAverage: 0,
    categoryBreakdown: []
  })
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [insights, setInsights] = useState<FinancialInsight[]>([])
  const [showInsights, setShowInsights] = useState(false)

  const DEFAULT_WIDGETS: DashboardWidget[] = [
    { id: 'monthly_spends', title: 'This Month Spends', enabled: true, position: 0, size: 'medium' },
    { id: 'today_spends', title: 'Today\'s Spends', enabled: true, position: 1, size: 'small' },
    { id: 'total_spends', title: 'Total Spends', enabled: true, position: 2, size: 'small' },
    { id: 'monthly_average', title: 'Monthly Average', enabled: true, position: 3, size: 'small' },
    { id: 'persons_summary', title: 'Persons Summary', enabled: true, position: 4, size: 'medium' },
    { id: 'category_breakdown', title: 'Spending by Category', enabled: true, position: 5, size: 'large' },
    { id: 'spend_trend', title: 'Spending Trend', enabled: true, position: 6, size: 'medium' },
    { id: 'ai_insights', title: 'AI Financial Insights', enabled: true, position: 7, size: 'large' }
  ]

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // Load widget preferences
      const { data: preferences } = await supabase
        .from('dashboard_preferences')
        .select('*')
        .eq('user_id', user.id)

      if (preferences && preferences.length > 0) {
        const loadedWidgets = DEFAULT_WIDGETS.map(widget => {
          const pref = preferences.find(p => p.widget_id === widget.id)
          return pref ? {
            ...widget,
            enabled: pref.is_visible,
            position: pref.position,
            size: pref.size as 'small' | 'medium' | 'large'
          } : widget
        }).sort((a, b) => a.position - b.position)
        setWidgets(loadedWidgets)
      } else {
        setWidgets(DEFAULT_WIDGETS)
      }

      // Fetch spends data
      const { data: spendsData } = await supabase
        .from('spends')
        .select('*')
        .eq('user_id', user.id)

      const spends = spendsData || []
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Calculate monthly spends
      const monthlySpends = spends
        .filter(s => new Date(s.date) >= firstDayOfMonth)
        .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0)

      // Calculate today's spends
      const todaySpends = spends
        .filter(s => {
          const spendDate = new Date(s.date)
          return spendDate >= today
        })
        .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0)

      // Calculate total spends
      const totalSpends = spends.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0)

      // Calculate monthly average (last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const recentSpends = spends.filter(s => new Date(s.date) >= sixMonthsAgo)
      const monthlyAverage = recentSpends.length > 0 ? totalSpends / 6 : 0

      // Calculate category breakdown
      const categoryMap = new Map<string, number>()
      spends.forEach(spend => {
        const current = categoryMap.get(spend.category) || 0
        categoryMap.set(spend.category, current + parseFloat(spend.amount.toString()))
      })

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpends > 0 ? (amount / totalSpends) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)

      const topCategory = categoryBreakdown.length > 0
        ? { name: categoryBreakdown[0].category, amount: categoryBreakdown[0].amount }
        : { name: 'None', amount: 0 }

      // Calculate spend trend (compare this month with last month)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      const lastMonthSpends = spends
        .filter(s => {
          const date = new Date(s.date)
          return date >= lastMonthStart && date <= lastMonthEnd
        })
        .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0)

      const spendTrend = monthlySpends > lastMonthSpends * 1.1 ? 'up'
        : monthlySpends < lastMonthSpends * 0.9 ? 'down'
        : 'stable'

      // Fetch persons data
      const { data: loanTransactions } = await supabase
        .from('loan_transactions')
        .select('*')
        .eq('user_id', user.id)

      const personBalances = new Map<string, number>()
      loanTransactions?.forEach(t => {
        const current = personBalances.get(t.person_id) || 0
        if (t.type === 'Gives') {
          personBalances.set(t.person_id, current + parseFloat(t.amount.toString()))
        } else {
          personBalances.set(t.person_id, current - parseFloat(t.amount.toString()))
        }
      })

      const personsOwed = Array.from(personBalances.values()).filter(b => b > 0).length
      const personsOwing = Array.from(personBalances.values()).filter(b => b < 0).length

      setStats({
        totalSpends,
        monthlySpends,
        todaySpends,
        personsOwed,
        personsOwing,
        topCategory,
        spendTrend,
        monthlyAverage,
        categoryBreakdown: categoryBreakdown.slice(0, 6)
      })

      // Load AI insights
      const hasApiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (hasApiKey && insights.length === 0) {
        loadAIInsights(monthlySpends, categoryBreakdown)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAIInsights = async (monthly: number, _categories: any[]) => {
    try {
      const trendMapping: { [key: string]: 'increasing' | 'decreasing' | 'stable' } = {
        up: 'increasing',
        down: 'decreasing',
        stable: 'stable'
      }

      const generatedInsights = await generateFinancialInsights({
        totalDues: 0,
        totalSpends: monthly,
        topSuppliers: [],
        recentTrend: trendMapping[stats.spendTrend]
      })

      setInsights(generatedInsights)
      if (generatedInsights.length > 0) {
        setShowInsights(true)
      }
    } catch (error) {
      console.error('Error loading AI insights:', error)
    }
  }

  const saveWidgetPreferences = async (updatedWidgets: DashboardWidget[]) => {
    if (!user) return

    try {
      // Delete existing preferences
      await supabase
        .from('dashboard_preferences')
        .delete()
        .eq('user_id', user.id)

      // Insert new preferences
      const preferences = updatedWidgets.map(w => ({
        user_id: user.id,
        widget_id: w.id,
        is_visible: w.enabled,
        position: w.position,
        size: w.size
      }))

      await supabase
        .from('dashboard_preferences')
        .insert(preferences)

      setWidgets(updatedWidgets.sort((a, b) => a.position - b.position))
    } catch (error) {
      console.error('Error saving widget preferences:', error)
    }
  }

  const toggleWidget = (widgetId: string) => {
    const updated = widgets.map(w =>
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    )
    saveWidgetPreferences(updated)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'tip': return <Lightbulb className="h-5 w-5 text-blue-600" />
      default: return <Sparkles className="h-5 w-5 text-purple-600" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'tip': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-purple-50 border-purple-200 text-purple-800'
    }
  }

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.enabled) return null

    const sizeClasses = {
      small: 'col-span-1',
      medium: 'col-span-1 sm:col-span-2',
      large: 'col-span-1 sm:col-span-2 lg:col-span-3'
    }

    switch (widget.id) {
      case 'monthly_spends':
        return (
          <div key={widget.id} className={`${sizeClasses[widget.size]} stat-card group bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">This Month</p>
            <p className="text-3xl font-bold text-blue-600 mb-1">
              ₹{Math.round(stats.monthlySpends).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {stats.spendTrend === 'up' && '↑ Higher than last month'}
              {stats.spendTrend === 'down' && '↓ Lower than last month'}
              {stats.spendTrend === 'stable' && '→ Similar to last month'}
            </p>
          </div>
        )

      case 'today_spends':
        return (
          <div key={widget.id} className={`${sizeClasses[widget.size]} stat-card group bg-gradient-to-br from-green-50 to-emerald-50 border-green-200`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">Today</p>
            <p className="text-3xl font-bold text-green-600 mb-1">
              ₹{Math.round(stats.todaySpends).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Today's spending</p>
          </div>
        )

      case 'total_spends':
        return (
          <div key={widget.id} className={`${sizeClasses[widget.size]} stat-card group bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">All Time</p>
            <p className="text-3xl font-bold text-purple-600 mb-1">
              ₹{Math.round(stats.totalSpends).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Total spends</p>
          </div>
        )

      case 'monthly_average':
        return (
          <div key={widget.id} className={`${sizeClasses[widget.size]} stat-card group bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">6-Month Avg</p>
            <p className="text-3xl font-bold text-orange-600 mb-1">
              ₹{Math.round(stats.monthlyAverage).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">per month</p>
          </div>
        )

      case 'persons_summary':
        return (
          <button
            key={widget.id}
            onClick={() => navigate('/persons')}
            className={`${sizeClasses[widget.size]} stat-card group bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 hover:shadow-2xl hover:scale-105`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-1">Persons</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.personsOwed}</p>
                <p className="text-xs text-gray-500">You owe</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.personsOwing}</p>
                <p className="text-xs text-gray-500">Owe you</p>
              </div>
            </div>
          </button>
        )

      case 'category_breakdown':
        return (
          <div key={widget.id} className={`${sizeClasses[widget.size]} card-modern`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Spending by Category</h2>
                </div>
                <button
                  onClick={() => navigate('/spends')}
                  className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors flex items-center gap-1 group"
                >
                  View All
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
              <div className="space-y-3">
                {stats.categoryBreakdown.length > 0 ? (
                  stats.categoryBreakdown.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">{cat.category}</p>
                          <p className="text-sm font-bold text-purple-600">
                            ₹{Math.round(cat.amount).toLocaleString()}
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No spending data yet</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'spend_trend':
        return (
          <div key={widget.id} className={`${sizeClasses[widget.size]} card-modern`}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${
                  stats.spendTrend === 'up' ? 'bg-red-100' : 
                  stats.spendTrend === 'down' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {stats.spendTrend === 'up' && <TrendingUp className="h-6 w-6 text-red-600" />}
                  {stats.spendTrend === 'down' && <TrendingDown className="h-6 w-6 text-green-600" />}
                  {stats.spendTrend === 'stable' && <TrendingUp className="h-6 w-6 text-blue-600" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Spending Trend</h2>
                  <p className="text-sm text-gray-600">Compared to last month</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <p className="text-lg font-semibold text-gray-900">
                  {stats.spendTrend === 'up' && '📈 Spending is increasing'}
                  {stats.spendTrend === 'down' && '📉 Spending is decreasing'}
                  {stats.spendTrend === 'stable' && '➡️ Spending is stable'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Top category: <span className="font-semibold">{stats.topCategory.name}</span> (₹{Math.round(stats.topCategory.amount).toLocaleString()})
                </p>
              </div>
            </div>
          </div>
        )

      case 'ai_insights':
        if (!showInsights || insights.length === 0) return null
        return (
          <div key={widget.id} className={`${sizeClasses[widget.size]} bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">AI Financial Insights</h2>
              </div>
              <button
                onClick={() => setShowInsights(false)}
                className="p-1 hover:bg-purple-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-purple-600" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                      <p className="text-xs mb-2 opacity-90">{insight.message}</p>
                      {insight.actionable && (
                        <p className="text-xs font-medium flex items-center space-x-1">
                          <span>💡</span>
                          <span>{insight.actionable}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up-fade">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl p-6 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back!</h1>
            <p className="text-purple-100">Here's your personal finance overview</p>
          </div>
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
            title="Customize Dashboard"
          >
            <Settings className="h-6 w-6 text-white" />
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Widget Customizer */}
      {showCustomizer && (
        <div className="card-modern animate-slide-down">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Customize Dashboard</h2>
              <button
                onClick={() => setShowCustomizer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Choose which widgets to display on your dashboard</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {widgets.map(widget => (
                <button
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    widget.enabled
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-900">{widget.title}</span>
                  {widget.enabled ? (
                    <Eye className="h-5 w-5 text-blue-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {widgets.map(widget => renderWidget(widget))}
      </div>
    </div>
  )
}

export default PersonalDashboard
