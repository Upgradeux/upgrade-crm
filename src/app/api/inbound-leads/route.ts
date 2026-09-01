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

    // 1. Detect if this is a standard Cal.com booking webhook
    const isCalComWebhook = Boolean(body.triggerEvent && body.payload);
    
    let finalName = '';
    let finalEmail = '';
    let finalPhone = '';
    let finalMessage = '';
    let interestList: string[] = [];
    let budget = body.budget;
    let deadline = body.deadline;
    let source: 'Website Contact Form' | 'Cal.com Booking' | 'API' = 'Website Contact Form';
    let meetingDate: string | undefined = undefined;

    if (isCalComWebhook) {
      const p = body.payload;
      const attendee = p.attendees?.[0] || {};
      finalName = attendee.name || p.title || 'Cal.com Client';
      finalEmail = attendee.email || '';
      finalPhone = p.responses?.phone || '';
      meetingDate = p.startTime;
      finalMessage = `Cal.com Discovery Booking scheduled for ${new Date(p.startTime).toLocaleString('en-US')}. Meeting Link: ${p.metadata?.videoCallUrl || 'Google Meet'}\nNotes: ${p.description || p.responses?.notes || 'None'}`;
      interestList = ['Discovery Demo Call', 'Full Package'];
      source = 'Cal.com Booking';
    } else {
      // Standard Website Form Payload
      const {
        name,
        contactName,
        companyName,
        email,
        phone,
        interest,
        interests = [],
        message,
        brief,
        notes,
      } = body;

      finalName = name || contactName || companyName || 'Inbound Prospect';
      finalEmail = email || '';
      finalPhone = phone || '';
      finalMessage = message || brief || notes || '';
      source = (body.source as any) || 'Website Contact Form';

      if (Array.isArray(interests) && interests.length > 0) {
        interestList = interests;
      } else if (interest) {
        interestList = Array.isArray(interest) ? interest : [interest];
      }
    }

    if (!finalName && !finalEmail && !finalPhone) {
      return NextResponse.json(
        { error: 'At least Name, Email, or Phone is required.' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const submission = {
      id: `inbound_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      email: finalEmail,
      phone: finalPhone,
      interests: interestList,
      message: finalMessage,
      budget: budget || undefined,
      deadline: deadline || undefined,
      source: source,
      status: 'new' as const,
      meetingDate: meetingDate,
      createdAt: new Date().toISOString(),
    };

    // Auto-persist directly to Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const cleanUrl = supabaseUrl.replace(/\/+$/, '');
        // 1. Insert into inbound_submissions table
        await fetch(`${cleanUrl}/rest/v1/inbound_submissions`, {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            id: submission.id,
            name: submission.name,
            email: submission.email || null,
            phone: submission.phone || null,
            interests: submission.interests || [],
            message: submission.message || '',
            budget: submission.budget || null,
            deadline: submission.deadline || null,
            source: submission.source,
            status: 'new',
            created_at: submission.createdAt,
          }),
        });
      } catch (err) {
        console.error('Failed saving to Supabase from /api/inbound-leads:', err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isCalComWebhook
          ? 'Cal.com booking captured in upgradeUX CRM'
          : 'Inbound submission received successfully by upgradeUX CRM',
        submission,
      },
      {
        status: 201,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const cleanUrl = supabaseUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/rest/v1/inbound_submissions?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const submissions = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          email: d.email || '',
          phone: d.phone || undefined,
          interests: Array.isArray(d.interests) ? d.interests : [],
          message: d.message || '',
          budget: d.budget || undefined,
          deadline: d.deadline || undefined,
          source: d.source || 'Website Contact Form',
          status: d.status || 'new',
          convertedLeadId: d.converted_lead_id || undefined,
          createdAt: d.created_at,
        }));

        return NextResponse.json(
          {
            status: 'active',
            count: submissions.length,
            submissions,
          },
          {
            headers: { 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
    } catch (e) {
      console.error('Error fetching submissions in GET /api/inbound-leads:', e);
    }
  }

  return NextResponse.json(
    {
      status: 'active',
      service: 'upgradeUX Inbound Leads & Cal.com Webhook',
      endpoint: '/api/inbound-leads',
      acceptedPayload: {
        name: 'Sarah Jenkins',
        email: 'sarah@nexusmedspa.com',
        phone: '+1 415-889-2041',
        interests: ['AI Automation', 'Web Development'],
        message: 'Looking for 24/7 AI Voice Receptionist + Clinic website redesign...',
        budget: '$8,500 - $12,000',
        deadline: 'Within 30 Days',
      },
    },
    {
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  );
}
