import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// This endpoint will be called by Vercel Cron
// Add this to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/process-recurring",
//     "schedule": "0 0 * * *"
//   }]
// }

function calculateNextOccurrence(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch all active recurring expenses that are due
  const { data: recurringExpenses, error: fetchError } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('is_active', true)
    .lte('next_occurrence', today);

  if (fetchError) {
    console.error('Error fetching recurring expenses:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const results = {
    processed: 0,
    errors: 0,
    details: [] as any[],
  };

  for (const recurring of recurringExpenses || []) {
    try {
      // Check if end_date has passed
      if (recurring.end_date && recurring.end_date < today) {
        // Deactivate expired recurring expense
        await supabase
          .from('recurring_expenses')
          .update({ is_active: false })
          .eq('id', recurring.id);

        results.details.push({
          id: recurring.id,
          status: 'deactivated',
          reason: 'end_date passed',
        });
        continue;
      }

      // Create the expense
      const { error: insertError } = await supabase.from('expenses').insert({
        user_id: recurring.user_id,
        category_id: recurring.category_id,
        amount: recurring.amount,
        description: `${recurring.description || ''} (Recurring)`,
        date: today,
      });

      if (insertError) {
        console.error(`Error creating expense for recurring ${recurring.id}:`, insertError);
        results.errors++;
        results.details.push({
          id: recurring.id,
          status: 'error',
          error: insertError.message,
        });
        continue;
      }

      // Calculate next occurrence
      const nextOccurrence = calculateNextOccurrence(
        new Date(recurring.next_occurrence),
        recurring.frequency
      );

      // Update the recurring expense with new next_occurrence
      const { error: updateError } = await supabase
        .from('recurring_expenses')
        .update({
          next_occurrence: nextOccurrence.toISOString().split('T')[0],
        })
        .eq('id', recurring.id);

      if (updateError) {
        console.error(`Error updating recurring ${recurring.id}:`, updateError);
        results.errors++;
        results.details.push({
          id: recurring.id,
          status: 'error',
          error: updateError.message,
        });
        continue;
      }

      results.processed++;
      results.details.push({
        id: recurring.id,
        status: 'success',
        nextOccurrence: nextOccurrence.toISOString().split('T')[0],
      });
    } catch (error: any) {
      console.error(`Unexpected error processing recurring ${recurring.id}:`, error);
      results.errors++;
      results.details.push({
        id: recurring.id,
        status: 'error',
        error: error.message,
      });
    }
  }

  return NextResponse.json({
    success: true,
    processed: results.processed,
    errors: results.errors,
    total: recurringExpenses?.length || 0,
    details: results.details,
  });
}
