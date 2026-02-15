import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ReceiptData {
  amount: number | null;
  category: string | null;
  description: string | null;
  date: string | null;
}

/**
 * Extract receipt data using Groq Llama Vision API
 * @param imageBase64 - Base64 encoded image string
 * @param userCategories - User's existing categories to match against
 * @returns Parsed receipt data
 */
export async function extractReceiptData(
  imageBase64: string,
  userCategories: Array<{ id: string; name: string }>
): Promise<ReceiptData> {
  try {
    // Build category list from user's categories
    const categoryNames = userCategories.map((cat) => cat.name).join(', ');
    const categoryPrompt = categoryNames
      ? `one of: ${categoryNames}`
      : 'Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Groceries, Other, gym';

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a receipt parser that reads the text inside the image and returns a JSON object with:
- amount (number, the total amount paid)
- category (string, MUST be ${categoryPrompt}. If the receipt doesn't clearly match any category, use "Other")
- description (string, merchant name or brief description)
- date (string, format: DD/MM/YYYY)

IMPORTANT: The category MUST be one of the provided categories. If unsure, use "Other".
Only return valid JSON. If you cannot find a field, use null.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Extract JSON from response (handle cases where model adds extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : responseText;

    const parsed = JSON.parse(jsonString);

    // Convert date from DD/MM/YYYY to YYYY-MM-DD
    let formattedDate = null;
    if (parsed.date) {
      const dateMatch = parsed.date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return {
      amount: parsed.amount ? parseFloat(parsed.amount) : null,
      category: parsed.category || null,
      description: parsed.description || null,
      date: formattedDate,
    };
  } catch (error) {
    console.error('Groq Vision API error:', error);
    throw new Error('Failed to extract receipt data');
  }
}

/**
 * Match extracted category to user's existing categories
 * @param extractedCategory - Category from receipt
 * @param userCategories - User's existing categories
 * @returns Matched category ID, or "Other" category ID if no match found
 */
export function matchCategory(
  extractedCategory: string | null,
  userCategories: Array<{ id: string; name: string }>
): string | null {
  if (!userCategories.length) return null;

  if (!extractedCategory) {
    // Try to find "Other" category as fallback
    const otherCategory = userCategories.find((cat) => cat.name.toLowerCase() === 'other');
    return otherCategory?.id || null;
  }

  const normalized = extractedCategory.toLowerCase().trim();

  // Direct match (case-insensitive, exact match)
  const directMatch = userCategories.find((cat) => cat.name.toLowerCase() === normalized);
  if (directMatch) return directMatch.id;

  // Remove common suffixes/prefixes for better matching
  const cleanNormalized = normalized
    .replace(/\s*&\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Try direct match with cleaned version
  const cleanMatch = userCategories.find(
    (cat) =>
      cat.name
        .toLowerCase()
        .replace(/\s*&\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() === cleanNormalized
  );
  if (cleanMatch) return cleanMatch.id;

  // Fuzzy match with common category mappings
  const categoryMappings: Record<string, string[]> = {
    'food & dining': [
      'food',
      'dining',
      'restaurant',
      'cafe',
      'coffee',
      'meal',
      'food & dining',
      'food and dining',
    ],
    transportation: ['transport', 'transportation', 'taxi', 'uber', 'bus', 'train', 'fuel', 'gas'],
    shopping: ['shopping', 'retail', 'store', 'mall', 'clothes', 'clothing'],
    entertainment: ['entertainment', 'movie', 'cinema', 'game', 'concert', 'event'],
    'bills & utilities': [
      'bills',
      'utility',
      'utilities',
      'electricity',
      'water',
      'internet',
      'phone',
      'bills & utilities',
      'bills and utilities',
    ],
    healthcare: ['healthcare', 'health', 'medical', 'doctor', 'hospital', 'pharmacy', 'medicine'],
    education: ['education', 'school', 'course', 'book', 'tuition', 'learning'],
    travel: ['travel', 'hotel', 'flight', 'vacation', 'trip', 'tourism'],
    groceries: ['groceries', 'grocery', 'supermarket', 'market'],
    gym: ['gym', 'fitness', 'workout', 'exercise'],
  };

  // Check if extracted category matches any mapping keywords
  for (const [key, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some((keyword) => normalized.includes(keyword) || keyword.includes(normalized))) {
      // Try to find category by key (exact match)
      const match = userCategories.find((cat) => cat.name.toLowerCase() === key);
      if (match) return match.id;

      // Try to find by key with cleaned version
      const cleanKey = key
        .replace(/\s*&\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const cleanKeyMatch = userCategories.find(
        (cat) =>
          cat.name
            .toLowerCase()
            .replace(/\s*&\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim() === cleanKey
      );
      if (cleanKeyMatch) return cleanKeyMatch.id;

      // Try partial match with key
      const partialMatch = userCategories.find((cat) => {
        const catName = cat.name.toLowerCase();
        return catName.includes(key) || key.includes(catName);
      });
      if (partialMatch) return partialMatch.id;
    }
  }

  // Partial match with user categories (word-based)
  const words = normalized.split(/\s+/);
  for (const cat of userCategories) {
    const catWords = cat.name.toLowerCase().split(/\s+/);
    // Check if any significant word matches
    const hasMatch = words.some(
      (word) =>
        word.length > 2 &&
        catWords.some((catWord) => catWord.includes(word) || word.includes(catWord))
    );
    if (hasMatch) return cat.id;
  }

  // If no match found, return "Other" category
  const otherCategory = userCategories.find((cat) => cat.name.toLowerCase() === 'other');
  return otherCategory?.id || null;
}

/**
 * Generate AI-powered analytics insights using Groq's reasoning model
 * @param expenses - User's expense data
 * @param categoryBreakdown - Category spending breakdown
 * @param monthlyTrends - Monthly spending trends
 * @param budgets - User's budget data
 * @returns Array of insight strings
 */
export async function generateAnalyticsInsights(
  expenses: any[],
  categoryBreakdown: any[],
  monthlyTrends: any[],
  budgets: any[]
): Promise<string[]> {
  try {
    // Prepare data summary for the AI
    const totalSpent = categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0);
    const expenseCount = expenses.length;
    const avgExpense = expenseCount > 0 ? totalSpent / expenseCount : 0;

    // Get top 3 categories
    const topCategories = categoryBreakdown
      .slice(0, 3)
      .map((cat) => `${cat.name}: ₹${cat.value.toFixed(2)} (${cat.percentage.toFixed(1)}%)`)
      .join(', ');

    // Get recent trend
    const recentTrends =
      monthlyTrends.length >= 2
        ? monthlyTrends
            .slice(-3)
            .map((m) => `${m.month}: ₹${m.total}`)
            .join(', ')
        : 'Not enough data';

    // Budget status
    const budgetSummary = budgets
      .map((b) => {
        const spent = expenses
          .filter((e) => e.category_id === b.category_id)
          .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const percentage = (spent / parseFloat(b.monthly_limit)) * 100;
        return `${b.categories?.name || 'Unknown'}: ${percentage.toFixed(0)}% used`;
      })
      .join(', ');

    const prompt = `You are a financial advisor analyzing a user's expense data. Provide 3-5 actionable insights based on the following data:

Total Expenses: ${expenseCount}
Total Spent: ₹${totalSpent.toFixed(2)}
Average per Expense: ₹${avgExpense.toFixed(2)}

Top Spending Categories: ${topCategories}
Recent Monthly Trends: ${recentTrends}
Budget Status: ${budgetSummary || 'No budgets set'}

Provide insights that are:
1. Specific and actionable
2. Based on the actual data provided
3. Helpful for improving financial habits
4. Concise (1-2 sentences each)

Return ONLY a JSON array of insight strings, nothing else. Example format:
["Insight 1 text here", "Insight 2 text here", "Insight 3 text here"]`;

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_completion_tokens: 2048,
      include_reasoning: false, // We only want the final answer, not the reasoning process
    });

    const responseText = completion.choices[0]?.message?.content || '[]';

    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : responseText;

    const insights = JSON.parse(jsonString);

    // Validate that we got an array of strings
    if (!Array.isArray(insights)) {
      throw new Error('Invalid response format');
    }

    return insights.filter((insight) => typeof insight === 'string' && insight.length > 0);
  } catch (error) {
    console.error('Groq analytics insights error:', error);
    throw new Error('Failed to generate AI insights');
  }
}
