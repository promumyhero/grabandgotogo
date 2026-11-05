import { type NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseMiddlewareClient } from '@/utils/supabase/middleware';

/**
 * Next.js 16 Proxy (`src/proxy.ts` replaces deprecated `middleware.ts`).
 * Enforces:
 * 1. Supabase SSR session refresh
 * 2. CSRF Origin verification on mutating API requests (`POST`, `PUT`, `PATCH`, `DELETE`)
 * 3. OWASP HTTP Security Headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // CSRF Defense: Verify Origin header on state-changing requests to /api/auth/* and /api/pricings/*
  const isProtectedApi =
    pathname.startsWith('/api/auth/') || pathname.startsWith('/api/pricings/');
  const isMutatingMethod =
    method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

  if (isProtectedApi && isMutatingMethod) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { error: 'Forbidden: Cross-origin request blocked by CSRF policy' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Forbidden: Malformed Origin header' },
          { status: 403 }
        );
      }
    }
  }

  // Run Supabase SSR cookie synchronization
  const response = createSupabaseMiddlewareClient(request);

  // Apply strict OWASP HTTP Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

