import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { email, password } = await req.json();
    
    // Log the login attempt
    console.log(`Login attempt for: ${email}`);
    
    // Check for demo login credentials
    if (email === 'demo@example.com' && password === 'password') {
      // Set session cookie
      cookies().set('session', 'demo-session-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
      });
      
      console.log('Demo login successful - cookie set');
      
      // Return success response
      return NextResponse.json({
        success: true,
        user: {
          id: 'demo-user',
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin'
        }
      });
    }
    
    // If not demo login, try backend or return error
    return NextResponse.json({ 
      error: 'Invalid credentials. Only demo login is supported.' 
    }, { status: 401 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
