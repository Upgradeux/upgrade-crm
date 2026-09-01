'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { LeadStatus, OutreachStage, ServiceType, LeadSource, CallOutcome } from '@/types/crm';
import {
  IconBuilding,
  IconCurrencyDollar,
  IconMapPin,
  IconMail,
  IconPhone,
  IconUser,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconPhoneCall,
  IconRoute,
} from '@tabler/icons-react';

export function NewLeadModal() {
  const { 
    isNewLeadModalOpen, 
    setIsNewLeadModalOpen, 
    addLead, 
    teamMembers,
    spaces,
    activeSpaceId,
  } = useCRM();

  const [selectedSpaceId, setSelectedSpaceId] = useState(
    activeSpaceId !== 'all' ? activeSpaceId : 'real-estate'
  );
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [location, setLocation] = useState('Austin, TX');
  const [mapsUrl, setMapsUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSource>('Google Maps');
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Not Called');
  const [dealValue, setDealValue] = useState(7500);
  const [serviceInterest, setServiceInterest] = useState<ServiceType>('AI Voice Agent');
  const [status, setStatus] = useState<LeadStatus>('Not Contacted');
  const [outreachStage, setOutreachStage] = useState<OutreachStage>('Needs Outreach');
  const [leadOwner, setLeadOwner] = useState('Unassigned');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [initialNote, setInitialNote] = useState('');

  React.useEffect(() => {
    if (isNewLeadModalOpen) {
      if (activeSpaceId !== 'all') {
        setSelectedSpaceId(activeSpaceId);
      }
      if (teamMembers.length > 0 && leadOwner === 'Unassigned') {
        setLeadOwner(`${teamMembers[0].name} (${teamMembers[0].role.split(' ')[0]})`);
      }
    }
  }, [isNewLeadModalOpen, activeSpaceId, teamMembers, leadOwner]);

  const spaceOptions = spaces
    .filter((s) => s.id !== 'all')
    .map((s) => ({
      value: s.id,
      label: s.name,
    }));

  const sourceOptions = [
    { value: 'Google Maps', label: 'Google Maps' },
    { value: 'Instagram', label: 'Instagram DM / Explore' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'Cold Email', label: 'Cold Email Outreach' },
    { value: 'Website Inbound', label: 'Website Form' },
    { value: 'Referral', label: 'Client Referral' },
    { value: 'Other', label: 'Other Channel' },
  ];

  const teamMemberOptions = teamMembers.length > 0
    ? teamMembers.map((m) => ({
        value: `${m.name} (${m.role.split(' ')[0]})`,
        label: `${m.name} (${m.role.split(' ')[0]})`,
        badge: (
          <span
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8.5px] font-bold text-white uppercase shrink-0"
            style={{ backgroundColor: m.avatarColor || '#6366f1' }}
          >
            {m.name.charAt(0)}
          </span>
        ),
      }))
    : [{ value: 'Unassigned', label: 'Unassigned (No team members added)' }];

  const serviceOptions = [
    { value: 'AI Voice Agent', label: 'AI Voice Agent' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Workflow / n8n Automation', label: 'Workflow Automation' },
    { value: 'AI Chatbot', label: 'AI Chatbot' },
    { value: 'Monthly Retainer', label: 'Monthly Retainer' },
  ];

  const statusOptions = [
    { value: 'Not Contacted', label: 'Not Contacted' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Booked Call', label: 'Booked Call' },
    { value: 'In Processing / Proposal', label: 'In Processing / Proposal' },
    { value: 'Won', label: 'Won Deal' },
    { value: 'Lost', label: 'Lost' },
  ];

  const outreachOptions = [
    { value: 'Needs Outreach', label: 'Needs Cold Outreach' },
    { value: 'Contacted', label: 'In Outreach / Spoken' },
    { value: 'Follow-Up Needed', label: 'Follow-Up Needed' },
    { value: 'Closed', label: 'Closed' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const matchedSpace = spaces.find((s) => s.id === selectedSpaceId);

    addLead({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      websiteUrl: websiteUrl.trim(),
      location: location.trim() || 'Remote',
      mapsUrl: mapsUrl.trim() || undefined,
      phone: phone.trim(),
      email: email.trim(),
      source,
      callOutcome,
      dealValue: Number(dealValue) || 0,
      serviceInterest,
      industrySpaceId: selectedSpaceId,
      industry: matchedSpace?.name || 'Real Estate & Properties',
      status,
      outreachStage,
      leadOwner: leadOwner.trim() || 'Alex (Founder)',
      socials: {
        linkedin: linkedin.trim() || undefined,
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        maps: mapsUrl.trim() || undefined,
      },
      initialNote: initialNote.trim() || undefined,
    });

    // Reset form
    setCompanyName('');
    setContactName('');
    setWebsiteUrl('');
    setPhone('');
    setEmail('');
    setInstagram('');
    setLinkedin('');
    setInitialNote('');
    setIsNewLeadModalOpen(false);
  };

  return (
    <Modal
      isOpen={isNewLeadModalOpen}
      onClose={() => setIsNewLeadModalOpen(false)}
      title="Add New Client Prospect"
      subtitle="Track leads found on Google Maps, Instagram, LinkedIn, or Cold Calls"
      maxWidth="max-w-[580px]"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-[12px]">
        {/* Industry Space & Source */}
        <div className="grid grid-cols-2 gap-3 p-2.5 rounded-[8px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)]">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Industry Space / Niche
            </label>
            <Dropdown
              value={selectedSpaceId}
              onChange={setSelectedSpaceId}
              options={spaceOptions}
              size="sm"
              buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Lead Sourced From
            </label>
            <Dropdown
              value={source}
              onChange={(val) => setSource(val as LeadSource)}
              options={sourceOptions}
              size="sm"
              buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
            />
          </div>
        </div>

        {/* Assigned Member */}
        <div className="p-2.5 rounded-[8px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)]">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Assigned Team Member
            </label>
            <Dropdown
              value={leadOwner}
              onChange={setLeadOwner}
              options={teamMemberOptions}
              size="sm"
              buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
            />
          </div>
        </div>

        {/* Company Name & Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Business / Company Name <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              autoFocus
              placeholder="e.g. Austin Dental Clinic"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              leftIcon={<IconBuilding size={14} />}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Location / City
            </label>
            <Input
              placeholder="e.g. Austin, TX"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              leftIcon={<IconMapPin size={14} />}
            />
          </div>
        </div>

        {/* Contact Person & Deal Value */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Owner / Contact Person
            </label>
            <Input
              placeholder="e.g. Dr. John Miller (Owner)"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              leftIcon={<IconUser size={14} />}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Estimated Deal Budget ($)
            </label>
            <Input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(Number(e.target.value))}
              leftIcon={<IconCurrencyDollar size={14} />}
            />
          </div>
        </div>

        {/* Service & Initial Pipeline Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Service to Pitch
            </label>
            <Dropdown
              value={serviceInterest}
              onChange={(val) => setServiceInterest(val as ServiceType)}
              options={serviceOptions}
              size="sm"
              buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Pipeline Stage
            </label>
            <Dropdown
              value={status}
              onChange={(val) => {
                const s = val as LeadStatus;
                setStatus(s);
                if (s === 'Not Contacted') setOutreachStage('Needs Outreach');
                else if (s === 'Contacted' || s === 'Booked Call' || s === 'In Processing / Proposal') {
                  setOutreachStage('Contacted');
                } else {
                  setOutreachStage('Closed');
                }
              }}
              options={statusOptions}
              size="sm"
              buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
            />
          </div>
        </div>

        {/* Phone, Email, Socials */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Phone Number (For Calling)
            </label>
            <Input
              type="tel"
              placeholder="+1 (512) 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<IconPhone size={14} />}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="owner@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<IconMail size={14} />}
            />
          </div>
        </div>

        {/* Digital Profiles & Maps */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Google Maps Place URL
            </label>
            <Input
              placeholder="https://maps.google.com/?q=..."
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              leftIcon={<IconMapPin size={14} className="text-emerald-500" />}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Website URL
            </label>
            <Input
              placeholder="https://business.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10.5px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              X (Twitter)
            </label>
            <Input
              placeholder="@handle or URL"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              leftIcon={<IconBrandX size={13} />}
            />
          </div>

          <div>
            <label className="text-[10.5px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Instagram
            </label>
            <Input
              placeholder="@handle or URL"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              leftIcon={<IconBrandInstagram size={13} className="text-pink-500" />}
            />
          </div>

          <div>
            <label className="text-[10.5px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              LinkedIn
            </label>
            <Input
              placeholder="linkedin.com/..."
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              leftIcon={<IconBrandLinkedin size={13} className="text-sky-500" />}
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
            Cold Call / Outreach Notes
          </label>
          <textarea
            rows={2}
            value={initialNote}
            onChange={(e) => setInitialNote(e.target.value)}
            placeholder="e.g. Sourced from Google Maps 4.8 stars. Needs 24/7 AI receptionist to handle missed weekend bookings..."
            className="w-full bg-[var(--t-background-transparent-lighter)] border border-[var(--t-border-color-medium)] rounded-[8px] p-2 text-[12px] text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)] outline-none focus:border-[#5d4ef7] resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--t-border-color-light)]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setIsNewLeadModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            Save Client Prospect
          </Button>
        </div>
      </form>
    </Modal>
  );
}
