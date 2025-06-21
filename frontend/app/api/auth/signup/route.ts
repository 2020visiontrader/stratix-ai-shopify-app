import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { email, password } = await req.json();
    
    // Log the signup attempt
    console.log(`Signup attempt for: ${email}`);
    
    // Here you would typically create a user in your database
    // For demonstration purposes, we'll just return a success response
    
    // Set a temporary session cookie
    cookies().set('session', 'new-user-session-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    
    console.log('Signup successful - cookie set');
    
    // Return success response
    return NextResponse.json({
      success: true,
      user: {
        id: 'new-user',
        email: email,
        role: 'user'
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
