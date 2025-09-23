import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { NotificationService } from './services/NotificationService'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import IconUpdateNotification from './components/IconUpdateNotification'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Suppliers from './pages/Suppliers'
import SupplierDetail from './pages/SupplierDetail'
import Persons from './pages/Persons'
import PersonDetail from './pages/PersonDetail'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import DataStorage from './pages/DataStorage'
import Documentation from './pages/Documentation'
import Profile from './pages/Profile'

function App() {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // Check if this is a PWA launch
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true ||
                  document.referrer.includes('android-app://') ||
                  window.location.search.includes('utm_source=pwa')

    // Also show splash on first load or when explicitly requested
    const shouldShowSplash = isPWA || 
                            localStorage.getItem('shopsynk_first_launch') === null ||
                            window.location.search.includes('show_splash=true')

    if (shouldShowSplash) {
      setShowSplash(true)
      localStorage.setItem('shopsynk_first_launch', 'false')
    }

    // Request notification permissions
    NotificationService.requestNotificationPermission()
  }, [])

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            <IconUpdateNotification />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/suppliers/:id" element={<SupplierDetail />} />
                        <Route path="/persons" element={<Persons />} />
                        <Route path="/persons/:id" element={<PersonDetail />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/data-storage" element={<DataStorage />} />
                        <Route path="/documentation" element={<Documentation />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App