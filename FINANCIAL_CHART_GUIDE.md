# Financial Trends Chart - Feature Documentation

## 🎨 Overview
The **Financial Trends Chart** is a comprehensive visualization widget that displays your financial data across three key metrics over the last 6 months, with an intelligent status indicator.

---

## 📊 Chart Features

### Three Data Lines

#### 1. **Spends Line** (Purple 💜)
- **Color**: Purple (`rgb(168, 85, 247)`)
- **Data**: Monthly personal spending totals
- **Source**: `spends` table filtered by month
- **Calculation**: Sum of all spend amounts per month

#### 2. **Dues Line** (Red 🔴)
- **Color**: Red (`rgb(239, 68, 68)`)
- **Data**: Money you owe to others (Takes transactions)
- **Source**: `loan_transactions` table where `type = 'Takes'`
- **Calculation**: Sum of "Takes" transactions per month
- **Meaning**: When this line goes up, you're borrowing more

#### 3. **Owe Line** (Green 🟢)
- **Color**: Green (`rgb(34, 197, 94)`)
- **Data**: Money owed to you (Gives transactions)
- **Source**: `loan_transactions` table where `type = 'Gives'`
- **Calculation**: Sum of "Gives" transactions per month
- **Meaning**: When this line goes up, you're lending more

---

## 🎯 Financial Status Indicator

### Status Calculation Logic

The chart displays your overall financial health with three statuses:

#### ✅ **GOOD** (Green Badge)
**Criteria**:
- Current spending ≤ 110% of 6-month average
- Current dues ≤ 120% of 6-month average
- Total person balance ≥ 0 (not owing money overall)

**Message**: *"Excellent financial health! Your spending is controlled and cash flow is positive."*

**What it means**:
- You're spending within or below your average
- You're not accumulating significant debt
- People owe you more than you owe them (or balanced)
- Financial discipline is strong

#### ⚠️ **BAD** (Red Badge)
**Criteria** (any one triggers this):
- Current spending > 150% of 6-month average
- Current dues > 200% of 6-month average
- Total person balance < -₹5,000 (owing significant money)

**Message**: *"Financial attention needed! High spending and dues detected. Consider budgeting."*

**What it means**:
- Spending has increased significantly
- Borrowing has increased dramatically
- You owe significantly more than owed to you
- Need immediate budget review

#### 💼 **DECENT** (Blue Badge)
**Criteria**:
- Neither "Good" nor "Bad" conditions met
- Moderate financial situation

**Message**: *"Your finances are balanced. Keep monitoring spending and dues."*

**What it means**:
- Spending is slightly elevated but manageable
- Dues are moderate
- Overall balance is reasonable
- Continue current habits with awareness

---

## 📈 Chart Components

### Y-Axis (Vertical)
- **Labels**: 5 evenly spaced values from 0 to max
- **Format**: 
  - Values > ₹1,000: Shows as "1.5k", "2.0k", etc.
  - Values < ₹1,000: Shows full amount
- **Dynamic scaling**: Adjusts to highest value across all three lines

### X-Axis (Horizontal)
- **Labels**: 6 month names (e.g., "Jun", "Jul", "Aug")
- **Format**: 3-letter month abbreviation
- **Order**: Oldest to newest (left to right)

### Grid
- **Horizontal lines**: 5 evenly spaced lines
- **Color**: Light gray (`border-gray-200`)
- **Purpose**: Easier value reading

### Data Points
- **Circles**: 4px radius dots at each data point
- **Colors**: Match line colors (purple, red, green)
- **Purpose**: Highlight exact monthly values

### Legend
- **Position**: Below chart
- **Items**: Three color-coded labels
  - Purple bar + "Spends"
  - Red bar + "Dues (You Owe)"
  - Green bar + "Owe (Owed to You)"

---

## 🔢 Data Calculation

### Monthly Spends
```typescript
const monthSpends = spends
  .filter(s => {
    const spendDate = new Date(s.date)
    return spendDate >= monthStart && spendDate <= monthEnd
  })
  .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0)
```

### Monthly Dues (You Owe)
```typescript
const monthDues = loanTransactions
  .filter(t => {
    const transDate = new Date(t.created_at)
    return transDate >= monthStart && transDate <= monthEnd 
      && t.type === 'Takes'
  })
  .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
```

### Monthly Owe (Owed to You)
```typescript
const monthOwe = loanTransactions
  .filter(t => {
    const transDate = new Date(t.created_at)
    return transDate >= monthStart && transDate <= monthEnd 
      && t.type === 'Gives'
  })
  .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
```

---

## 🎨 Visual Design

### Chart Card
- **Background**: White with shadow
- **Padding**: 24px (p-6)
- **Border radius**: Rounded-xl
- **Layout**: Full width on all screens (large widget)

### Status Badge
- **Position**: Top-right corner
- **Design**: 
  - Rounded pill shape
  - Icon + uppercase status text
  - Color-coded background
- **Colors**:
  - Good: `bg-green-100 text-green-700`
  - Bad: `bg-red-100 text-red-700`
  - Decent: `bg-blue-100 text-blue-700`

### Status Message Box
- **Position**: Below header, above chart
- **Design**: 
  - Rounded box with border
  - Padding: 16px
  - Color-coded to match status
- **Purpose**: Explain status to user

### SVG Chart
- **Technique**: SVG paths for smooth lines
- **Viewbox**: Preserves aspect ratio
- **Stroke width**: 3px for visibility
- **Vector effect**: `non-scaling-stroke` for consistent line width

---

## 💡 Usage Tips

