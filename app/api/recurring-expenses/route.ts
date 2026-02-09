import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { validateRequest, recurringExpenseSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';
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

// GET - Fetch all recurring expenses for the user
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*, categories(*)')
    .eq('user_id', userId!)
    .order('next_occurrence', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST - Create a new recurring expense
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const rateLimitResponse = await checkRateLimit(request, 'mutation');
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json();
  const validation = validateRequest(recurringExpenseSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);
  const { category_id, amount, description, frequency, start_date, end_date } = validation.data;

  // Calculate next occurrence based on frequency
  const nextOccurrence = new Date(start_date);

  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({
      user_id: userId,
      category_id,
      amount,
      description,
      frequency,
      start_date,
      end_date,
      next_occurrence: nextOccurrence.toISOString().split('T')[0],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT - Update a recurring expense
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const rateLimitResponse = await checkRateLimit(request, 'mutation');
  if (rateLimitResponse) return rateLimitResponse;

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);

  // Verify ownership
  const { data: existing } = await supabase
    .from('recurring_expenses')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId!)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Recurring expense not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('recurring_expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE - Delete a recurring expense
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const rateLimitResponse = await checkRateLimit(request, 'mutation');
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const userId = auth.user!.id;
  const supabase = getSupabaseAuthed(request);

  // Verify ownership
  const { data: existing } = await supabase
    .from('recurring_expenses')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId!)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Recurring expense not found' }, { status: 404 });
  }

  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Recurring expense deleted successfully' });
}
