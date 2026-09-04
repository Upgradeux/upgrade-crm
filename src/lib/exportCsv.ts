import { Lead, ServiceType, LeadStatus, OutreachStage } from '@/types/crm';
import { generateUUID, getGoogleMapsUrl, getInstagramUrl, getLinkedInUrl, getTwitterUrl, getFacebookUrl } from './utils';

export function exportLeadsToCsv(leads: Lead[]): void {
  if (!leads.length) return;

  const headers = [
    'ID',
    'Company Name',
    'Contact Name',
    'Primary Phone',
    'Alternate Phone',
    'Email Address',
    'Location / City',
    'Website URL',
    'Google Maps URL',
    'Instagram Handle / URL',
    'LinkedIn URL',
    'Facebook URL',
    'Twitter / X URL',
    'Star Rating',
    'Review Count',
    'Followers Count',
    'Pipeline Status',
    'Outreach Stage',
    'Call Outcome',
    'Deal Value ($)',
    'Primary Service',
    'All Services / Scope',
    'Industry Space',
    'Assigned Team Member',
    'Last Contacted At',
    'Next Follow-Up Scheduled',
    'Follow-Up Channel',
    'Booked Meeting Date',
    'Google Meet Link',
    'Notes / Bio Summary',
    'Created At',
    'Updated At',
  ];

  const rows = leads.map((lead) => {
    const mapsLink = lead.mapsUrl || lead.socials?.maps || getGoogleMapsUrl(lead);
    const igLink = lead.socials?.instagram ? getInstagramUrl(lead.socials.instagram) : '';
    const liLink = lead.socials?.linkedin ? getLinkedInUrl(lead.socials.linkedin) : '';
    const fbLink = lead.socials?.facebook ? getFacebookUrl(lead.socials.facebook) : '';
    const twLink = lead.socials?.twitter ? getTwitterUrl(lead.socials.twitter) : '';
    
    const notesSummary = (lead.notes || [])
      .map((n) => n.content)
      .filter(Boolean)
      .join(' | ') || (lead as any).initialNote || '';

    const allServices = (lead.services && lead.services.length > 0)
      ? lead.services.join('; ')
      : lead.serviceInterest || '';

    return [
      `"${(lead.id || '').replace(/"/g, '""')}"`,
      `"${(lead.companyName || '').replace(/"/g, '""')}"`,
      `"${(lead.contactName || '').replace(/"/g, '""')}"`,
      `"${(lead.phone || '').replace(/"/g, '""')}"`,
      `"${(lead.alternatePhone || '').replace(/"/g, '""')}"`,
      `"${(lead.email || '').replace(/"/g, '""')}"`,
      `"${(lead.location || '').replace(/"/g, '""')}"`,
      `"${(lead.websiteUrl || '').replace(/"/g, '""')}"`,
      `"${mapsLink.replace(/"/g, '""')}"`,
      `"${igLink.replace(/"/g, '""')}"`,
      `"${liLink.replace(/"/g, '""')}"`,
      `"${fbLink.replace(/"/g, '""')}"`,
      `"${twLink.replace(/"/g, '""')}"`,
      lead.rating !== undefined && lead.rating !== null ? lead.rating : '',
      lead.reviewCount !== undefined && lead.reviewCount !== null ? lead.reviewCount : '',
      `"${(lead.followers || '').replace(/"/g, '""')}"`,
      `"${lead.status}"`,
      `"${lead.outreachStage}"`,
      `"${lead.callOutcome || 'Not Called'}"`,
      lead.dealValue || 0,
      `"${lead.serviceInterest || ''}"`,
      `"${allServices.replace(/"/g, '""')}"`,
      `"${(lead.industry || 'All Spaces').replace(/"/g, '""')}"`,
      `"${(lead.leadOwner || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(lead.lastContactedAt || '').replace(/"/g, '""')}"`,
      `"${(lead.nextFollowUpDate || lead.activeFollowUp?.scheduledDate || '').replace(/"/g, '""')}"`,
      `"${(lead.activeFollowUp?.channel || '').replace(/"/g, '""')}"`,
      `"${(lead.bookedMeetingDate || '').replace(/"/g, '""')}"`,
      `"${(lead.googleMeetLink || '').replace(/"/g, '""')}"`,
      `"${notesSummary.replace(/"/g, '""')}"`,
      `"${lead.createdAt || ''}"`,
      `"${lead.updatedAt || ''}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `upgradeux_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCsvToLeads(csvText: string): Partial<Lead>[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header line
  const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const leads: Partial<Lead>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple regex for CSV tokens handling quotes
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim().replace(/^["']|["']$/g, ''));

    const leadMap: Record<string, string> = {};
    headers.forEach((h, idx) => {
      leadMap[h] = values[idx] || '';
    });

    const companyName = leadMap['company name'] || leadMap['company'] || leadMap['name'] || values[1] || values[0] || 'Untitled Lead';
    const email = leadMap['email address'] || leadMap['email'] || '';
    const phone = leadMap['primary phone'] || leadMap['phone'] || leadMap['phone number'] || '';
    const alternatePhone = leadMap['alternate phone'] || leadMap['alt phone'] || '';
    const websiteUrl = leadMap['website url'] || leadMap['website'] || leadMap['url'] || '';
    const mapsUrl = leadMap['google maps url'] || leadMap['maps url'] || leadMap['maps'] || '';
    const location = leadMap['location / city'] || leadMap['location'] || leadMap['city'] || '';
    const dealValue = parseFloat(leadMap['deal value ($)'] || leadMap['deal value'] || leadMap['budget'] || '0') || 0;
    const service = (leadMap['primary service'] || leadMap['service interest'] || leadMap['service'] || 'Web Development') as ServiceType;
    const status = (leadMap['pipeline status'] || leadMap['status'] || 'Leads') as LeadStatus;
    const outreachStage = (leadMap['outreach stage'] || 'Needs Outreach') as OutreachStage;
    const rating = leadMap['star rating'] ? parseFloat(leadMap['star rating']) : undefined;
    const reviewCount = leadMap['review count'] ? parseInt(leadMap['review count'], 10) : undefined;
    const followers = leadMap['followers count'] || leadMap['followers'] || undefined;

    leads.push({
      id: generateUUID(),
      companyName,
      contactName: leadMap['contact name'] || leadMap['contact'] || '',
      email,
      phone,
      alternatePhone,
      websiteUrl: websiteUrl.startsWith('http') ? websiteUrl : websiteUrl ? `https://${websiteUrl}` : '',
      mapsUrl: mapsUrl || undefined,
      location,
      dealValue,
      serviceInterest: service,
      rating,
      reviewCount,
      followers,
      status: ['Leads', 'Not Contacted', 'Contacted', 'Booked Meeting', 'Booked Call', 'Proposal Sent', 'In Processing / Proposal', 'Won', 'Lost'].includes(status) ? status : 'Leads',
      outreachStage: ['Needs Outreach', 'Contacted', 'Follow-Up Needed', 'Closed'].includes(outreachStage) ? outreachStage : 'Needs Outreach',
      leadOwner: leadMap['assigned team member'] || leadMap['lead owner'] || leadMap['owner'] || 'Swapnil (Founder)',
      socials: {
        linkedin: leadMap['linkedin url'] || leadMap['linkedin'] || '',
        twitter: leadMap['twitter / x url'] || leadMap['twitter'] || '',
        instagram: leadMap['instagram handle / url'] || leadMap['instagram'] || '',
        facebook: leadMap['facebook url'] || leadMap['facebook'] || '',
        maps: mapsUrl || '',
      },
      notes: leadMap['notes / bio summary'] ? [{
        id: generateUUID(),
        content: leadMap['notes / bio summary'],
        createdAt: new Date().toISOString(),
        author: leadMap['assigned team member'] || 'Founder',
        type: 'note'
      }] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return leads;
}
