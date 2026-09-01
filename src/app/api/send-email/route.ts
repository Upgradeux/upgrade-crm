import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      subject,
      text,
      html,
      fromName = 'upgradeUX Outreach',
      replyTo,
    } = body;

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and text/html are required.' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@upgradeux.in';
    
    // Free webmail providers (gmail/yahoo/outlook) cannot be used as Resend from envelope sender
    if (
      fromEmail.toLowerCase().includes('@gmail.') ||
      fromEmail.toLowerCase().includes('@yahoo.') ||
      fromEmail.toLowerCase().includes('@outlook.') ||
      fromEmail.toLowerCase().includes('@hotmail.')
    ) {
      fromEmail = 'hello@upgradeux.in';
    }

    const finalReplyTo = replyTo || 'upgradeux.agency@gmail.com';

    // 1. If RESEND_API_KEY is configured, send directly via Resend REST API
    if (resendApiKey) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: Array.isArray(to) ? to : [to],
          reply_to: finalReplyTo,
          subject: subject,
          text: text,
          html: html || `<p style="font-family: sans-serif; white-space: pre-wrap;">${text}</p>`,
        }),
      });

      const resData = await resendResponse.json();

      if (!resendResponse.ok) {
        return NextResponse.json(
          {
            error: resData.message || 'Resend email delivery failed',
            details: resData,
          },
          { status: resendResponse.status }
        );
      }

      return NextResponse.json({
        success: true,
        provider: 'resend',
        id: resData.id,
        message: `Email successfully sent to ${to} via Resend!`,
      });
    }

    // 2. Fallback simulation if running in dev without keys configured yet
    return NextResponse.json({
      success: true,
      provider: 'simulation',
      note: 'RESEND_API_KEY not configured in .env.local — logged to CRM history.',
      message: `[Simulated Dispatch] Email sent to ${to}: "${subject}"`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
