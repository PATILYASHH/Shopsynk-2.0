import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { getVersionDisplay } from '../constants/version'
import { supabase } from '../lib/supabase'
import PWAInstallPrompt from './PWAInstallPrompt'
import PWAUpdateNotification from './PWAUpdateNotification'
import NotificationDropdown from './NotificationDropdown'
import { 
  LogOut, 
  Home, 
  Users, 
  Receipt, 
  FileText, 
  User,
  HardDrive,
  Book,
  Store,
  Plus,
  ShoppingBasket,
  CreditCard,
  X,
  MoreVertical,
  HandCoins,
  DollarSign,
  Settings
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showPersonMenu, setShowPersonMenu] = useState(false)
  const [featureSettings, setFeatureSettings] = useState({
    suppliers: true,
    spends: true,
    persons: true
  })

  const [replacementSettings, setReplacementSettings] = useState({
    suppliers: 'reports',
    spends: 'transactions',
    persons: 'data-storage'
  })

  const [userMode, setUserMode] = useState<'business' | 'personal'>('business')

  // Load user mode from database
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
          
          // Auto-disable suppliers for personal mode
          if (data.mode === 'personal') {
            setFeatureSettings(prev => ({ ...prev, suppliers: false }))
          }
        }
      } catch (error) {
        console.error('Error loading user mode:', error)
      }
    }

    loadUserMode()
  }, [user])

  // Load feature settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('shopsynk_settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          if (parsed.features) {
            // For personal mode, always keep suppliers disabled
            if (userMode === 'personal') {
              parsed.features.suppliers = false
            }
            setFeatureSettings(parsed.features)
          }
          if (parsed.replacements) {
            setReplacementSettings(parsed.replacements)
          }
        } catch (error) {
          console.error('Error loading feature settings:', error)
        }
      }
    }

    // Load settings on mount
    loadSettings()

    // Listen for storage changes (when settings are updated in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shopsynk_settings') {
        loadSettings()
      }
    }

    // Also listen for custom events when settings change in the same tab
    const handleSettingsChange = () => {
      loadSettings()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('settingsChanged', handleSettingsChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('settingsChanged', handleSettingsChange)
    }
  }, [])

  // Filter navigation based on feature settings - replace disabled features with alternatives
  const getFilteredNavigation = useMemo(() => {
    return (navItems: any[]) => {
      const result = [...navItems]
      const usedReplacements = new Set<string>()

      return result.map(item => {
        if (item.path === '/spends' && !featureSettings.spends) {
          const replacement = replacementSettings.spends
          if (!usedReplacements.has(`/${replacement}`)) {
            usedReplacements.add(`/${replacement}`)
            return getReplacementItem(replacement)
          } else {
            // Fallback to another available replacement
            const fallback = getFallbackReplacement(replacement, usedReplacements)
            if (fallback) {
              usedReplacements.add(`/${fallback}`)
              return getReplacementItem(fallback)
            } else {
              // If no fallback available, use the first available option
              const availableOptions = ['transactions', 'reports', 'data-storage', 'documentation']
              const available = availableOptions.find(option => !usedReplacements.has(`/${option}`))
              return available ? getReplacementItem(available) : getReplacementItem('reports')
            }
          }
        }
        if (item.path === '/suppliers' && !featureSettings.suppliers) {
          const replacement = replacementSettings.suppliers
          if (!usedReplacements.has(`/${replacement}`)) {
            usedReplacements.add(`/${replacement}`)
            return getReplacementItem(replacement)
          } else {
            // Fallback to another available replacement
            const fallback = getFallbackReplacement(replacement, usedReplacements)
            if (fallback) {
              usedReplacements.add(`/${fallback}`)
              return getReplacementItem(fallback)
            } else {
              // If no fallback available, use the first available option
              const availableOptions = ['transactions', 'reports', 'data-storage', 'documentation']
              const available = availableOptions.find(option => !usedReplacements.has(`/${option}`))
              return available ? getReplacementItem(available) : getReplacementItem('transactions')
            }
          }
        }
        if (item.path === '/persons' && !featureSettings.persons) {
          const replacement = replacementSettings.persons
          if (!usedReplacements.has(`/${replacement}`)) {
            usedReplacements.add(`/${replacement}`)
            return getReplacementItem(replacement)
          } else {
            // Fallback to another available replacement
            const fallback = getFallbackReplacement(replacement, usedReplacements)
            if (fallback) {
              usedReplacements.add(`/${fallback}`)
              return getReplacementItem(fallback)
            } else {
              // If no fallback available, use the first available option
              const availableOptions = ['transactions', 'reports', 'data-storage', 'documentation']
              const available = availableOptions.find(option => !usedReplacements.has(`/${option}`))
              return available ? getReplacementItem(available) : getReplacementItem('data-storage')
            }
          }
        }
        return item
      })
    }
  }, [featureSettings, replacementSettings])

  // Helper function to get replacement navigation item
  const getReplacementItem = (replacement: string) => {
    switch (replacement) {
      case 'transactions':
        return { name: 'Transactions', path: '/transactions', icon: Receipt }
      case 'reports':
        return { name: 'Reports', path: '/reports', icon: FileText }
      case 'data-storage':
        return { name: 'Data Storage', path: '/data-storage', icon: HardDrive }
      case 'documentation':
        return { name: 'Documentation', path: '/documentation', icon: Book }
      default:
        return { name: 'Reports', path: '/reports', icon: FileText }
    }
  }

  // Helper function to get fallback replacement
  const getFallbackReplacement = (current: string, used: Set<string>) => {
    const options = ['transactions', 'reports', 'data-storage', 'documentation']
    for (const option of options) {
      if (option !== current && !used.has(`/${option}`)) {
        return option
      }
    }
    return null
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Check if we're on suppliers page or supplier detail page
  const isOnSuppliersPage = location.pathname === '/suppliers'
  const isOnSupplierDetailPage = location.pathname.startsWith('/suppliers/') && location.pathname !== '/suppliers'

  // Check if we're on persons page
  const isOnPersonsPage = location.pathname === '/persons'
  const isOnPersonDetailPage = location.pathname.startsWith('/persons/') && location.pathname !== '/persons'

  // Check if we're on spends page
  const isOnSpendsPage = location.pathname === '/spends'

  // Handle plus button click
  const handlePlusClick = () => {
    if (isOnSuppliersPage) {
      // Navigate to add new supplier (or trigger add supplier modal)
      // For now, we'll use a query parameter to trigger the add supplier modal
      navigate('/suppliers?add=true')
    } else if (isOnSupplierDetailPage) {
      // Show purchase/payment menu
      setShowPlusMenu(true)
    } else if (isOnPersonsPage) {
      // Navigate to add new person
      navigate('/persons?add=true')
    } else if (isOnSpendsPage) {
      // Navigate to add new spend
      navigate('/spends?add=true')
    }
  }

  // Handle purchase action
  const handlePurchase = () => {
    setShowPlusMenu(false)
    // Trigger purchase modal - this could be done via URL params or event system
    const event = new CustomEvent('openPurchaseModal')
    window.dispatchEvent(event)
  }

  // Handle payment action
  const handlePayment = () => {
    setShowPlusMenu(false)
    // Trigger payment modal - this could be done via URL params or event system
    const event = new CustomEvent('openPaymentModal')
    window.dispatchEvent(event)
  }

  // Handle gives action (for persons)
  const handleGives = () => {
    setShowPersonMenu(false)
    const event = new CustomEvent('openPurchaseModal')
    window.dispatchEvent(event)
  }

  // Handle takes action (for persons)
  const handleTakes = () => {
    setShowPersonMenu(false)
    const event = new CustomEvent('openPaymentModal')
    window.dispatchEvent(event)
  }

  const navigation = useMemo(() => {
    const baseNav = [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Suppliers', path: '/suppliers', icon: Users },
      { name: 'Persons', path: '/persons', icon: User },
      { name: 'Spends', path: '/spends', icon: DollarSign },
      { name: 'Reports', path: '/reports', icon: FileText },
      { name: 'Data Storage', path: '/data-storage', icon: HardDrive },
      { name: 'Documentation', path: '/documentation', icon: Book },
    ]
    
    // In personal mode, completely remove suppliers from navigation
    const filteredNav = userMode === 'personal' 
      ? baseNav.filter(item => item.path !== '/suppliers')
      : baseNav
    
    return getFilteredNavigation(filteredNav)
  }, [getFilteredNavigation, userMode])

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  // Dynamic mobile navigation based on current page
  const getBaseNavigation = useMemo(() => {
    // In personal mode, create navigation without suppliers
    if (userMode === 'personal') {
      const personalNav = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Spends', path: '/spends', icon: DollarSign },
        { name: 'Persons', path: '/persons', icon: User },
        { name: 'Reports', path: '/reports', icon: FileText },
        { name: 'More', path: '#', icon: MoreVertical },
      ]
      return getFilteredNavigation(personalNav)
    }

    // Business mode navigation (includes suppliers)
    const defaultNav = getFilteredNavigation([
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Spends', path: '/spends', icon: DollarSign },
      { name: 'Suppliers', path: '/suppliers', icon: Users },
      { name: 'Persons', path: '/persons', icon: User },
      { name: 'More', path: '#', icon: MoreVertical },
    ])

    // When on spends page: Dashboard, Suppliers, Spends, Persons, More
    if (isOnSpendsPage) {
      return getFilteredNavigation([
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Suppliers', path: '/suppliers', icon: Users },
        { name: 'Spends', path: '/spends', icon: DollarSign },
        { name: 'Persons', path: '/persons', icon: User },
        { name: 'More', path: '#', icon: MoreVertical },
      ])
    }

    // When on persons page: Dashboard, Spends, Persons, Suppliers, More
    if (isOnPersonsPage) {
      return getFilteredNavigation([
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Spends', path: '/spends', icon: DollarSign },
        { name: 'Persons', path: '/persons', icon: User },
        { name: 'Suppliers', path: '/suppliers', icon: Users },
        { name: 'More', path: '#', icon: MoreVertical },
      ])
    }

    // When on suppliers page: keep default navigation, just show + at suppliers position
    if (isOnSuppliersPage) {
      return defaultNav
    }

    return defaultNav
  }, [getFilteredNavigation, userMode, isOnSpendsPage, isOnPersonsPage, isOnSuppliersPage])

  const baseNavigation = getBaseNavigation

  // Determine which position should have the plus button
  let plusButtonIndex = -1
  let plusButtonType = ''

  // Only show supplier plus button in business mode
  if ((isOnSuppliersPage || isOnSupplierDetailPage) && userMode === 'business') {
    plusButtonIndex = 2 // Suppliers position (index 2 in default navigation)
    plusButtonType = 'Add Supplier'
  } else if (isOnPersonsPage) {
    plusButtonIndex = 2 // Persons position (index 2 in rearranged navigation)
    plusButtonType = 'Add Person'
  } else if (isOnPersonDetailPage) {
    plusButtonIndex = 2 // Persons position (index 2 in rearranged navigation)
    plusButtonType = 'Add Transaction'
  } else if (isOnSpendsPage) {
    plusButtonIndex = 2 // Spends position (index 2 in rearranged navigation)
    plusButtonType = 'Add Spend'
  }

  // Close More menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreMenu) {
        const target = event.target as Element
        if (!target.closest('[data-more-menu]')) {
          setShowMoreMenu(false)
        }
      }
    }

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center h-16 bg-blue-600 text-white">
            <div className="flex items-center space-x-2 mb-1">
              <Store className="h-8 w-8 text-white" />
              <h1 className="text-xl font-bold">Shopsynk</h1>
            </div>
            <p className="text-xs text-blue-200">{getVersionDisplay()}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              )
            })}
          </nav>

          {/* User info and sign out */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors mb-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Profile Settings
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-pb backdrop-blur-lg bg-opacity-95">
        <div className="flex items-center justify-around px-1 py-3">
          {baseNavigation.map((item, index) => {
            const isActive = isActivePath(item.path)
            
            // Staggered animation delay for each nav item
            const animationDelay = `${index * 50}ms`
            const animationClass = index < 2 ? 'animate-slide-in-left' : index > 2 ? 'animate-slide-in-right' : 'animate-slide-in-center'

            // Check if this position should have the plus button
            if (index === plusButtonIndex) {
              if (plusButtonType === 'Add Supplier') {
                return (
                  <button
                    key={`plus-${index}`}
                    onClick={handlePlusClick}
                    className="flex items-center justify-center p-4 rounded-full transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 text-white transform scale-110 shadow-xl hover:shadow-2xl hover:scale-125 active:scale-105 animate-plus-appear animate-plus-pulse ripple-container"
                    style={{ animationDelay }}
                    title="Add Supplier"
                  >
                    <Plus className="h-7 w-7 text-white transition-transform duration-300" />
                  </button>
                )
              }

              if (plusButtonType === 'Add Person') {
                return (
                  <button
                    key={`plus-${index}`}
                    onClick={() => navigate('/persons?add=true')}
                    className="flex items-center justify-center p-4 rounded-full transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 text-white transform scale-110 shadow-xl hover:shadow-2xl hover:scale-125 active:scale-105 animate-plus-appear animate-plus-pulse ripple-container"
                    style={{ animationDelay }}
                    title="Add Person"
                  >
                    <Plus className="h-7 w-7 text-white transition-transform duration-300" />
                  </button>
                )
              }

              if (plusButtonType === 'Add Spend') {
                return (
                  <button
                    key={`plus-${index}`}
                    onClick={() => navigate('/spends?add=true')}
                    className="flex items-center justify-center p-4 rounded-full transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 text-white transform scale-110 shadow-xl hover:shadow-2xl hover:scale-125 active:scale-105 animate-plus-appear animate-plus-pulse ripple-container"
                    style={{ animationDelay }}
                    title="Add Spend"
                  >
                    <Plus className="h-7 w-7 text-white transition-transform duration-300" />
                  </button>
                )
              }

              if (plusButtonType === 'Add Transaction') {
                return (
                  <button
                    key={`plus-${index}`}
                    onClick={() => setShowPersonMenu(!showPersonMenu)}
                    className="flex items-center justify-center p-4 rounded-full transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 text-white transform scale-110 shadow-xl hover:shadow-2xl hover:scale-125 active:scale-105 animate-plus-appear animate-plus-pulse ripple-container"
                    style={{ animationDelay }}
                    title="Add Transaction"
                  >
                    <Plus className="h-7 w-7 text-white transition-transform duration-300" />
                  </button>
                )
              }
            }

            // Special handling for More button
            if (item.name === 'More') {
              return (
                <button
                  key={item.name}
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 ${animationClass} ripple-container ${
                    showMoreMenu
                      ? 'text-blue-600 bg-blue-50 transform scale-110 shadow-md'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
                  }`}
                  style={{ animationDelay }}
                  title={item.name}
                >
                  <i className={`bi bi-grid-1x2 transition-all duration-300 ${showMoreMenu ? 'text-blue-600 rotate-90' : 'text-gray-500'}`} style={{fontSize: '1.5rem'}}></i>
                </button>
              )
            }

            // Regular navigation items
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 ${animationClass} ripple-container ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 transform scale-110 shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95 hover:shadow-sm'
                }`}
                style={{ animationDelay }}
                title={item.name}
              >
                <Icon className={`h-6 w-6 transition-all duration-300 ${isActive ? 'text-blue-600 scale-110' : 'text-gray-500'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Plus Menu Popup for Supplier Detail */}
      {showPlusMenu && isOnSupplierDetailPage && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end justify-center transition-opacity duration-300">
          <div className="bg-white rounded-t-2xl w-full p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6 animate-fade-in-delayed">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <button
                onClick={() => setShowPlusMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handlePurchase}
                className="flex flex-col items-center p-6 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-slide-in-left ripple-container"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-3 shadow-md">
                  <ShoppingBasket className="h-6 w-6 text-white" />
                </div>
                <span className="text-red-700 font-medium">Add Purchase</span>
                <span className="text-red-600 text-sm mt-1">Record new purchase</span>
              </button>
              
              <button
                onClick={handlePayment}
                className="flex flex-col items-center p-6 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-slide-in-right ripple-container"
                style={{ animationDelay: '100ms' }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-3 shadow-md">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <span className="text-green-700 font-medium">Pay Due</span>
                <span className="text-green-600 text-sm mt-1">Make payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Person Menu Popup */}
      {showPersonMenu && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end justify-center transition-opacity duration-300">
          <div className="bg-white rounded-t-2xl w-full p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6 animate-fade-in-delayed">
              <h3 className="text-lg font-semibold text-gray-900">Add Transaction</h3>
              <button
                onClick={() => setShowPersonMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGives}
                className="flex flex-col items-center p-6 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-slide-in-left ripple-container"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-3 shadow-md">
                  <HandCoins className="h-6 w-6 text-white" />
                </div>
                <span className="text-red-700 font-medium">Gives</span>
                <span className="text-red-600 text-sm mt-1">Record loan given</span>
              </button>

              <button
                onClick={handleTakes}
                className="flex flex-col items-center p-6 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-slide-in-right ripple-container"
                style={{ animationDelay: '100ms' }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-3 shadow-md">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <span className="text-green-700 font-medium">Takes</span>
                <span className="text-green-600 text-sm mt-1">Record payment received</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Menu Popup */}
      {showMoreMenu && (
        <div data-more-menu className="lg:hidden fixed bottom-16 right-4 bg-white border border-gray-200 rounded-xl shadow-2xl z-[60] min-w-48 animate-nav-pop-in backdrop-blur-lg bg-opacity-95">
          <div className="py-2">
            <button
              onClick={() => {
                navigate('/profile')
                setShowMoreMenu(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 rounded-lg mx-1"
            >
              <User className="h-4 w-4 mr-3 text-gray-500 transition-transform duration-200" />
              Profile
            </button>
            <button
              onClick={() => {
                navigate('/data-storage')
                setShowMoreMenu(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 rounded-lg mx-1"
            >
              <HardDrive className="h-4 w-4 mr-3 text-gray-500 transition-transform duration-200" />
              Data Storage
            </button>
            <button
              onClick={() => {
                navigate('/reports')
                setShowMoreMenu(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 rounded-lg mx-1"
            >
              <FileText className="h-4 w-4 mr-3 text-gray-500 transition-transform duration-200" />
              Reports
            </button>
            <button
              onClick={() => {
                navigate('/transactions')
                setShowMoreMenu(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 rounded-lg mx-1"
            >
              <Receipt className="h-4 w-4 mr-3 text-gray-500 transition-transform duration-200" />
              Transactions
            </button>
            <button
              onClick={() => {
                navigate('/documentation')
                setShowMoreMenu(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 rounded-lg mx-1"
            >
              <Book className="h-4 w-4 mr-3 text-gray-500 transition-transform duration-200" />
              Documentation
            </button>
            <button
              onClick={() => {
                navigate('/settings')
                setShowMoreMenu(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 rounded-lg mx-1"
            >
              <Settings className="h-4 w-4 mr-3 text-gray-500 transition-transform duration-200" />
              Settings
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={() => {
                handleSignOut()
                setShowMoreMenu(false)
              }}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center transition-all duration-200 hover:scale-105 hover:shadow-sm active:scale-95 rounded-lg mx-1"
            >
              <LogOut className="h-4 w-4 mr-3 text-red-500 transition-transform duration-200" />
              Sign Out
            </button>
          </div>
        </div>
      )}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-bold text-blue-600">Shopsynk</h1>
            <span className="ml-2 text-xs text-gray-500">{getVersionDisplay()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <NotificationDropdown />
            <button
              onClick={() => navigate('/profile')}
              className={`p-2 rounded-lg transition-colors ${
                isActivePath('/profile') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Profile"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Desktop Top header bar */}
        <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4 lg:px-8">
          <div className="flex items-center justify-end">
            <NotificationDropdown />
          </div>
        </div>
        
        <main className="p-4 lg:p-8 pb-20 lg:pb-8 pt-4 lg:pt-0 page-transition">
          {children}
        </main>
      </div>

      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAUpdateNotification />
    </div>
  )
}

export default Layout