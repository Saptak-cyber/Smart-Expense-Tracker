import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { getEnv } from './env';

// Server-side Supabase client for auth validation
const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Validates the JWT token from the Authorization header and returns the authenticated user
 * @param request - Next.js request object
 * @returns AuthUser object or null if invalid
 */
export async function validateAuthToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return null;
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Check if token is empty or invalid
    if (!token || token.length < 20) {
      console.log('Token is empty or too short');
      return null;
    }

    // Verify the JWT token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('Auth validation error:', error?.message || 'Unknown error');
      return null;
    }

    return {
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Error validating auth token:', error);
    return null;
  }
}

/**
 * Extract and validate user from request
 * Returns user or throws appropriate NextResponse error
 */
export async function requireAuth(request: NextRequest) {
  const user = await validateAuthToken(request);
  
  if (!user) {
    return {
      error: true,
      response: new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or missing token' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }

  return { error: false, user };
}
