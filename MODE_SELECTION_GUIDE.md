# Business vs Personal Mode - User Guide

## Overview
Shopsynk now offers two primary modes to tailor the application to your specific needs:

1. **Business Mode** - Full-featured for business management
2. **Personal Mode** - Simplified for personal finance tracking

## Mode Selection

### First Time Setup
When you create a new account or log in for the first time, you'll be presented with a mode selection screen. This is a one-time setup that personalizes your Shopsynk experience.

### Mode Selection Screen
![Mode Selection](docs/mode-selection.png)

You'll see two options:

#### 🏢 Business Mode
**Best for:**
- Small business owners
- Shop owners managing supplier dues
- Teams tracking business expenses
- Anyone needing supplier management

**Features Available:**
- ✅ **Supplier Management** - Track all your suppliers and their dues
- ✅ **Person Money Tracking** - Manage person-to-person transactions
- ✅ **Personal Spends** - Track your personal expenses
- ✅ **Business Reports** - Comprehensive financial reporting
- ✅ **All Features Enabled** - Access to every Shopsynk feature

#### 👤 Personal Mode
**Best for:**
- Individual users managing personal finances
- Users who don't deal with suppliers
- Simplified expense tracking needs
- Personal money management

**Features Available:**
- ✅ **Person Money Tracking** - Track money you give/receive from people
- ✅ **Personal Spends** - Track all your daily expenses
- ✅ **Expense Reports** - Personal financial insights
- ✅ **Simplified Interface** - Clean, focused experience
- ❌ **No Supplier Management** - Supplier features hidden

## Changing Your Mode

You can change your mode anytime from the **Profile** page:

### Steps to Change Mode:

1. Navigate to **Profile** (click your profile icon or name)
2. Scroll to the **"Account Mode"** section
3. You'll see two cards showing Business and Personal modes
4. Click on the mode you want to switch to
5. Your current mode will be highlighted with a blue/purple background
6. The change takes effect immediately
7. The app will reload to apply the new navigation structure

### Mode Change UI
![Mode Change in Profile](docs/mode-change-profile.png)

## What Happens When You Change Mode?

### Switching to Personal Mode:
- ✅ Supplier menu items are removed from navigation
- ✅ Supplier-related features are hidden
- ✅ Dashboard focuses on personal finance
- ✅ Simplified navigation menu
- ✅ **Your data is preserved** - nothing is deleted

### Switching to Business Mode:
- ✅ Supplier menu items reappear
- ✅ All business features become available
- ✅ Full dashboard with supplier stats
- ✅ Complete navigation menu
- ✅ Access to all previously created data

## Important Notes

### Data Preservation
- 🔒 **Your data is NEVER deleted** when switching modes
- 🔒 Suppliers, transactions, and spends remain in the database
- 🔒 Switching back to Business mode restores full access
- 🔒 Only the UI changes, not your data

### Navigation Changes

**Business Mode Navigation:**
- Dashboard
- Suppliers (visible)
- Persons
- Spends
- Transactions
- Reports
- Data Storage
- Documentation
- Profile

**Personal Mode Navigation:**
- Dashboard
- Persons
- Spends
- Transactions (filtered to persons/spends only)
- Reports
- Data Storage
- Documentation
- Profile

### Feature Availability Matrix

| Feature | Business Mode | Personal Mode |
|---------|--------------|---------------|
| Supplier Management | ✅ Yes | ❌ No |
| Person Money Tracking | ✅ Yes | ✅ Yes |
| Personal Spends | ✅ Yes | ✅ Yes |
| Supplier Transactions | ✅ Yes | ❌ No |
| Person Transactions | ✅ Yes | ✅ Yes |
| Supplier Reports | ✅ Yes | ❌ No |
| Personal Reports | ✅ Yes | ✅ Yes |
| Dashboard Supplier Stats | ✅ Yes | ❌ No |
| AI Features | ✅ Yes | ✅ Yes |

## Use Cases

### When to Use Business Mode:

**Scenario 1: Small Shop Owner**
- You buy inventory from multiple suppliers
- Need to track who you owe money to
- Manage payment deadlines
- Generate supplier reports for accounting

**Scenario 2: Service Business**
- Track vendor payments
- Manage contractor dues
- Monitor business expenses alongside personal
- Need comprehensive financial reporting

**Scenario 3: Freelancer with Clients**
- Track money owed by clients (use Persons)
- Track expenses paid to service providers (use Suppliers)
- Separate business vs personal spends
- Complete financial overview

### When to Use Personal Mode:

**Scenario 1: Personal Finance Tracking**
- Track daily expenses (groceries, transport, entertainment)
- Monitor money lent/borrowed from friends/family
- Simple expense categorization
- Clean, distraction-free interface

**Scenario 2: Student/Individual**
- No business dealings with suppliers
- Focus on personal budgeting
- Track money with roommates/friends
- Simplified expense management

**Scenario 3: Household Finance**
- Family expense tracking
- Money shared between family members
- Monthly budget monitoring
- No vendor management needed

## Tips for Mode Selection

### Choose Business Mode if:
- ❓ You run any kind of business (even small)
- ❓ You regularly deal with suppliers/vendors
- ❓ You need to track business dues
- ❓ You want access to all features

### Choose Personal Mode if:
- ❓ You only track personal expenses
- ❓ You don't have any suppliers
- ❓ You prefer a simpler interface
- ❓ You're using it for household/personal finance only

### Still Not Sure?
- 💡 Start with **Business Mode** - you get all features
- 💡 You can always switch to Personal Mode later
- 💡 Try both modes and see which feels right
- 💡 Your data stays safe regardless of mode

## Technical Details

### Database
- Mode preference is stored in `user_preferences` table
- Each user has one mode setting
- Mode can be updated anytime
- Changes take effect immediately

### Performance
- No impact on app performance
- Mode only affects UI visibility
- Data queries remain unchanged
- Fast mode switching

### Security
- Mode preference is user-specific
- Secured with Row Level Security (RLS)
- Each user can only change their own mode
- No data exposure between modes

## FAQ

**Q: Can I switch back and forth between modes?**  
A: Yes, absolutely! Change as many times as you want from Profile → Account Mode.

**Q: Will I lose my supplier data in Personal Mode?**  
A: No! Data is preserved. It's just hidden. Switch back to Business Mode to access it again.

**Q: Can I change mode on mobile?**  
A: Yes, the mode change feature works on all devices.

**Q: What happens to transactions linked to suppliers in Personal Mode?**  
A: They remain in the database but won't appear in the UI. They'll be visible again in Business Mode.

**Q: Can I use Business Mode for personal finance too?**  
A: Yes! Business Mode includes all Personal Mode features plus supplier management.

**Q: Is there a limit to how many times I can change mode?**  
A: No limits. Change as often as you need.

**Q: Does mode affect AI features?**  
A: No, AI features work the same in both modes.

---

**Version**: 1.4.5  
**Last Updated**: November 2025  
**Developed by**: Yash Patil
