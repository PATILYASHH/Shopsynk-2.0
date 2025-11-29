# 🤖 AI Smart Spend Parsing Feature

## Overview
The new AI-powered Smart Input feature automatically extracts **title**, **amount**, and **category** from natural language descriptions.

## How It Works

### 1. Enable Smart Input
In the "Add Personal Spend" modal, toggle the **Smart Input** switch at the top.

### 2. Write Naturally
Just type what you spent on in plain language:

**Examples:**
```
✅ "i bought new phone for 2000 rs"
   → Title: "New Phone"
   → Amount: ₹2000
   → Category: Shopping

✅ "lunch at restaurant 350 rupees"
   → Title: "Restaurant Lunch"
   → Amount: ₹350
   → Category: Food & Dining

✅ "auto rickshaw 50"
   → Title: "Auto Rickshaw"
   → Amount: ₹50
   → Category: Transportation

✅ "doctor visit 500"
   → Title: "Doctor Visit"
   → Amount: ₹500
   → Category: Healthcare

✅ "bought groceries 1.5k"
   → Title: "Groceries"
   → Amount: ₹1500
   → Category: Shopping

✅ "movie ticket"
   → Title: "Movie Ticket"
   → Amount: (manual entry needed)
   → Category: Entertainment
```

### 3. AI Processing
The AI will automatically:
- Extract the **item/service** and create a clean title
- Detect the **amount** (supports: 2000, 2k, 2.5k, ₹2000, Rs.2000, 2000rs, etc.)
- Suggest the most appropriate **category** from 12 categories
- Provide **confidence level** (high/medium/low)
- Explain its **reasoning**

### 4. Review & Accept
- See the parsed result in a beautiful card
- **Accept**: Click "Use This" to populate the form
- **Reject**: Click X to manually enter details

## Supported Amount Formats

| Input Format | Detected Amount |
|--------------|-----------------|
| 2000 | ₹2000 |
| 2k | ₹2000 |
| 2.5k | ₹2500 |
| ₹2000 | ₹2000 |
| Rs.2000 | ₹2000 |
| 2000 rs | ₹2000 |
| 2000 rupees | ₹2000 |
| 1.5k | ₹1500 |

## Available Categories
1. Food & Dining
2. Transportation
3. Entertainment
4. Shopping
5. Bills & Utilities
6. Healthcare
7. Education
8. Travel
9. Personal Care
10. Home & Garden
11. General
12. Other

## Features

### 🎯 Smart Recognition
- **Transportation**: bus, train, taxi, uber, auto, rickshaw, petrol, fuel
- **Food**: restaurant, cafe, lunch, dinner, breakfast, food
- **Shopping**: clothes, electronics, groceries, amazon, flipkart
- **Healthcare**: doctor, hospital, medicine, pharmacy
- **Entertainment**: movie, concert, game, netflix, spotify
- **Education**: books, course, tuition, school, college
- **Travel**: hotel, flight, vacation, trip, tour

### ✨ AI Capabilities
- Natural language understanding
- Context-aware categorization
- Multiple currency format support
- Title cleaning and capitalization
- Confidence scoring
- Reasoning explanation

### 🔄 Fallback Mode
If AI is unavailable or API key not set:
- Uses rule-based parsing
- Keyword matching for categories
- Basic amount extraction with regex
- Still provides good results!

## Regular Mode (AI Category Suggestion)

If you prefer the traditional form:
1. Keep Smart Input **OFF**
2. Fill in description manually
3. Enable "AI Category" toggle
4. AI will only suggest the category based on your description
5. Amount and other fields entered manually

## Tips for Best Results

1. **Be Specific**: "lunch at restaurant" is better than just "food"
2. **Include Amount**: Always mention the price for automatic detection
3. **Use Common Terms**: "auto" instead of "auto-rickshaw ride from A to B"
4. **Keep it Simple**: "bought phone 2000" works better than "I went to the store and purchased a mobile phone for two thousand rupees"

## Technical Details

### AI Model
- **Provider**: Google Gemini Pro
- **Function**: `parseSpendFromText()`
- **Location**: `src/lib/geminiService.ts`

### API Requirements
- Requires `VITE_GEMINI_API_KEY` in `.env` file
- Free tier available at Google AI Studio
- Fallback to rule-based parsing if unavailable

### Response Format
```typescript
interface ParsedSpend {
  title: string          // Clean, capitalized title
  amount: number | null  // Extracted amount or null
  category: string       // One of 12 categories
  confidence: 'high' | 'medium' | 'low'
  reasoning: string      // AI's explanation
}
```

## Benefits

✅ **3x Faster**: Type one sentence instead of filling 3-4 fields
✅ **Accurate**: AI understands context and nuances
✅ **Consistent**: Automatic title capitalization and formatting
✅ **Smart**: Learns from common patterns
✅ **Flexible**: Supports multiple currency formats
✅ **Reliable**: Fallback to rule-based parsing

## Examples by Category

### Transportation
```
"took bus from kolhapur to mumbai"
"auto rickshaw 50"
"petrol 1.5k"
"uber ride 200"
```

### Food & Dining
```
"lunch at restaurant 350"
"coffee at cafe 120"
"dinner with friends 800"
"breakfast 80 rupees"
```

### Shopping
```
"bought new phone for 20k"
"groceries from store 1200"
"clothes shopping 2500 rs"
"amazon order 599"
```

### Healthcare
```
"doctor visit 500"
"medicine from pharmacy 350"
"health checkup 1200"
"dental consultation 800"
```

### Entertainment
```
"movie ticket 250"
"netflix subscription 199"
"concert ticket 1500"
"game purchase 999"
```

---

**Note**: This feature requires an active internet connection and Gemini API key. The fallback parser works offline with basic regex patterns.
