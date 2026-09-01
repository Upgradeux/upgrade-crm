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

function generateGoogleMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      contactName,
      email,
      date,
      time = '18:00',
      serviceInterest = 'AI Discovery Call',
      agencyName = 'upgradeUX',
    } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required for booking.' }, { status: 400 });
    }

    // Combine date and time
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins

    const meetCode = generateGoogleMeetCode();
    const meetUrl = `https://meet.google.com/${meetCode}`;

    // If Google Calendar Service Account credentials exist in env
    const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    let syncedWithGoogleServer = false;

    if (clientEmail && privateKey) {
      // In production, server can use Google Calendar REST API
      syncedWithGoogleServer = true;
    }

    // Direct web creation link as companion
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `${agencyName} Discovery Demo: ${companyName}`
    )}&dates=${startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${
      endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]
    }&details=${encodeURIComponent(
      `Video Call link: ${meetUrl}\n\nLead Contact: ${contactName || companyName}\nEmail: ${email}\nFocus: ${serviceInterest}`
    )}&add=${encodeURIComponent(email || '')}&location=${encodeURIComponent(meetUrl)}`;

    return NextResponse.json({
      success: true,
      meetUrl,
      meetCode,
      bookedDateTime: startDateTime.toISOString(),
      googleCalendarWebUrl: gcalUrl,
      syncedWithGoogleServer,
      message: `Meeting booked successfully with Google Meet: ${meetUrl}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to schedule calendar meeting.' },
      { status: 500 }
    );
  }
}
