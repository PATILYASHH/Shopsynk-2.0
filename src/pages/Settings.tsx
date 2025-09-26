import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Users, DollarSign, User, Home, FileText, HardDrive, Book, GripVertical } from 'lucide-react'

interface NavigationItem {
  id: string
  name: string
  path: string
  iconName: string
  enabled: boolean
}

const Settings: React.FC = () => {
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

  const [menuOrder, setMenuOrder] = useState<NavigationItem[]>([
    { id: 'dashboard', name: 'Dashboard', path: '/', iconName: 'Home', enabled: true },
    { id: 'suppliers', name: 'Suppliers', path: '/suppliers', iconName: 'Users', enabled: true },
    { id: 'spends', name: 'Spends', path: '/spends', iconName: 'DollarSign', enabled: true },
    { id: 'persons', name: 'Persons', path: '/persons', iconName: 'User', enabled: true },
    { id: 'transactions', name: 'Transactions', path: '/transactions', iconName: 'Receipt', enabled: true },
    { id: 'reports', name: 'Reports', path: '/reports', iconName: 'FileText', enabled: true },
    { id: 'more', name: 'More', path: '#', iconName: 'MoreVertical', enabled: true }
  ])

  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  // Function to get icon component by name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Home': return Home
      case 'Users': return Users
      case 'DollarSign': return DollarSign
      case 'User': return User
      case 'FileText': return FileText
      case 'HardDrive': return HardDrive
      case 'Book': return Book
      default: return Home
    }
  }

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('shopsynk_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        if (parsed.features) {
          setFeatureSettings(parsed.features)
          if (parsed.replacements) {
            setReplacementSettings(parsed.replacements)
          }
          // Sync menu order with loaded feature settings
          if (parsed.menuOrder) {
            setMenuOrder(parsed.menuOrder.map((item: NavigationItem) => ({
              ...item,
              enabled: parsed.features[item.id] !== false // Default to true if not specified
            })))
          }
        } else if (parsed.menuOrder) {
          setMenuOrder(parsed.menuOrder)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // Reset to defaults if there's an error
      setFeatureSettings({
        suppliers: true,
        spends: true,
        persons: true
      })
      setMenuOrder([
        { id: 'dashboard', name: 'Dashboard', path: '/', iconName: 'Home', enabled: true },
        { id: 'suppliers', name: 'Suppliers', path: '/suppliers', iconName: 'Users', enabled: true },
        { id: 'spends', name: 'Spends', path: '/spends', iconName: 'DollarSign', enabled: true },
        { id: 'persons', name: 'Persons', path: '/persons', iconName: 'User', enabled: true },
        { id: 'transactions', name: 'Transactions', path: '/transactions', iconName: 'Receipt', enabled: true },
        { id: 'reports', name: 'Reports', path: '/reports', iconName: 'FileText', enabled: true },
        { id: 'more', name: 'More', path: '#', iconName: 'MoreVertical', enabled: true }
      ])
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      features: featureSettings,
      replacements: replacementSettings,
      menuOrder: menuOrder
    }
    localStorage.setItem('shopsynk_settings', JSON.stringify(settings))
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('settingsChanged'))
  }, [featureSettings, replacementSettings, menuOrder])

  const handleFeatureToggle = (feature: keyof typeof featureSettings) => {
    setFeatureSettings(prev => {
      const newSettings = {
        ...prev,
        [feature]: !prev[feature]
      }
      // Update menu order to match the new feature settings
      setMenuOrder(currentMenu => currentMenu.map(item =>
        item.id === feature ? { ...item, enabled: newSettings[feature] } : item
      ))
      return newSettings
    })
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()

    if (!draggedItem || draggedItem === targetId) return

    const draggedIndex = menuOrder.findIndex(item => item.id === draggedItem)
    const targetIndex = menuOrder.findIndex(item => item.id === targetId)

    const newOrder = [...menuOrder]
    const [draggedItemData] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedItemData)

    setMenuOrder(newOrder)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const resetToDefaults = () => {
    setFeatureSettings({
      suppliers: true,
      spends: true,
      persons: true
    })

    setReplacementSettings({
      suppliers: 'reports',
      spends: 'transactions',
      persons: 'data-storage'
    })

    setMenuOrder([
      { id: 'dashboard', name: 'Dashboard', path: '/', iconName: 'Home', enabled: true },
      { id: 'suppliers', name: 'Suppliers', path: '/suppliers', iconName: 'Users', enabled: true },
      { id: 'spends', name: 'Spends', path: '/spends', iconName: 'DollarSign', enabled: true },
      { id: 'persons', name: 'Persons', path: '/persons', iconName: 'User', enabled: true },
      { id: 'transactions', name: 'Transactions', path: '/transactions', iconName: 'Receipt', enabled: true },
      { id: 'reports', name: 'Reports', path: '/reports', iconName: 'FileText', enabled: true },
      { id: 'more', name: 'More', path: '#', iconName: 'MoreVertical', enabled: true }
    ])
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Settings</h2>
        <p className="text-sm text-gray-600 mb-6">Enable or disable features you want to use in the app.</p>

        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Suppliers</p>
                  <p className="text-sm text-gray-600">Manage suppliers and transactions</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={featureSettings.suppliers}
                  onChange={() => handleFeatureToggle('suppliers')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {!featureSettings.suppliers && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replace with:
                </label>
                <select
                  value={replacementSettings.suppliers}
                  onChange={(e) => setReplacementSettings(prev => ({ ...prev, suppliers: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="reports">Reports</option>
                  <option value="transactions">Transactions</option>
                  <option value="data-storage">Data Storage</option>
                  <option value="documentation">Documentation</option>
                </select>
              </div>
            )}
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Spends</p>
                  <p className="text-sm text-gray-600">Track personal expenses</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={featureSettings.spends}
                  onChange={() => handleFeatureToggle('spends')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {!featureSettings.spends && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replace with:
                </label>
                <select
                  value={replacementSettings.spends}
                  onChange={(e) => setReplacementSettings(prev => ({ ...prev, spends: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="transactions">Transactions</option>
                  <option value="reports">Reports</option>
                  <option value="data-storage">Data Storage</option>
                  <option value="documentation">Documentation</option>
                </select>
              </div>
            )}
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Persons</p>
                  <p className="text-sm text-gray-600">Manage persons and transactions</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={featureSettings.persons}
                  onChange={() => handleFeatureToggle('persons')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {!featureSettings.persons && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replace with:
                </label>
                <select
                  value={replacementSettings.persons}
                  onChange={(e) => setReplacementSettings(prev => ({ ...prev, persons: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="data-storage">Data Storage</option>
                  <option value="transactions">Transactions</option>
                  <option value="reports">Reports</option>
                  <option value="documentation">Documentation</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Customization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bottom Menu Customization</h2>
        <p className="text-sm text-gray-600 mb-6">Drag and drop to reorder menu items. Disabled items won't appear in the bottom navigation.</p>

        <div className="space-y-3">
          {menuOrder.map((item) => {
            try {
              const Icon = getIconComponent(item.iconName)
              return (
                <div
                  key={item.id}
                  draggable={item.enabled}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg transition-all ${
                    draggedItem === item.id ? 'opacity-50' : ''
                  } ${!item.enabled ? 'opacity-50 bg-gray-50' : 'bg-white hover:bg-gray-50'} ${
                    item.enabled ? 'cursor-move' : 'cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.enabled && (
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    )}
                    <Icon className={`h-5 w-5 ${item.enabled ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <p className={`font-medium ${item.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {item.name}
                      </p>
                      {!item.enabled && (
                        <p className="text-xs text-gray-400">Disabled</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              )
            } catch (error) {
              console.error('Error rendering menu item:', item, error)
              return (
                <div key={item.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <p className="text-red-600">Error loading menu item: {item.name}</p>
                </div>
              )
            }
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings