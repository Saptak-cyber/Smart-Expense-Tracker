import { z } from 'zod';

// Expense validation schema
export const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(10000000, 'Amount too large'),
  category_id: z.string().uuid('Invalid category ID'),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

export const updateExpenseSchema = expenseSchema.partial().extend({
  id: z.string().uuid('Invalid expense ID'),
});

// Budget validation schema
export const budgetSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  monthly_limit: z.number().positive('Monthly limit must be positive').max(100000000, 'Limit too large'),
  month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2020).max(2100, 'Year must be between 2020 and 2100'),
});

export const updateBudgetSchema = budgetSchema.partial().extend({
  id: z.string().uuid('Invalid budget ID'),
});

// Export parameters schema
export const exportParamsSchema = z.object({
  format: z.enum(['csv', 'pdf'], { message: 'Format must be csv or pdf' }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
});

// User settings schema
export const userSettingsSchema = z.object({
  full_name: z.string().min(1).max(100, 'Name too long').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional().nullable(),
  currency: z.string().length(3, 'Currency must be 3-letter code').optional(),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
});

// AI chat schema
export const aiChatSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(1000, 'Query too long'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Category schema
export const categorySchema = z.object({
  name: z.string().min(1).max(50, 'Category name too long'),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

// Recurring expense schema
export const recurringExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(10000000, 'Amount too large'),
  category_id: z.string().uuid('Invalid category ID'),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly'], {
    message: 'Frequency must be daily, weekly, monthly, or yearly'
  }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional().nullable(),
  is_active: z.boolean().default(true),
});

// Helper function to validate and parse request body
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Validation failed',
        issues: error.issues,
      };
    }
    return {
      success: false,
      error: 'Invalid request data',
      issues: [],
    };
  }
}
