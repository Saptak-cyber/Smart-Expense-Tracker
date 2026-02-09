import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { supabase } from '@/lib/supabase';

// GET - Fetch chat history
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Reverse to show oldest first
  return NextResponse.json(data?.reverse() || []);
}

// POST - Add message to history
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;
  const { role, content, metadata } = await request.json();

  if (!role || !content) {
    return NextResponse.json({ error: 'Role and content are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('chat_history')
    .insert({
      user_id: userId,
      role,
      content,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE - Clear chat history
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const userId = auth.user!.id;

  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Chat history cleared' });
}
