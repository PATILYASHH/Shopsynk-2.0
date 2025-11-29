# Dashboard Customization Guide - Shopsynk v1.4.6

## Overview
Shopsynk now features a **fully customizable dashboard** that adapts to your needs! Personal mode users get a specialized dashboard with **8 customizable widgets** showing exactly what matters to them.

---

## 🎯 Personal Dashboard Features

### Available Widgets

#### 1️⃣ **This Month Spends** (Medium Widget)
- **What it shows**: Total spending for the current month
- **Trend indicator**: Compares with last month (↑ Higher / ↓ Lower / → Similar)
- **Visual**: Blue gradient card with calendar icon
- **Click action**: None (informational only)

#### 2️⃣ **Today's Spends** (Small Widget)
- **What it shows**: All spending done today
- **Real-time updates**: Instantly reflects new spends
- **Visual**: Green gradient card with receipt icon
- **Click action**: None (informational only)

#### 3️⃣ **Total Spends** (Small Widget)
- **What it shows**: All-time total spending
- **Cumulative**: Sum of every spend ever recorded
- **Visual**: Purple/pink gradient card with dollar icon
- **Click action**: None (informational only)

#### 4️⃣ **Monthly Average** (Small Widget)
- **What it shows**: Average monthly spending (last 6 months)
- **Calculation**: Total spends ÷ 6 months
- **Visual**: Orange/amber gradient card with trending icon
- **Click action**: None (informational only)

#### 5️⃣ **Persons Summary** (Medium Widget)
- **What it shows**: 
  - Number of persons you owe money to (red)
  - Number of persons who owe you money (green)
- **Balance tracking**: Based on "Gives" and "Takes" transactions
- **Visual**: Teal/cyan gradient card with users icon
- **Click action**: Navigates to Persons page

#### 6️⃣ **Spending by Category** (Large Widget)
- **What it shows**: Top 6 spending categories with amounts
- **Progress bars**: Visual percentage breakdown
- **Sorted**: Highest to lowest spending
- **Categories**: Food, Transport, Shopping, Entertainment, etc.
- **Visual**: White card with purple gradient bars
- **Click action**: "View All" navigates to Spends page

#### 7️⃣ **Spending Trend** (Medium Widget)
- **What it shows**: 
  - Overall spending trend (📈 Increasing / 📉 Decreasing / ➡️ Stable)
  - Top spending category with amount
- **Comparison**: This month vs last month
- **Visual**: Dynamic icon based on trend (up/down/stable)
- **Insight**: Quick summary of your spending behavior

#### 8️⃣ **AI Financial Insights** (Large Widget)
- **What it shows**: 3-4 AI-generated personalized insights
- **Insight types**:
  - ⚠️ **Warning**: High spending alerts
  - ✅ **Success**: Good financial habits
  - 💡 **Tip**: Actionable recommendations
  - ✨ **Info**: General observations
- **Powered by**: Google Gemini AI
- **Requires**: VITE_GEMINI_API_KEY environment variable
- **Dismissible**: Click X to hide

---

## 🎨 Dashboard Customization

### How to Customize

1. **Open Customizer**:
   - Click the **⚙️ Settings** icon in the top-right of your dashboard
   - The customizer panel will slide down

2. **Toggle Widgets**:
   - Click any widget name to enable/disable it
   - **Enabled**: Blue background with 👁️ eye icon
   - **Disabled**: Gray background with 👁️‍🗨️ eye-off icon

3. **Changes Auto-Save**:
   - Preferences immediately saved to database
   - No "Save" button needed
   - Persists across devices and sessions

4. **Close Customizer**:
   - Click the **✖️ X** icon
   - Or click Settings icon again to toggle off

### Widget Visibility
- **Enabled widgets**: Display on dashboard in grid layout
- **Disabled widgets**: Hidden completely (no empty spaces)
- **Grid auto-adjusts**: Responsive layout adapts to enabled widgets

### Default Configuration
All 8 widgets are **enabled by default** for new users:
```
✓ This Month Spends
✓ Today's Spends  
✓ Total Spends
✓ Monthly Average
✓ Persons Summary
✓ Spending by Category
✓ Spending Trend
✓ AI Financial Insights
```

---

## 📊 Widget Sizes Explained

### Small Widgets
- **Grid span**: 1 column (1/3 width on desktop)
- **Best for**: Single stat displays (Today, Total, Average)
- **Layout**: Stacks 3 per row on large screens

### Medium Widgets
- **Grid span**: 2 columns (2/3 width on desktop)
- **Best for**: Summary cards with 2-3 data points
- **Layout**: Takes up more horizontal space

