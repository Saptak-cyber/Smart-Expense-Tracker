import { supabase } from './supabase';

/**
 * Ensures a user profile exists in the profiles table
 * This is a fallback in case the trigger didn't fire during signup
 */
export async function ensureUserProfile(userId: string, email: string, fullName?: string) {
  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // If profile exists, we're good
    if (existingProfile) {
      return { success: true };
    }

    // If profile doesn't exist, create it
    if (checkError && checkError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: email,
          full_name: fullName || email.split('@')[0],
        }]);

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return { success: false, error: insertError };
      }

      return { success: true, created: true };
    }

    return { success: false, error: checkError };
  } catch (error) {
    console.error('Error ensuring profile:', error);
    return { success: false, error };
  }
}
