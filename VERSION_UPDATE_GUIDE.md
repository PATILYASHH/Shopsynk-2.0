# Version Update Guide

This guide explains how to update the version information across the Shopsynk application.

## Current Version: 1.3 - Person Money Tracking

## Files to Update When Releasing a New Version:on Update Guide

This guide explains how to update the version information across the Shopsynk application.

## Current Version: 1.3

## Files to Update When Releasing a New Version:

### 1. **Version Constants** (`src/constants/version.ts`)
- Update `APP_VERSION`
- Update `VERSION_NAME` 
- Update `RELEASE_DATE`

### 2. **Package Configuration** (`package.json`)
- Update the `version` field

### 3. **PWA Manifest** (`public/manifest.json`)  
- Update `name` field
- Update `description` field
- Update `version` field

### 4. **HTML Meta Tags** (`index.html`)
- Update page title
- Update meta description
- Update Open Graph tags
- Update Twitter card tags
- Update keywords

### 5. **Documentation** (`src/pages/Documentation.tsx`)
- Add new update entry in the "Update Log" section
- Include:
  - Version number and update name
  - Release date  
  - New Features (✨)
  - Improvements (🔧)
  - Bug Fixes (🐛)
  - Documentation changes (📚)
  - Impact description (🎯)

## Update Process:

1. **Update version constants** in `src/constants/version.ts`
2. **Update package.json** version
3. **Update manifest.json** with new version info
4. **Update index.html** meta tags
5. **Add new update log entry** in Documentation
6. **Test build**: `npm run build`
7. **Test development**: `npm run dev`
8. **Commit and deploy** changes

## Automatic Updates:

The following components automatically use the version constants:
- Sidebar navigation (shows current version)
- Documentation page (current version display)
- Update log entries (version numbers)

This ensures version consistency across the entire application.
