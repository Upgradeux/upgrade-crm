'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { InboundSubmission, ServiceType } from '@/types/crm';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  IconInbox,
  IconSparkles,
  IconCode,
  IconCheck,
  IconArrowRight,
  IconTrash,
  IconBrandWhatsapp,
  IconMail,
  IconCalendar,
  IconSearch,
  IconX,
  IconCopy,
  IconEye,
  IconClock,
  IconCurrencyDollar,
  IconBriefcase,
  IconUser,
  IconPhone,
} from '@tabler/icons-react';
import { formatDate } from '@/lib/utils';

export function InboundSubmissionsView() {
  const {
    inboundSubmissions,
    addInboundSubmission,
    convertInboundToLead,
    dismissInboundSubmission,
    deleteInboundSubmission,
    spaces,
    activeSpaceId,
    setWhatsAppLeadModal,
    setEmailComposerLeadModal,
    timezone,
    currency,
    addToast,
  } = useCRM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'converted' | 'dismissed'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'Website Contact Form' | 'Cal.com Booking'>('all');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<InboundSubmission | null>(null);
  const [convertingSubmission, setConvertingSubmission] = useState<InboundSubmission | null>(null);
  const [convertSpaceId, setConvertSpaceId] = useState(activeSpaceId !== 'all' ? activeSpaceId : 'all');
  const [convertDealValue, setConvertDealValue] = useState(150000);

  const filteredSubmissions = inboundSubmissions.filter((sub) => {
    const matchesSearch =
      !search ||
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.email.toLowerCase().includes(search.toLowerCase()) ||
      sub.message.toLowerCase().includes(search.toLowerCase()) ||
      sub.interests.some((i: string) => i.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || sub.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const countAll = inboundSubmissions.length;
  const countNew = inboundSubmissions.filter((s) => s.status === 'new').length;
  const countConverted = inboundSubmissions.filter((s) => s.status === 'converted').length;
  const countDismissed = inboundSubmissions.filter((s) => s.status === 'dismissed').length;

  const handleSimulateTest = () => {
    const samples = [
      {
        name: 'Dr. Sarah Jenkins (Nexus MedSpa)',
        email: 'sarah@nexusmedspa.com',
        phone: '+1 (415) 889-2041',
        interests: ['AI Voice Agent', 'Web Development'],
        message: 'Looking for an AI voice receptionist to handle booking patient appointments 24/7 and a sleek redesign for our 3 clinic locations in California.',
        budget: '$8,500 - $12,000',
        deadline: 'Within 30 Days',
        source: 'Website Contact Form' as const,
      },
      {
        name: 'Vikram Malhotra (Apex Properties)',
        email: 'vikram@apexproperties.in',
        phone: '+91 98201 44552',
        interests: ['Web Development', 'AI Automation', 'Monthly Retainer'],
        message: 'High-converting luxury property portfolio website with integrated WhatsApp bot lead qualification for our new high-rise towers.',
        budget: '₹2,50,000 - ₹4,00,000',
        deadline: 'Urgent (15 Days)',
        source: 'Website Contact Form' as const,
      },
      {
        name: 'Elena Rostova (Luxe Apparel Co)',
        email: 'elena@luxeapparel.co',
        phone: '+44 7911 123456',
        interests: ['Branding & Identity', 'Web Development'],
        message: 'Scheduled a 30-min discovery demo to discuss scaling our direct-to-consumer store conversions and brand identity refresh.',
        budget: '£5,000',
        deadline: 'Next Quarter',
        source: 'Cal.com Booking' as const,
      },
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    addInboundSubmission(pick);
  };

  const handleExecuteConvert = () => {
    if (!convertingSubmission) return;
    convertInboundToLead(
      convertingSubmission.id,
      convertSpaceId !== 'all' ? convertSpaceId : undefined,
      convertDealValue
    );
    setConvertingSubmission(null);
    if (viewingSubmission?.id === convertingSubmission.id) {
      setViewingSubmission(null);
    }
  };

  const formCodeSnippet = `// Direct POST to upgradeUX Inbound API
async function submitProjectInquiry(data) {
  const res = await fetch('http://localhost:3000/api/inbound-leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,           // "Sarah Jenkins"
      email: data.email,         // "sarah@nexusmedspa.com"
      phone: data.phone,         // "+1 415-889-2041" (optional)
      interests: data.interests, // ["AI Voice Agent", "Web Development"]
      message: data.message,     // "Project brief..."
      budget: data.budget,       // "$8,500"
      deadline: data.deadline,   // "30 Days"
      source: "Website Contact Form"
    })
  });
  return res.json();
}`;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-48px)] bg-[var(--t-background-primary)] overflow-hidden select-none">
      {/* Twenty CRM Sleek Subheader Toolbar */}
      <div className="h-[44px] px-3.5 border-b border-[var(--t-border-color-light)] flex items-center justify-between shrink-0 bg-[var(--t-background-secondary)] gap-2">
        {/* Left: View Title & Segmented Status Filters */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <IconInbox size={14} className="text-[#5d4ef7]" />
            <span className="text-[12.5px] font-medium text-[var(--t-font-color-primary)]">
              Inbound Inquiries
            </span>
            <span className="px-1.5 py-0.2 rounded-[3px] bg-[var(--t-background-quaternary)] font-mono text-[10px] text-[var(--t-font-color-secondary)]">
              {filteredSubmissions.length}
            </span>
          </div>

          <div className="h-3.5 w-[1px] bg-[var(--t-border-color-light)]" />

          {/* Twenty Segmented Filter Pills */}
          <div className="flex items-center gap-0.5 bg-[var(--t-background-primary)] p-0.5 rounded-[5px] border border-[var(--t-border-color-light)]">
            {[
              { id: 'all', label: 'All', count: countAll },
              { id: 'new', label: 'New', count: countNew, highlight: countNew > 0 },
              { id: 'converted', label: 'In Pipeline', count: countConverted },
              { id: 'dismissed', label: 'Dismissed', count: countDismissed },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`h-[22px] px-2 rounded-[3px] text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] shadow-2xs font-semibold'
                    : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1 py-0.1 rounded-[2px] font-mono text-[9.5px] ${
                      tab.highlight
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'text-[var(--t-font-color-tertiary)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search inquiries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[26px] w-[160px] pl-6 pr-2 text-[11px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[4px] outline-none text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)]"
            />
            <IconSearch size={11} className="absolute left-2 top-2 text-[var(--t-font-color-tertiary)] pointer-events-none" />
          </div>

          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="h-[26px] px-2.5 rounded-[4px] bg-[var(--t-background-primary)] hover:bg-[var(--t-background-transparent-light)] border border-[var(--t-border-color-light)] text-[11px] font-medium text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="View API integration code snippet"
          >
            <IconCode size={12} />
            <span className="hidden md:inline">Website Form Code</span>
          </button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<IconSparkles size={12} />}
            onClick={handleSimulateTest}
          >
            Test Submission
          </Button>
        </div>
      </div>

      {/* Twenty CRM High-Density Master Spreadsheet Table */}
      <div className="flex-1 overflow-auto border border-[var(--t-border-color-light)] rounded-[6px] bg-[var(--t-background-primary)] m-2.5 shadow-2xs">
        {filteredSubmissions.length > 0 ? (
          <table className="w-full text-left text-[11.5px] border-collapse min-w-[780px]">
            <thead className="bg-[var(--t-background-secondary)] sticky top-0 z-10 border-b border-[var(--t-border-color-light)] text-[var(--t-font-color-tertiary)] text-[10px] font-medium uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3 font-medium min-w-[160px]">Prospect Contact</th>
                <th className="py-2 px-3 font-medium min-w-[120px]">Requested Scope</th>
                <th className="py-2 px-3 font-medium min-w-[170px]">Project Brief</th>
                <th className="py-2 px-2.5 font-medium w-[90px] whitespace-nowrap">Budget / SLA</th>
                <th className="py-2 px-2 font-medium w-[75px] whitespace-nowrap">Source</th>
                <th className="py-2 px-2 font-medium w-[80px] whitespace-nowrap">Status</th>
                <th className="py-2 px-2 font-medium w-[70px] whitespace-nowrap">Received</th>
                <th className="py-2 px-3 font-medium text-right w-[90px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]">
                {filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => setViewingSubmission(sub)}
                    className="hover:bg-[var(--t-background-transparent-light)] transition-colors group h-[38px] align-middle cursor-pointer"
                  >
                    {/* Prospect Contact */}
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-[20px] h-[20px] rounded-full bg-[#5d4ef7]/10 text-[#5d4ef7] flex items-center justify-center font-bold text-[9.5px] shrink-0">
                          {sub.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-normal text-[var(--t-font-color-primary)] group-hover:underline truncate max-w-[170px]">
                            {sub.name}
                          </div>
                          <div className="text-[10px] text-[var(--t-font-color-tertiary)] font-mono truncate max-w-[170px]">
                            {sub.email || sub.phone || 'No email provided'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Requested Scope (Compact Badges) */}
                    <td className="py-1.5 px-3">
                      <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                        {sub.interests && sub.interests.length > 0 ? (
                          sub.interests.slice(0, 2).map((interest: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded-[3px] bg-indigo-500/10 text-indigo-400 font-mono text-[9.5px] border border-indigo-500/20 truncate max-w-[110px]"
                            >
                              {interest}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10.5px] text-[var(--t-font-color-tertiary)]">General</span>
                        )}
                        {sub.interests && sub.interests.length > 2 && (
                          <span className="px-1 py-0.2 rounded-[3px] bg-[var(--t-background-quaternary)] font-mono text-[9px] text-[var(--t-font-color-tertiary)]">
                            +{sub.interests.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Project Brief (Truncated Single Line) */}
                    <td className="py-1.5 px-3 text-[11px] text-[var(--t-font-color-secondary)]">
                      <span className="truncate block max-w-[260px]" title={sub.message}>
                        {sub.message || 'No project brief provided.'}
                      </span>
                    </td>

                    {/* Budget / SLA */}
                    <td className="py-1.5 px-3 font-mono text-[10.5px] whitespace-nowrap">
                      {sub.budget ? (
                        <span className="text-[var(--t-font-color-primary)] font-medium">{sub.budget}</span>
                      ) : (
                        <span className="text-[var(--t-font-color-tertiary)]">—</span>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      <span className="px-1.5 py-0.2 rounded-[3px] bg-[var(--t-background-quaternary)] text-[10px] font-mono text-[var(--t-font-color-tertiary)] border border-[var(--t-border-color-light)]">
                        {sub.source === 'Cal.com Booking' ? 'Cal.com' : 'Website'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-3 whitespace-nowrap">
                      {sub.status === 'new' && (
                        <span className="px-1.5 py-0.2 rounded-[3px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                          New
                        </span>
                      )}
                      {sub.status === 'converted' && (
                        <span className="px-1.5 py-0.2 rounded-[3px] bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-medium">
                          ✓ Pipeline
                        </span>
                      )}
                      {sub.status === 'dismissed' && (
                        <span className="px-1.5 py-0.2 rounded-[3px] bg-[var(--t-background-quaternary)] text-[var(--t-font-color-tertiary)] text-[10px]">
                          Dismissed
                        </span>
                      )}
                    </td>

                    {/* Received */}
                    <td className="py-1.5 px-3 text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono whitespace-nowrap">
                      {formatDate(sub.createdAt, timezone)}
                    </td>

                    {/* Quick Row Actions (Twenty Hover Style) */}
                    <td className="py-1.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {sub.status !== 'converted' && (
                          <button
                            onClick={() => setConvertingSubmission(sub)}
                            className="h-[22px] px-2 rounded-[3px] bg-[#5d4ef7] text-white hover:opacity-90 text-[10.5px] font-medium flex items-center gap-1 transition-opacity cursor-pointer shadow-2xs"
                            title="Add to Deals Pipeline"
                          >
                            <IconArrowRight size={11} />
                            <span>Add</span>
                          </button>
                        )}

                        {sub.phone && (
                          <button
                            onClick={() =>
                              setWhatsAppLeadModal({
                                id: sub.id,
                                companyName: sub.name,
                                contactName: sub.name,
                                email: sub.email,
                                phone: sub.phone || '',
                                websiteUrl: '',
                                socials: {},
                                source: 'Website Inbound',
                                serviceInterest: (sub.interests[0] as ServiceType) || 'AI Voice Agent',
                                status: 'Not Contacted',
                                outreachStage: 'Needs Outreach',
                                leadOwner: 'Unassigned',
                                location: 'Website',
                                dealValue: 150000,
                                createdAt: sub.createdAt,
                                updatedAt: sub.createdAt,
                                notes: [],
                              })
                            }
                            className="p-1 text-[var(--t-font-color-tertiary)] hover:text-emerald-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="WhatsApp Follow-Up"
                          >
                            <IconBrandWhatsapp size={12} />
                          </button>
                        )}

                        {sub.status === 'new' && (
                          <button
                            onClick={() => dismissInboundSubmission(sub.id)}
                            className="p-1 text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Dismiss"
                          >
                            <IconX size={11} />
                          </button>
                        )}

                        <button
                          onClick={() => deleteInboundSubmission(sub.id)}
                          className="p-1 text-[var(--t-font-color-tertiary)] hover:text-rose-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <IconTrash size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        ) : (
          /* Clean Twenty Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-center text-[#5d4ef7]">
              <IconInbox size={18} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-[13px] font-semibold text-[var(--t-font-color-primary)]">
                No Inbound Inquiries Yet
              </h3>
              <p className="text-[11px] text-[var(--t-font-color-tertiary)] leading-relaxed">
                Connect your website contact form or Cal.com widget to automatically receive and review project briefs right here.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<IconCode size={12} />}
                onClick={() => setIsCodeModalOpen(true)}
              >
                Website Form Code
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<IconSparkles size={12} />}
                onClick={handleSimulateTest}
              >
                Send Test Lead
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {viewingSubmission && (
        <Modal
          isOpen={Boolean(viewingSubmission)}
          onClose={() => setViewingSubmission(null)}
          title="Inbound Project Inquiry"
          subtitle={`Received via ${viewingSubmission.source} on ${formatDate(viewingSubmission.createdAt, timezone)}`}
          maxWidth="max-w-[480px]"
        >
          <div className="space-y-3.5 text-[11.5px]">
            {/* Contact Card */}
            <div className="p-3 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[13px] font-semibold text-[var(--t-font-color-primary)]">
                  {viewingSubmission.name}
                </div>
                <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                  {viewingSubmission.email || 'No email provided'}
                </div>
                {viewingSubmission.phone && (
                  <div className="text-[11px] text-[var(--t-font-color-tertiary)] font-mono">
                    {viewingSubmission.phone}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {viewingSubmission.phone && (
                  <button
                    onClick={() => {
                      const cleanPhone = viewingSubmission.phone?.replace(/[^0-9]/g, '');
                      window.open(`https://wa.me/${cleanPhone}`, '_blank');
                    }}
                    className="h-[26px] px-2.5 rounded-[4px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <IconBrandWhatsapp size={13} />
                    <span>WhatsApp</span>
                  </button>
                )}
                {viewingSubmission.email && (
                  <button
                    onClick={() => {
                      window.location.href = `mailto:${viewingSubmission.email}`;
                    }}
                    className="h-[26px] px-2.5 rounded-[4px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <IconMail size={13} />
                    <span>Email</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scope / Interests */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
                Requested Services & Scope
              </span>
              <div className="flex flex-wrap gap-1.5">
                {viewingSubmission.interests && viewingSubmission.interests.length > 0 ? (
                  viewingSubmission.interests.map((interest: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-[3px] bg-indigo-500/10 text-indigo-400 font-mono text-[10.5px] border border-indigo-500/20 font-medium"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[var(--t-font-color-tertiary)]">General Inquiry</span>
                )}
              </div>
            </div>

            {/* Full Project Brief / Message */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
                Project Brief & Details
              </span>
              <div className="p-3 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] text-[11.5px] text-[var(--t-font-color-primary)] leading-relaxed whitespace-pre-wrap">
                {viewingSubmission.message || 'No project brief provided.'}
              </div>
            </div>

            {/* Budget & Timeline Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-0.5">
                <span className="text-[9.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
                  Budget Estimate
                </span>
                <span className="text-[11.5px] font-mono text-[var(--t-font-color-primary)] font-medium">
                  {viewingSubmission.budget || 'Not specified'}
                </span>
              </div>

              <div className="p-2.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-0.5">
                <span className="text-[9.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
                  Target Deadline
                </span>
                <span className="text-[11.5px] font-mono text-[var(--t-font-color-primary)] font-medium">
                  {viewingSubmission.deadline || 'Flexible'}
                </span>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--t-border-color-light)]">
              <button
                type="button"
                onClick={() => {
                  deleteInboundSubmission(viewingSubmission.id);
                  setViewingSubmission(null);
                }}
                className="h-[26px] px-2 rounded-[4px] text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <IconTrash size={12} />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewingSubmission(null)}
                  className="h-[26px] px-2.5 rounded-[4px] text-[11px] font-medium text-[var(--t-font-color-secondary)] hover:bg-[var(--t-background-secondary)] cursor-pointer"
                >
                  Close
                </button>
                {viewingSubmission.status !== 'converted' && (
                  <button
                    type="button"
                    onClick={() => {
                      setConvertingSubmission(viewingSubmission);
                    }}
                    className="h-[26px] px-3 rounded-[4px] bg-[#5d4ef7] text-white hover:opacity-90 text-[11px] font-medium flex items-center gap-1 transition-opacity cursor-pointer shadow-2xs"
                  >
                    <IconArrowRight size={12} />
                    <span>Add to Pipeline</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Convert to Lead Modal */}
      {convertingSubmission && (
        <Modal
          isOpen={Boolean(convertingSubmission)}
          onClose={() => setConvertingSubmission(null)}
          title="Convert Inbound Lead to Active Deal"
          subtitle={`Add "${convertingSubmission.name}" to CRM Deals Pipeline`}
          maxWidth="max-w-[420px]"
        >
          <div className="space-y-3 text-[11.5px]">
            <div className="p-2.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-1">
              <div className="font-medium text-[var(--t-font-color-primary)]">
                {convertingSubmission.name}
              </div>
              <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                {convertingSubmission.email} • {convertingSubmission.phone || 'No phone'}
              </div>
              <div className="text-[10.5px] text-indigo-400 font-mono pt-0.5">
                Scope: {convertingSubmission.interests.join(', ') || 'General'}
              </div>
            </div>

            {/* Target Industry Space */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
                Assign to Industry Space
              </label>
              <select
                value={convertSpaceId}
                onChange={(e) => setConvertSpaceId(e.target.value)}
                className="w-full h-[30px] px-2 text-[11.5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] rounded-[4px] outline-none text-[var(--t-font-color-primary)]"
              >
                <option value="all">Global (All Spaces)</option>
                {spaces
                  .filter((s) => s.id !== 'all')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Deal Value */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
                Estimated Deal Value
              </label>
              <input
                type="number"
                value={convertDealValue}
                onChange={(e) => setConvertDealValue(Number(e.target.value))}
                className="w-full h-[30px] px-2 text-[11.5px] font-mono bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] rounded-[4px] outline-none text-[var(--t-font-color-primary)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--t-border-color-light)]">
              <button
                type="button"
                onClick={() => setConvertingSubmission(null)}
                className="h-[26px] px-2.5 rounded-[4px] text-[11px] font-medium text-[var(--t-font-color-secondary)] hover:bg-[var(--t-background-secondary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConvert}
                className="h-[26px] px-3 rounded-[4px] bg-[#5d4ef7] text-white text-[11px] font-medium flex items-center gap-1 hover:opacity-90 cursor-pointer"
              >
                <IconCheck size={12} />
                <span>Add to Deals Pipeline</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Website Form Code Snippet Modal */}
      {isCodeModalOpen && (
        <Modal
          isOpen={isCodeModalOpen}
          onClose={() => setIsCodeModalOpen(false)}
          title="Connect Website Contact Form"
          subtitle="Direct POST endpoint: /api/inbound-leads"
          maxWidth="max-w-[540px]"
        >
          <div className="space-y-3 text-[11.5px]">
            <p className="text-[var(--t-font-color-secondary)] leading-relaxed">
              When a visitor fills your website's <strong>"START PROJECT"</strong> form, post the JSON payload to:
            </p>

            <div className="relative">
              <pre className="p-3 rounded-[6px] bg-[#0d0d12] border border-[var(--t-border-color-medium)] text-[10.5px] font-mono text-emerald-400 overflow-x-auto max-h-[220px]">
                {formCodeSnippet}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(formCodeSnippet);
                  addToast('Copied website form code to clipboard!', 'success');
                }}
                className="absolute top-2 right-2 h-[22px] px-2 rounded-[3px] bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1 font-mono cursor-pointer transition-colors"
              >
                <IconCopy size={11} />
                <span>Copy</span>
              </button>
            </div>

            <div className="p-2.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] text-[11px] text-[var(--t-font-color-secondary)]">
              💡 <strong>Cal.com Webhook:</strong> In Cal.com Settings &gt; Webhooks, add your URL <code className="text-cyan-400 font-mono">http://your-crm.vercel.app/api/inbound-leads</code> to automatically capture booked demo calls!
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="primary" size="sm" onClick={() => setIsCodeModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
