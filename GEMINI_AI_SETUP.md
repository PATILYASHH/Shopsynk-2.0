# Gemini AI Integration Setup Guide

## Overview
Shopsynk now includes AI-powered features throughout the application using Google's Gemini AI. Get intelligent assistance for categorization, descriptions, and financial insights.

## AI Features Across Shopsynk

### 1. 🛍️ Smart Spend Categorization
- **Automatic Categorization**: AI analyzes your spend description and suggests the best category
- **Smart Description Cleanup**: AI improves and formats your descriptions
- **Confidence Scoring**: Shows how confident the AI is about the suggestion (high/medium/low)
- **Reasoning**: Explains why a particular category was chosen
- **Accept/Reject**: You can accept the AI suggestion or manually choose a category

### 2. 📝 Transaction Description Generator
- **Smart Descriptions**: Auto-generate professional descriptions for supplier transactions
- **Context-Aware**: Uses supplier name, amount, and transaction type
- **One-Click Generation**: Click "AI Suggest" button to generate descriptions
- **Works for**: Purchases and payments to suppliers

### 3. 💡 Financial Insights Dashboard
- **AI-Powered Analysis**: Get intelligent insights about your finances
- **Cash Flow Advice**: Tips on managing outstanding dues
- **Spending Patterns**: Understand your spending behavior
- **Risk Alerts**: Warnings about potential financial issues
- **Actionable Tips**: Specific recommendations to improve finances

### 4. 🚀 Fallback System
- If AI is unavailable, falls back to keyword-based categorization
- Ensures features always work, even without API key

## Setup Instructions

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key

### 2. Add API Key to Your Environment

