# Supabase Setup Instructions

## Important: Disable Email Confirmation for Development

The 400 error you're seeing is likely because Supabase requires email confirmation by default.

### Steps to Fix:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/ltksbczyxrpcfnmhcfdo

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Providers" 
   - Find "Email" provider

3. **Disable Email Confirmation**
   - Scroll down to "Email Settings"
   - **UNCHECK** "Enable email confirmations"
   - Click "Save"

4. **Alternative: Enable Email Confirmations (Production)**
   If you want to keep email confirmations enabled:
   - Go to Authentication > Email Templates
   - Configure your email templates
   - Set up SMTP settings (or use Supabase's default)
   - Users will need to click the confirmation link in their email

## Testing the Fix

After disabling email confirmation:

1. Go to http://localhost:3001/signup
2. Create a new account with:
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123

3. You should be automatically logged in and redirected to the dashboard

## Database Schema

Make sure you've run the SQL schema:

1. Go to: https://supabase.com/dashboard/project/ltksbczyxrpcfnmhcfdo/editor
2. Click "SQL Editor"
3. Click "New Query"
4. Paste the entire contents of `supabase-schema.sql`
5. Click "Run"

You should see:
- ✓ Tables created (profiles, categories, expenses, budgets, insights_cache, alerts)
- ✓ RLS policies enabled
- ✓ Default categories inserted
- ✓ Triggers created

## Verify Setup

Check if everything is working:

```sql
-- Run this in SQL Editor to verify
SELECT * FROM categories;
```

You should see 10 default categories (Food & Dining, Transportation, etc.)

## Common Issues

### Issue: "violates foreign key constraint expenses_user_id_fkey"
**Solution**: Your user profile wasn't created. Run this fix:

1. Go to Supabase SQL Editor
2. Run the SQL from `supabase-fix-profiles.sql`
3. This will:
   - Create profiles for existing users
   - Fix the trigger to prevent future issues
4. Refresh your app and try again

**Quick Fix SQL**:
```sql
-- Create profile for existing users
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
```

### Issue: "Invalid login credentials"
**Solution**: The user doesn't exist yet. Sign up first, then login.

### Issue: "Email not confirmed"
**Solution**: Disable email confirmation (see steps above) or check your email for confirmation link.

### Issue: "User already registered"
**Solution**: Use the login page instead of signup.

### Issue: Tables don't exist
**Solution**: Run the SQL schema from `supabase-schema.sql` in the SQL Editor.
