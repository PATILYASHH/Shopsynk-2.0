import React, { useState } from 'react'
import { VERSION_NAME, RELEASE_DATE, getVersionDisplay } from '../constants/version'
import { 
  Book, 
  Github, 
  Globe, 
  User, 
  FileText, 
  Shield, 
  Code, 
  ExternalLink,
  Clock,
  Tag
} from 'lucide-react'

const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: Book,
      content: (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Shopsynk</h2>
            <p className="text-gray-700 mb-4">
              Shopsynk is a comprehensive supplier dues management system designed to help businesses 
              efficiently track, manage, and maintain their supplier relationships and financial obligations.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Key Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Supplier management and contact information</li>
                <li>Transaction tracking and payment management</li>
                <li>Comprehensive reporting and analytics</li>
                <li>Data backup and storage solutions</li>
                <li>PWA support for mobile and desktop</li>
                <li>Push notifications for important updates</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'usage',
      title: 'How to Use',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Guide</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">1. Getting Started</h3>
              <p className="text-gray-700">
                Sign up for an account and complete your profile setup. Once logged in, 
                you'll have access to the dashboard where you can manage all aspects of your supplier relationships.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">2. Managing Suppliers</h3>
              <p className="text-gray-700">
                Navigate to the Suppliers page to add new suppliers, update contact information, 
                and track outstanding dues. You can also set up payment reminders and view supplier history.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">3. Recording Transactions</h3>
              <p className="text-gray-700">
                Use the Transactions page to record new purchases, payments, and adjustments. 
                The system automatically updates supplier balances and generates relevant reports.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">4. Generating Reports</h3>
              <p className="text-gray-700">
                Access comprehensive reports from the Reports page. Generate supplier statements, 
                payment summaries, and analytical insights to make informed business decisions.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'rules',
      title: 'Rules & Regulations',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms of Service & Privacy Policy</h2>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Data Privacy & Security</h3>
              <ul className="list-disc list-inside space-y-1 text-red-800">
                <li>All data is encrypted and stored securely using Supabase</li>
                <li>We do not share your business data with third parties</li>
                <li>Regular backups are maintained for data protection</li>
                <li>You retain full ownership of your data</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Usage Guidelines</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>Use the system only for legitimate business purposes</li>
                <li>Maintain accurate and up-to-date supplier information</li>
                <li>Do not attempt to breach security measures</li>
                <li>Report any bugs or security issues immediately</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">User Responsibilities</h3>
              <ul className="list-disc list-inside space-y-1 text-green-800">
                <li>Keep your login credentials secure</li>
                <li>Regularly back up important data</li>
                <li>Verify transaction details before recording</li>
                <li>Use appropriate data categorization and tags</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'contribute',
      title: 'Contribution Guide',
      icon: Code,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contributing to Shopsynk</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <Github className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-900">GitHub Repository</span>
            </div>
            <p className="text-blue-800">
              Visit our GitHub repository to contribute to the project, report issues, or suggest new features.
            </p>
            <a 
              href="https://github.com/PATILYASHH/Shopsynk-2.0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800"
            >
              View Repository <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">How to Contribute</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Fork the repository on GitHub</li>
                <li>Create a new branch for your feature or bug fix</li>
                <li>Make your changes with clear, descriptive commit messages</li>
                <li>Write or update tests as necessary</li>
                <li>Submit a pull request with a detailed description</li>
              </ol>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Development Setup</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>{`# Clone the repository
git clone https://github.com/PATILYASHH/Shopsynk-2.0.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build`}</code>
              </pre>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Code Style Guidelines</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Follow TypeScript best practices</li>
                <li>Use Tailwind CSS for styling</li>
                <li>Write meaningful component and variable names</li>
                <li>Add proper TypeScript types and interfaces</li>
                <li>Include JSDoc comments for complex functions</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'about',
      title: 'About Developer',
      icon: User,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Yash Patil</h2>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Yash Patil</h3>
                <p className="text-gray-600">Full Stack Developer & Entrepreneur</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">
              I'm a passionate full-stack developer with expertise in modern web technologies 
              including React, TypeScript, Node.js, and cloud services. I specialize in building 
              scalable business applications that solve real-world problems.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-gray-700">Portfolio: </span>
                <a 
                  href="https://yashpatil.tech" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-2 flex items-center"
                >
                  yashpatil.tech <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
              
              <div className="flex items-center">
                <Github className="h-5 w-5 text-gray-600 mr-3" />
                <span className="text-gray-700">GitHub: </span>
                <a 
                  href="https://github.com/PATILYASHH" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-2 flex items-center"
                >
                  @PATILYASHH <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Technical Expertise</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>React & TypeScript</li>
                <li>Node.js & Express</li>
                <li>PostgreSQL & Supabase</li>
                <li>Tailwind CSS</li>
                <li>PWA Development</li>
                <li>Cloud Services (Netlify, Vercel)</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Contact</h4>
              <p className="text-gray-700 text-sm mb-2">
                Feel free to reach out for collaboration, questions, or just to say hello!
              </p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">Open to freelance projects</p>
                <p className="text-gray-600">Available for consulting</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'updates',
      title: 'Update Log',
      icon: Clock,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Version History & Updates</h2>
          
          <div className="space-y-6">
            {/* Current Version Badge */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Tag className="h-6 w-6 text-blue-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">Current Version: {getVersionDisplay()}</span>
                <span className="ml-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">LATEST</span>
              </div>
              <p className="text-gray-700">
                Welcome to Shopsynk {getVersionDisplay()}! This is the first stable release of our comprehensive 
                supplier management system with full documentation and enhanced features.
              </p>
            </div>

            {/* Update Entries */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-full mr-3">
                      {getVersionDisplay()}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{VERSION_NAME}</h3>
                  </div>
                  <span className="text-sm text-gray-500">{RELEASE_DATE}</span>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-green-50 border-l-4 border-green-400 p-3">
                    <h4 className="font-semibold text-green-800 mb-2">✨ New Features</h4>
                    <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                      <li>Added comprehensive documentation system with interactive navigation</li>
                      <li>Implemented transaction edit and delete functionality</li>
                      <li>Added version display in sidebar navigation</li>
                      <li>Created update log system for version tracking</li>
                      <li>Enhanced user experience with dropdown menus and confirmation dialogs</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                    <h4 className="font-semibold text-blue-800 mb-2">🔧 Improvements</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                      <li>Enhanced transaction form to support both creating and editing</li>
                      <li>Improved mobile responsiveness for documentation pages</li>
                      <li>Added click-outside handlers for better UX</li>
                      <li>Optimized SEO with comprehensive meta keywords</li>
                      <li>Added professional developer profile and contribution guidelines</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <h4 className="font-semibold text-yellow-800 mb-2">🐛 Bug Fixes</h4>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                      <li>Fixed missing edit/delete functionality in transactions</li>
                      <li>Resolved form state management issues when switching between add/edit modes</li>
                      <li>Fixed dropdown positioning and z-index conflicts</li>
                      <li>Improved error handling for transaction operations</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 border-l-4 border-gray-400 p-3">
                    <h4 className="font-semibold text-gray-800 mb-2">📚 Documentation</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      <li>Added complete user guide with step-by-step instructions</li>
                      <li>Created comprehensive contribution guidelines</li>
                      <li>Documented rules, regulations, and privacy policies</li>
                      <li>Added developer information and portfolio links</li>
                      <li>Implemented version history tracking system</li>
                    </ul>
                  </div>

                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
                    <h4 className="font-semibold text-purple-800 mb-1">🎯 Impact</h4>
                    <p className="text-purple-700 text-sm">
                      This update significantly improves user experience by adding essential 
                      CRUD operations for transactions and providing comprehensive documentation 
                      for new users and contributors. The addition of version tracking ensures 
                      transparency in development progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Update Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">📝 How to Document Future Updates</h3>
              <div className="text-amber-800 text-sm space-y-2">
                <p><strong>For Developers:</strong> When releasing a new version, add a new entry above this section with:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Version number and update name</li>
                  <li>Release date</li>
                  <li>Categorized changes (Features, Improvements, Bug Fixes, Documentation)</li>
                  <li>Impact description explaining the benefits to users</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Book className="h-8 w-8 mr-3 text-blue-600" />
            Documentation
          </h1>
          <p className="text-gray-600 mt-2">
            Complete guide to using Shopsynk, contribution guidelines, and project information
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:sticky lg:top-8">
              <h2 className="font-semibold text-gray-900 mb-4">Contents</h2>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <span className="text-sm">{section.title}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {sections.find(section => section.id === activeSection)?.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Documentation
