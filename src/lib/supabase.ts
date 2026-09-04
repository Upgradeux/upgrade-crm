import { Lead, Project, InboundSubmission, SupabaseConfig, TeamMember, TeamPresenceRecord, CRMTask, CRMNote, IndustrySpace } from '@/types/crm';

export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- SUPABASE DATABASE SCHEMA FOR WEB & AI AGENCY CRM
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================================================

-- 1. Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  website_url TEXT,
  location TEXT,
  phone TEXT,
  email TEXT,
  socials JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'Not Contacted',
  outreach_stage TEXT NOT NULL DEFAULT 'Needs Outreach',
  deal_value NUMERIC DEFAULT 0,
  service_interest TEXT DEFAULT 'AI Voice Agent',
  lead_owner TEXT DEFAULT 'Alex Rivera',
  notes JSONB DEFAULT '[]'::jsonb,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Projects Table (For 'Won' Clients)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT,
  company_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Build',
  progress_percent INTEGER DEFAULT 0,
  milestones JSONB DEFAULT '[]'::jsonb,
  budget NUMERIC DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT now(),
  target_delivery_date TIMESTAMPTZ,
  repo_url TEXT,
  figma_url TEXT,
  live_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Inbound Submissions Table (For Website Inquiries & Cal.com Webhooks)
