import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini API
const getGeminiAPI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    return null // Return null instead of throwing - allows fallback parsing
  }
  return new GoogleGenerativeAI(apiKey)
}

// Available spend categories
export const SPEND_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Home & Garden',
  'General',
  'Other'
]

export interface SpendSuggestion {
  category: string
  description: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export interface ParsedSpend {
  title: string
  amount: number | null
  category: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

/**
 * Parse natural language spend input to extract title, amount, and category
 * Example: "i bought new phone for 2000 rs" → { title: "New Phone", amount: 2000, category: "Shopping" }
 */
export async function parseSpendFromText(input: string): Promise<ParsedSpend> {
  try {
    const genAI = getGeminiAPI()
    
    // If no API key, use fallback immediately
    if (!genAI) {
      return fallbackSpendParsing(input)
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are a smart expense parser. Extract structured information from natural language expense descriptions.

User input: "${input}"

Available categories:
${SPEND_CATEGORIES.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

Extract and structure the following:
1. Title: Clean, concise description of what was purchased/spent (2-5 words, capitalize properly)
2. Amount: Extract the numeric amount (support formats: 2000, 2k, 2000rs, ₹2000, Rs.2000)
3. Category: Best matching category from the list above

Examples:
Input: "i bought new phone for 2000 rs"
Output: {"title": "New Phone", "amount": 2000, "category": "Shopping", "confidence": "high", "reasoning": "Phone purchase clearly indicates shopping"}

Input: "lunch at restaurant 350 rupees"
Output: {"title": "Restaurant Lunch", "amount": 350, "category": "Food & Dining", "confidence": "high", "reasoning": "Restaurant meal is food and dining"}

Input: "auto rickshaw 50"
Output: {"title": "Auto Rickshaw", "amount": 50, "category": "Transportation", "confidence": "high", "reasoning": "Auto rickshaw is transportation"}

Input: "bought groceries 1.5k"
Output: {"title": "Groceries", "amount": 1500, "category": "Shopping", "confidence": "high", "reasoning": "Groceries shopping"}

Input: "movie ticket"
Output: {"title": "Movie Ticket", "amount": null, "category": "Entertainment", "confidence": "high", "reasoning": "Movie ticket is entertainment"}

Input: "doctor visit 500"
Output: {"title": "Doctor Visit", "amount": 500, "category": "Healthcare", "confidence": "high", "reasoning": "Doctor visit is healthcare"}

Rules:
- Extract numbers: 2k = 2000, 1.5k = 1500, handle rs/rupees/₹
- If no amount found, set amount to null
- Title should be clean and professional (remove "i bought", "for", extra words)
- Use title case for titles
- Category must be from the provided list

Respond with ONLY valid JSON in this exact format:
{
  "title": "Clean Title Here",
  "amount": 2000,
  "category": "Category Name",
  "confidence": "high",
  "reasoning": "Brief reason"
}

Parse the user input now:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate and normalize
    if (!SPEND_CATEGORIES.includes(parsed.category)) {
      parsed.category = 'General'
    }

    if (!['high', 'medium', 'low'].includes(parsed.confidence)) {
      parsed.confidence = 'medium'
    }

    // Ensure amount is number or null
    if (parsed.amount !== null) {
      parsed.amount = parseFloat(parsed.amount) || null
    }

    return {
      title: parsed.title || input,
      amount: parsed.amount,
      category: parsed.category,
      confidence: parsed.confidence as 'high' | 'medium' | 'low',
      reasoning: parsed.reasoning || 'Automatically parsed'
    }
  } catch (error) {
    console.error('Error parsing spend with AI:', error)
    
    // Fallback: Manual parsing
    return fallbackSpendParsing(input)
  }
}

/**
 * Fallback spend parsing when AI is unavailable
 */
function fallbackSpendParsing(input: string): ParsedSpend {
  // Extract amount using regex
  const amountPatterns = [
    /(\d+\.?\d*)\s*k(?:s)?/i,           // 2k, 2.5k
    /[₹rs\.]*\s*(\d+)/i,                 // ₹2000, Rs.2000, 2000
    /(\d+)\s*(?:rs|rupees|₹)/i          // 2000rs, 2000 rupees
  ]
  
  let amount: number | null = null
  let cleanInput = input
  
  for (const pattern of amountPatterns) {
    const match = input.match(pattern)
    if (match) {
      let value = parseFloat(match[1])
      // Handle 'k' notation
      if (pattern.source.includes('k')) {
        value = value * 1000
      }
      amount = value
      // Remove amount from input for cleaner title
      cleanInput = input.replace(match[0], '').trim()
      break
    }
  }
  
  // Clean title
  let title = cleanInput
    .replace(/^(i |bought |purchase |paid |spend )/gi, '')
    .replace(/\b(for|at|from|to|in)\b/gi, '')
    .trim()
  
  // Capitalize title
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 50) // Limit length
  
  if (!title) {
    title = input.slice(0, 50)
  }
  
  // Use fallback categorization
  const suggestion = fallbackCategorization(input)
  
  return {
    title,
    amount,
    category: suggestion.category,
    confidence: 'medium' as const,
    reasoning: 'Parsed using basic rules'
  }
}

/**
 * Analyzes spend description and suggests appropriate category using Gemini AI
 */
export async function analyzeSpendDescription(description: string): Promise<SpendSuggestion> {
  try {
    const genAI = getGeminiAPI()
    
    // If no API key, use fallback immediately
    if (!genAI) {
      return fallbackCategorization(description)
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are a financial categorization assistant. Analyze the following expense description and categorize it appropriately.

Description: "${description}"

Available categories:
${SPEND_CATEGORIES.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

Rules:
- Transportation includes: bus, train, taxi, uber, auto, rickshaw, petrol, fuel, parking, toll
- Food & Dining includes: restaurant, cafe, food, lunch, dinner, breakfast, snacks, drinks
- Shopping includes: clothes, electronics, groceries, amazon, flipkart, mall, store
- Bills & Utilities includes: electricity, water, gas, phone, internet, rent, maintenance
- Healthcare includes: doctor, hospital, medicine, pharmacy, medical
- Education includes: books, course, tuition, school, college, training
- Travel includes: hotel, flight, vacation, trip, tour, stay
- Entertainment includes: movie, concert, game, sports, subscription, netflix
- Personal Care includes: salon, spa, grooming, cosmetics, gym
- Home & Garden includes: furniture, decor, plants, home improvement

Please respond in the following JSON format only (no extra text):
{
  "category": "exact category name from the list",
  "cleanedDescription": "improved/cleaned version of description",
  "confidence": "high/medium/low",
  "reasoning": "brief explanation why this category fits"
}

Example:
Input: "took bus kolhapur to mumbai"
Output: {"category": "Transportation", "cleanedDescription": "Bus: Kolhapur to Mumbai", "confidence": "high", "reasoning": "Bus travel between cities clearly falls under Transportation"}

Now analyze the given description and respond with JSON only.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response (handle cases where AI might add extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate category
    if (!SPEND_CATEGORIES.includes(parsed.category)) {
      parsed.category = 'General'
    }

    // Validate confidence
    if (!['high', 'medium', 'low'].includes(parsed.confidence)) {
      parsed.confidence = 'medium'
    }

    return {
      category: parsed.category,
      description: parsed.cleanedDescription || description,
      confidence: parsed.confidence as 'high' | 'medium' | 'low',
      reasoning: parsed.reasoning || 'Automatically categorized'
    }
  } catch (error) {
    console.error('Error analyzing spend with Gemini:', error)
    
    // Fallback: Simple keyword-based categorization
    return fallbackCategorization(description)
  }
}

/**
 * Fallback categorization when AI is unavailable
 */
function fallbackCategorization(description: string): SpendSuggestion {
  const lowerDesc = description.toLowerCase()

  // Simple keyword matching
  if (/bus|train|taxi|uber|auto|rickshaw|petrol|fuel|transport/.test(lowerDesc)) {
    return {
      category: 'Transportation',
      description: description,
      confidence: 'medium',
      reasoning: 'Detected transportation keywords'
    }
  }
  
  if (/restaurant|cafe|food|lunch|dinner|breakfast|eat|meal/.test(lowerDesc)) {
    return {
      category: 'Food & Dining',
      description: description,
      confidence: 'medium',
      reasoning: 'Detected food-related keywords'
    }
  }
  
  if (/movie|entertainment|game|concert|netflix|show/.test(lowerDesc)) {
    return {
      category: 'Entertainment',
      description: description,
      confidence: 'medium',
      reasoning: 'Detected entertainment keywords'
    }
  }
  
  if (/shop|store|buy|purchase|cloth|electronics/.test(lowerDesc)) {
    return {
      category: 'Shopping',
      description: description,
      confidence: 'medium',
      reasoning: 'Detected shopping keywords'
    }
  }
  
  if (/electric|water|gas|phone|internet|bill|rent/.test(lowerDesc)) {
    return {
      category: 'Bills & Utilities',
      description: description,
      confidence: 'medium',
      reasoning: 'Detected utility bill keywords'
    }
  }
  
  if (/doctor|hospital|medicine|pharmacy|health|medical/.test(lowerDesc)) {
    return {
      category: 'Healthcare',
      description: description,
      confidence: 'medium',
      reasoning: 'Detected healthcare keywords'
    }
  }
  
  if (/hotel|flight|trip|travel|vacation|tour/.test(lowerDesc)) {
    return {
      category: 'Travel',
      description: description,
      confidence: 'medium',
      reasoning: 'Detected travel keywords'
    }
  }
  
  if (/book|course|tuition|school|education|learn/.test(lowerDesc)) {
    return {
      category: 'Education',
      description: description,
      confidence: 'medium',
      reasoning: 'Detected education keywords'
    }
  }

  // Default to General
  return {
    category: 'General',
    description: description,
    confidence: 'low',
    reasoning: 'No specific category detected'
  }
}

/**
 * Batch analyze multiple descriptions (useful for import)
 */
export async function batchAnalyzeSpends(descriptions: string[]): Promise<SpendSuggestion[]> {
  const results = await Promise.allSettled(
    descriptions.map(desc => analyzeSpendDescription(desc))
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      // Fallback for failed requests
      return fallbackCategorization(descriptions[index])
    }
  })
}

/**
 * Generate smart transaction description for supplier purchases/payments
 */
export async function generateTransactionDescription(
  type: 'purchase' | 'payment',
  supplierName: string,
  amount: number,
  userInput?: string
): Promise<string> {
  try {
    const genAI = getGeminiAPI()
    
    // If no API key, return basic description
    if (!genAI) {
      return `${type === 'purchase' ? 'Purchase' : 'Payment'} - ${supplierName} - ₹${amount}`
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Generate a concise, professional transaction description.

Type: ${type === 'purchase' ? 'New Purchase' : 'Payment Made'}
Supplier: ${supplierName}
Amount: ₹${amount}
${userInput ? `Additional context: ${userInput}` : ''}

Generate a brief (5-10 words) professional description for this transaction.
Examples:
- "Office supplies purchase from ABC Store"
- "Monthly rent payment to XYZ Properties"
- "Electronic components for Project Alpha"
- "Advance payment for services"

Respond with ONLY the description text, nothing else.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const description = response.text().trim()
    
    return description || (type === 'purchase' ? `Purchase from ${supplierName}` : `Payment to ${supplierName}`)
  } catch (error) {
    console.error('Error generating transaction description:', error)
    return type === 'purchase' ? `Purchase from ${supplierName}` : `Payment to ${supplierName}`
  }
}

/**
 * Generate financial insights from transaction data
 */
export interface FinancialInsight {
  type: 'warning' | 'info' | 'success' | 'tip'
  title: string
  message: string
  actionable?: string
}

export async function generateFinancialInsights(data: {
  totalDues: number
  totalSpends: number
  topSuppliers: { name: string; amount: number }[]
  recentTrend: 'increasing' | 'decreasing' | 'stable'
}): Promise<FinancialInsight[]> {
  try {
    const genAI = getGeminiAPI()
    
    // If no API key, return basic insights
    if (!genAI) {
      return [
        {
          type: 'info',
          title: 'Financial Overview',
          message: `Total dues: ₹${data.totalDues}. Total spends: ₹${data.totalSpends}.`,
          actionable: 'Track your expenses regularly'
        }
      ]
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are a financial advisor. Analyze this business financial data and provide 3-4 actionable insights.

Data:
- Total Outstanding Dues: ₹${data.totalDues}
- Total Personal Spends: ₹${data.totalSpends}
- Top Suppliers: ${data.topSuppliers.map(s => `${s.name} (₹${s.amount})`).join(', ')}
- Recent Trend: ${data.recentTrend}

Provide insights in JSON format:
[
  {
    "type": "warning|info|success|tip",
    "title": "Brief title (3-5 words)",
    "message": "Detailed insight (1-2 sentences)",
    "actionable": "Recommended action (optional)"
  }
]

Focus on:
1. Cash flow management
2. Supplier payment priorities
3. Spending patterns
4. Risk mitigation

Respond with ONLY valid JSON array, no extra text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return []
  } catch (error) {
    console.error('Error generating insights:', error)
    return []
  }
}

/**
 * Smart search across transactions using natural language
 */
export async function smartSearch(
  query: string,
  transactions: any[]
): Promise<{ relevantIds: string[]; explanation: string }> {
  try {
    if (transactions.length === 0) {
      return { relevantIds: [], explanation: 'No transactions to search' }
    }

    const genAI = getGeminiAPI()
    
    // If no API key, return empty results
    if (!genAI) {
      return { relevantIds: [], explanation: 'AI search unavailable. Please use regular search.' }
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Create simplified transaction list for AI
    const transactionSummary = transactions.slice(0, 50).map((t, idx) => ({
      index: idx,
      id: t.id,
      type: t.type || t.transactionType,
      supplier: t.supplier?.name || t.person?.name || t.description,
      amount: t.amount,
      description: t.description
    }))

    const prompt = `You are a search assistant. User query: "${query}"

Transactions (first 50):
${transactionSummary.map((t, i) => `${i}. ${t.supplier} - ₹${t.amount} - ${t.type} ${t.description ? `(${t.description})` : ''}`).join('\n')}

Find the most relevant transactions matching the query. Consider:
- Supplier/person names
- Transaction types
- Amounts (if mentioned)
- Descriptions
- Context and intent

Respond in JSON format ONLY:
{
  "relevantIndices": [array of matching transaction indices],
  "explanation": "Brief explanation of why these match"
}

If no matches, return empty array.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      const relevantIds = parsed.relevantIndices.map((idx: number) => transactionSummary[idx]?.id).filter(Boolean)
      return {
        relevantIds,
        explanation: parsed.explanation
      }
    }
    
    return { relevantIds: [], explanation: 'No matches found' }
  } catch (error) {
    console.error('Error in smart search:', error)
    return { relevantIds: [], explanation: 'Search unavailable' }
  }
}
