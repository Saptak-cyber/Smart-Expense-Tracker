import { requireAuth } from '@/lib/auth-utils';
import { getEnv } from '@/lib/env';
import { generateAnalyticsInsights } from '@/lib/groq';
import { rateLimit, rateLimits } from '@/lib/rate-limit';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
  // Apply rate limiting for AI endpoints
  const rateLimitResult = await rateLimit(request, rateLimits.ai);
  if (rateLimitResult) return rateLimitResult;

  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  try {
    const body = await request.json();
    const { categoryBreakdown, monthlyTrends } = body;

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI insights are not configured. Please add GROQ_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const supabase = getSupabaseAuthed(request);

    // Fetch user's expenses for AI analysis
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*, categories(*)')
      .order('date', { ascending: false })
      .limit(100);

    if (expensesError) throw expensesError;

    // Fetch budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*, categories(*)');

    if (budgetsError) throw budgetsError;

    // Generate AI insights
    const aiInsights = await generateAnalyticsInsights(
      expenses || [],
      categoryBreakdown || [],
      monthlyTrends || [],
      budgets || []
    );

    return NextResponse.json({ insights: aiInsights });
  } catch (error: any) {
    console.error('AI insights generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI insights' },
      { status: 500 }
    );
  }
}
