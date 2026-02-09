import { createClient } from '@supabase/supabase-js';

// Safe environment variable access (with validation)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  category_id: string | null;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
};

export type Alert = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  created_at: string;
};
