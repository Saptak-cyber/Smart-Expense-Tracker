// Database types matching Supabase schema

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category_id: string;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface Alert {
  id: string;
  user_id: string;
  type: 'budget_exceeded' | 'budget_warning' | 'unusual_spending' | 'info';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface InsightCache {
  id: string;
  user_id: string;
  type: 'chat_response' | 'monthly_insight' | 'spending_pattern';
  content: Record<string, any>;
  generated_at: string;
  expires_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  amount: number;
  category_id: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  next_occurrence: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

// View types
export interface MonthlyExpenseSummary {
  user_id: string;
  month: string;
  total_amount: number;
  expense_count: number;
}

export interface CategoryBreakdown {
  user_id: string;
  category_id: string;
  category_name: string;
  total_amount: number;
  expense_count: number;
  categories?: Category;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  issues?: Array<{ path: string[]; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Form types
export interface ExpenseFormData {
  amount: number;
  category_id: string;
  description?: string;
  date: string;
}

export interface BudgetFormData {
  category_id: string;
  monthly_limit: number;
  month: number;
  year: number;
}

export interface RecurringExpenseFormData {
  amount: number;
  category_id: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
}

export interface UserSettingsFormData {
  full_name?: string;
  avatar_url?: string;
  currency?: string;
  date_format?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}

// Chart data types
export interface ExpenseChartData {
  date: string;
  amount: number;
  category?: string;
}

export interface CategoryChartData {
  name: string;
  value: number;
  color?: string;
}

// AI Chat types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// Export types
export type ExportFormat = 'csv' | 'pdf';

export interface ExportParams {
  format: ExportFormat;
  start_date?: string;
  end_date?: string;
  category_ids?: string[];
}

// Analytics types
export interface SpendingTrend {
  period: string;
  amount: number;
  change: number;
  percentageChange: number;
}

export interface BudgetPerformance {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
  status: 'on_track' | 'warning' | 'exceeded';
}

// Component prop types
export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  loading?: boolean;
}

export interface ChartProps {
  data: any[];
  loading?: boolean;
  height?: number;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
