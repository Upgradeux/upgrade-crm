'use client';

import React, { useState, useMemo } from 'react';
import { useCRM } from '@/lib/store';
import { Lead, LeadStatus, ServiceType, LeadSource } from '@/types/crm';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import {
  IconSearch,
  IconArrowUp,
  IconArrowDown,
  IconExternalLink,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconPlus,
  IconTrash,
  IconMapPin,
  IconRefresh,
  IconEye,
  IconBrandWhatsapp,
  IconBrandX,
  IconMail,
  IconClock,
} from '@tabler/icons-react';
import { formatCurrency, formatDate, getGoogleMapsUrl, getTwitterUrl, matchLeadSearch } from '@/lib/utils';

export function AllLeadsView() {
  const {
    leads,
    openLeadDrawer,
    deleteLead,
    confirmAction,
    setIsNewLeadModalOpen,
    setWhatsAppLeadModal,
    setInstagramDMLeadModal,
    setEmailComposerLeadModal,
    setFollowUpModalLead,
    activeSpaceId,
    currency,
    timezone,
  } = useCRM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof Lead>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const sourceFilterOptions = [
    { value: 'All', label: 'All Sources' },
    { value: 'Google Maps', label: 'Google Maps' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'Cold Email', label: 'Cold Email' },
    { value: 'Website Inbound', label: 'Website Form' },
  ];

  const statusFilterOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'Leads', label: 'Leads' },
    { value: 'Not Contacted', label: 'Not Contacted' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Booked Meeting', label: 'Booked Meeting' },
    { value: 'Proposal Sent', label: 'Proposal Sent' },
    { value: 'Lost', label: 'Lost' },
    { value: 'Won', label: 'Won' },
  ];

  const serviceFilterOptions = [
    { value: 'All', label: 'All Services' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'AI Voice Agent', label: 'AI Voice Agent' },
    { value: 'AI Automation', label: 'AI Automation' },
    { value: 'Google Business Profile', label: 'Google Business Profile' },
    { value: 'Meta Ads', label: 'Meta Ads' },
    { value: 'AI Chatbot', label: 'AI Chatbot' },
    { value: 'Workflow / n8n Automation', label: 'Workflow Automation' },
    { value: 'Monthly Retainer', label: 'Monthly Retainer' },
    { value: 'Lead Generation', label: 'Lead Generation' },
  ];

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const matchesSearch = matchLeadSearch(lead, search);
        const matchesStatus =
          statusFilter === 'All' ||
          lead.status === statusFilter ||
          (statusFilter === 'Booked Meeting' && lead.status === 'Booked Call') ||
          (statusFilter === 'Proposal Sent' && lead.status === 'In Processing / Proposal');
        const matchesService =
          serviceFilter === 'All' ||
          lead.serviceInterest === serviceFilter ||
          (lead.services && lead.services.includes(serviceFilter as ServiceType));
        const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;

        return matchesSearch && matchesStatus && matchesService && matchesSource;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [leads, search, statusFilter, serviceFilter, sourceFilter, sortField, sortAsc]);

  const toggleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderSortIcon = (field: keyof Lead) => {
    if (sortField !== field) return null;
    return sortAsc ? <IconArrowUp size={11} className="inline ml-0.5 text-[var(--t-font-color-primary)]" /> : <IconArrowDown size={11} className="inline ml-0.5 text-[var(--t-font-color-primary)]" />;
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-hidden bg-[var(--t-background-primary)] flex flex-col gap-2">
      {/* Twenty Style Compact Horizontal Toolbar */}
      <div className="p-2 sm:px-2.5 sm:py-1.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        {/* Search Input */}
        <div className="w-full sm:w-[220px]">
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<IconSearch size={13} />}
            className="h-[26px] text-[12px] bg-[var(--t-background-primary)] w-full"
          />
        </div>

        {/* Filter Dropdowns (Inline Horizontal) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 flex-1 min-w-0">
          <div className="w-[120px] shrink-0">
            <Dropdown
              value={sourceFilter}
              onChange={setSourceFilter}
              options={sourceFilterOptions}
              size="sm"
              buttonClassName="h-[26px] text-[11px] bg-[var(--t-background-primary)]"
            />
          </div>

          <div className="w-[130px] shrink-0">
            <Dropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusFilterOptions}
              size="sm"
              buttonClassName="h-[26px] text-[11px] bg-[var(--t-background-primary)]"
            />
          </div>

          <div className="w-[135px] shrink-0">
            <Dropdown
              value={serviceFilter}
              onChange={setServiceFilter}
              options={serviceFilterOptions}
              size="sm"
              buttonClassName="h-[26px] text-[11px] bg-[var(--t-background-primary)]"
            />
          </div>

          {(search || statusFilter !== 'All' || serviceFilter !== 'All' || sourceFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setServiceFilter('All');
                setSourceFilter('All');
              }}
              className="text-[11px] text-[#5d4ef7] hover:underline cursor-pointer shrink-0 px-1 whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-[var(--t-font-color-tertiary)] hidden sm:inline">
            {filteredLeads.length} leads
          </span>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<IconPlus size={12} />}
            onClick={() => setIsNewLeadModalOpen(true)}
          >
            Add Lead
          </Button>
        </div>
      </div>

      {/* Twenty CRM High-Density Master Spreadsheet Table */}
      <div className="flex-1 overflow-auto border border-[var(--t-border-color-light)] rounded-[6px] bg-[var(--t-background-primary)]">
        <table className="w-full text-left text-[12px] border-collapse min-w-[860px]">
          <thead className="bg-[var(--t-background-secondary)] sticky top-0 z-10 border-b border-[var(--t-border-color-light)] text-[var(--t-font-color-tertiary)] text-[10.5px] font-medium uppercase tracking-wider">
            <tr>
              <th
                onClick={() => toggleSort('companyName')}
                className="py-2 px-3 cursor-pointer hover:text-[var(--t-font-color-primary)] font-medium min-w-[200px]"
              >
                Prospect Business {renderSortIcon('companyName')}
              </th>
              <th
                onClick={() => toggleSort('dealValue')}
                className="py-2 px-3 cursor-pointer hover:text-[var(--t-font-color-primary)] font-medium text-right w-[90px] whitespace-nowrap"
              >
                Deal Value {renderSortIcon('dealValue')}
              </th>
              <th
                onClick={() => toggleSort('source')}
                className="py-2 px-3 cursor-pointer hover:text-[var(--t-font-color-primary)] font-medium w-[110px] whitespace-nowrap"
              >
                Source {renderSortIcon('source')}
              </th>
              <th
                onClick={() => toggleSort('status')}
                className="py-2 px-3 cursor-pointer hover:text-[var(--t-font-color-primary)] font-medium w-[120px] whitespace-nowrap"
              >
                Status {renderSortIcon('status')}
              </th>
              <th
                onClick={() => toggleSort('serviceInterest')}
                className="py-2 px-3 cursor-pointer hover:text-[var(--t-font-color-primary)] font-medium min-w-[130px] whitespace-nowrap"
              >
                Service Pitch {renderSortIcon('serviceInterest')}
              </th>
              <th
                onClick={() => toggleSort('location')}
                className="py-2 px-3 cursor-pointer hover:text-[var(--t-font-color-primary)] font-medium min-w-[110px] whitespace-nowrap"
              >
                Location {renderSortIcon('location')}
              </th>
              <th
                onClick={() => toggleSort('leadOwner')}
                className="py-2 px-3 cursor-pointer hover:text-[var(--t-font-color-primary)] font-medium min-w-[120px] whitespace-nowrap"
              >
                Assigned Team {renderSortIcon('leadOwner')}
              </th>
              <th
                onClick={() => toggleSort('createdAt')}
                className="py-2 px-3 cursor-pointer hover:text-[var(--t-font-color-primary)] font-medium w-[80px] whitespace-nowrap"
              >
                Added {renderSortIcon('createdAt')}
              </th>
              <th className="py-2 px-3 text-right w-[60px] font-medium whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]">
            {filteredLeads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => openLeadDrawer(lead.id)}
                className="hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer group h-[38px] align-middle"
              >
                {/* Company Name & Link */}
                <td className="py-1.5 px-3 font-normal text-[var(--t-font-color-primary)]">
                  <div className="flex items-center gap-1.5">
                    <span className="group-hover:underline truncate max-w-[170px]">
                      {lead.companyName}
                    </span>
                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      {lead.websiteUrl && (
                        <a
                          href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Website"
                          className="opacity-0 group-hover:opacity-100 text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] transition-opacity p-0.5"
                        >
                          <IconExternalLink size={12} />
                        </a>
                      )}
                      {lead.socials?.twitter && (
                        <a
                          href={getTwitterUrl(lead.socials.twitter)}
                          target="_blank"
                          rel="noreferrer"
                          title={`Open on X: ${lead.socials.twitter}`}
                          className="opacity-0 group-hover:opacity-100 text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] transition-opacity p-0.5"
                        >
                          <IconBrandX size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                  {lead.contactName && (
                    <div className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-normal truncate max-w-[180px]">
                      {lead.contactName}
                    </div>
                  )}
                  {lead.activeFollowUp && !lead.activeFollowUp.completed && (
                    <div className="pt-0.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[3px] bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[9.5px]">
                        <IconClock size={9} />
                        <span>Follow-Up ({lead.activeFollowUp.channel})</span>
                      </span>
                    </div>
                  )}
                </td>

                {/* Deal Value */}
                <td className="py-1.5 px-3 font-mono text-[12px] text-[var(--t-font-color-primary)] text-right whitespace-nowrap">
                  {formatCurrency(lead.dealValue, currency)}
                </td>

                {/* Source Badge */}
                <td className="py-1.5 px-3 whitespace-nowrap">
                  <Badge value={lead.source || 'Google Maps'} size="sm" />
                </td>

                {/* Status Badge */}
                <td className="py-1.5 px-3 whitespace-nowrap">
                  <Badge value={lead.status} size="sm" />
                </td>

                {/* Service Interest & Space */}
                <td className="py-1.5 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="service" size="sm">
                      {lead.serviceInterest}
                    </Badge>
                    {activeSpaceId === 'all' && lead.industry && (
                      <span className="px-1.5 py-0.2 rounded-[3px] bg-indigo-500/10 text-indigo-400 font-mono text-[9.5px] border border-indigo-500/20 truncate max-w-[100px]">
                        {lead.industry.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </td>

                {/* Location (Direct 1-Click Google Maps Link) */}
                <td className="py-1.5 px-3 text-[11px] whitespace-nowrap">
                  <a
                    href={getGoogleMapsUrl(lead)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 truncate max-w-[125px] text-[var(--t-font-color-tertiary)] hover:text-emerald-500 transition-colors"
                    title={`Open in Google Maps: ${lead.companyName} (${lead.location})`}
                  >
                    <IconMapPin size={11} className="shrink-0 text-emerald-500/70" />
                    <span className="truncate hover:underline">{lead.location}</span>
                  </a>
                </td>

                {/* Owner (Single Line, No Wrap) */}
                <td className="py-1.5 px-3 text-[11px] text-[var(--t-font-color-primary)] whitespace-nowrap truncate max-w-[120px]">
                  {lead.leadOwner}
                </td>

                {/* Date */}
                <td className="py-1.5 px-3 text-[11px] text-[var(--t-font-color-tertiary)] font-mono whitespace-nowrap">
                  {formatDate(lead.createdAt, timezone)}
                </td>

                {/* Actions */}
                <td className="py-1.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setFollowUpModalLead(lead)}
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-amber-400 rounded transition-colors"
                      title="Schedule Follow-Up"
                    >
                      <IconClock size={13} />
                    </button>
                    {lead.phone && (
                      <button
                        onClick={() => setWhatsAppLeadModal(lead)}
                        className="p-1 text-[var(--t-font-color-tertiary)] hover:text-emerald-500 rounded transition-colors"
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
                    <button
                      onClick={() => {
                        confirmAction({
                          title: 'Delete Lead',
                          message: `Are you sure you want to delete "${lead.companyName}"?`,
                          confirmText: 'Delete',
                          variant: 'danger',
                          onConfirm: () => deleteLead(lead.id),
                        });
                      }}
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-rose-500 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete Lead"
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-[var(--t-font-color-tertiary)]">
                  No prospects matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="flex items-center justify-between text-[11px] text-[var(--t-font-color-tertiary)] px-1 shrink-0">
        <span>
          Showing {filteredLeads.length} of {leads.length} prospects
        </span>
        <span className="font-mono">
          Total Value:{' '}
          <span className="text-[var(--t-font-color-primary)] font-semibold">
            {formatCurrency(filteredLeads.reduce((a, b) => a + (b.dealValue || 0), 0), currency)}
          </span>
        </span>
      </div>
    </div>
  );
}