### Understanding Trends

#### **Spends Line Rising**
- You're spending more month-over-month
- Review budget and cut unnecessary expenses
- Check category breakdown widget

#### **Dues Line Rising**
- You're borrowing more money
- Consider if this is sustainable
- Plan repayment strategy

#### **Owe Line Rising**
- You're lending more money
- Ensure you can afford to lend
- Track who owes you money

#### **All Lines Rising**
- High financial activity
- Both income and expenses increasing
- Monitor cash flow carefully

#### **All Lines Stable**
- Consistent financial patterns
- Good for budgeting and planning
- Predictable cash flow

---

## 🔧 Widget Configuration

### Default Settings
- **ID**: `financial_chart`
- **Title**: Financial Trends Chart
- **Enabled**: Yes (by default)
- **Position**: 0 (first widget)
- **Size**: Large (full width)

### Customization
Users can toggle this widget on/off via Dashboard Customizer:
1. Click Settings (⚙️) icon
2. Find "Financial Trends Chart"
3. Click to disable if not needed

### Database Storage
Preferences saved to `dashboard_preferences` table:
```sql
widget_id = 'financial_chart'
is_visible = true/false
position = 0
size = 'large'
```

---

## 📱 Responsive Behavior

### Desktop (> 1024px)
- Full width (3 columns)
- Chart height: 256px (h-64)
- All labels visible
- Optimal viewing experience

### Tablet (640-1024px)
- Full width (2 columns span)
- Chart height: 256px
- Labels may wrap
- Still fully functional

### Mobile (< 640px)
- Full width (1 column)
- Chart height: 256px
- Compact legend layout
- Touch-friendly

---

## 🚀 Performance

### Data Efficiency
- Only loads last 6 months (not all data)
- Pre-aggregated monthly totals
- Single database query for spends
- Single query for loan transactions

### Rendering
- SVG for smooth, scalable graphics
- No external charting libraries (reduces bundle size)
- Pure CSS styling (fast rendering)
- Minimal re-renders (memoized calculations)

### Bundle Impact
- Chart code: ~5 KB
- No dependencies added
- Total widget: ~6 KB with styles

---

## 🐛 Edge Cases Handled

### No Data
- Chart displays empty with 0 values
- Status defaults to "Decent"
- Message: "Your finances are balanced"

### Single Month Data
- Chart still renders with one point
- Lines appear as single dots
- Status calculation works

### Negative Values
- Dues can only be positive (Takes are additions)
- Owe can only be positive (Gives are additions)
- Balance can be negative (total person balance)

### Large Numbers
- Y-axis auto-scales to max value
- Format switches to "k" suffix for readability
- No overflow issues

### Different Month Ranges
- Always shows last 6 complete months
- Current partial month included
- Consistent time window

---

## 🎓 User Education

### What Users Should Learn

1. **Trend Recognition**:
   - Rising lines = increasing activity
   - Falling lines = decreasing activity
   - Parallel lines = consistent patterns

2. **Status Interpretation**:
   - Good = keep current habits
   - Decent = monitor but okay
   - Bad = take immediate action

3. **Line Relationships**:
   - If Spends > Owe: spending more than lending
   - If Dues > Owe: borrowing more than lending
   - Ideal: Spends low, Owe high, Dues low

4. **Monthly Comparison**:
   - Compare current month to average
   - Identify seasonal patterns
   - Plan ahead for high-spend months

---

## 🔮 Future Enhancements

### Phase 2 (Not Yet Implemented)
- **Tooltips**: Hover to see exact values
- **Date range selector**: Choose 3/6/12 month view
- **Zoom/pan**: Explore data interactively
- **Export**: Download chart as PNG/PDF
- **Annotations**: Mark important events on chart

### Phase 3 (Ideas)
- **Forecasting**: Predict next 3 months
- **Comparison**: Compare to previous year
- **Goals**: Overlay budget targets
- **Categories**: Filter by spend category
- **Drill-down**: Click month to see details

---

## 📊 Example Scenarios

### Scenario 1: Healthy Finances
```
Month    Spends   Dues    Owe
Jun      5000     0       2000
Jul      4800     0       1500
Aug      5200     500     2500
Sep      4900     0       3000
Oct      5100     0       2800
Nov      5000     0       3200

Status: GOOD ✅
Reason: Stable spending, minimal dues, positive owe balance
```

### Scenario 2: Warning Signs
```
Month    Spends   Dues    Owe
Jun      5000     2000    1000
Jul      6500     3000    500
Aug      8000     4500    0
Sep      9500     6000    0
Oct      11000    7500    0
Nov      12500    9000    0

Status: BAD ⚠️
Reason: Rapidly increasing spending and dues, no money owed to you
```

### Scenario 3: Balanced
```
Month    Spends   Dues    Owe
Jun      6000     1000    1500
Jul      5800     800     1200
Aug      6200     1200    1800
Sep      5900     900     1400
Oct      6100     1100    1600
Nov      6000     1000    1500

Status: DECENT 💼
Reason: Moderate spending, manageable dues, some positive balance
```

---

## ✅ Checklist

When reviewing the chart, ask yourself:

- [ ] Are my spends trending up or down?
- [ ] Is my current spending above or below average?
- [ ] Am I borrowing more than before?
- [ ] Do I have more money owed to me or by me?
- [ ] Is my financial status good, decent, or bad?
- [ ] What actions should I take based on my status?

---

**Widget**: Financial Trends Chart  
**Version**: 1.4.6  
**Last Updated**: November 26, 2025  
**Developed by**: Yash Patil
