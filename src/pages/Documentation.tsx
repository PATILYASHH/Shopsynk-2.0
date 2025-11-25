import React, { useState } from 'react'
import { VERSION_NAME, getVersionDisplay } from '../constants/version'
import { 
  Book, 
  Bug,
  User, 
  FileText, 
  Shield, 
  Code, 
  Clock,
  Tag,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Download,
  Play,
  Smartphone,
  Monitor,
  Zap,
  Target,
  ArrowLeft,
  TrendingUp,
  Layers,
  Database,
  BarChart3,
  Settings,
  BookOpen
} from 'lucide-react'

// Version History Data
const versionHistory = [
  {
    id: 'v1.4.3',
    version: '1.4.3',
    name: 'The opening page update',
    date: 'October 18, 2025',
    type: 'minor',
    color: 'purple',
    current: false,
    description: 'Enhanced user experience with a professional landing page showcasing all features and capabilities.',
    features: [
      {
        category: 'User Experience',
        icon: Monitor,
        color: 'purple',
        items: [
          'New professional landing page with big logo and branding',
          'Comprehensive feature showcase with detailed descriptions',
          'Prominent "Get Started" call-to-action button',
          'Responsive design for all screen sizes',
          'Statistics section highlighting key app benefits'
        ]
      },
      {
        category: 'Navigation & Routing',
        icon: ArrowRight,
        color: 'blue',
        items: [
          'Improved authentication flow with proper redirects',
          'Landing page for unauthenticated users',
          'Dashboard access for authenticated users',
          'Fixed email verification redirects',
          'Enhanced user onboarding experience'
        ]
      }
    ],
    impact: 'This update significantly improves the first impression and user onboarding experience. New visitors now see a professional landing page that clearly communicates the app\'s value proposition and features, making it easier for them to understand what Shopsynk offers and get started with the application.',
    breaking: false,
    migration: []
  },
  {
    id: 'v1.4.5',
    version: '1.4.5',
    name: 'minor bug fixes and UI improve',
    date: 'November 25, 2025',
    type: 'patch',
    color: 'blue',
    current: true,
    description: 'Minor bug fixes and UI improvements for better user experience.',
    features: [
      {
        category: 'UI Improvements',
        icon: Monitor,
        color: 'blue',
        items: [
          'Removed oversized Dashboard heading for cleaner look',
          'Improved header spacing and layout',
          'Enhanced visual hierarchy on homepage',
          'Added developer credit in footer'
        ]
      },
      {
        category: 'Bug Fixes',
        icon: Bug,
        color: 'green',
        items: [
          'Fixed mobile UI rendering issues',
          'Improved responsive design consistency',
          'Enhanced footer information display'
        ]
      }
    ],
    impact: 'This patch improves the overall user interface and fixes minor display issues, resulting in a cleaner and more professional appearance.',
    breaking: false,
    migration: []
  },
  {
    id: 'v1.4.4',
    version: '1.4.4',
    name: 'bug fixed',
    date: 'October 22, 2025',
    type: 'patch',
    color: 'green',
    current: false,
    description: 'Various bug fixes and stability improvements.',
    features: [
      {
        category: 'Bug Fixes',
        icon: Bug,
        color: 'green',
        items: [
          'Fixed various application bugs',
          'Improved stability and performance',
          'Enhanced error handling'
        ]
      }
    ],
    impact: 'This patch release addresses various bugs and improves overall application stability.',
    breaking: false,
    migration: []
  },
  {
    id: 'v1.4.2',
    version: '1.4.2',
    name: 'Bugs Fixed',
    date: 'September 26, 2025',
    type: 'patch',
    color: 'blue',
    current: false,
    description: 'Critical bug fixes and type safety improvements for enhanced stability and performance.',
    features: [
      {
        category: 'Bug Fixes',
        icon: Bug,
        color: 'blue',
        items: [
          'Fixed TypeScript errors in transaction filtering logic',
          'Resolved property access issues on union types',
          'Removed unused imports to eliminate warnings',
          'Fixed Reports page tab switching for Persons and Spends',
          'Improved type safety across transaction components'
        ]
      },
      {
        category: 'Code Quality',
        icon: Code,
        color: 'purple',
        items: [
          'Enhanced type guards for transaction property access',
          'Cleaned up import statements',
          'Improved error handling in data filtering',
          'Better TypeScript compliance throughout the application'
        ]
      }
    ],
    impact: 'This patch release addresses critical TypeScript errors and improves overall application stability. The fixes ensure proper type safety when accessing transaction properties and eliminate compilation warnings, resulting in a more robust and maintainable codebase.',
    breaking: false,
    migration: []
  },
  {
    id: 'v1.3.2',
    version: '1.3.2',
    name: 'Mobile Logout Enhancement',
    date: 'September 24, 2025',
    type: 'minor',
    color: 'red',
    current: false,
    description: 'Enhanced mobile user experience with logout functionality accessible from the mobile navigation menu.',
    features: [
      {
        category: 'Mobile User Experience',
        icon: Smartphone,
        color: 'red',
        items: [
          'Added logout button to mobile More menu',
          'Easy access to sign out functionality on mobile devices',
          'Improved mobile navigation completeness',
          'Consistent logout experience across all platforms',
          'Enhanced mobile security and session management'
        ]
      }
    ],
    impact: 'This minor update improves the mobile user experience by providing easy access to logout functionality. Users can now securely sign out of their account directly from the mobile navigation, ensuring better session management and security on mobile devices.',
    breaking: false,
    migration: []
  },
  {
    id: 'v1.3',
    version: '1.3',
    name: 'Person Money Tracking',
    date: 'September 23, 2025',
    type: 'major',
    color: 'green',
    current: false,
    description: 'Introducing comprehensive person-to-person money tracking alongside supplier management for complete financial relationship management.',
    features: [
      {
        category: 'Person Money Tracking',
        icon: User,
        color: 'green',
        items: [
          'Complete person-to-person money tracking system',
          'Track money given to persons ("Gives") and received from persons ("Takes")',
          'Personal loan and debt management capabilities',
          'Outstanding balance tracking for each person',
          'Comprehensive person transaction history'
        ]
      },
      {
        category: 'Enhanced Reports',
        icon: BarChart3,
        color: 'blue',
        items: [
          'Dual reporting system for suppliers and persons',
          'Person transaction analytics and insights',
          'Combined financial overview across all relationships',
          'Export functionality for person transactions',
          'Visual charts and breakdowns for personal finances'
        ]
      },
      {
        category: 'Navigation Improvements',
        icon: Smartphone,
        color: 'purple',
        items: [
          'Added profile button to mobile more menu',
          'Fixed person tab switching in reports',
          'Improved navigation consistency across all sections',
          'Enhanced mobile user experience',
          'Better accessibility and touch targets'
        ]
      }
    ],
    impact: 'This major update expands Shopsynk beyond supplier management to include comprehensive person-to-person financial tracking. Users can now manage both business supplier relationships and personal financial transactions in one unified platform, providing complete visibility into all financial relationships.',
    breaking: false,
    migration: []
  },
  {
    id: 'v1.2',
    version: '1.2',
    name: 'The Navigation Update',
    date: 'September 5, 2025',
    type: 'major',
    color: 'purple',
    current: false,
    description: 'Complete mobile navigation redesign with enhanced user experience and comprehensive documentation.',
    features: [
      {
        category: 'Mobile Navigation',
        icon: Smartphone,
        color: 'purple',
        items: [
          'Complete mobile navigation redesign with bottom navigation bar',
          'Replaced hamburger menu with thumb-friendly bottom navigation',
          'Enhanced touch targets and gesture support',
          'Improved mobile responsiveness across all pages',
          'Optimized PWA experience for mobile devices'
        ]
      },
      {
        category: 'Documentation System',
        icon: BookOpen,
        color: 'blue',
        items: [
          'Card-based documentation system with dedicated pages',
          'Enhanced mobile experience guide',
          'Comprehensive version history tracking',
          'Interactive documentation navigation',
          'Improved accessibility and user experience'
        ]
      },
      {
        category: 'User Experience',
        icon: Target,
        color: 'green',
        items: [
          'Mobile-first design philosophy implementation',
          'Improved navigation patterns for better usability',
          'Enhanced visual feedback and transitions',
          'Better content organization and discovery',
          'Responsive design improvements across all components'
        ]
      }
    ],
    impact: 'This major update transforms Shopsynk into a truly mobile-first application with modern navigation patterns and comprehensive documentation. Users can now enjoy a seamless experience across all devices with improved accessibility and usability.',
    breaking: false,
    migration: []
  },
  {
    id: 'v1.0',
    version: '1.00',
    name: 'Initial Release',
    date: 'September 1, 2025',
    type: 'major',
    color: 'blue',
    current: false,
    description: 'First stable release of Shopsynk with core supplier management functionality.',
    features: [
      {
        category: 'Core Features',
        icon: Layers,
        color: 'blue',
        items: [
          'Complete supplier management system',
          'Transaction tracking with CRUD operations',
          'Comprehensive reporting and analytics',
          'Data backup and export functionality',
          'PWA support with offline capabilities'
        ]
      },
      {
        category: 'User Interface',
        icon: Monitor,
        color: 'green',
        items: [
          'Clean and intuitive dashboard design',
          'Responsive layout for desktop and mobile',
          'Professional business-focused styling',
          'Accessible form controls and navigation',
          'Modern Material Design principles'
        ]
      },
      {
        category: 'Technical Foundation',
        icon: Settings,
        color: 'orange',
        items: [
          'React + TypeScript architecture',
          'Supabase backend integration',
          'Tailwind CSS styling system',
          'Vite build tooling',
          'Progressive Web App configuration'
        ]
      }
    ],
    impact: 'Established the foundation for modern supplier management with essential features for tracking suppliers, managing transactions, and generating reports. Set the technical architecture for future enhancements.',
    breaking: false,
    migration: []
  },
  {
    id: 'v0.9',
    version: '0.9',
    name: 'Beta Release',
    date: 'August 25, 2025',
    type: 'minor',
    color: 'orange',
    current: false,
    description: 'Feature-complete beta with testing and optimization focus.',
    features: [
      {
        category: 'Testing & Quality',
        icon: CheckCircle,
        color: 'green',
        items: [
          'Comprehensive testing suite implementation',
          'Performance optimization and profiling',
          'Cross-browser compatibility testing',
          'Security audit and vulnerability fixes',
          'User acceptance testing completion'
        ]
      },
      {
        category: 'Documentation',
        icon: FileText,
        color: 'blue',
        items: [
          'Initial documentation structure',
          'API documentation for developers',
          'User guide and tutorials',
          'Installation and setup instructions',
          'FAQ and troubleshooting guides'
        ]
      }
    ],
    impact: 'Finalized core functionality and ensured application stability through extensive testing. Prepared the foundation for public release.',
    breaking: false,
    migration: []
  },
  {
    id: 'v0.5',
    version: '0.5',
    name: 'Alpha Release',
    date: 'August 15, 2025',
    type: 'minor',
    color: 'yellow',
    current: false,
    description: 'Initial alpha release with basic supplier management functionality.',
    features: [
      {
        category: 'Basic Features',
        icon: User,
        color: 'blue',
        items: [
          'Basic supplier CRUD operations',
          'Simple transaction recording',
          'Basic reporting capabilities',
          'User authentication system',
          'Data persistence with Supabase'
        ]
      },
      {
        category: 'Development Setup',
        icon: Code,
        color: 'gray',
        items: [
          'Initial React application setup',
          'TypeScript configuration',
          'Basic styling with Tailwind CSS',
          'Development tooling configuration',
          'Version control and repository setup'
        ]
      }
    ],
    impact: 'Established the basic foundation for supplier management with essential CRUD operations and user authentication.',
    breaking: true,
    migration: ['Initial setup required', 'Database schema creation']
  }
]