1. Open the `.env.local` file in your project root (create it if it doesn't exist)
2. Add the following line:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with the API key you copied

### 3. Restart Your Development Server

After adding the API key, restart your development server:
```bash
npm run dev
```

## How to Use AI Features

### 1. Smart Spend Categorization

1. Click the "Add Spend" button
2. Make sure the AI toggle (✨ AI button) is enabled (purple color)
3. Type a description of what you bought. For example:
   - "took bus kolhapur to mumbai"
   - "lunch at restaurant with friends"
   - "bought new phone from amazon"
   - "electricity bill payment"

4. After typing 3+ words or 15+ characters, the AI will automatically analyze your description
5. An AI suggestion card will appear showing:
   - Suggested category
   - Cleaned up description (if improved)
   - Confidence level
   - Reasoning for the suggestion

6. You can either:
   - Click **Accept** to use the AI suggestion
   - Click **Reject** to manually select a category
   - Toggle off the AI button to disable AI suggestions

### 2. Transaction Description Generator

**Where**: Add Transaction form (for suppliers)

1. Select a supplier from the dropdown
2. Enter the transaction amount
3. Click the **"AI Suggest"** button next to Description field
4. AI will generate a professional description based on:
   - Transaction type (purchase/payment)
   - Supplier name
   - Amount
   - Any context you've already typed

**Example Generations:**
- Input: New Purchase, ABC Store, ₹5000
- Output: "Office supplies purchase from ABC Store"

- Input: Payment, XYZ Properties, ₹25000  
- Output: "Monthly rent payment to XYZ Properties"

### 3. Financial Insights on Dashboard

**Where**: Dashboard page (shows automatically if API key is set)

- Insights appear at the top of your dashboard
- AI analyzes your financial data to provide:
  - ⚠️ **Warnings**: Critical issues needing attention
  - ✅ **Success**: Positive financial behaviors
  - 💡 **Tips**: Helpful suggestions
  - ℹ️ **Info**: General financial observations

- Each insight includes:
  - Title summarizing the point
  - Detailed explanation
  - Actionable recommendation (when applicable)

- You can dismiss insights by clicking the X button

### Spend Categories Supported

The AI can categorize spends into these categories:
- 🍽️ Food & Dining
- 🚗 Transportation
- 🎬 Entertainment
- 🛍️ Shopping
- 💡 Bills & Utilities
- 🏥 Healthcare
- 📚 Education
- ✈️ Travel
- 💇 Personal Care
- 🏡 Home & Garden
- 📋 General
- 📌 Other

## Real-World Examples

### Spend Categorization Examples

#### Transportation
**Input:** "took bus kolhapur to mumbai"  
**AI Suggestion:** Transportation  
**Cleaned Description:** "Bus: Kolhapur to Mumbai"

### Food & Dining
**Input:** "lunch at dominos pizza"  
**AI Suggestion:** Food & Dining  
**Cleaned Description:** "Lunch at Domino's Pizza"

### Shopping
**Input:** "bought new shoes from amazon"  
**AI Suggestion:** Shopping  
**Cleaned Description:** "Shoes purchased from Amazon"

### Bills & Utilities
**Input:** "paid electricity bill 500 rupees"  
**AI Suggestion:** Bills & Utilities  
**Cleaned Description:** "Electricity Bill Payment"

### Transaction Description Examples

#### Supplier Purchase
**Input Data:**
- Supplier: "Tech Solutions Ltd"
- Amount: ₹45,000
- Type: New Purchase

**AI Generated:** "Electronic equipment purchase from Tech Solutions Ltd"

#### Supplier Payment
**Input Data:**
- Supplier: "Office Mart"  
- Amount: ₹15,000
- Type: Payment

**AI Generated:** "Settlement payment to Office Mart"

### Financial Insight Examples

#### Warning Insight
**Title:** High Outstanding Dues  
**Message:** Your total outstanding dues of ₹1,25,000 are 40% higher than last month. This could impact cash flow.  
**Action:** Consider prioritizing payments to top 3 suppliers to reduce debt burden.

#### Success Insight
**Title:** Improved Payment Discipline  
**Message:** You've reduced pending payments by 25% this month. Great progress on debt management!  
**Action:** Continue this trend by setting up payment reminders for due dates.

#### Tip Insight
**Title:** Spending Pattern Alert  
**Message:** Your personal spends have increased 30% in the last 2 weeks, mainly in Food & Shopping categories.  
**Action:** Review discretionary spending and set a weekly budget to maintain control.

## Troubleshooting

### AI Not Working?

1. **Check API Key**: Make sure you've added `VITE_GEMINI_API_KEY` to `.env.local`
2. **Restart Server**: After adding the API key, restart your dev server
3. **Check Console**: Open browser console (F12) to see any error messages
4. **API Limits**: Free tier has rate limits. If you hit the limit, wait a few minutes

### Fallback Mode

If the Gemini API is unavailable or you haven't set up an API key, the system automatically falls back to keyword-based categorization. This provides basic categorization without requiring AI.

## API Key Security

⚠️ **Important Security Notes:**

1. **Never commit** your `.env.local` file to version control
2. The `.env.local` file is already in `.gitignore`
3. Never share your API key publicly
4. For production deployment, set environment variables through your hosting platform (Netlify, Vercel, etc.)

## Cost & Limits

- **Gemini API Free Tier**: 60 requests per minute
- **Cost**: Free for personal use (subject to Google's terms)
- **Fallback**: Keyword-based categorization works without any API key

## Disabling AI Features

### For Spend Categorization
1. Click the AI toggle button (✨) in the Add Spend modal
2. When disabled (gray), AI suggestions won't appear
3. You can manually select categories as before

### For Transaction Descriptions  
- Simply don't click the "AI Suggest" button
- Type your own description manually

### For Dashboard Insights
- Click the X button on the insights panel
- Insights won't regenerate until you reload the dashboard

## Performance & Limits

### Speed
- **Spend Categorization**: ~1-2 seconds
- **Transaction Descriptions**: ~1-2 seconds  
- **Financial Insights**: ~3-5 seconds (only generated once per dashboard load)

### API Usage
- Gemini API Free Tier: 60 requests per minute
- Each feature makes 1 API call per use
- Insights only load once per dashboard visit (cached)

### Data Privacy
- No data is stored by Google's API
- Requests are processed in real-time
- All data remains in your Supabase database

## Support

For issues or questions:
- Check browser console for error messages
- Ensure API key is correctly set in `.env.local`
- Verify you have internet connection (AI requires API calls)
- Contact support if problems persist

---

**Developed by Yash Patil**  
Version: 1.4.5 - November 2025
