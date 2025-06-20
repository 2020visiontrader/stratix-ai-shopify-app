import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Define paths that don't require authentication
const publicPaths = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/status',
  '/api/auth/logout',
  '/api/auth/forgot-password', 
  '/api/auth/reset-password',
  '/api/health',
];

// Function to check if the path matches any of the public paths
const isPublicPath = (path: string) => {
  return publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(`${publicPath}/`)
  );
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For API routes that need auth
  if (pathname.startsWith('/api/')) {
    // Check for Authorization header OR session cookie
    const authHeader = request.headers.get('authorization');
    const sessionCookie = request.cookies.get('session');
    
    if (authHeader?.startsWith('Bearer ') || sessionCookie?.value === 'demo-session-token') {
      // Let the API route handler verify the token
      return NextResponse.next();
    }
    
    // No valid authentication found
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // For frontend routes, check session cookie
  const session = request.cookies.get('session');
  
  if (!session?.value) {
    // Redirect to login if no session
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Allow access if session exists
  return NextResponse.next();
}

export const config = {
  // Apply middleware to dashboard routes and specific API routes that need protection
  // Exclude auth API routes and test files from middleware
  matcher: [
    '/dashboard/:path*',
    '/campaigns/:path*', 
    '/analytics/:path*',
    '/integrations/:path*',
    '/segments/:path*',
    '/testing/:path*',
    '/user/:path*',
    '/chat/:path*',
    '/api/campaigns/:path*',
    '/api/analytics/:path*',
    '/api/segments/:path*',
    '/api/testing/:path*',
    '/api/shopify/:path*',
    '/api/chat/:path*',
  ],
};
