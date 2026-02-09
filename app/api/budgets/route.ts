import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth-utils';
import { budgetSchema, updateBudgetSchema, validateRequest } from '@/lib/validations';
import { rateLimit, rateLimits } from '@/lib/rate-limit';
import { getEnv } from '@/lib/env';

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

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  let query = supabase
    .from('budgets')
    .select('*, categories(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (month) query = query.eq('month', parseInt(month));
  if (year) query = query.eq('year', parseInt(year));

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimits.mutation);
  if (rateLimitResult) return rateLimitResult;

  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);
  const body = await request.json();

  // Validate request body
  const validation = validateRequest(budgetSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error, issues: validation.issues },
      { status: 400 }
    );
  }

  const { category_id, monthly_limit, month, year } = validation.data;

  const { data, error } = await supabase
    .from('budgets')
    .insert([{ user_id: userId, category_id, monthly_limit, month, year }])
    .select('*, categories(*)')
    .single();

  if (error) {
    // Check for unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Budget for this category and month already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimits.mutation);
  if (rateLimitResult) return rateLimitResult;

  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);
  const body = await request.json();

  // Validate request body
  const validation = validateRequest(updateBudgetSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error, issues: validation.issues },
      { status: 400 }
    );
  }

  const { id, ...updates } = validation.data;

  // Verify budget belongs to user
  const { data: existing } = await supabase.from('budgets').select('user_id').eq('id', id).single();

  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('budgets')
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
  const rateLimitResult = await rateLimit(request, rateLimits.mutation);
  if (rateLimitResult) return rateLimitResult;

  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);
  const { searchParams } = new URL(request.url);
  const budgetId = searchParams.get('id');

  if (!budgetId) {
    return NextResponse.json({ error: 'Budget ID required' }, { status: 400 });
  }

  // Verify budget belongs to user
  const { data: existing } = await supabase
    .from('budgets')
    .select('user_id')
    .eq('id', budgetId)
    .single();

  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
  }

  const { error } = await supabase.from('budgets').delete().eq('id', budgetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
