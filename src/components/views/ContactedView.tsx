'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  IconClock,
  IconCalendarEvent,
  IconPhoneCall,
  IconMapPin,
  IconMessageCircle,
  IconSearch,
  IconExternalLink,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconBrandX,
  IconMail,
  IconVideo,
} from '@tabler/icons-react';
import { formatCurrency, formatRelativeTime, formatDate, getGoogleMapsUrl, getTwitterUrl } from '@/lib/utils';

export function ContactedView() {
  const {
    leads,
    openLeadDrawer,
    setMeetingModalLead,
    setWhatsAppLeadModal,
    setInstagramDMLeadModal,
    setEmailComposerLeadModal,
    addNote,
    currency,
  } = useCRM();

  const [filterChip, setFilterChip] = useState<'all' | 'Booked Call' | 'In Processing / Proposal'>('all');
  const [search, setSearch] = useState('');
  const [quickNoteId, setQuickNoteId] = useState<string | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');

  // Filter leads in dialogue
  const activeLeads = leads.filter((l) => {
    if (l.status === 'Not Contacted') return false;
    if (filterChip === 'Booked Call') if (l.status !== 'Booked Call') return false;
    if (filterChip === 'In Processing / Proposal') if (l.status !== 'In Processing / Proposal') return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.companyName.toLowerCase().includes(q) ||
        l.contactName?.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSaveQuickNote = (leadId: string) => {
    if (!quickNoteText.trim()) return;
    addNote(leadId, quickNoteText.trim(), 'note');
    setQuickNoteText('');
    setQuickNoteId(null);
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-hidden bg-[var(--t-background-primary)] flex flex-col gap-2 select-none">
      {/* Twenty Style Compact Horizontal Toolbar */}
      <div className="h-[38px] px-2.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-[180px] sm:w-[220px]">
            <Input
              placeholder="Search contacted leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<IconSearch size={13} />}
              className="h-[26px] text-[12px] bg-[var(--t-background-primary)]"
            />
          </div>

          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All Active' },
              { id: 'Booked Call', label: 'Booked Meetings' },
              { id: 'In Processing / Proposal', label: 'Proposals Sent' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilterChip(chip.id as any)}
                className={`h-[24px] px-2 rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer ${
                  filterChip === chip.id
                    ? 'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] font-semibold shadow-2xs'
                    : 'text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] font-mono text-[var(--t-font-color-tertiary)] shrink-0 hidden sm:inline">
          {activeLeads.length} in dialogue
        </div>
      </div>

      {/* Twenty CRM High-Density Table for Contacted Leads */}
      <div className="flex-1 overflow-auto border border-[var(--t-border-color-light)] rounded-[6px] bg-[var(--t-background-primary)]">
        <table className="w-full text-left text-[12px] border-collapse min-w-[840px]">
          <thead className="bg-[var(--t-background-secondary)] sticky top-0 z-10 border-b border-[var(--t-border-color-light)] text-[var(--t-font-color-tertiary)] text-[10.5px] font-medium uppercase tracking-wider">
            <tr>
              <th className="py-2 px-3 font-medium min-w-[190px]">Prospect Business</th>
              <th className="py-2 px-3 font-medium text-right w-[90px] whitespace-nowrap">Deal Value</th>
              <th className="py-2 px-3 font-medium w-[120px] whitespace-nowrap">Status</th>
              <th className="py-2 px-3 font-medium min-w-[130px] whitespace-nowrap">Service</th>
              <th className="py-2 px-3 font-medium min-w-[120px] whitespace-nowrap">Assigned</th>
              <th className="py-2 px-3 font-medium w-[110px] whitespace-nowrap">Last Contact</th>
              <th className="py-2 px-3 font-medium text-right w-[140px] whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]">
            {activeLeads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => openLeadDrawer(lead.id)}
                className="hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer group h-[38px] align-middle"
              >
                {/* Company Name */}
                <td className="py-1.5 px-3 font-normal text-[var(--t-font-color-primary)]">
                  <div className="flex items-center gap-1.5">
                    <span className="group-hover:underline truncate max-w-[180px]">
                      {lead.companyName}
                    </span>
                    <Badge value={lead.source || 'Google Maps'} size="sm" />
                  </div>
                  {lead.contactName && (
                    <div className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-normal truncate max-w-[180px]">
                      {lead.contactName}
                    </div>
                  )}
                </td>

                {/* Deal Value */}
                <td className="py-1.5 px-3 font-mono text-[12px] text-[var(--t-font-color-primary)] text-right whitespace-nowrap">
                  {formatCurrency(lead.dealValue, currency)}
                </td>

                {/* Status */}
                <td className="py-1.5 px-3 whitespace-nowrap">
                  <Badge value={lead.status} size="sm" />
                </td>

                {/* Service */}
                <td className="py-1.5 px-3 whitespace-nowrap">
                  <Badge variant="service" size="sm">
                    {lead.serviceInterest}
                  </Badge>
                </td>

                {/* Assigned Team */}
                <td className="py-1.5 px-3 text-[11px] text-[var(--t-font-color-primary)] whitespace-nowrap truncate max-w-[120px]">
                  {lead.leadOwner}
                </td>

                {/* Last Contact */}
                <td className="py-1.5 px-3 text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono whitespace-nowrap">
                  {formatRelativeTime(lead.lastContactedAt)}
                </td>

                {/* Actions */}
                <td className="py-1.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="subtle"
                      size="sm"
                      leftIcon={<IconCalendarEvent size={11} className="text-emerald-500" />}
                      onClick={() => setMeetingModalLead(lead)}
                      className="h-[22px] px-2 text-[10.5px]"
                    >
                      Book Meet
                    </Button>
                    {lead.phone && (
                      <button
                        onClick={() => setWhatsAppLeadModal(lead)}
                        className="p-1 text-[var(--t-font-color-tertiary)] hover:text-emerald-400 rounded transition-colors"
                        title="Send WhatsApp Follow-Up"
                      >
                        <IconBrandWhatsapp size={13} />
                      </button>
                    )}
                    {lead.email && (
                      <button
                        onClick={() => setEmailComposerLeadModal(lead)}
                        className="p-1 text-[var(--t-font-color-tertiary)] hover:text-blue-400 rounded transition-colors"
                        title="Send Direct Email"
                      >
                        <IconMail size={13} />
                      </button>
                    )}
                    {lead.socials?.twitter && (
                      <a
                        href={getTwitterUrl(lead.socials.twitter)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] rounded transition-colors"
                        title={`Open on X (Twitter): ${lead.socials.twitter}`}
                      >
                        <IconBrandX size={13} />
                      </a>
                    )}
                    {lead.socials?.instagram && (
                      <button
                        onClick={() => setInstagramDMLeadModal(lead)}
                        className="p-1 text-[var(--t-font-color-tertiary)] hover:text-pink-500 rounded transition-colors"
                        title="Send Instagram DM"
                      >
                        <IconBrandInstagram size={13} />
                      </button>
                    )}
                    {lead.socials?.linkedin && (
                      <a
                        href={lead.socials.linkedin.startsWith('http') ? lead.socials.linkedin : `https://${lead.socials.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-[var(--t-font-color-tertiary)] hover:text-sky-500 rounded transition-colors"
                        title="LinkedIn"
                      >
                        <IconBrandLinkedin size={13} />
                      </a>
                    )}
                    <a
                      href={getGoogleMapsUrl(lead)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-emerald-500 rounded transition-colors"
                      title="Open on Google Maps"
                    >
                      <IconMapPin size={13} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}

            {activeLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[var(--t-font-color-tertiary)]">
                  No active follow-ups found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
