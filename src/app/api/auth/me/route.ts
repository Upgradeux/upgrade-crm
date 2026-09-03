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

      const FOUNDER_EMAILS = [
        'skalambe520@gmail.com',
        'iamsurajsavle@gmail.com',
        'upgradeux.agency@gmail.com',
        adminEmail,
      ].filter(Boolean);

      // Check if session belongs to valid admin/founder email and has not expired (30 days)
      const maxAgeMs = 1000 * 60 * 60 * 24 * 30;
      if (
        decoded &&
        FOUNDER_EMAILS.includes(decoded.email) &&
        Date.now() - (decoded.issuedAt || 0) < maxAgeMs
      ) {
        return NextResponse.json({
          authenticated: true,
          user: {
            email: decoded.email,
            name: decoded.name || 'Founder',
            memberId: decoded.memberId || (decoded.email.includes('suraj') ? 'member-suraj' : 'member-swapnil'),
            role: decoded.role || 'Founder',
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
