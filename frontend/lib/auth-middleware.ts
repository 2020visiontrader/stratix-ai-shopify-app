import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get cookie from request headers
    const cookieHeader = request.headers.get('cookie');
    
    if (!cookieHeader) {
      return null;
    }

    // Parse the session cookie
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    const sessionValue = sessionMatch ? sessionMatch[1] : null;
    
    if (!sessionValue) {
      return null;
    }

    // For demo purposes, accept the demo session token
    if (sessionValue === 'demo-session-token') {
      return {
        id: 'demo-user',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'admin'
      };
    }

    // In production, you would validate the session token here
    // against your database or authentication service
    
    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}
