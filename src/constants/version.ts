// Application version information
export const APP_VERSION = '1.3'
export const VERSION_NAME = 'Person Money Tracking'
export const RELEASE_DATE = 'September 23, 2025'

// Version display formats
export const getVersionDisplay = () => `v${APP_VERSION}`
export const getFullVersionInfo = () => `${getVersionDisplay()} - ${VERSION_NAME}`

// Application metadata
export const APP_META = {
  name: 'Shopsynk',
  fullName: `Shopsynk ${getVersionDisplay()}`,
  description: 'Complete supplier dues management system for businesses',
  author: 'Yash Patil',
  website: 'https://yashpatil.tech',
  repository: 'https://github.com/PATILYASHH/Shopsynk-2.0'
} as const
