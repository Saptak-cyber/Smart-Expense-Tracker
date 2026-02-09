# Troubleshooting Guide

## Error: "violates foreign key constraint expenses_user_id_fkey"

This error means your user profile wasn't created in the `profiles` table when you signed up.

### Quick Fix (Automatic)

1. **Visit the fix page**: http://localhost:3001/fix-profile
2. The page will automatically:
   - Check if you're logged in
   - Check if your profile exists
   - Create your profile if missing
   - Redirect you to the dashboard

### Manual Fix (SQL)

If the automatic fix doesn't work, run this in Supabase SQL Editor:

```sql
-- Check which users are missing profiles
SELECT 
    au.id,
    au.email,
    CASE WHEN p.id IS NULL THEN '❌ Missing' ELSE '✅ Exists' END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;

-- Create profiles for users who don't have one
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify all users now have profiles
SELECT COUNT(*) as users_with_profiles FROM public.profiles;
SELECT COUNT(*) as total_users FROM auth.users;
-- These numbers should match!
```

### Why This Happens

The `profiles` table should be automatically populated by a database trigger when you sign up. If it didn't work:

1. **Trigger wasn't created**: Run `supabase-fix-profiles.sql` to recreate it
2. **Trigger failed silently**: The fix scripts handle this
3. **You signed up before running the schema**: The fix scripts handle this too

### Prevent Future Issues

Run the complete schema from `supabase-fix-profiles.sql` which includes:
- Improved trigger with error handling
- Automatic profile creation with fallbacks
- Conflict resolution (ON CONFLICT DO UPDATE)

## Error: "Invalid login credentials"

**Cause**: The user doesn't exist or password is wrong.

**Solutions**:
1. Make sure you signed up first at `/signup`
2. Check your email and password
3. Try resetting your password in Supabase Dashboard

## Error: "Email not confirmed"

**Cause**: Email confirmation is enabled in Supabase.

**Solution**: Disable email confirmation for development:
1. Go to Supabase Dashboard → Authentication → Providers → Email
2. Uncheck "Enable email confirmations"
3. Save

## Error: "relation 'categories' does not exist"

**Cause**: Database schema wasn't run.

**Solution**:
1. Go to Supabase SQL Editor
2. Paste contents of `supabase-schema.sql`
3. Click "Run"
4. Verify by running: `SELECT * FROM categories;`

## Testing Your Setup

### 1. Test Database Connection
Visit: http://localhost:3001/test-connection

Should show:
- ✅ Database connected
- ✅ Categories found
- ✅ Auth status

### 2. Test Profile Creation
Visit: http://localhost:3001/fix-profile

Should show:
- ✅ Authenticated
- ✅ Profile exists or created

### 3. Test Full Flow
1. Signup at `/signup`
2. Should redirect to `/dashboard`
3. Click "Add Expense"
4. Fill form and submit
5. Should see expense in list

## Still Having Issues?

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" → "Postgres Logs"
3. Look for errors related to triggers or foreign keys

### Verify RLS Policies
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Reset Everything (Nuclear Option)
```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.insights_cache CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Then run supabase-schema.sql again
```

## Getting Help

If you're still stuck:
1. Check the browser console for errors
2. Check Supabase logs
3. Verify your `.env.local` has correct values
4. Make sure you ran both SQL files:
   - `supabase-schema.sql` (initial setup)
   - `supabase-fix-profiles.sql` (fixes and improvements)