// Version History Component
interface VersionHistoryProps {
  onVersionSelect: (versionId: string) => void
  onBackToMain: () => void
}

const VersionHistoryComponent: React.FC<VersionHistoryProps> = ({ onVersionSelect, onBackToMain }) => {
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <button
          onClick={onBackToMain}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documentation
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Version History & Updates</h1>
        <p className="text-xl text-gray-600">
          Complete changelog and development timeline
        </p>
      </div>

      {/* Current Version Highlight */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex items-center mb-3">
          <Tag className="h-6 w-6 text-blue-600 mr-3" />
          <span className="text-2xl font-bold text-gray-900">Current Version: {getVersionDisplay()}</span>
          <span className="ml-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">LATEST</span>
        </div>
        <p className="text-gray-700">
          Welcome to Shopsynk {getVersionDisplay()} - {VERSION_NAME}! This version introduces 
          enhanced mobile navigation, improved user experience, and comprehensive documentation.
        </p>
      </div>

      {/* Version Cards Grid */}
      <div className="grid gap-6">
        {versionHistory.map((version) => {
          const getVersionColor = (color: string) => {
            const colors = {
              purple: 'bg-purple-500',
              blue: 'bg-blue-500',
              orange: 'bg-orange-500',
              yellow: 'bg-yellow-500',
              green: 'bg-green-500'
            }
            return colors[color as keyof typeof colors] || 'bg-gray-500'
          }

          const getBorderColor = (color: string) => {
            const colors = {
              purple: 'border-purple-200 hover:border-purple-300',
              blue: 'border-blue-200 hover:border-blue-300',
              orange: 'border-orange-200 hover:border-orange-300',
              yellow: 'border-yellow-200 hover:border-yellow-300',
              green: 'border-green-200 hover:border-green-300'
            }
            return colors[color as keyof typeof colors] || 'border-gray-200 hover:border-gray-300'
          }

          return (
            <div
              key={version.id}
              onClick={() => onVersionSelect(version.id)}
              className={`
                bg-white border-2 ${getBorderColor(version.color)} rounded-xl p-6 
                cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-105
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`${getVersionColor(version.color)} text-white text-sm font-semibold px-3 py-1 rounded-full mr-3`}>
                    v{version.version}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{version.name}</h3>
                    <p className="text-sm text-gray-500">{version.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {version.current && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">CURRENT</span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    version.type === 'major' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {version.type.toUpperCase()}
                  </span>
                  {version.breaking && (
                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">BREAKING</span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 mb-4">{version.description}</p>

              <div className="space-y-3">
                {version.features.slice(0, 2).map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <feature.icon className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{feature.category}</h4>
                      <p className="text-xs text-gray-600">{feature.items.length} updates</p>
                    </div>
                  </div>
                ))}
                {version.features.length > 2 && (
                  <div className="text-sm text-blue-600 font-medium">
                    +{version.features.length - 2} more categories
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center text-blue-600 font-semibold">
                <span>View Details</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Version Detail Component
const VersionDetailComponent: React.FC<{ versionId: string; onBack: () => void }> = ({ versionId, onBack }) => {
  const version = versionHistory.find(v => v.id === versionId)
  
  if (!version) {
    return (
      <div className="text-center py-12">
        <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Version History
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Version Not Found</h2>
        <p className="text-gray-600">The requested version could not be found.</p>
      </div>
    )
  }

  const getVersionColor = (color: string) => {
    const colors = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Version History
        </button>
        
        <div className="flex items-center mb-4">
          <div className={`${getVersionColor(version.color)} text-white text-lg font-bold px-4 py-2 rounded-full mr-4`}>
            v{version.version}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{version.name}</h1>
            <p className="text-lg text-gray-600">{version.date}</p>
          </div>
          {version.current && (
            <span className="ml-4 bg-green-500 text-white text-sm px-3 py-1 rounded-full">CURRENT</span>
          )}
        </div>
        
        <p className="text-xl text-gray-700 mb-6">{version.description}</p>
        
        <div className="flex items-center space-x-4">
          <span className={`text-sm px-3 py-1 rounded-full ${
            version.type === 'major' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {version.type.toUpperCase()} RELEASE
          </span>
          {version.breaking && (
            <span className="bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full">BREAKING CHANGES</span>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What's New in This Version</h2>
        
        {version.features.map((feature, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <feature.icon className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">{feature.category}</h3>
            </div>
            <ul className="space-y-2">
              {feature.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Impact Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
          <Target className="h-6 w-6 text-blue-600 mr-3" />
          Impact & Benefits
        </h3>
        <p className="text-gray-700">{version.impact}</p>
      </div>

      {/* Migration Guide (if breaking changes) */}
      {version.breaking && version.migration.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-orange-900 mb-3 flex items-center">
            <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
            Migration Guide
          </h3>
          <ul className="space-y-2">
            {version.migration.map((step, index) => (
              <li key={index} className="flex items-start">
                <ArrowRight className="h-5 w-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-orange-800">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const documentationCards = [
    {
      id: 'overview',
      title: 'Getting Started',
      description: 'Learn the basics and get started with Shopsynk',
      icon: Book,
      color: 'blue',
      topics: ['Introduction', 'Key Features', 'System Requirements', 'Quick Setup']
    },
    {
      id: 'user-guide',
      title: 'User Guide',
      description: 'Complete step-by-step instructions for all features',
      icon: FileText,
      color: 'green',
      topics: ['Dashboard', 'Suppliers', 'Transactions', 'Reports', 'Data Management']
    },
    {
      id: 'mobile-guide',
      title: 'Mobile Experience',
      description: 'Using Shopsynk on mobile devices and PWA features',
      icon: Smartphone,
      color: 'purple',
      topics: ['Mobile Navigation', 'PWA Installation', 'Offline Features', 'Touch Gestures']
    },
    {
      id: 'rules',
      title: 'Policies & Rules',
      description: 'Terms of service, privacy policy, and usage guidelines',
      icon: Shield,
      color: 'red',
      topics: ['Privacy Policy', 'Terms of Service', 'Usage Guidelines', 'Data Security']
    },
    {
      id: 'contribute',
      title: 'Developer Guide',
      description: 'Contribute to the project and technical documentation',
      icon: Code,
      color: 'indigo',
      topics: ['Setup Environment', 'Code Standards', 'Pull Requests', 'API Reference']
    },
    {
      id: 'updates',
      title: 'Version History',
      description: 'Complete changelog and update history',
      icon: Clock,
      color: 'orange',
      topics: ['Recent Updates', 'Version Timeline', 'Breaking Changes', 'Migration Guide']
    },
    {
      id: 'about',
      title: 'About & Support',
      description: 'Learn about the developer and get support',
      icon: User,
      color: 'teal',
      topics: ['Developer Info', 'Contact Support', 'Community', 'Feedback']
    }
  ]

  const getColorClasses = (color: string, variant: 'light' | 'dark' | 'border' | 'hover' = 'light') => {
    const colorMap = {
      blue: { 
        light: 'bg-blue-50 text-blue-700', 
        dark: 'bg-blue-600 text-white', 
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100 hover:border-blue-300'
      },
      green: { 
        light: 'bg-green-50 text-green-700', 
        dark: 'bg-green-600 text-white', 
        border: 'border-green-200',
        hover: 'hover:bg-green-100 hover:border-green-300'
      },
      purple: { 
        light: 'bg-purple-50 text-purple-700', 
        dark: 'bg-purple-600 text-white', 
        border: 'border-purple-200',
        hover: 'hover:bg-purple-100 hover:border-purple-300'
      },
      red: { 
        light: 'bg-red-50 text-red-700', 
        dark: 'bg-red-600 text-white', 
        border: 'border-red-200',
        hover: 'hover:bg-red-100 hover:border-red-300'
      },
      indigo: { 
        light: 'bg-indigo-50 text-indigo-700', 
        dark: 'bg-indigo-600 text-white', 
        border: 'border-indigo-200',
        hover: 'hover:bg-indigo-100 hover:border-indigo-300'
      },
      orange: { 
        light: 'bg-orange-50 text-orange-700', 
        dark: 'bg-orange-600 text-white', 
        border: 'border-orange-200',
        hover: 'hover:bg-orange-100 hover:border-orange-300'
      },
      teal: { 
        light: 'bg-teal-50 text-teal-700', 
        dark: 'bg-teal-600 text-white', 
        border: 'border-teal-200',
        hover: 'hover:bg-teal-100 hover:border-teal-300'
      }
    }
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.blue[variant]
  }

  // Enhanced content sections with detailed information
  const getSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="mb-8">
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documentation
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Getting Started with Shopsynk</h1>
              <p className="text-xl text-gray-600">
                Welcome to Shopsynk - your comprehensive supplier management solution
              </p>
            </div>

            <div className="grid gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Target className="h-8 w-8 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">What is Shopsynk?</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Shopsynk is a modern, comprehensive supplier dues management system designed to help 
                  businesses efficiently track, manage, and maintain their supplier relationships and 
                  financial obligations. Built with cutting-edge web technologies, it offers a seamless 
                  experience across all devices.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">🎯 Purpose</h3>
                    <p className="text-sm text-blue-800">
                      Streamline supplier relationship management and financial tracking
                    </p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">⚡ Performance</h3>
                    <p className="text-sm text-blue-800">
                      Fast, responsive PWA with offline capabilities
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="h-6 w-6 text-yellow-500 mr-3" />
                  Key Features
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon: Layers, title: 'Supplier Management', desc: 'Complete supplier profiles and contact management' },
                    { icon: TrendingUp, title: 'Transaction Tracking', desc: 'Record and monitor all financial transactions' },
                    { icon: BarChart3, title: 'Advanced Reports', desc: 'Comprehensive analytics and reporting tools' },
                    { icon: Database, title: 'Data Backup', desc: 'Secure cloud backup and data export options' },
                    { icon: Smartphone, title: 'Mobile PWA', desc: 'Full mobile experience with app-like features' },
                    { icon: Settings, title: 'Customizable', desc: 'Flexible settings and personalization options' }
                  ].map((feature, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <feature.icon className="h-8 w-8 text-blue-600 mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  System Requirements
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-green-900 mb-3">Minimum Requirements</h3>
                    <ul className="space-y-2 text-green-800">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Internet connection for sync and backup
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        JavaScript enabled
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Local storage support (5MB+)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-3">Recommended Setup</h3>
                    <ul className="space-y-2 text-green-800">
                      <li className="flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        Desktop/laptop for data entry
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        Mobile device for PWA installation
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        Stable internet for real-time sync
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        Regular backup schedule
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Play className="h-6 w-6 text-purple-600 mr-3" />
                  Quick Setup Guide
                </h2>
                <div className="space-y-4">
                  {[
                    { step: 1, title: 'Create Account', desc: 'Sign up with your email and create a secure password' },
                    { step: 2, title: 'Complete Profile', desc: 'Fill in your business information and preferences' },
                    { step: 3, title: 'Add First Supplier', desc: 'Create your first supplier profile with contact details' },
                    { step: 4, title: 'Record Transaction', desc: 'Add your first transaction to get familiar with the system' },
                    { step: 5, title: 'Explore Features', desc: 'Browse reports, settings, and advanced features' }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start space-x-4 bg-white rounded-lg p-4">
                      <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'mobile-guide':
        return (
          <div className="space-y-8">
            <div className="mb-8">
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documentation
              </button>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Mobile Experience Guide</h1>
              <p className="text-xl text-gray-600">
                Get the most out of Shopsynk on mobile devices
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <Smartphone className="h-8 w-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Person Money Tracking v1.3</h2>
                <span className="ml-3 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
              </div>
              <p className="text-gray-700 mb-4">
                Version 1.3 introduces comprehensive person-to-person money tracking alongside supplier management. Track money given to persons ("Gives") and received from persons ("Takes") with complete transaction history, outstanding balance management, and integrated reporting. 
                replacing the traditional hamburger menu with a modern bottom navigation bar 
                for easier thumb-friendly access.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">🎯 Bottom Navigation</h3>
                  <p className="text-sm text-purple-800">
                    Quick access to Dashboard, Suppliers, Transactions, and Reports
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">📱 Touch Optimized</h3>
                  <p className="text-sm text-purple-800">
                    Large touch targets and gesture-friendly interface design
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Download className="h-6 w-6 text-blue-600 mr-3" />
                  PWA Installation
                </h2>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold mb-2">📱 iOS Installation</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                      <li>Open Shopsynk in Safari browser</li>
                      <li>Tap the Share button (square with arrow)</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Customize the name and tap "Add"</li>
                    </ol>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🤖 Android Installation</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                      <li>Open Shopsynk in Chrome browser</li>
                      <li>Tap the menu (three dots) in the top right</li>
                      <li>Select "Add to Home screen"</li>
                      <li>Confirm the installation</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Zap className="h-6 w-6 text-green-600 mr-3" />
                  Offline Features
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-green-900 mb-3">Available Offline</h3>
                    <ul className="space-y-2 text-green-800">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        View existing suppliers and transactions
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Access cached reports and data
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Browse documentation
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-3">Requires Internet</h3>
                    <ul className="space-y-2 text-green-800">
                      <li className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Adding new data
                      </li>
                      <li className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Real-time sync
                      </li>
                      <li className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Data backup
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Target className="h-6 w-6 text-orange-600 mr-3" />
                  Mobile Best Practices
                </h2>
                <div className="space-y-4">
                  {[
                    { title: 'Portrait Mode', tip: 'Use portrait orientation for optimal experience' },
                    { title: 'Touch Gestures', tip: 'Swipe left/right to navigate between sections' },
                    { title: 'Quick Actions', tip: 'Long press on items for context menus' },
                    { title: 'Voice Input', tip: 'Use voice input for faster data entry' },
                    { title: 'Auto-Save', tip: 'Data is automatically saved as you type' }
                  ].map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 flex items-start space-x-3">
                      <Info className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-900">{item.title}</h3>
                        <p className="text-sm text-orange-800">{item.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'updates':
        return <VersionHistoryComponent 
          onVersionSelect={(versionId) => setActiveSection(`version-detail-${versionId}`)}
          onBackToMain={() => setActiveSection(null)}
        />

      // Default case for other sections and version details
      default:
        if (activeSection && activeSection.startsWith('version-detail-')) {
          const versionId = activeSection.split('-')[2]
          return <VersionDetailComponent 
            versionId={versionId} 
            onBack={() => setActiveSection('updates')} 
          />
        }
        
        return (
          <div className="text-center py-12">
            <div className="mb-8">
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documentation
              </button>
            </div>
            <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-600">This section is under development.</p>
          </div>
        )
    }
  }

  // Main card overview when no section is selected
  if (!activeSection) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Book className="h-12 w-12 text-blue-600 mr-4" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Shopsynk Documentation</h1>
                <p className="text-xl text-gray-600 mt-2">
                  Complete guide for Shopsynk {getVersionDisplay()} - {VERSION_NAME}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center mb-3">
                <Tag className="h-6 w-6 text-blue-600 mr-3" />
                <span className="text-2xl font-bold text-gray-900">Version {getVersionDisplay()}</span>
                <span className="ml-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">LATEST</span>
              </div>
              <p className="text-gray-700 max-w-3xl mx-auto">
                Welcome to the comprehensive documentation for Shopsynk, your modern supplier 
                management system. This version introduces enhanced mobile navigation, improved 
                user experience, and complete documentation coverage.
              </p>
            </div>
          </div>

          {/* Documentation Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {documentationCards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.id}
                  onClick={() => setActiveSection(card.id)}
                  className={`
                    bg-white border-2 ${getColorClasses(card.color, 'border')} rounded-xl p-6 
                    cursor-pointer transition-all duration-200 transform hover:scale-105 
                    hover:shadow-lg ${getColorClasses(card.color, 'hover')}
                  `}
                >
                  <div className="flex items-center mb-4">
                    <div className={`${getColorClasses(card.color, 'dark')} rounded-lg p-3 mr-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{card.description}</p>
                  <div className="space-y-2">
                    {card.topics.map((topic, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></div>
                        {topic}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center text-blue-600 font-semibold">
                    <span>Explore</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Documentation Overview
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">7</div>
                <div className="text-sm text-gray-600">Documentation Sections</div>
              </div>
              <div className="text-center">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">25+</div>
                <div className="text-sm text-gray-600">Topics Covered</div>
              </div>
              <div className="text-center">
                <Smartphone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">UI+</div>
                <div className="text-sm text-gray-600">UI Improvements</div>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{getVersionDisplay()}</div>
                <div className="text-sm text-gray-600">Current Version</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Individual section view
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {getSectionContent(activeSection)}
      </div>
    </div>
  )
}

export default Documentation
