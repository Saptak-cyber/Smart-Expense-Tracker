import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;
  
  const userId = auth.user.id;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'monthly' | 'categories' | 'trends'

  if (type === 'monthly') {
    const { data, error } = await supabase
      .from('monthly_expense_summary')
      .select('*')
      .eq('user_id', userId!)
      .order('month', { ascending: false })
      .limit(12);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  if (type === 'categories') {
    const { data, error } = await supabase
      .from('category_breakdown')
      .select('*')
      .eq('user_id', userId!)
      .order('total_amount', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
