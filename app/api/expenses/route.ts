import { requireAuth } from '@/lib/auth-utils';
import { getEnv } from '@/lib/env';
import { rateLimit, rateLimits } from '@/lib/rate-limit';
import { expenseSchema, updateExpenseSchema, validateRequest } from '@/lib/validations';
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

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const cursor = searchParams.get('cursor');
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = supabase
    .from('expenses')
    .select('*, categories(*)', { count: 'exact' })
    .eq('user_id', userId!)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (cursor) query = query.lt('created_at', cursor);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hasMore = (data?.length || 0) === limit;
  const nextCursor = hasMore && data && data.length > 0 ? data[data.length - 1].created_at : null;

  return NextResponse.json({
    data,
    pagination: {
      cursor: nextCursor,
      hasMore,
      total: count,
    },
  });
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, rateLimits.mutation);
  if (rateLimitResult) return rateLimitResult;

  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);
  const body = await request.json();

  // Validate request body
  const validation = await validateRequest(expenseSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error, issues: validation.issues },
      { status: 400 }
    );
  }

  const { amount, category_id, description, date } = validation.data;

  const { data, error } = await supabase
    .from('expenses')
    .insert([{ user_id: userId, amount, category_id, description, date }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check budget alerts
  const currentMonth = new Date(date).getMonth() + 1;
  const currentYear = new Date(date).getFullYear();

  const { data: monthlyTotal } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
    .lte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`);

  const total = monthlyTotal?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

  const { data: budget } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', category_id)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .single();

  if (budget && total > budget.monthly_limit) {
    await supabase.from('alerts').insert([
      {
        user_id: userId,
        type: 'budget_exceeded',
        title: 'Budget Exceeded',
        message: `You've exceeded your budget for this category by ₹${(total - budget.monthly_limit).toFixed(2)}`,
        severity: 'warning',
      },
    ]);
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, rateLimits.mutation);
  if (rateLimitResult) return rateLimitResult;

  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);
  const body = await request.json();

  // Validate request body
  const validation = await validateRequest(updateExpenseSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error, issues: validation.issues },
      { status: 400 }
    );
  }

  const { id, ...updates } = validation.data;

  // Verify expense belongs to user before updating
  const { data: existing } = await supabase
    .from('expenses')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select('*, categories(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, rateLimits.mutation);
  if (rateLimitResult) return rateLimitResult;

  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);
  const { searchParams } = new URL(request.url);
  const expenseId = searchParams.get('id');

  if (!expenseId) {
    return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
  }

  // Verify expense belongs to user before deleting
  const { data: existing } = await supabase
    .from('expenses')
    .select('user_id')
    .eq('id', expenseId)
    .single();

  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  }

  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
