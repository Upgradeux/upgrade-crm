'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Lead } from '@/types/crm';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  IconCheck,
  IconCalendarEvent,
  IconExternalLink,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconSparkles,
  IconPhone,
  IconCopy,
  IconMapPin,
  IconInbox,
  IconBrandWhatsapp,
  IconBrandX,
  IconMail,
  IconSearch,
} from '@tabler/icons-react';
import { formatCurrency, getGoogleMapsUrl, getTwitterUrl, matchLeadSearch } from '@/lib/utils';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

export function NeedsOutreachView() {
  const {
    leads,
    markLeadContacted,
    bookCall,
    openLeadDrawer,
    setWhatsAppLeadModal,
    setInstagramDMLeadModal,
    setEmailComposerLeadModal,
    setMeetingModalLead,
    currency,
    addToast,
  } = useCRM();

  const [aiPitchLead, setAiPitchLead] = useState<Lead | null>(null);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [search, setSearch] = useState('');

  // Cold leads queue: outreachStage is Needs Outreach or status is Leads / Not Contacted
  const coldLeads = leads.filter(
    (l) =>
      (l.outreachStage === 'Needs Outreach' || l.status === 'Leads' || l.status === 'Not Contacted') &&
      matchLeadSearch(l, search)
  );

  const generatePitchText = (lead: Lead) => {
    if (lead.serviceInterest === 'AI Voice Agent') {
      return `Hi ${lead.contactName || 'Team at ' + lead.companyName},\n\nFound ${lead.companyName} on ${lead.source || 'Google Maps'}. We build custom 24/7 AI Voice Receptionists for local businesses that handle customer inquiries in <500ms and book appointments directly into your calendar.\n\nCould I send a quick 60-second interactive audio sample for ${lead.companyName}?\n\nBest,\nAlex | upgradeUX Studio`;
    }
    if (lead.serviceInterest === 'Workflow / n8n Automation') {
      return `Hey ${lead.contactName || 'Team'},\n\nSaw your operations at ${lead.companyName}. We build autonomous n8n workflows that eliminate manual data entry across CRMs, email leads, and follow-ups.\n\nCould I send a 3-minute Loom showing how we automate lead routing?\n\nCheers,\nAlex | upgradeUX`;
    }
    return `Hi ${lead.contactName || 'there'},\n\nCame across ${lead.companyName} on ${lead.source || 'Instagram'}. We build modern Next.js web experiences and AI automated sales funnels.\n\nAre you looking to upgrade your digital presence this quarter?\n\nBest,\nAlex | upgradeUX`;
  };

  const handleCopyPitch = () => {
    if (!aiPitchLead) return;
    navigator.clipboard.writeText(generatePitchText(aiPitchLead));
    setCopiedPitch(true);
    addToast('Pitch copied to clipboard!', 'info');
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-y-auto bg-[var(--t-background-primary)] flex flex-col gap-2.5">
      {/* Header Banner & Search */}
      <div className="p-2 sm:px-2.5 sm:py-1.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        <div className="flex-1 min-w-0 sm:max-w-[280px]">
          <Input
            placeholder="Search by phone, name, email, link, handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<IconSearch size={13} />}
            className="h-6.5 text-[12px] bg-[var(--t-background-primary)] w-full"
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-[11.5px]">
          <span className="font-medium text-[var(--t-font-color-primary)]">
            Cold Queue ({coldLeads.length})
          </span>
          <div className="text-[11px] font-mono text-[var(--t-font-color-tertiary)] shrink-0">
            Total: <span className="text-[var(--t-font-color-primary)] font-semibold">{formatCurrency(coldLeads.reduce((a, b) => a + (b.dealValue || 0), 0), currency)}</span>
          </div>
        </div>
      </div>

      {/* Leads List */}
      {coldLeads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)]">
          <div className="w-[36px] h-[36px] rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
            <IconInbox size={18} />
          </div>
          <h3 className="text-[13px] font-medium text-[var(--t-font-color-primary)]">
            Cold Outreach Queue Cleared!
          </h3>
          <p className="text-[11.5px] text-[var(--t-font-color-tertiary)] mt-1">
            No leads currently require initial contact. Add new prospects from Google Maps, Instagram, or inbound forms.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto">
          {coldLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => openLeadDrawer(lead.id)}
              className="p-2.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] transition-all cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-2 shadow-2xs"
            >
              {/* Left Info */}
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-[var(--t-font-color-primary)] group-hover:underline truncate">
                      {lead.companyName}
                    </span>
                    <Badge value={lead.source || 'Google Maps'} size="sm" />
                    <Badge variant="service" size="sm">
                      {lead.serviceInterest}
                    </Badge>
                    <span className="font-mono text-[11.5px] text-[var(--t-font-color-primary)]">
                      {formatCurrency(lead.dealValue, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10.5px] text-[var(--t-font-color-tertiary)] mt-0.5">
                    <span>Contact: {lead.contactName || 'Business Owner'}</span>
                    <span>•</span>
                    <a
                      href={getGoogleMapsUrl(lead)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-0.5 text-[var(--t-font-color-tertiary)] hover:text-emerald-500 transition-colors"
                      title="Open in Google Maps"
                    >
                      <IconMapPin size={11} className="text-emerald-500/70 shrink-0" />
                      <span className="hover:underline">{lead.location}</span>
                    </a>
                    <span>•</span>
                    <span>Assigned: {lead.leadOwner}</span>
                  </div>
                </div>
              </div>

              {/* Right Quick Actions */}
              <div
                className="flex items-center gap-1.5 shrink-0 self-end lg:self-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* AI Pitch Trigger */}
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={<IconSparkles size={12} />}
                  onClick={() => setAiPitchLead(lead)}
                >
                  AI Hook
                </Button>

                {/* Direct Calling & Social Jump */}
                <div className="flex items-center gap-1 bg-[var(--t-background-primary)] px-1 py-0.5 rounded-[4px] border border-[var(--t-border-color-light)]">
                  {lead.phone && (
                    <button
                      onClick={() => setWhatsAppLeadModal(lead)}
                      title="Send WhatsApp Follow-Up"
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-emerald-400 transition-colors"
                    >
                      <IconBrandWhatsapp size={13} />
                    </button>
                  )}
                  {lead.email && (
                    <button
                      onClick={() => setEmailComposerLeadModal(lead)}
                      title="Send Direct Email"
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-blue-400 transition-colors"
                    >
                      <IconMail size={13} />
                    </button>
                  )}
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      title={`Call ${lead.phone}`}
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-emerald-400 transition-colors"
                    >
                      <IconPhone size={13} />
                    </a>
                  )}
                  {lead.socials?.twitter && (
                    <a
                      href={getTwitterUrl(lead.socials.twitter)}
                      target="_blank"
                      rel="noreferrer"
                      title={`Open on X (Twitter): ${lead.socials.twitter}`}
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] transition-colors"
                    >
                      <IconBrandX size={13} />
                    </a>
                  )}
                  {lead.socials?.instagram && (
                    <button
                      onClick={() => setInstagramDMLeadModal(lead)}
                      title="Send Instagram DM"
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-pink-500 transition-colors"
                    >
                      <IconBrandInstagram size={13} />
                    </button>
                  )}
                  {lead.socials?.linkedin && (
                    <a
                      href={lead.socials.linkedin.startsWith('http') ? lead.socials.linkedin : `https://${lead.socials.linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open LinkedIn"
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-sky-500 transition-colors"
                    >
                      <IconBrandLinkedin size={13} />
                    </a>
                  )}
                  <a
                    href={getGoogleMapsUrl(lead)}
                    target="_blank"
                    rel="noreferrer"
                    title="Open on Google Maps"
                    className="p-1 text-[var(--t-font-color-tertiary)] hover:text-emerald-500 transition-colors"
                  >
                    <IconMapPin size={13} />
                  </a>
                  {lead.websiteUrl && (
                    <a
                      href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Visit Website"
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] transition-colors"
                    >
                      <IconExternalLink size={13} />
                    </a>
                  )}
                </div>

                {/* Book Demo */}
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={<IconCalendarEvent size={12} />}
                  onClick={() => bookCall(lead.id)}
                >
                  Book Call
                </Button>

                {/* Mark Contacted */}
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<IconCheck size={12} />}
                  onClick={() => markLeadContacted(lead.id)}
                >
                  Contacted
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Pitch Modal */}
      {aiPitchLead && (
        <Modal
          isOpen={Boolean(aiPitchLead)}
          onClose={() => setAiPitchLead(null)}
          title={`upgradeUX Pitch Hook for ${aiPitchLead.companyName}`}
          subtitle={`Personalized pitch tailored for ${aiPitchLead.serviceInterest}`}
        >
          <div className="space-y-3 text-[12px]">
            <div className="p-3 bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] rounded-[6px] font-sans whitespace-pre-wrap leading-relaxed text-[var(--t-font-color-primary)] text-[12px]">
              {generatePitchText(aiPitchLead)}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[var(--t-border-color-light)]">
              <Button
                variant="subtle"
                size="sm"
                leftIcon={<IconCheck size={12} />}
                onClick={() => {
                  markLeadContacted(aiPitchLead.id);
                  setAiPitchLead(null);
                }}
              >
                Mark Contacted & Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAiPitchLead(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={copiedPitch ? <IconCheck size={12} /> : <IconCopy size={12} />}
                  onClick={handleCopyPitch}
                >
                  {copiedPitch ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
