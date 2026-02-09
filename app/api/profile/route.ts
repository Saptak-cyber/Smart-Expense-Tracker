import { requireAuth } from '@/lib/auth-utils';
import { getEnv } from '@/lib/env';
import { rateLimit, rateLimits } from '@/lib/rate-limit';
import { userSettingsSchema, validateRequest } from '@/lib/validations';
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

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimits.mutation);
  if (rateLimitResult) return rateLimitResult;

  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const body = await request.json();

  // Validate request body
  const validation = validateRequest(userSettingsSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error, issues: validation.issues },
      { status: 400 }
    );
  }

  // Use service role for profile updates to bypass RLS
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(validation.data)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
