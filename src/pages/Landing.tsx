import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  User,
  DollarSign,
  BarChart3,
  TrendingUp,
  Shield,
  Smartphone,
  Database,
  FileText,
  ArrowRight,
  Star,
  CheckCircle
} from 'lucide-react'

const Landing = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: Users,
      title: 'Supplier Management',
      description: 'Complete supplier dues tracking with purchase history, payment management, and outstanding balance monitoring.',
      color: 'blue'
    },
    {
      icon: User,
      title: 'Person Money Tracking',
      description: 'Track money given to and received from individuals with comprehensive loan and debt management.',
      color: 'green'
    },
    {
      icon: DollarSign,
      title: 'Personal Spends',
      description: 'Monitor personal expenses with categorized spending, budget tracking, and spending analytics.',
      color: 'purple'
    },
    {
      icon: BarChart3,
      title: 'Advanced Reports',
      description: 'Generate detailed financial reports with charts, export capabilities, and comprehensive analytics.',
      color: 'orange'
    },
    {
      icon: Database,
      title: 'Secure Data Storage',
      description: 'Cloud-based data storage with backup and restore functionality for all your financial data.',
      color: 'indigo'
    },
    {
      icon: Smartphone,
      title: 'PWA Support',
      description: 'Install as a Progressive Web App for offline access and native app-like experience.',
      color: 'pink'
    }
  ]

  const stats = [
    { number: '100%', label: 'Data Security' },
    { number: '24/7', label: 'Access' },
    { number: 'Free', label: 'Forever' },
    { number: 'v1.4.2', label: 'Latest Version' }
  ]

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
                onClick={() => navigate('/documentation')}
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
              <span>Version 1.4.2 - Bugs Fixed</span>
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