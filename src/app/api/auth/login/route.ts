import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide both email and password.' },
        { status: 400 }
      );
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password;

    // Validate credentials strictly on the server against environment variables
    if (
      !adminEmail ||
      !adminPassword ||
      inputEmail !== adminEmail ||
      inputPassword !== adminPassword
    ) {
      return NextResponse.json(
        { error: 'Invalid email or password. Access denied.' },
        { status: 401 }
      );
    }

    // Generate secure session payload
    const sessionToken = Buffer.from(
      JSON.stringify({
        email: inputEmail,
        name: 'upgradeUX Admin',
        role: 'superadmin',
        issuedAt: Date.now(),
      })
    ).toString('base64');

    const res = NextResponse.json({
      success: true,
      user: {
        email: inputEmail,
        name: 'upgradeUX Admin',
        role: 'superadmin',
      },
      message: 'Authentication successful.',
    });

    // 30 Days Persistent HttpOnly Cookie
    res.cookies.set({
      name: 'crm_auth_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Authentication error.' },
      { status: 500 }
    );
  }
}
