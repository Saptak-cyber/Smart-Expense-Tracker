import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateInsight, buildFinancialPrompt } from '@/lib/gemini';
import { requireAuth } from '@/lib/auth-utils';
import { aiChatSchema, validateRequest } from '@/lib/validations';
import { rateLimit, rateLimits } from '@/lib/rate-limit';

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

  // Fetch user expenses
  let expensesQuery = supabase
    .from('expenses')
    .select('*, categories(*)')
    .eq('user_id', userId);

  if (start_date) expensesQuery = expensesQuery.gte('date', start_date);
  if (end_date) expensesQuery = expensesQuery.lte('date', end_date);

  const { data: expenses } = await expensesQuery;

  // Fetch category breakdown
  const { data: categoryBreakdown } = await supabase
    .from('category_breakdown')
    .select('*')
    .eq('user_id', userId);

  // Fetch budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, categories(*)')
    .eq('user_id', userId);

  // Build prompt and get AI response
  const prompt = buildFinancialPrompt(
    expenses || [],
    categoryBreakdown || [],
    budgets || [],
    query
  );

  try {
    const response = await generateInsight(prompt);

    // Cache the insight
    await supabase.from('insights_cache').insert([{
      user_id: userId,
      type: 'chat_response',
      content: { query, response },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }]);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
