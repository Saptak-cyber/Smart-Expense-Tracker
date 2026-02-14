import { FunctionDeclaration, GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define available functions for the AI
const functions: FunctionDeclaration[] = [
  {
    name: 'create_budget',
    description: 'Create a new budget for a specific category and month',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category_id: {
          type: SchemaType.STRING,
          description: 'The ID of the category for the budget',
        },
        monthly_limit: {
          type: SchemaType.NUMBER,
          description: 'The monthly budget limit amount',
        },
        month: {
          type: SchemaType.NUMBER,
          description: 'The month number (1-12)',
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'The year (e.g., 2026)',
        },
      },
      required: ['category_id', 'monthly_limit', 'month', 'year'],
    },
  },
  {
    name: 'add_expense',
    description: 'Add a new expense transaction',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        amount: {
          type: SchemaType.NUMBER,
          description: 'The expense amount',
        },
        category_id: {
          type: SchemaType.STRING,
          description: 'The ID of the category for the expense',
        },
        description: {
          type: SchemaType.STRING,
          description: 'Description of the expense',
        },
        date: {
          type: SchemaType.STRING,
          description: 'The date of the expense in YYYY-MM-DD format',
        },
      },
      required: ['amount', 'category_id', 'description', 'date'],
    },
  },
  {
    name: 'update_budget',
    description: 'Update an existing budget amount',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        budget_id: {
          type: SchemaType.STRING,
          description: 'The ID of the budget to update',
        },
        monthly_limit: {
          type: SchemaType.NUMBER,
          description: 'The new monthly budget limit amount',
        },
      },
      required: ['budget_id', 'monthly_limit'],
    },
  },
];

export async function generateInsight(prompt: string): Promise<string> {
  // Using gemini-2.5-flash-lite: Free tier, highest throughput
  // Rate limits: 15 RPM, 1,000 RPD (highest!), 250K TPM
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

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

  return `You are a financial assistant helping users understand their spending patterns. You can also take actions to help manage their finances.

Context:
- Total expenses: ${expenses.length} transactions
- Total amount spent: ₹${totalSpent.toFixed(2)}
- Average transaction: ₹${avgExpense.toFixed(2)}
- Category breakdown: ${JSON.stringify(categoryBreakdown, null, 2)}
- Budget limits: ${JSON.stringify(budgets, null, 2)}

Capabilities:
You can perform the following actions when the user requests:
1. Create budgets - Use create_budget function when user wants to set a budget
2. Add expenses - Use add_expense function when user wants to record an expense
3. Update budgets - Use update_budget function when user wants to change a budget amount

User question: ${userQuery}

Instructions:
- If the user asks you to create a budget, add an expense, or update a budget, use the appropriate function
- When using functions, extract the necessary information from the user's request
- For dates, use today's date if not specified: ${new Date().toISOString().split('T')[0]}
- For months, use the current month if not specified: ${new Date().getMonth() + 1}
- For years, use the current year if not specified: ${new Date().getFullYear()}
- If information is missing, ask the user for clarification instead of using functions
- Provide clear, actionable, and non-judgmental responses
- Focus on explaining spending patterns, identifying trends, and suggesting optimizations
- Keep responses concise (2-3 paragraphs max)`;
}


export async function generateInsightWithActions(
  prompt: string,
  categories: any[]
): Promise<{ response: string; functionCalls?: any[] }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    tools: [{ functionDeclarations: functions }],
  });

  const chat = model.startChat({
    history: [],
  });

  // Add category information to help AI map category names to IDs
  const categoryInfo = categories.map((c) => `${c.name} (ID: ${c.id})`).join(', ');
  const enhancedPrompt = `${prompt}\n\nAvailable categories: ${categoryInfo}`;

  const result = await chat.sendMessage(enhancedPrompt);
  const response = result.response;

  // Check if AI wants to call functions
  const functionCalls = response.functionCalls();

  if (functionCalls && functionCalls.length > 0) {
    return {
      response: '',
      functionCalls: functionCalls,
    };
  }

  return {
    response: response.text(),
  };
}