### Large Widgets
- **Grid span**: 3 columns (full width on desktop)
- **Best for**: Detailed breakdowns and lists
- **Layout**: Full-width cards (Category Breakdown, AI Insights)

### Responsive Behavior
- **Mobile (< 640px)**: All widgets stack vertically (1 column)
- **Tablet (640-1024px)**: 2 columns max
- **Desktop (> 1024px)**: 3 columns max

---

## 🔒 Data Storage

### Database Table: `dashboard_preferences`

**Schema**:
```sql
CREATE TABLE dashboard_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  widget_id VARCHAR(100),
  is_visible BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0,
  size VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, widget_id)
);
```

**Fields**:
- `user_id`: Links to your Supabase auth user
- `widget_id`: Unique identifier (e.g., 'monthly_spends')
- `is_visible`: TRUE = enabled, FALSE = hidden
- `position`: Order of widget (0-7)
- `size`: Widget size ('small', 'medium', 'large')

**Security**:
- Row Level Security (RLS) enabled
- Users can only read/write their own preferences
- Policies enforce `auth.uid() = user_id`

**Indexes**:
- `user_id` for fast user lookups
- `user_id, widget_id` composite for preference retrieval
- `user_id, position` for ordering visible widgets

---

## 🆚 Business vs Personal Dashboard

### Business Mode Dashboard
**Features**:
- Supplier tracking
- Outstanding dues
- Transaction history with suppliers
- Business-focused metrics
- Full navigation menu

