import { requireAuth } from '@/lib/auth-utils';
import { getEnv } from '@/lib/env';
import { buildFinancialPrompt, generateInsightWithActions } from '@/lib/gemini';
import { rateLimit, rateLimits } from '@/lib/rate-limit';
import { supabase } from '@/lib/supabase';
import { aiChatSchema, validateRequest } from '@/lib/validations';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

function getSupabaseAuthed(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const dynamic = 'force-dynamic';

async function executeFunctionCall(
  functionCall: any,
  userId: string,
  supabaseClient: any
): Promise<{ success: boolean; result: any; error?: string }> {
  const { name, args } = functionCall;

  try {
    switch (name) {
      case 'create_budget': {
        const { category_id, monthly_limit, month, year } = args;
        const { data, error } = await supabaseClient
          .from('budgets')
          .insert([{ user_id: userId, category_id, monthly_limit, month, year }])
          .select('*, categories(*)')
          .single();

        if (error) {
          if (error.code === '23505') {
            return {
              success: false,
              result: null,
              error: 'Budget for this category and month already exists',
            };
          }
          return { success: false, result: null, error: error.message };
        }

        return { success: true, result: data };
      }

      case 'add_expense': {
        const { amount, category_id, description, date } = args;
        const { data, error } = await supabaseClient
          .from('expenses')
          .insert([{ user_id: userId, amount, category_id, description, date }])
          .select('*, categories(*)')
          .single();

        if (error) {
          return { success: false, result: null, error: error.message };
        }

        return { success: true, result: data };
      }

      case 'update_budget': {
        const { budget_id, monthly_limit } = args;

        // Verify budget belongs to user
        const { data: existing } = await supabaseClient
          .from('budgets')
          .select('user_id')
          .eq('id', budget_id)
          .single();

        if (!existing || existing.user_id !== userId) {
          return { success: false, result: null, error: 'Budget not found' };
        }

        const { data, error } = await supabaseClient
          .from('budgets')
          .update({ monthly_limit })
          .eq('id', budget_id)
          .select('*, categories(*)')
          .single();

        if (error) {
          return { success: false, result: null, error: error.message };
        }

        return { success: true, result: data };
      }

      default:
        return { success: false, result: null, error: `Unknown function: ${name}` };
    }
  } catch (error: any) {
    return { success: false, result: null, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, rateLimits.ai);
  if (rateLimitResult) return rateLimitResult;

  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;

  // Check if GEMINI_API_KEY is set
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    return NextResponse.json(
      { error: 'AI service is not configured. Please set GEMINI_API_KEY environment variable.' },
      { status: 500 }
    );
  }

  const body = await request.json();

  // Validate request body
  const validation = validateRequest(aiChatSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error, issues: validation.issues },
      { status: 400 }
    );
  }

  const { query, start_date, end_date } = validation.data;

  const supabaseClient = getSupabaseAuthed(request);

  // Fetch user expenses
  let expensesQuery = supabaseClient
    .from('expenses')
    .select('*, categories(*)')
    .eq('user_id', userId);

  if (start_date) expensesQuery = expensesQuery.gte('date', start_date);
  if (end_date) expensesQuery = expensesQuery.lte('date', end_date);

  const { data: expenses } = await expensesQuery;

  // Fetch category breakdown
  const { data: categoryBreakdown } = await supabaseClient
    .from('category_breakdown')
    .select('*')
    .eq('user_id', userId);

  // Fetch budgets
  const { data: budgets } = await supabaseClient
    .from('budgets')
    .select('*, categories(*)')
    .eq('user_id', userId);

  // Fetch categories for function calling
  const { data: categories } = await supabaseClient.from('categories').select('*');

  // Build prompt and get AI response
  const prompt = buildFinancialPrompt(
    expenses || [],
    categoryBreakdown || [],
    budgets || [],
    query
  );

  try {
    const aiResponse = await generateInsightWithActions(prompt, categories || []);

    // Check if AI wants to execute functions
    if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
      const results = [];

      for (const functionCall of aiResponse.functionCalls) {
        const result = await executeFunctionCall(functionCall, userId, supabaseClient);
        results.push(result);
      }

      // Generate a response based on the function execution results
      const successfulActions = results.filter((r) => r.success);
      const failedActions = results.filter((r) => !r.success);

      let responseText = '';

      if (successfulActions.length > 0) {
        responseText += `✅ Successfully completed ${successfulActions.length} action(s):\n\n`;
        successfulActions.forEach((action, index) => {
          const functionName = aiResponse.functionCalls![index].name;
          if (functionName === 'create_budget') {
            responseText += `• Created budget of ₹${action.result.monthly_limit} for ${action.result.categories.name}\n`;
          } else if (functionName === 'add_expense') {
            responseText += `• Added expense of ₹${action.result.amount} for ${action.result.description}\n`;
          } else if (functionName === 'update_budget') {
            responseText += `• Updated budget to ₹${action.result.monthly_limit} for ${action.result.categories.name}\n`;
          }
        });
      }

      if (failedActions.length > 0) {
        responseText += `\n❌ ${failedActions.length} action(s) failed:\n\n`;
        failedActions.forEach((action) => {
          responseText += `• ${action.error}\n`;
        });
      }

      // Cache the insight
      await supabase.from('insights_cache').insert([
        {
          user_id: userId,
          type: 'chat_response',
          content: { query, response: responseText },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);

      return NextResponse.json({ response: responseText });
    }

    // No function calls, return regular response
    const response = aiResponse.response;

    // Cache the insight
    await supabase.from('insights_cache').insert([
      {
        user_id: userId,
        type: 'chat_response',
        content: { query, response },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
