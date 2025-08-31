import React, { useState } from 'react'
import { X, Plus, DollarSign } from 'lucide-react'
import { Supplier } from '../lib/supabase'
import { BusinessOwner } from '../lib/businessOwners'

interface SimpleTransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  suppliers: Supplier[]
  businessOwners: BusinessOwner[]
}

const SimpleTransactionForm: React.FC<SimpleTransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  businessOwners
}) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    type: 'new_purchase',
    amount: '',
    description: '',
    owner_id: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      supplier_id: '',
      type: 'new_purchase', 
      amount: '',
      description: '',
      owner_id: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Transaction</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Add description..."
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SimpleTransactionForm
