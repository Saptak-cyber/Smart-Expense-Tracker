import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth-utils';
import { categorySchema, validateRequest } from '@/lib/validations';
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
  // Use basic client for public categories
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.from('categories').select('*').order('name');

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

  const body = await request.json();

  // Validate request body
  const validation = await validateRequest(categorySchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error, issues: validation.issues },
      { status: 400 }
    );
  }

  // Use service role to bypass RLS for category creation (categories are global)
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
  }

  const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert([validation.data])
    .select()
    .single();

  if (error) {
    console.error('Category creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
