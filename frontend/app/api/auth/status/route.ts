import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Get the session cookie
  const sessionCookie = cookies().get('session');
  console.log('Session cookie in status check:', sessionCookie?.value || 'not found');
  
  // If no session cookie, return unauthenticated
  if (!sessionCookie?.value) {
    return NextResponse.json({ 
      authenticated: false,
      message: 'No session cookie found'
    });
  }
  
  // Check for demo session
  if (sessionCookie.value === 'demo-session-token') {
    console.log('Demo session found - user is authenticated');
    return NextResponse.json({
      authenticated: true,
      user: {
        id: 'demo-user',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'admin'
      }
    });
  }
  
  // For all other sessions, return unauthenticated
  // In a real app, you would validate with the backend here
  return NextResponse.json({ 
    authenticated: false,
    message: 'Invalid session token'
  });
}
