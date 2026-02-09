import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;
  
  const userId = auth.user!.id;
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread_only') === 'true';

  let query = supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const body = await request.json();
  const { alert_id, is_read } = body;

  if (!alert_id) {
    return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
  }

  // Verify alert belongs to user
  const { data: existing } = await supabase
    .from('alerts')
    .select('user_id')
    .eq('id', alert_id)
    .single();
    
  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read })
    .eq('id', alert_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const { searchParams } = new URL(request.url);
  const alertId = searchParams.get('id');
  
  if (!alertId) {
    return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
  }
  
  // Verify alert belongs to user
  const { data: existing } = await supabase
    .from('alerts')
    .select('user_id')
    .eq('id', alertId)
    .single();
    
  if (!existing || existing.user_id !== userId) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
