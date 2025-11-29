import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Briefcase, User, Check, ArrowRight } from 'lucide-react'

interface ModeSelectionProps {
  userId: string
  onComplete: (mode: 'business' | 'personal') => void
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ userId, onComplete }) => {
  const [selectedMode, setSelectedMode] = useState<'business' | 'personal' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedMode) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('user_preferences')
        .insert([{ user_id: userId, mode: selectedMode }])

      if (error) throw error

      onComplete(selectedMode)
    } catch (error) {
      console.error('Error saving mode preference:', error)
      alert('Failed to save preference. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Shopsynk!</h1>
          <p className="text-gray-600">Let's personalize your experience. How will you be using Shopsynk?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Business Mode */}
          <button
            onClick={() => setSelectedMode('business')}
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
              selectedMode === 'business'
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            {selectedMode === 'business' && (
              <div className="absolute top-4 right-4">
                <div className="bg-blue-500 rounded-full p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-lg ${
                selectedMode === 'business' ? 'bg-blue-500' : 'bg-blue-100'
              }`}>
                <Briefcase className={`h-6 w-6 ${
                  selectedMode === 'business' ? 'text-white' : 'text-blue-600'
                }`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Business Mode</h3>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Perfect for managing business finances, supplier dues, and team transactions.
            </p>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>Supplier Management</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>Person Money Tracking</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>Personal Spends</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>Business Reports</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>All Features Enabled</span>
              </div>
            </div>
          </button>

          {/* Personal Mode */}
          <button
            onClick={() => setSelectedMode('personal')}
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left ${
              selectedMode === 'personal'
                ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
            }`}
          >
            {selectedMode === 'personal' && (
              <div className="absolute top-4 right-4">
                <div className="bg-purple-500 rounded-full p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-lg ${
                selectedMode === 'personal' ? 'bg-purple-500' : 'bg-purple-100'
              }`}>
                <User className={`h-6 w-6 ${
                  selectedMode === 'personal' ? 'text-white' : 'text-purple-600'
                }`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Personal Mode</h3>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Ideal for personal finance management without business complexity.
            </p>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>Personal Spends Tracking</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>Person Money Tracking</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>Expense Reports</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                <span>Simplified Interface</span>
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <span className="mr-2">✕</span>
                <span>No Supplier Management</span>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You can change this setting anytime from your Profile → Settings page.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedMode || isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <span>Saving...</span>
          ) : (
            <>
              <span>Continue to Shopsynk</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ModeSelection
