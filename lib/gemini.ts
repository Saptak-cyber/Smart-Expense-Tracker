import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateInsight(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export function buildFinancialPrompt(
  expenses: any[],
  categoryBreakdown: any[],
  budgets: any[],
  userQuery: string
): string {
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;
  
  return `You are a financial assistant helping users understand their spending patterns.

Context:
- Total expenses: ${expenses.length} transactions
- Total amount spent: ₹${totalSpent.toFixed(2)}
- Average transaction: ₹${avgExpense.toFixed(2)}
- Category breakdown: ${JSON.stringify(categoryBreakdown, null, 2)}
- Budget limits: ${JSON.stringify(budgets, null, 2)}

User question: ${userQuery}

Provide a clear, actionable, and non-judgmental response. Focus on:
1. Explaining spending patterns
2. Identifying anomalies or trends
3. Suggesting optimizations
4. Being supportive and helpful

Keep your response concise (2-3 paragraphs max).`;
}