**Stats Cards**:
- Outstanding Dues (₹)
- Total Suppliers (#)
- Total Transactions (#)
- Pending Payments (#)

**Sections**:
- Recent Activity (supplier transactions)
- Payments Due (outstanding supplier balances)
- AI Financial Insights (business-focused)

### Personal Mode Dashboard
**Features**:
- Personal spending tracking
- Person-to-person money management
- Category-based expense analysis
- **Customizable widgets** 🎨
- Simplified navigation (no suppliers)

**Stats Cards**:
- Monthly Spends (₹)
- Today's Spends (₹)
- Total Spends (₹)
- Monthly Average (₹)
- Persons Summary (owed/owing counts)

**Sections**:
- Spending by Category (top 6 with progress bars)
- Spending Trend (up/down/stable indicator)
- AI Financial Insights (personal finance focused)

**Key Difference**: Personal dashboard is **widget-based and customizable**, while business dashboard has a fixed layout.

---

## 💡 Customization Tips

### Recommended Configurations

#### **Minimalist Setup** (Focus on essentials)
Enable only:
- ✓ Monthly Spends
- ✓ Today's Spends
- ✓ Persons Summary
- ✓ AI Insights

#### **Full Analytics** (See everything)
Enable all 8 widgets:
- ✓ All widgets enabled
- Complete financial picture
- Maximum information density

#### **Budget Tracker** (Spending focused)
Enable:
- ✓ Monthly Spends
- ✓ Monthly Average
- ✓ Spending by Category
- ✓ Spending Trend
- ✓ AI Insights

#### **Social Finance** (Person tracking)
Enable:
- ✓ Persons Summary
- ✓ Monthly Spends
- ✓ Today's Spends
- ✓ AI Insights

### Best Practices

1. **Start with defaults**: Try all widgets first
2. **Remove unused**: Disable widgets you don't check
3. **Mobile consideration**: Fewer widgets = cleaner mobile view
4. **AI insights**: Keep enabled for smart recommendations
5. **Experiment**: Try different combinations to find what works

---

## 🔧 Technical Implementation

### Component Structure

**PersonalDashboard.tsx**:
- Main dashboard component
- Fetches spending and persons data
- Loads widget preferences from database
- Renders enabled widgets in grid layout
- Handles AI insights generation

**Widget Rendering**:
```tsx
const renderWidget = (widget: DashboardWidget) => {
  if (!widget.enabled) return null
  
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 sm:col-span-2',
    large: 'col-span-1 sm:col-span-2 lg:col-span-3'
  }
  
  switch (widget.id) {
    case 'monthly_spends': return <MonthlyWidget />
    case 'today_spends': return <TodayWidget />
    // ... other widgets
  }
}
```

**Grid Layout**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
  {widgets.map(widget => renderWidget(widget))}
</div>
```

### Data Flow

1. **Load Preferences**: Query `dashboard_preferences` table
2. **Merge with Defaults**: Apply user preferences to default widget list
3. **Sort by Position**: Order widgets by `position` field
4. **Fetch Stats**: Get spends, persons, and category data
5. **Render Widgets**: Display only enabled widgets
6. **AI Processing**: Generate insights if API key present

### Customization Flow

1. **User clicks Settings**: `showCustomizer` state = true
2. **User toggles widget**: `toggleWidget(widgetId)` called
3. **Update state**: Widget `enabled` property flipped
4. **Save to DB**: `saveWidgetPreferences()` called
5. **Delete old prefs**: Clear existing user preferences
6. **Insert new prefs**: Batch insert updated preferences
7. **Re-render**: Dashboard updates with new configuration

---

## 🚀 Migration Guide

### Database Setup

**Step 1**: Run migration in Supabase SQL Editor
```bash
# File: supabase/migrations/20251126000002_add_dashboard_preferences.sql
# Run this in your Supabase project SQL editor
```

**Step 2**: Verify table creation
```sql
SELECT * FROM dashboard_preferences LIMIT 1;
```

**Step 3**: Check RLS policies
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'dashboard_preferences';
```

### User Experience

**First-time users**:
- See all 8 widgets enabled
- No database records yet
- Preferences created on first customization

**Existing users**:
- Automatically get default configuration
- Can immediately start customizing
- Changes persist across sessions

### Rollback Plan

If issues occur, disable customization:

**Option 1**: Hide customizer button
```tsx
// In PersonalDashboard.tsx, comment out:
// <button onClick={() => setShowCustomizer(!showCustomizer)}>
//   <Settings />
// </button>
```

**Option 2**: Force default widgets
```tsx
// Skip loading preferences:
// setWidgets(DEFAULT_WIDGETS)
```

**Option 3**: Drop table (data loss!)
```sql
DROP TABLE dashboard_preferences CASCADE;
```

---

## 📈 Analytics & Insights

### Widget Usage Tracking

To see which widgets users prefer, query:
```sql
SELECT 
  widget_id,
  COUNT(*) as enabled_users,
  COUNT(*) * 100.0 / (SELECT COUNT(DISTINCT user_id) FROM dashboard_preferences) as percentage
FROM dashboard_preferences
WHERE is_visible = true
GROUP BY widget_id
ORDER BY enabled_users DESC;
```

### Common Configurations

Find popular widget combinations:
```sql
SELECT 
  ARRAY_AGG(widget_id ORDER BY position) as widget_combo,
  COUNT(*) as users
FROM dashboard_preferences
WHERE is_visible = true
GROUP BY user_id
ORDER BY users DESC
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Issue: Widgets not saving
**Cause**: Database permission error
**Solution**: Check RLS policies are enabled

### Issue: All widgets hidden
**Cause**: User disabled all widgets
**Solution**: Re-enable at least one widget in customizer

### Issue: AI insights not showing
**Cause**: Missing VITE_GEMINI_API_KEY
**Solution**: Set environment variable in `.env` file

### Issue: Layout broken on mobile
**Cause**: CSS grid not responsive
**Solution**: Check Tailwind responsive classes (sm:, lg:)

### Issue: Preferences not loading
**Cause**: User ID mismatch or no records
**Solution**: Verify user logged in, check Supabase auth

---

## 🔮 Future Enhancements

### Planned Features (Not Yet Implemented)

1. **Widget Reordering**:
   - Drag-and-drop widget positioning
   - Custom layout arrangements
   - Save favorite layouts

2. **Widget Sizing Control**:
   - Let users choose small/medium/large
   - Custom width/height adjustments
   - Compact vs expanded views

3. **Color Themes**:
   - Light/dark mode toggle
   - Accent color customization
   - Widget-specific color schemes

4. **Data Range Selection**:
   - Monthly vs yearly views
   - Custom date ranges
   - Historical comparisons

5. **Export Dashboard**:
   - PDF snapshot generation
   - Email scheduled reports
   - Share dashboard publicly

6. **Widget Templates**:
   - Pre-built configurations
   - Import/export layouts
   - Community shared templates

---

## 📝 Version History

### v1.4.6 - November 26, 2025
- ✨ **NEW**: Customizable Personal Dashboard
- ✨ **NEW**: 8 widget types with toggle controls
- ✨ **NEW**: Dashboard preferences database table
- 🎨 Improved: Personal mode user experience
- 🎨 Improved: Mode-specific dashboard rendering
- 📊 Added: Widget size system (small/medium/large)
- 🔒 Added: RLS policies for dashboard preferences
- 📱 Responsive: Mobile-optimized grid layouts

---

**Need Help?** Contact support or check the main documentation at `/documentation`.

**Version**: 1.4.6  
**Last Updated**: November 26, 2025  
**Developed by**: Yash Patil
