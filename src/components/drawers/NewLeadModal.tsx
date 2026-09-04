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
  IconSparkles,
  IconCheck,
} from '@tabler/icons-react';

const AVAILABLE_SERVICES: ServiceType[] = [
  'Web Development',
  'Google Business Profile',
  'AI Voice Agent',
  'AI Automation',
  'Meta Ads',
  'AI Chatbot',
  'Workflow / n8n Automation',
  'Monthly Retainer',
  'Lead Generation',
];

export function NewLeadModal() {
  const { 
    isNewLeadModalOpen, 
    setIsNewLeadModalOpen, 
    addLead, 
    teamMembers,
    activeMemberId,
    currentUser,
    spaces,
    activeSpaceId,
    addToast,
  } = useCRM();

  const [selectedSpaceId, setSelectedSpaceId] = useState(activeSpaceId || 'all');

  // Smart Auto-Fill State
  const [autoFillUrl, setAutoFillUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState<string[]>([]);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Clean empty lead state (No fake/hardcoded default data)
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [location, setLocation] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<LeadSource>('Google Maps');
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Not Called');
  const [dealValue, setDealValue] = useState<number>(0);
  const [serviceInterest, setServiceInterest] = useState<ServiceType>('Web Development');
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>(['Web Development']);
  const [status, setStatus] = useState<LeadStatus>('Leads');
  const [outreachStage, setOutreachStage] = useState<OutreachStage>('Needs Outreach');
  const [leadOwner, setLeadOwner] = useState('Swapnil');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [reviewCount, setReviewCount] = useState<number | undefined>(undefined);
  const [followers, setFollowers] = useState<string | undefined>(undefined);
  const [initialNote, setInitialNote] = useState('');

  const toggleService = (svc: ServiceType) => {
    setSelectedServices((prev) => {
      const exists = prev.includes(svc);
      const updated = exists ? prev.filter((s) => s !== svc) : [...prev, svc];
      if (updated.length > 0) {
        setServiceInterest(updated[0]);
      }
      return updated;
    });
  };

  React.useEffect(() => {
    if (isNewLeadModalOpen) {
      setSelectedSpaceId(activeSpaceId || 'all');
      
      // Default assigned member based on logged in user
      const currentMember = teamMembers.find(
        (m) => m.id === activeMemberId || (currentUser?.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
      ) || teamMembers[0];

      if (currentMember) {
        setLeadOwner(currentMember.name);
      }
    }
  }, [isNewLeadModalOpen, activeSpaceId, teamMembers, activeMemberId, currentUser]);

  const spaceOptions = [
    { value: 'all', label: 'All Spaces (General / Global)' },
    ...spaces
      .filter((s) => s.id !== 'all')
      .map((s) => ({
        value: s.id,
        label: s.name,
      })),
  ];

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
        value: m.name,
        label: `${m.name} (${m.role})`,
        badge: (
          <span
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8.5px] font-bold text-white uppercase shrink-0"
            style={{ backgroundColor: m.avatarColor || '#6366f1' }}
          >
            {m.name.charAt(0)}
          </span>
        ),
      }))
    : [{ value: 'Unassigned', label: 'Unassigned' }];

  const statusOptions = [
    { value: 'Leads', label: 'Leads (New Queue)' },
    { value: 'Not Contacted', label: 'Not Contacted' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Booked Meeting', label: 'Booked Meeting' },
    { value: 'Proposal Sent', label: 'Proposal Sent' },
    { value: 'Lost', label: 'Lost' },
    { value: 'Won', label: 'Won Deal' },
  ];

  const handleExtractLead = async () => {
    if (!autoFillUrl.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    setExtractedFields([]);

    try {
      const res = await fetch('/api/extract-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: autoFillUrl.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Could not extract data from the provided link');
      }

      const d = json.data;
      const found: string[] = [];

      if (d.companyName) {
        setCompanyName(d.companyName);
        found.push('Business Name');
      }
      if (d.contactName) {
        setContactName(d.contactName);
        found.push(`Owner: ${d.contactName}`);
      }
      if (d.location) {
        setLocation(d.location);
        found.push('Location');
      }
      if (d.phone) {
        setPhone(d.phone);
        found.push('Primary Phone');
      }
      if (d.alternatePhone) {
        setAlternatePhone(d.alternatePhone);
        found.push('Alt Phone');
      }
      if (d.email) {
        setEmail(d.email);
        found.push('Email');
      }
      if (d.websiteUrl) {
        setWebsiteUrl(d.websiteUrl);
        found.push('Website');
        setSelectedServices(['AI Voice Agent']);
        setServiceInterest('AI Voice Agent');
      } else {
        // Client has NO website -> default to Web Development ONLY
        setWebsiteUrl('');
        setSelectedServices(['Web Development']);
        setServiceInterest('Web Development');
        found.push('No Website (Pitched Web Dev)');
      }
      if (d.mapsUrl) {
        setMapsUrl(d.mapsUrl);
        found.push('Google Maps');
      }
      if (d.instagram) {
        setInstagram(d.instagram);
        found.push('Instagram');
      }
      if (d.followers) {
        setFollowers(d.followers);
        found.push(d.followers);
      }
      if (d.rating) {
        setRating(d.rating);
        if (d.reviewCount) {
          setReviewCount(d.reviewCount);
          found.push(`Rating: ${d.rating} (${d.reviewCount} Reviews)`);
        } else {
          found.push(`Rating: ${d.rating}`);
        }
      }
      if (d.linkedin) {
        setLinkedin(d.linkedin);
        found.push('LinkedIn');
      }
      if (d.twitter) {
        setTwitter(d.twitter);
        found.push('X (Twitter)');
      }
      if (d.source) {
        setSource(d.source);
      }
      if (d.notes) {
        setInitialNote(d.notes);
        found.push('Bio / Notes');
      }

      setExtractedFields(found);
      addToast(`Extracted ${found.length} details accurately!`, 'success');
    } catch (err: any) {
      setExtractError(err.message || 'Failed to auto-fill details');
      addToast(err.message || 'Failed to extract link', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleResetAndClose = () => {
    setCompanyName('');
    setContactName('');
    setWebsiteUrl('');
    setLocation('');
    setMapsUrl('');
    setPhone('');
    setAlternatePhone('');
    setEmail('');
    setDealValue(0);
    setTwitter('');
    setInstagram('');
    setLinkedin('');
    setRating(undefined);
    setReviewCount(undefined);
    setFollowers(undefined);
    setStatus('Leads');
    setOutreachStage('Needs Outreach');
    setSelectedServices(['Web Development']);
    setServiceInterest('Web Development');
    setExtractedFields([]);
    setExtractError(null);
    setIsNewLeadModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const matchedSpace = spaces.find((s) => s.id === selectedSpaceId);

    addLead({
      companyName: companyName.trim(),
      contactName: contactName.trim() || undefined,
      websiteUrl: websiteUrl.trim() || '',
      location: location.trim() || '',
      mapsUrl: mapsUrl.trim() || undefined,
      phone: phone.trim() || '',
      alternatePhone: alternatePhone.trim() || undefined,
      email: email.trim() || '',
      source,
      callOutcome,
      dealValue: Number(dealValue) || 0,
      serviceInterest: selectedServices[0] || serviceInterest,
      services: selectedServices.length > 0 ? selectedServices : [serviceInterest],
      industrySpaceId: selectedSpaceId === 'all' ? 'all' : selectedSpaceId,
      industry: selectedSpaceId === 'all' ? 'All Spaces' : matchedSpace?.name || 'All Spaces',
      status,
      outreachStage,
      leadOwner: leadOwner.trim() || 'Unassigned',
      rating,
      reviewCount,
      followers,
      socials: {
        linkedin: linkedin.trim() || undefined,
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        maps: mapsUrl.trim() || undefined,
      },
      initialNote: initialNote.trim() || undefined,
    });

    handleResetAndClose();
  };

  return (
    <Modal
      isOpen={isNewLeadModalOpen}
      onClose={handleResetAndClose}
      title="Add New Client Prospect"
      subtitle="Track leads found on Google Maps, Instagram, LinkedIn, or Cold Calls"
      maxWidth="max-w-[580px]"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-[12px]">
        {/* Smart URL Auto-Fill Header */}
        <div className="p-3 rounded-[8px] bg-gradient-to-r from-[#5d4ef7]/10 via-[var(--t-background-secondary)] to-[var(--t-background-secondary)] border border-[#5d4ef7]/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--t-font-color-primary)]">
              <IconSparkles size={14} className="text-[#5d4ef7]" />
              <span>Smart Auto-Fill from Link</span>
            </div>
            <span className="text-[10px] text-[var(--t-font-color-tertiary)] font-mono">
              Google Maps • Instagram • Website
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Paste Google Maps URL, Instagram (@user or URL), or Website..."
                value={autoFillUrl}
                onChange={(e) => {
                  setAutoFillUrl(e.target.value);
                  setExtractError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExtractLead();
                  }
                }}
                className="w-full h-[32px] px-2.5 text-[11.5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-medium)] focus:border-[#5d4ef7] rounded-[6px] outline-none text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)]"
              />
            </div>
            <button
              type="button"
              disabled={isExtracting || !autoFillUrl.trim()}
              onClick={handleExtractLead}
              className="h-[32px] px-3 rounded-[6px] bg-[#5d4ef7] hover:bg-[#4f3ff0] disabled:opacity-50 text-white font-medium text-[11.5px] flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              {isExtracting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <IconSparkles size={13} />
                  <span>Auto-Fill</span>
                </>
              )}
            </button>
          </div>

          {/* Extracted Feedback Badges */}
          {extractedFields.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
              <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                <IconCheck size={11} />
                <span>Auto-filled:</span>
              </span>
              {extractedFields.map((f, idx) => (
                <span key={idx} className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">
                  {f}
                </span>
              ))}
            </div>
          )}

          {extractError && (
            <div className="text-[11px] text-rose-400">
              {extractError}
            </div>
          )}
        </div>

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
              placeholder="e.g. Acme Studio or @handle"
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
              placeholder="e.g. London, UK or New York (Optional)"
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
              placeholder="e.g. John Miller (Optional)"
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
              placeholder="0"
              value={dealValue === 0 ? '' : dealValue}
              onChange={(e) => setDealValue(Number(e.target.value) || 0)}
              leftIcon={<IconCurrencyDollar size={14} />}
            />
          </div>
        </div>

        {/* Pipeline Stage */}
        <div>
          <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
            Pipeline Stage
          </label>
          <Dropdown
            value={status}
            onChange={(val) => {
              const s = val as LeadStatus;
              setStatus(s);
              if (s === 'Leads' || s === 'Not Contacted') setOutreachStage('Needs Outreach');
              else if (s === 'Contacted' || s === 'Booked Meeting' || s === 'Booked Call' || s === 'Proposal Sent' || s === 'In Processing / Proposal') {
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

        {/* Multi-Service Pitch Selection */}
        <div className="p-2 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10.5px] font-medium text-[var(--t-font-color-secondary)]">
              Pitch Scope <span className="text-[9.5px] text-[var(--t-font-color-tertiary)]">(Click to Toggle)</span>
            </label>
            <span className="text-[9.5px] text-[#5d4ef7] font-mono font-medium">
              {selectedServices.length} Selected
            </span>
          </div>

          <div className="flex flex-wrap gap-1 pt-0.5">
            {AVAILABLE_SERVICES.map((svc) => {
              const isSelected = selectedServices.includes(svc);
              return (
                <button
                  key={svc}
                  type="button"
                  onClick={() => toggleService(svc)}
                  className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border transition-all flex items-center gap-1 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#5d4ef7]/15 border-[#5d4ef7] text-[#5d4ef7] font-semibold'
                      : 'bg-[var(--t-background-primary)] border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)] hover:border-[var(--t-border-color-medium)] hover:text-[var(--t-font-color-primary)]'
                  }`}
                >
                  {isSelected && <IconCheck size={10} className="text-[#5d4ef7] shrink-0" />}
                  <span>{svc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phone Numbers: Primary & Alternate */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Primary Phone (For Calling)
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
              Alternate Phone (Secondary)
            </label>
            <Input
              type="tel"
              placeholder="Secondary contact or landline"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
              leftIcon={<IconPhoneCall size={14} className="text-amber-500" />}
            />
          </div>
        </div>

        {/* Email & Website */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="owner@business.com (Optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<IconMail size={14} />}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Website URL
            </label>
            <Input
              placeholder="https://business.com (Optional)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Google Maps URL */}
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
            onClick={handleResetAndClose}
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
