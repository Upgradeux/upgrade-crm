import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('crm_auth_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    try {
      const decoded = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));
      const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

      // Check if session belongs to valid admin email and has not expired (30 days)
      const maxAgeMs = 1000 * 60 * 60 * 24 * 30;
      if (
        decoded &&
        decoded.email === adminEmail &&
        Date.now() - (decoded.issuedAt || 0) < maxAgeMs
      ) {
        return NextResponse.json({
          authenticated: true,
          user: {
            email: decoded.email,
            name: decoded.name || 'upgradeUX Admin',
            role: decoded.role || 'superadmin',
          },
        });
      }
    } catch {
      // Invalid cookie payload
    }

    return NextResponse.json({ authenticated: false }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
