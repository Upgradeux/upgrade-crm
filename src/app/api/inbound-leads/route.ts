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
      const p = body.payload || {};
      const attendee = p.attendees?.[0] || {};
      finalName = attendee.name || p.title || 'Cal.com Client';
      finalEmail = attendee.email || '';
      
      // Extract phone from responses if present
      finalPhone =
        (typeof p.responses?.phone === 'object' ? p.responses.phone.value : p.responses?.phone) ||
        (typeof p.responses?.phoneNumber === 'object' ? p.responses.phoneNumber.value : p.responses?.phoneNumber) ||
        '';
      meetingDate = p.startTime;

      const meetingLink = p.metadata?.videoCallUrl || p.videoCallUrl || p.location || 'Google Meet';
      const eventTitle = p.eventTitle || p.title || 'Book a Discovery Call';
      const formattedTime = p.startTime
        ? new Date(p.startTime).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'Scheduled';

      // Parse custom answers (e.g. "What is this meeting about?", "Additional notes", etc.)
      const customAnswers: string[] = [];

      if (p.responses && typeof p.responses === 'object') {
        for (const [key, val] of Object.entries(p.responses)) {
          // Skip standard fields like name/email/phone that are already captured
          if (['name', 'email', 'phone', 'guests', 'rescheduleReason'].includes(key.toLowerCase())) continue;

          let label = key;
          let value: any = val;

          if (val && typeof val === 'object' && 'value' in (val as any)) {
            label = (val as any).label || key;
            value = (val as any).value;
          }

          if (value && typeof value === 'string' && value.trim()) {
            // Humanize label if it's a slug like "what_is_this_meeting_about" or "what-is-this-meeting-about"
            const cleanLabel = label
              .replace(/[-_]+/g, ' ')
              .trim()
              .split(' ')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(' ');
            customAnswers.push(`${cleanLabel}: ${value.trim()}`);
          }
        }
      }

      // Check customInputs array if present
      if (Array.isArray(p.customInputs)) {
        for (const input of p.customInputs) {
          if (input?.label && input?.value) {
            customAnswers.push(`${input.label}: ${input.value}`);
          }
        }
      }

      // Build clean message with client responses (No emojis)
      const messageLines: string[] = [];
      messageLines.push(`Event: ${eventTitle}`);
      messageLines.push(`Scheduled for: ${formattedTime}`);
      if (meetingLink) {
        messageLines.push(`Meeting Link: ${meetingLink}`);
      }

      if (customAnswers.length > 0) {
        messageLines.push('');
        messageLines.push('Client Responses:');
        messageLines.push(...customAnswers.map((a) => `• ${a}`));
      } else if (p.description) {
        messageLines.push('');
        messageLines.push(`Notes: ${p.description}`);
      }

      finalMessage = messageLines.join('\n');
      interestList = [eventTitle];
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

      finalName = (name || contactName || companyName || '').trim() || (email ? email.split('@')[0] : '') || 'Inbound Lead';
      finalEmail = (email || '').trim();
      finalPhone = (phone || '').trim();
      finalMessage = (message || brief || notes || '').trim();
      source = (body.source as any) || 'Website Contact Form';

      if (Array.isArray(interests) && interests.length > 0) {
        interestList = interests;
      } else if (interest) {
        interestList = Array.isArray(interest) ? interest : [interest];
      }
    }

    const hasRealData = Boolean(
      (finalEmail && finalEmail.length > 3) ||
      (finalPhone && finalPhone.length > 4) ||
      (finalMessage && finalMessage.length > 2) ||
      (body.name && body.name.trim().length > 1) ||
      (body.contactName && body.contactName.trim().length > 1) ||
      (body.companyName && body.companyName.trim().length > 1)
    );

    if (!hasRealData && !isCalComWebhook) {
      if (body.triggerEvent === 'PING' || body.ping) {
        return NextResponse.json(
          { success: true, message: 'Webhook verified successfully!' },
          { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
      return NextResponse.json(
        { error: 'At least real Name, Email, Phone, or Message is required.' },
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
