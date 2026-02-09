-- Smart Expense Tracker - Complete Database Schema
-- This script is idempotent - safe to run multiple times
-- Paste this into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT '💰',
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    monthly_limit DECIMAL(12, 2) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, month, year)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history table (for AI assistant)
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring expenses table
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights cache table (for AI-generated insights)
CREATE TABLE IF NOT EXISTS public.insights_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'monthly_summary', 'anomaly', 'prediction', 'chat_response', etc.
    content JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'budget_exceeded', 'unusual_spending', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default categories (only if they don't exist)
INSERT INTO public.categories (name, icon, color) VALUES
    ('Food & Dining', '🍔', '#ef4444'),
    ('Transportation', '🚗', '#f59e0b'),
    ('Shopping', '🛍️', '#ec4899'),
    ('Entertainment', '🎬', '#8b5cf6'),
    ('Bills & Utilities', '💡', '#3b82f6'),
    ('Healthcare', '🏥', '#10b981'),
    ('Education', '📚', '#6366f1'),
    ('Travel', '✈️', '#14b8a6'),
    ('Groceries', '🛒', '#84cc16'),
    ('Other', '💰', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_expires ON public.insights_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_id ON public.recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_next_occurrence ON public.recurring_expenses(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_active ON public.recurring_expenses(is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
CREATE POLICY "Users can insert own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for budgets
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
CREATE POLICY "Users can view own budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
CREATE POLICY "Users can insert own budgets" ON public.budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
CREATE POLICY "Users can update own budgets" ON public.budgets
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;
CREATE POLICY "Users can delete own budgets" ON public.budgets
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for insights_cache
DROP POLICY IF EXISTS "Users can view own insights" ON public.insights_cache;
CREATE POLICY "Users can view own insights" ON public.insights_cache
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON public.insights_cache;
CREATE POLICY "Users can insert own insights" ON public.insights_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own insights" ON public.insights_cache;
CREATE POLICY "Users can delete own insights" ON public.insights_cache
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for alerts
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
CREATE POLICY "Users can view own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;
CREATE POLICY "Users can update own alerts" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own alerts" ON public.alerts;
CREATE POLICY "Users can delete own alerts" ON public.alerts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_history
DROP POLICY IF EXISTS "Users can view own chat history" ON public.chat_history;
CREATE POLICY "Users can view own chat history" ON public.chat_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own chat messages" ON public.chat_history;
CREATE POLICY "Users can create own chat messages" ON public.chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chat history" ON public.chat_history;
CREATE POLICY "Users can delete own chat history" ON public.chat_history
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recurring_expenses
DROP POLICY IF EXISTS "Users can view own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can view own recurring expenses" ON public.recurring_expenses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can create own recurring expenses" ON public.recurring_expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can update own recurring expenses" ON public.recurring_expenses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can delete own recurring expenses" ON public.recurring_expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Categories are public (read-only for all authenticated users)
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired insights
CREATE OR REPLACE FUNCTION public.clean_expired_insights()
RETURNS void AS $$
BEGIN
    DELETE FROM public.insights_cache
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_expenses ON public.expenses;
CREATE TRIGGER set_updated_at_expenses
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_budgets ON public.budgets;
CREATE TRIGGER set_updated_at_budgets
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_recurring_expenses ON public.recurring_expenses;
CREATE TRIGGER set_updated_at_recurring_expenses
    BEFORE UPDATE ON public.recurring_expenses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- VIEWS
-- =====================================================

-- View for monthly expense summary
CREATE OR REPLACE VIEW public.monthly_expense_summary AS
SELECT
    user_id,
    DATE_TRUNC('month', date) AS month,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MAX(amount) AS max_amount
FROM public.expenses
GROUP BY user_id, DATE_TRUNC('month', date);

-- View for category breakdown
CREATE OR REPLACE VIEW public.category_breakdown AS
SELECT
    e.user_id,
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    COUNT(*) AS transaction_count,
    SUM(e.amount) AS total_amount,
    DATE_TRUNC('month', e.date) AS month
FROM public.expenses e
LEFT JOIN public.categories c ON e.category_id = c.id
GROUP BY e.user_id, c.id, c.name, c.icon, c.color, DATE_TRUNC('month', e.date);

-- =====================================================
-- FIX EXISTING USERS
-- =====================================================

-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (Run these separately to check)
-- =====================================================

-- Verify all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('profiles', 'categories', 'budgets', 'expenses', 'chat_history', 'recurring_expenses', 'insights_cache', 'alerts')
-- ORDER BY table_name;

-- Verify all users have profiles
-- SELECT 
--     au.id,
--     au.email,
--     p.full_name,
--     CASE WHEN p.id IS NOT NULL THEN '✓ Has Profile' ELSE '✗ Missing Profile' END as status
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON au.id = p.id;

-- Verify triggers
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table, trigger_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema setup complete!';
    RAISE NOTICE '📊 All tables, indexes, policies, functions, triggers, and views created successfully.';
    RAISE NOTICE '👥 Existing users have been migrated to profiles table.';
END $$;
