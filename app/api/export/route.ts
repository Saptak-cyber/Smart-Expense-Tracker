import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth-utils';
import { exportParamsSchema, validateRequest } from '@/lib/validations';
import { rateLimit, rateLimits } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, rateLimits.export);
  if (rateLimitResult) return rateLimitResult;
  
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;
  
  const userId = auth.user.id;
  const body = await request.json();
  
  // Validate request body
  const validation = await validateRequest(exportParamsSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error, issues: validation.issues },
      { status: 400 }
    );
  }
  
  const { format, start_date, end_date, category_ids } = validation.data;

  let query = supabase
    .from('expenses')
    .select('*, categories(*)')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (start_date) query = query.gte('date', start_date);
  if (end_date) query = query.lte('date', end_date);
  if (category_ids?.length) query = query.in('category_id', category_ids);

  const { data: expenses, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === 'csv') {
    const csv = [
      'Date,Amount,Category,Description',
      ...expenses!.map(e => 
        `${e.date},${e.amount},${e.categories?.name || 'Uncategorized'},"${e.description || ''}"`
      )
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=expenses.csv',
      },
    });
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
}
