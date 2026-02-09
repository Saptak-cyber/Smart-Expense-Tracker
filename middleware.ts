import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicPaths = ['/login', '/signup', '/'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path));

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('sb-access-token')?.value;
  
  if (!token) {
    // No token, ensure we check auth header for API routes
    if (pathname.startsWith('/api/')) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized - Missing authentication' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Let the API route handlers validate the token
      return NextResponse.next();
    }
    
    // Redirect to login for dashboard routes
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For dashboard routes, verify the token
  if (pathname.startsWith('/dashboard')) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        // Invalid token, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
