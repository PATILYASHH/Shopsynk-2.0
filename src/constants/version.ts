// Application version information
export const APP_VERSION = '1.4.4'
export const VERSION_NAME = 'bug fixed'
export const RELEASE_DATE = 'October 22, 2025'

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
