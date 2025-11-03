import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getVersionDisplay } from '../constants/version'
import {
  Users,
  User,
  DollarSign,
  BarChart3,
  Smartphone,
  Database,
  ArrowRight,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  Zap,
  Globe,
  Lock
} from 'lucide-react'

const Landing = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated, redirect to dashboard
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user is authenticated, don't render the landing page
  if (user) {
    return null
  }

  const features = [
    {
      icon: Users,
      title: 'Supplier Management',
      description: 'Complete supplier dues tracking with purchase history, payment management, and outstanding balance monitoring.',
      color: 'blue',
      details: [
        'Track all supplier purchases and payments',
        'Monitor outstanding balances in real-time',
        'View detailed transaction history',
        'Generate supplier-wise reports',
        'Set payment reminders and due dates'
      ]
    },
    {
      icon: User,
      title: 'Person Money Tracking',
      description: 'Track money given to and received from individuals with comprehensive loan and debt management.',
      color: 'green',
      details: [
        'Track money given (Gives) and received (Takes)',
        'Manage personal loans and debts',
        'Monitor outstanding balances per person',
        'Complete transaction history',
        'Easy-to-use interface for quick entries'
      ]
    },
    {
      icon: DollarSign,
      title: 'Personal Spends',
      description: 'Monitor personal expenses with categorized spending, budget tracking, and spending analytics.',
      color: 'purple',
      details: [
        'Categorized expense tracking',
        'Multiple spend categories (Food, Transport, etc.)',
        'Visual spending analytics',
        'Monthly spending trends',
        'Budget management tools'
      ]
    },
    {
      icon: BarChart3,
      title: 'Advanced Reports',
      description: 'Generate detailed financial reports with charts, export capabilities, and comprehensive analytics.',
      color: 'orange',
      details: [
        'Comprehensive financial reports',
        'Export to CSV, Excel, and PDF',
        'Visual charts and graphs',
        'Date range filtering',
        'Category-wise breakdowns'
      ]
    },
    {
      icon: Database,
      title: 'Secure Data Storage',
      description: 'Cloud-based data storage with backup and restore functionality for all your financial data.',
      color: 'indigo',
      details: [
        'Secure cloud-based storage',
        'Automatic data backup',
        'Easy restore functionality',
        'Data encryption',
        'Multi-device sync'
      ]
    },
    {
      icon: Smartphone,
      title: 'PWA Support',
      description: 'Install as a Progressive Web App for offline access and native app-like experience.',
      color: 'pink',
      details: [
        'Install on any device',
        'Offline functionality',
        'Native app experience',
        'Fast loading times',
        'Push notifications'
      ]
    }
  ]

  const benefits = [
    {
      icon: Shield,
      title: '100% Secure',
      description: 'Your financial data is encrypted and stored securely with enterprise-grade security measures.'
    },
    {
      icon: Clock,
      title: '24/7 Access',
      description: 'Access your financial data anytime, anywhere from any device with internet connection.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Quick data entry and instant calculations for efficient financial management.'
    },
    {
      icon: Globe,
      title: 'Multi-Platform',
      description: 'Works seamlessly on desktop, tablet, and mobile devices with responsive design.'
    },
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      description: 'Gain insights into your spending patterns with intelligent analytics and reports.'
    },
    {
      icon: Lock,
      title: 'Privacy Focused',
      description: 'Your data belongs to you. We never share or sell your information to third parties.'
    }
  ]

  const stats = [
    { number: '100%', label: 'Data Security' },
    { number: '24/7', label: 'Access' },
    { number: 'Free', label: 'Forever' },
    { number: getVersionDisplay(), label: 'Latest Version' }
  ]

  const handleLearnMore = () => {
    setShowDetails(true)
    // Smooth scroll to details section
    setTimeout(() => {
      const detailsSection = document.getElementById('details-section')
      if (detailsSection) {
        detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img
                src="/pwa opning/SHOP.png"
                alt="Shopsynk Logo"
                className="h-10 w-10"
              />
              <span className="text-2xl font-bold text-gray-900">Shopsynk</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img
                src="/pwa opning/shopsynk.png"
                alt="Shopsynk"
                className="h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40 object-contain"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Complete Money
              <span className="text-blue-600"> Management</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The ultimate solution for managing supplier dues, personal loans, and expenses.
              Track, analyze, and control your financial relationships with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={handleLearnMore}
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Complete Financial Control
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your business finances and personal expenses in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${feature.color}-100 mb-4`}>
                    <IconComponent className={`h-6 w-6 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Detailed Information Section - Shown after Learn More */}
      {showDetails && (
        <section id="details-section" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Comprehensive Financial Management Platform
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Shopsynk is your all-in-one solution for managing supplier relationships, personal loans, and daily expenses.
                Here's everything you can do with Shopsynk:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center space-x-2"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Already a User? Login
                </button>
              </div>
            </div>

            {/* Feature Details */}
            <div className="space-y-12 mb-16">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div key={index} className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                    <div className="flex items-start space-x-6">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-${feature.color}-100 flex items-center justify-center`}>
                        <IconComponent className={`h-8 w-8 text-${feature.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-lg text-gray-600 mb-4">
                          {feature.description}
                        </p>
                        <ul className="space-y-2">
                          {feature.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Benefits Section */}
            <div className="mb-16">
              <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
                Why Choose Shopsynk?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.icon
                  return (
                    <div key={index} className="text-center p-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <IconComponent className="h-8 w-8 text-blue-600" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
              <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
                How It Works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
                    1
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Sign Up Free
                  </h4>
                  <p className="text-gray-600">
                    Create your free account in seconds with just your email
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
                    2
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Add Your Data
                  </h4>
                  <p className="text-gray-600">
                    Start adding suppliers, persons, and transactions
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
                    3
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Track & Manage
                  </h4>
                  <p className="text-gray-600">
                    Monitor all your financial relationships in real-time
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-4">
                    4
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Analyze & Export
                  </h4>
                  <p className="text-gray-600">
                    Generate reports and export data for your records
                  </p>
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                Join Shopsynk today and take control of your financial management
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center space-x-2"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Already a User? Login
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust Shopsynk for their financial management needs.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center space-x-2"
          >
            <span>Start Managing Your Money</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img
                src="/pwa opning/SHOP.png"
                alt="Shopsynk Logo"
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">Shopsynk</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Version 1.4.3 - The opening page update</span>
              <span>•</span>
              <span>© 2025 Shopsynk</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing