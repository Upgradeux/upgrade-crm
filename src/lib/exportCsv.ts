import { Lead, ServiceType, LeadStatus, OutreachStage } from '@/types/crm';
import { generateUUID } from './utils';

export function exportLeadsToCsv(leads: Lead[]): void {
  if (!leads.length) return;

  const headers = [
    'Company Name',
    'Contact Name',
    'Website',
    'Location',
    'Phone',
    'Email',
    'Status',
    'Outreach Stage',
    'Deal Value ($)',
    'Service Interest',
    'Lead Owner',
    'LinkedIn',
    'Twitter',
    'Instagram',
    'Date Added',
  ];

  const rows = leads.map((lead) => [
    `"${(lead.companyName || '').replace(/"/g, '""')}"`,
    `"${(lead.contactName || '').replace(/"/g, '""')}"`,
    `"${(lead.websiteUrl || '').replace(/"/g, '""')}"`,
    `"${(lead.location || '').replace(/"/g, '""')}"`,
    `"${(lead.phone || '').replace(/"/g, '""')}"`,
    `"${(lead.email || '').replace(/"/g, '""')}"`,
    `"${lead.status}"`,
    `"${lead.outreachStage}"`,
    lead.dealValue || 0,
    `"${lead.serviceInterest}"`,
    `"${lead.leadOwner || ''}"`,
    `"${lead.socials?.linkedin || ''}"`,
    `"${lead.socials?.twitter || ''}"`,
    `"${lead.socials?.instagram || ''}"`,
    `"${lead.createdAt}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `agency_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
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

    const companyName = leadMap['company name'] || leadMap['company'] || leadMap['name'] || values[0] || 'Untitled Lead';
    const email = leadMap['email'] || leadMap['email address'] || '';
    const phone = leadMap['phone'] || leadMap['phone number'] || '';
    const websiteUrl = leadMap['website'] || leadMap['website url'] || leadMap['url'] || '';
    const location = leadMap['location'] || leadMap['city'] || 'Remote';
    const dealValue = parseFloat(leadMap['deal value'] || leadMap['budget'] || leadMap['deal value ($)'] || '5000') || 5000;
    const service = (leadMap['service interest'] || leadMap['service'] || 'AI Voice Agent') as ServiceType;
    const status = (leadMap['status'] || 'Not Contacted') as LeadStatus;
    const outreachStage = (leadMap['outreach stage'] || 'Needs Outreach') as OutreachStage;

    leads.push({
      id: generateUUID(),
      companyName,
      contactName: leadMap['contact name'] || leadMap['contact'] || '',
      email,
      phone,
      websiteUrl: websiteUrl.startsWith('http') ? websiteUrl : websiteUrl ? `https://${websiteUrl}` : '',
      location,
      dealValue,
      serviceInterest: service,
      status: ['Not Contacted', 'Contacted', 'Booked Call', 'In Processing / Proposal', 'Won', 'Lost'].includes(status) ? status : 'Not Contacted',
      outreachStage: ['Needs Outreach', 'Contacted', 'Follow-Up Needed', 'Closed'].includes(outreachStage) ? outreachStage : 'Needs Outreach',
      leadOwner: leadMap['lead owner'] || leadMap['owner'] || 'Alex Rivera',
      socials: {
        linkedin: leadMap['linkedin'] || '',
        twitter: leadMap['twitter'] || '',
        instagram: leadMap['instagram'] || '',
      },
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return leads;
}
