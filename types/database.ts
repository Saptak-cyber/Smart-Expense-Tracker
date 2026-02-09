// This file is auto-generated. Do not edit manually.
// Represents the Supabase database schema

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string | null;
          color?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category_id: string;
          description: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category_id: string;
          description?: string | null;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          description?: string | null;
          date?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          monthly_limit: number;
          month: number;
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          monthly_limit: number;
          month: number;
          year: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          monthly_limit?: number;
          month?: number;
          year?: number;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          severity: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          severity: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      insights_cache: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          content: Json;
          generated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          content: Json;
          generated_at?: string;
          expires_at: string;
        };
        Update: {
          type?: string;
          content?: Json;
          expires_at?: string;
        };
      };
      recurring_expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category_id: string;
          description: string | null;
          frequency: string;
          start_date: string;
          next_occurrence: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category_id: string;
          description?: string | null;
          frequency: string;
          start_date: string;
          next_occurrence: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          description?: string | null;
          frequency?: string;
          next_occurrence?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {
      monthly_expense_summary: {
        Row: {
          user_id: string;
          month: string;
          total_amount: number;
          expense_count: number;
        };
      };
      category_breakdown: {
        Row: {
          user_id: string;
          category_id: string;
          category_name: string;
          total_amount: number;
          expense_count: number;
        };
      };
    };
  };
}
