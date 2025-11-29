import React, { useState, useEffect } from 'react'
import { X, Plus, DollarSign, Sparkles, Loader2 } from 'lucide-react'
import { Supplier, Transaction } from '../lib/supabase'
import { BusinessOwner } from '../lib/businessOwners'
import { generateTransactionDescription } from '../lib/geminiService'

interface SimpleTransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  suppliers: Supplier[]
  businessOwners: BusinessOwner[]
  editingTransaction?: Transaction | null
}

const SimpleTransactionForm: React.FC<SimpleTransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  businessOwners,
  editingTransaction
}) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    type: 'new_purchase',
    amount: '',
    description: '',
    owner_id: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)

  // Populate form when editing
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        supplier_id: editingTransaction.supplier_id || '',
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        description: editingTransaction.description || '',
        owner_id: editingTransaction.owner_id || ''
      })
    } else {
      setFormData({
        supplier_id: '',
        type: 'new_purchase',
        amount: '',
        description: '',
        owner_id: ''
      })
    }
  }, [editingTransaction, isOpen])

  const handleGenerateDescription = async () => {
    if (!formData.supplier_id || !formData.amount) return
    
    setIsGenerating(true)
    try {
      const supplier = suppliers.find(s => s.id === formData.supplier_id)
      if (supplier) {
        const description = await generateTransactionDescription(
          formData.type === 'new_purchase' ? 'purchase' : 'payment',
          supplier.name,
          parseFloat(formData.amount),
          formData.description
        )
        setFormData({ ...formData, description })
      }
    } catch (error) {
      console.error('Error generating description:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    if (!editingTransaction) {
      setFormData({
        supplier_id: '',
        type: 'new_purchase', 
        amount: '',
        description: '',
        owner_id: ''
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'new_purchase'})}
                className={`p-3 border rounded-lg text-center ${
                  formData.type === 'new_purchase'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Plus className="h-4 w-4 mx-auto mb-1" />
                <span className="text-sm">Purchase</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'pay_due'})}
                className={`p-3 border rounded-lg text-center ${
                  formData.type === 'pay_due'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <DollarSign className="h-4 w-4 mx-auto mb-1" />
                <span className="text-sm">Payment</span>
              </button>
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
              min="0"
              step="0.01"
              placeholder="Enter amount"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.type === 'new_purchase' ? 'Purchased by' : 'Paid by'}
            </label>
            <select
              value={formData.owner_id}
              onChange={(e) => setFormData({...formData, owner_id: e.target.value})}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select person</option>
              {businessOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.owner_name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              {aiEnabled && formData.supplier_id && formData.amount && (
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating}
                  className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>{isGenerating ? 'Generating...' : 'AI Suggest'}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={aiEnabled ? "Add description or click AI Suggest..." : "Add description..."}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {aiEnabled && (
              <p className="mt-1 text-xs text-gray-500">
                💡 Select supplier & amount, then click AI Suggest for smart description
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SimpleTransactionForm
