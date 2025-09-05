import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { getVersionDisplay } from '../constants/version'
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
  X
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPlusMenu, setShowPlusMenu] = useState(false)

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

  // Handle plus button click
  const handlePlusClick = () => {
    if (isOnSuppliersPage) {
      // Navigate to add new supplier (or trigger add supplier modal)
      // For now, we'll use a query parameter to trigger the add supplier modal
      navigate('/suppliers?add=true')
    } else if (isOnSupplierDetailPage) {
      // Show purchase/payment menu
      setShowPlusMenu(true)
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

  const navigation = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Suppliers', path: '/suppliers', icon: Users },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Data Storage', path: '/data-storage', icon: HardDrive },
    { name: 'Documentation', path: '/documentation', icon: Book },
  ]

  const mobileNavigation = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Suppliers', path: '/suppliers', icon: Users },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Data Storage', path: '/data-storage', icon: HardDrive },
  ]

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-pb">
        <div className="flex items-center justify-around px-1 py-3">
          {mobileNavigation.map((item) => {
            const isActive = isActivePath(item.path)
            
            // Special handling for Suppliers button
            if (item.path === '/suppliers' && (isOnSuppliersPage || isOnSupplierDetailPage)) {
              return (
                <button
                  key={item.name}
                  onClick={handlePlusClick}
                  className="flex items-center justify-center p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-1 bg-blue-600 text-white transform scale-110"
                  title={isOnSuppliersPage ? "Add Supplier" : "Quick Actions"}
                >
                  <Plus className="h-6 w-6 text-white" />
                </button>
              )
            }
            
            // Regular navigation items
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-1 ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 transform scale-110'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:scale-95'
                }`}
                title={item.name}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Plus Menu Popup for Supplier Detail */}
      {showPlusMenu && isOnSupplierDetailPage && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <button
                onClick={() => setShowPlusMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handlePurchase}
                className="flex flex-col items-center p-6 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
              >
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-3">
                  <ShoppingBasket className="h-6 w-6 text-white" />
                </div>
                <span className="text-red-700 font-medium">Add Purchase</span>
                <span className="text-red-600 text-sm mt-1">Record new purchase</span>
              </button>
              
              <button
                onClick={handlePayment}
                className="flex flex-col items-center p-6 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <span className="text-green-700 font-medium">Pay Due</span>
                <span className="text-green-600 text-sm mt-1">Make payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-bold text-blue-600">Shopsynk</h1>
            <span className="ml-2 text-xs text-gray-500">{getVersionDisplay()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigate('/documentation')}
              className={`p-2 rounded-lg transition-colors ${
                isActivePath('/documentation') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Documentation"
            >
              <Book className="h-5 w-5" />
            </button>
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
        
        <main className="p-4 lg:p-8 pb-20 lg:pb-8 pt-4 lg:pt-0">
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