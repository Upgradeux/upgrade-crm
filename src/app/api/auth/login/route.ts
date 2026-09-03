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
    const adminPassword = process.env.ADMIN_PASSWORD || 'Upgradeuxcrm@leads';
    const swapnilPassword = process.env.SWAPNIL_PASSWORD || 'Upgradeux@swapnil2026';
    const surajPassword = process.env.SURAJ_PASSWORD || 'Upgradeux@suraj2026';

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password;

    const FOUNDERS: Record<string, { name: string; memberId: string; validPasswords: string[] }> = {
      'skalambe520@gmail.com': {
        name: 'Swapnil',
        memberId: 'member-swapnil',
        validPasswords: [swapnilPassword, adminPassword],
      },
      'iamsurajsavle@gmail.com': {
        name: 'Suraj',
        memberId: 'member-suraj',
        validPasswords: [surajPassword, adminPassword],
      },
      'upgradeux.agency@gmail.com': {
        name: 'Swapnil',
        memberId: 'member-swapnil',
        validPasswords: [adminPassword, swapnilPassword],
      },
    };

    const founderInfo = FOUNDERS[inputEmail];

    if (!founderInfo || !founderInfo.validPasswords.includes(inputPassword)) {
      return NextResponse.json(
        { error: 'Invalid email or password. Access denied.' },
        { status: 401 }
      );
    }

    // Generate secure session payload
    const sessionToken = Buffer.from(
      JSON.stringify({
        email: inputEmail,
        name: founderInfo.name,
        memberId: founderInfo.memberId,
        role: 'Founder',
        issuedAt: Date.now(),
      })
    ).toString('base64');

    const res = NextResponse.json({
      success: true,
      user: {
        email: inputEmail,
        name: founderInfo.name,
        memberId: founderInfo.memberId,
        role: 'Founder',
      },
      message: `Welcome back, ${founderInfo.name}!`,
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
