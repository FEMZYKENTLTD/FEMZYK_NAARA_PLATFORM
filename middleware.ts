// src/middleware.ts
// ============================================================================
// Auth Middleware — Manages Supabase session refresh on every request.
// Redirects unauthenticated users away from protected routes.
// Redirects authenticated users away from auth pages.
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase client that can read/write cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Create a new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          });
          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth session (important for keeping users logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define which paths are "auth pages" (login/register)
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // Define which paths are public (no login required)
  const isPublicPage = pathname === '/' || pathname.startsWith('/verify');

  // If user is NOT logged in and trying to access a protected page
  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user IS logged in and trying to access login/register pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Tell Next.js which routes this middleware applies to
export const config = {
  matcher: [
    // Run on all routes EXCEPT static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|icons|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};