CREATE TABLE IF NOT EXISTS public.inbound_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  message TEXT,
  budget TEXT,
  deadline TEXT,
  source TEXT DEFAULT 'Website Contact Form',
  status TEXT DEFAULT 'new',
  converted_lead_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS) & Allow Anonymous Read/Write with Anon Key
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public anon access for CRM leads" ON public.leads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public anon access for CRM projects" ON public.projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public anon access for CRM inbound submissions" ON public.inbound_submissions
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable Realtime Sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbound_submissions;
`;

export function getSupabaseEnvConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}

/**
 * Safe fetch wrapper that handles network errors, timeouts, and unconfigured URLs cleanly
 * without throwing uncaught exceptions, AbortErrors, or crashing Next.js dev overlays.
 */
async function safeSupabaseFetch(url: string, options: RequestInit, timeoutMs = 4000): Promise<Response | null> {
  if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return null;
  }
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer: any = null;

    const fetchOpts: RequestInit = {
      ...options,
      ...(controller ? { signal: controller.signal } : {}),
    };

    const fetchPromise = (async () => {
      try {
        return await fetch(url, fetchOpts);
      } catch {
        return null;
      }
    })();

    const timeoutPromise = new Promise<null>((resolve) => {
      timer = setTimeout(() => {
        if (controller) {
          try {
            controller.abort();
          } catch {}
        }
        resolve(null);
      }, timeoutMs);
    });

    const res = await Promise.race([fetchPromise, timeoutPromise]);
    if (timer) clearTimeout(timer);
    return res;
  } catch {
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'Please provide both Supabase URL and Anon Key.' };
    }
    const cleanUrl = url.replace(/\/+$/, '');
    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/leads?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    }, 5000);

    if (!res) {
      return { success: false, message: 'Could not connect to Supabase endpoint (Network timeout or invalid URL).' };
    }

    if (res.ok) {
      return { success: true, message: 'Successfully connected to Supabase PostgreSQL database!' };
    } else if (res.status === 404 || res.status === 400) {
      return {
        success: true,
        message: 'Connected to Supabase! (Note: Remember to run the SQL migration script to create the `leads` table).',
      };
    } else {
      const errText = await res.text().catch(() => '');
      return { success: false, message: `Supabase Error (${res.status}): ${errText || 'Invalid credentials'}` };
    }
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to connect to Supabase endpoint.' };
  }
}

export function ensureValidUuid(id: string): string {
  if (!id) return '00000000-0000-4000-8000-000000000000';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `00000000-0000-4000-8000-${hex.padStart(12, '0')}`;
}

export async function syncLeadsToSupabase(leads: Lead[], config: SupabaseConfig): Promise<boolean> {
  if (!config.isConnected || !config.url || !config.anonKey) return false;
  if (leads.length === 0) return true;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const formatted = leads.map((l) => ({
      id: ensureValidUuid(l.id),
      company_name: l.companyName,
      contact_name: l.contactName || null,
      website_url: l.websiteUrl || null,
      location: l.location || null,
      phone: l.phone || null,
      email: l.email || null,
      socials: {
        ...(l.socials || {}),
        _activityLogs: l.activityLogs || [],
        _activeFollowUp: l.activeFollowUp || null,
        _followUps: l.followUps || [],
        _nextFollowUpDate: l.nextFollowUpDate || null,
        _bookedMeetingDate: l.bookedMeetingDate || null,
        _googleMeetLink: l.googleMeetLink || null,
        _rating: l.rating || null,
        _reviewCount: l.reviewCount || null,
        _followers: l.followers || null,
      },
      status: l.status,
      outreach_stage: l.outreachStage,
      deal_value: l.dealValue || 0,
      service_interest: l.serviceInterest,
      lead_owner: l.leadOwner || 'Alex Rivera',
      notes: l.notes || [],
      last_contacted_at: l.lastContactedAt || null,
      created_at: l.createdAt,
      updated_at: new Date().toISOString(),
    }));

    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(formatted),
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function fetchLeadsFromSupabase(config: SupabaseConfig): Promise<Lead[] | null> {
  if (!config.isConnected || !config.url || !config.anonKey) return null;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/leads?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) return null;

    return data.map((d: any) => ({
      id: d.id,
      companyName: d.company_name,
      contactName: d.contact_name,
      websiteUrl: d.website_url,
      location: d.location,
      phone: d.phone,
      email: d.email,
      socials: d.socials || {},
      source: d.source || 'Google Maps',
      status: d.status,
      outreachStage: d.outreach_stage,
      dealValue: Number(d.deal_value) || 0,
      serviceInterest: d.service_interest,
      leadOwner: d.lead_owner,
      notes: d.notes || [],
      activityLogs: d.activity_logs || d.socials?._activityLogs || [],
      lastContactedAt: d.last_contacted_at,
      activeFollowUp: d.active_follow_up || d.socials?._activeFollowUp || undefined,
      followUps: d.follow_ups || d.socials?._followUps || [],
      nextFollowUpDate: d.next_follow_up_date || d.socials?._nextFollowUpDate || undefined,
      bookedMeetingDate: d.booked_meeting_date || d.socials?._bookedMeetingDate || undefined,
      googleMeetLink: d.google_meet_link || d.socials?._googleMeetLink || undefined,
      rating: d.rating || d.socials?._rating || undefined,
      reviewCount: d.review_count || d.socials?._reviewCount || undefined,
      followers: d.followers || d.socials?._followers || undefined,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch {
    return null;
  }
}

export async function syncProjectsToSupabase(projects: Project[], config: SupabaseConfig): Promise<boolean> {
  if (!config.isConnected || !config.url || !config.anonKey) return false;
  if (projects.length === 0) return true;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const formatted = projects.map((p) => ({
      id: ensureValidUuid(p.id),
      company_id: p.companyId || null,
      company_name: p.companyName,
      project_name: p.projectName,
      service_type: p.serviceType,
      status: p.status,
      progress_percent: p.progressPercent || 0,
      milestones: p.milestones || [],
      budget: p.budget || 0,
      start_date: p.startDate,
      target_delivery_date: p.targetDeliveryDate || null,
      repo_url: p.repoUrl || null,
      figma_url: p.figmaUrl || null,
      live_url: p.liveUrl || null,
      client_access_key: p.clientAccessKey || null,
      client_notes: p.clientNotes || null,
      industry: p.industry || 'General',
      industry_space_id: p.industrySpaceId || 'all',
      created_at: p.createdAt,
      updated_at: new Date().toISOString(),
    }));

    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/projects`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(formatted),
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function fetchProjectsFromSupabase(config: SupabaseConfig): Promise<Project[] | null> {
  if (!config.isConnected || !config.url || !config.anonKey) return null;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/projects?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) return null;

    return data.map((d: any) => ({
      id: d.id,
      companyId: d.company_id || '',
      companyName: d.company_name,
      projectName: d.project_name,
      serviceType: d.service_type,
      status: d.status,
      progressPercent: Number(d.progress_percent) || 0,
      milestones: d.milestones || [],
      budget: Number(d.budget) || 0,
      startDate: d.start_date,
      targetDeliveryDate: d.target_delivery_date || '',
      repoUrl: d.repo_url || '',
      figmaUrl: d.figma_url || '',
      liveUrl: d.live_url || '',
      clientAccessKey: d.client_access_key || '',
      clientNotes: d.client_notes || '',
      industry: d.industry || 'General',
      industrySpaceId: d.industry_space_id || 'all',
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch {
    return null;
  }
}

export async function saveInboundSubmissionToSupabase(
  submission: InboundSubmission,
  config: { url: string; anonKey: string }
): Promise<boolean> {
  if (!config.url || !config.anonKey) return false;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const row = {
      id: submission.id,
      name: submission.name,
      email: submission.email || null,
      phone: submission.phone || null,
      interests: submission.interests || [],
      message: submission.message || '',
      budget: submission.budget || null,
      deadline: submission.deadline || null,
      source: submission.source || 'Website Contact Form',
      status: submission.status || 'new',
      converted_lead_id: submission.convertedLeadId || null,
      created_at: submission.createdAt || new Date().toISOString(),
    };

    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/inbound_submissions`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(row),
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function fetchInboundSubmissionsFromSupabase(
  config: SupabaseConfig
): Promise<InboundSubmission[] | null> {
  const url = (config.url || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (config.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) return null;
  try {
    const cleanUrl = url.replace(/\/+$/, '');
    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/inbound_submissions?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) return null;

    return data
      .filter(
        (d: any) =>
          d.name !== '_crm_team_presence_sync' &&
          d.id !== '00000000-0000-4000-8000-000000000099' &&
          ((d.email && d.email.trim().length > 3) ||
            (d.phone && d.phone.trim().length > 4) ||
            (d.message && d.message.trim().length > 2) ||
            (d.name && d.name !== 'Inbound Prospect' && d.name.trim().length > 1))
      )
      .map((d: any) => ({
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
  } catch {
    return null;
  }
}

export async function updateInboundSubmissionInSupabase(
  id: string,
  updates: Partial<InboundSubmission>,
  config: SupabaseConfig
): Promise<boolean> {
  if (!config.isConnected || !config.url || !config.anonKey) return false;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const patchBody: any = {};
    if (updates.status) patchBody.status = updates.status;
    if (updates.convertedLeadId) patchBody.converted_lead_id = updates.convertedLeadId;

    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/inbound_submissions?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function deleteInboundSubmissionFromSupabase(
  id: string,
  config: SupabaseConfig
): Promise<boolean> {
  if (!config.isConnected || !config.url || !config.anonKey) return false;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/inbound_submissions?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function clearAllInboundSubmissionsFromSupabase(
  config: { url: string; anonKey: string }
): Promise<boolean> {
  if (!config.url || !config.anonKey) return false;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/inbound_submissions?id=not.is.null`, {
      method: 'DELETE',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function deleteLeadFromSupabase(
  id: string,
  config: { url: string; anonKey: string }
): Promise<boolean> {
  if (!config.url || !config.anonKey) return false;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const validId = ensureValidUuid(id);
    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/leads?id=eq.${encodeURIComponent(validId)}`, {
      method: 'DELETE',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function deleteProjectFromSupabase(
  id: string,
  config: { url: string; anonKey: string }
): Promise<boolean> {
  if (!config.url || !config.anonKey) return false;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const validId = ensureValidUuid(id);
    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/projects?id=eq.${encodeURIComponent(validId)}`, {
      method: 'DELETE',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function syncTeamPresenceToSupabase(
  teamMembers: TeamMember[],
  presence: TeamPresenceRecord[],
  config: SupabaseConfig
): Promise<boolean> {
  const url = (config.url || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (config.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) return false;
  try {
    const cleanUrl = url.replace(/\/+$/, '');
    const metaRecord = {
      id: '00000000-0000-4000-8000-000000000099',
      name: '_crm_team_presence_sync',
      email: 'team@upgradeux.internal',
      source: 'system_presence',
      status: 'synced',
      message: JSON.stringify({
        teamMembers,
        presence,
        syncedAt: new Date().toISOString(),
      }),
      created_at: new Date().toISOString(),
    };

    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/inbound_submissions`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify([metaRecord]),
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function fetchTeamPresenceFromSupabase(
  config: SupabaseConfig
): Promise<{ teamMembers?: TeamMember[]; presence?: TeamPresenceRecord[] } | null> {
  const url = (config.url || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (config.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) return null;
  try {
    const cleanUrl = url.replace(/\/+$/, '');
    const res = await safeSupabaseFetch(
      `${cleanUrl}/rest/v1/inbound_submissions?name=eq._crm_team_presence_sync&select=*`,
      {
        method: 'GET',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      },
      3000
    );

    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data) || data.length === 0) return null;
    const item = data[0];
    if (item?.message) {
      try {
        return JSON.parse(item.message);
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export interface WorkspaceMetaPayload {
  tasks?: CRMTask[];
  notes?: CRMNote[];
  scratchpad?: string;
  spaces?: IndustrySpace[];
  syncedAt?: string;
}

export async function syncWorkspaceMetaToSupabase(
  payload: WorkspaceMetaPayload,
  config: { url: string; anonKey: string; isConnected?: boolean }
): Promise<boolean> {
  const url = (config.url || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (config.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) return false;
  try {
    const cleanUrl = url.replace(/\/+$/, '');
    const metaRecord = {
      id: '00000000-0000-4000-8000-000000000098',
      name: '_crm_workspace_meta_sync',
      email: 'workspace@upgradeux.internal',
      source: 'workspace_meta',
      status: 'synced',
      message: JSON.stringify({
        ...payload,
        syncedAt: new Date().toISOString(),
      }),
      created_at: new Date().toISOString(),
    };

    const res = await safeSupabaseFetch(`${cleanUrl}/rest/v1/inbound_submissions`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify([metaRecord]),
    });

    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

export async function fetchWorkspaceMetaFromSupabase(
  config: { url: string; anonKey: string; isConnected?: boolean }
): Promise<WorkspaceMetaPayload | null> {
  const url = (config.url || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (config.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) return null;
  try {
    const cleanUrl = url.replace(/\/+$/, '');
    const res = await safeSupabaseFetch(
      `${cleanUrl}/rest/v1/inbound_submissions?name=eq._crm_workspace_meta_sync&select=*`,
      {
        method: 'GET',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      },
      3000
    );

    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data) || data.length === 0) return null;
    const item = data[0];
    if (item?.message) {
      try {
        return JSON.parse(item.message);
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearAllSupabaseTables(config: { url: string; anonKey: string; isConnected?: boolean }): Promise<boolean> {
  if (!config.url || !config.anonKey) return false;
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    await Promise.all([
      safeSupabaseFetch(`${cleanUrl}/rest/v1/leads?id=not.is.null`, {
        method: 'DELETE',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
        },
      }),
      safeSupabaseFetch(`${cleanUrl}/rest/v1/projects?id=not.is.null`, {
        method: 'DELETE',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
        },
      }),
      safeSupabaseFetch(`${cleanUrl}/rest/v1/inbound_submissions?id=not.is.null`, {
        method: 'DELETE',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
        },
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

