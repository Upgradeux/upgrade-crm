'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Lead, FollowUpChannel, FollowUpItem } from '@/types/crm';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { SearchableLeadSelect } from '../ui/SearchableLeadSelect';
import {
  IconBrandWhatsapp,
  IconMail,
  IconBrandInstagram,
  IconBell,
  IconCalendar,
  IconClock,
  IconCheck,
  IconX,
  IconSearch,
  IconCalendarEvent,
  IconAlertTriangle,
  IconClockHour4,
  IconCalendarCheck,
  IconArrowRight,
  IconPlus,
} from '@tabler/icons-react';
import { formatCurrency, matchLeadSearch } from '@/lib/utils';

export function FollowUpsView() {
  const {
    leads,
    openLeadDrawer,
    setFollowUpModalLead,
    setWhatsAppLeadModal,
    setEmailComposerLeadModal,
    setInstagramDMLeadModal,
    completeFollowUp,
    deleteFollowUp,
    currency,
    timezone,
  } = useCRM();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'completed'>('all');
  const [channelFilter, setChannelFilter] = useState<FollowUpChannel | 'all'>('all');
  const [isSelectLeadModalOpen, setIsSelectLeadModalOpen] = useState(false);

  // Gather all leads with follow ups
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

  interface FlattenedFollowUp {
    lead: Lead;
    followUp: FollowUpItem;
    status: 'overdue' | 'today' | 'upcoming' | 'completed';
  }

  const allFollowUps: FlattenedFollowUp[] = [];

  leads.forEach((lead) => {
    // 1. Check active follow-up first
    if (lead.activeFollowUp && !lead.activeFollowUp.completed) {
      const scheduledTime = new Date(lead.activeFollowUp.scheduledDate).getTime();
      let status: 'overdue' | 'today' | 'upcoming' | 'completed' = 'upcoming';
      if (scheduledTime < startOfToday) {
        status = 'overdue';
      } else if (scheduledTime >= startOfToday && scheduledTime < endOfToday) {
        status = 'today';
      }

      allFollowUps.push({
        lead,
        followUp: lead.activeFollowUp,
        status,
      });
    } else if (lead.bookedMeetingDate) {
      // 2. Synthesize follow-up for booked meeting if activeFollowUp not set
      const scheduledTime = new Date(lead.bookedMeetingDate).getTime();
      let status: 'overdue' | 'today' | 'upcoming' | 'completed' = 'upcoming';
      if (scheduledTime < startOfToday) {
        status = 'overdue';
      } else if (scheduledTime >= startOfToday && scheduledTime < endOfToday) {
        status = 'today';
      }

      allFollowUps.push({
        lead,
        followUp: {
          id: `synth-meeting-${lead.id}`,
          scheduledDate: lead.bookedMeetingDate,
          channel: lead.phone ? 'whatsapp' : lead.email ? 'email' : 'whatsapp',
          completed: false,
          note: `Demo / Strategy Call Meeting${lead.googleMeetLink ? ` (${lead.googleMeetLink})` : ''}`,
          createdAt: lead.createdAt,
        },
        status,
      });
    } else if (lead.nextFollowUpDate) {
      // 3. Synthesize follow-up if nextFollowUpDate exists
      const scheduledTime = new Date(lead.nextFollowUpDate).getTime();
      let status: 'overdue' | 'today' | 'upcoming' | 'completed' = 'upcoming';
      if (scheduledTime < startOfToday) {
        status = 'overdue';
      } else if (scheduledTime >= startOfToday && scheduledTime < endOfToday) {
        status = 'today';
      }

      allFollowUps.push({
        lead,
        followUp: {
          id: `synth-followup-${lead.id}`,
          scheduledDate: lead.nextFollowUpDate,
          channel: lead.phone ? 'whatsapp' : lead.email ? 'email' : 'whatsapp',
          completed: false,
          note: `Follow-up on ${lead.serviceInterest || 'services'} proposal`,
          createdAt: lead.createdAt,
        },
        status,
      });
    }

    // 4. Check past completed follow ups
    (lead.followUps || []).forEach((f) => {
      if (f.completed) {
        allFollowUps.push({
          lead,
          followUp: f,
          status: 'completed',
        });
      }
    });
  });

  // Filter follow ups
  const filtered = allFollowUps.filter((item) => {
    // Search match on lead
    if (search.trim() && !matchLeadSearch(item.lead, search) && !(item.followUp.note || '').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Channel filter
    if (channelFilter !== 'all' && item.followUp.channel !== channelFilter) {
      return false;
    }

    // Tab filter
    if (activeTab === 'all') {
      return item.status !== 'completed';
    }
    return item.status === activeTab;
  });

  // Sort by scheduledDate (overdue & today first)
  filtered.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;
    return new Date(a.followUp.scheduledDate).getTime() - new Date(b.followUp.scheduledDate).getTime();
  });

  const overdueCount = allFollowUps.filter((f) => f.status === 'overdue').length;
  const todayCount = allFollowUps.filter((f) => f.status === 'today').length;
  const upcomingCount = allFollowUps.filter((f) => f.status === 'upcoming').length;
  const completedCount = allFollowUps.filter((f) => f.status === 'completed').length;

  const getChannelConfig = (channel: FollowUpChannel) => {
    switch (channel) {
      case 'whatsapp':
        return {
          label: 'WhatsApp',
          icon: <IconBrandWhatsapp size={13} className="text-emerald-400 shrink-0" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
          btnClass: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30',
          actionLabel: 'Send WhatsApp',
        };
      case 'email':
        return {
          label: 'Cold Email',
          icon: <IconMail size={13} className="text-purple-400 shrink-0" />,
          badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
          btnClass: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/30',
          actionLabel: 'Compose Email',
        };
      case 'instagram':
        return {
          label: 'Instagram DM',
          icon: <IconBrandInstagram size={13} className="text-pink-400 shrink-0" />,
          badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/25',
          btnClass: 'bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border-pink-500/30',
          actionLabel: 'Send IG DM',
        };
      case 'reminder':
      default:
        return {
          label: 'Reminder',
          icon: <IconBell size={13} className="text-amber-400 shrink-0" />,
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
          btnClass: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30',
          actionLabel: 'View Lead',
        };
    }
  };

  const handleExecuteAction = (item: FlattenedFollowUp) => {
    switch (item.followUp.channel) {
      case 'whatsapp':
        setWhatsAppLeadModal(item.lead);
        break;
      case 'email':
        setEmailComposerLeadModal(item.lead);
        break;
      case 'instagram':
        setInstagramDMLeadModal(item.lead);
        break;
      default:
        openLeadDrawer(item.lead.id);
        break;
    }
  };

  const formatScheduledLabel = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      return `${dateStr} at ${timeStr}`;
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-hidden bg-[var(--t-background-primary)] flex flex-col gap-2">
      {/* Top Twenty Style Filter & Search Toolbar */}
      <div className="p-2 sm:px-2.5 sm:py-1.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col gap-2 shrink-0">
        {/* Top Row: Search & Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Quick Search */}
          <div className="w-full sm:w-[220px]">
            <Input
              placeholder="Search follow-ups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<IconSearch size={13} className="text-[var(--t-font-color-tertiary)]" />}
              className="h-6.5 text-[12px] bg-[var(--t-background-primary)] w-full"
            />
          </div>

          {/* Segmented Status Tabs */}
          <div className="flex items-center bg-[var(--t-background-primary)] p-0.5 rounded-[4px] border border-[var(--t-border-color-light)] text-[11px] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] font-medium shadow-2xs'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)]'
              }`}
            >
              <span>Active</span>
              <span className="text-[9.5px] px-1 rounded-full bg-[var(--t-background-quaternary)] font-mono">
                {overdueCount + todayCount + upcomingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'overdue'
                  ? 'bg-rose-500/15 text-rose-400 font-medium shadow-2xs'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-rose-400'
              }`}
            >
              <IconAlertTriangle size={11} className={overdueCount > 0 ? 'text-rose-400' : ''} />
              <span>Overdue</span>
              {overdueCount > 0 && (
                <span className="text-[9.5px] px-1 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                  {overdueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('today')}
              className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'today'
                  ? 'bg-amber-500/15 text-amber-400 font-medium shadow-2xs'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-amber-400'
              }`}
            >
              <IconClockHour4 size={11} />
              <span>Today</span>
              {todayCount > 0 && (
                <span className="text-[9.5px] px-1 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {todayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'upcoming'
                  ? 'bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] font-medium shadow-2xs'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)]'
              }`}
            >
              <IconCalendarEvent size={11} />
              <span>Upcoming</span>
              {upcomingCount > 0 && (
                <span className="text-[9.5px] px-1 rounded-full bg-[var(--t-background-quaternary)] font-mono">
                  {upcomingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'completed'
                  ? 'bg-emerald-500/15 text-emerald-400 font-medium shadow-2xs'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-emerald-400'
              }`}
            >
              <IconCalendarCheck size={11} />
              <span>Completed</span>
              {completedCount > 0 && (
                <span className="text-[9.5px] px-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {completedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Row: Channels & Schedule Button */}
        <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-[var(--t-border-color-light)] overflow-hidden">
          {/* Channel Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full">
            {(
              [
                { id: 'all', label: 'All', icon: null },
                { id: 'whatsapp', label: 'WhatsApp', icon: <IconBrandWhatsapp size={11} /> },
                { id: 'email', label: 'Email', icon: <IconMail size={11} /> },
                { id: 'instagram', label: 'Instagram', icon: <IconBrandInstagram size={11} /> },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                onClick={() => setChannelFilter(c.id as any)}
                className={`h-[24px] px-2 rounded-[4px] text-[10.5px] border flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  channelFilter === c.id
                    ? 'bg-[var(--t-background-primary)] border-[var(--t-border-color-focus)] text-[var(--t-font-color-primary)] font-medium shadow-2xs'
                    : 'bg-transparent border-transparent text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-secondary)]'
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<IconPlus size={13} />}
            onClick={() => setIsSelectLeadModalOpen(true)}
            className="h-[24px] sm:h-[26px] text-[10.5px] sm:text-[11px] px-2 sm:px-3 shrink-0 whitespace-nowrap"
          >
            <span>+ Schedule</span>
          </Button>
        </div>
      </div>

      {/* Follow-Up List Table */}
      <div className="flex-1 bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] rounded-[6px] flex flex-col overflow-hidden shadow-2xs">
        <div className="w-full flex-1 flex flex-col overflow-auto">
          {/* Table Header */}
          <div className="min-w-[940px] h-[32px] border-b border-[var(--t-border-color-light)] bg-[var(--t-background-tertiary)] px-3 flex items-center text-[10.5px] font-medium text-[var(--t-font-color-tertiary)] uppercase tracking-wider shrink-0 whitespace-nowrap">
            <div className="w-[220px] shrink-0 whitespace-nowrap">Company & Contact</div>
            <div className="w-[110px] shrink-0 whitespace-nowrap">Channel</div>
            <div className="w-[160px] shrink-0 whitespace-nowrap">Scheduled Time</div>
            <div className="w-[200px] flex-1 shrink-0 whitespace-nowrap">Follow-Up Note</div>
            <div className="w-[90px] shrink-0 text-right whitespace-nowrap pr-3">Deal Value</div>
            <div className="w-[210px] shrink-0 text-right whitespace-nowrap pr-1">Actions</div>
          </div>

          {/* Rows Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--t-border-color-light)]">
            {filtered.length === 0 ? (
              <div className="h-[260px] flex flex-col items-center justify-center gap-2.5 text-center p-4">
                <div className="w-[40px] h-[40px] rounded-full bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] flex items-center justify-center text-[var(--t-font-color-tertiary)] shadow-2xs">
                  <IconCalendarEvent size={20} className="text-[#5d4ef7]" />
                </div>
                <div className="space-y-0.5 max-w-[380px]">
                  <p className="text-[13px] font-semibold text-[var(--t-font-color-primary)]">
                    {activeTab === 'all' ? 'No Scheduled Follow-Ups Yet' : `No ${activeTab} follow-ups`}
                  </p>
                  <p className="text-[11px] text-[var(--t-font-color-tertiary)] leading-relaxed">
                    The Follow-Up Queue tracks your client touchpoints across WhatsApp, Email, Instagram DMs, and Phone calls with countdowns and 1-click launch buttons.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<IconPlus size={13} />}
                  onClick={() => setIsSelectLeadModalOpen(true)}
                  className="h-[28px] text-[11.5px] px-3 mt-1"
                >
                  Schedule Follow-Up with a Lead
                </Button>
              </div>
            ) : (
              filtered.map((item) => {
                const cfg = getChannelConfig(item.followUp.channel);
                const isOverdue = item.status === 'overdue';
                const isToday = item.status === 'today';
                const isCompleted = item.status === 'completed';

                return (
                  <div
                    key={item.lead.id + item.followUp.id}
                    onClick={() => openLeadDrawer(item.lead.id)}
                    className={`min-w-[940px] px-3 py-2 flex items-center text-[12px] hover:bg-[var(--t-background-primary)] transition-colors cursor-pointer group ${
                      isCompleted ? 'opacity-60 bg-[var(--t-background-primary)]/40' : ''
                    }`}
                  >
                    {/* Company & Contact */}
                    <div className="w-[220px] shrink-0 flex flex-col min-w-0 pr-2">
                      <span className="font-medium text-[var(--t-font-color-primary)] truncate group-hover:text-[#5d4ef7]">
                        {item.lead.companyName}
                      </span>
                      <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] truncate">
                        {item.lead.contactName || item.lead.location || item.lead.leadOwner}
                      </span>
                    </div>

                    {/* Channel Badge */}
                    <div className="w-[110px] shrink-0 flex items-center pr-2">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border whitespace-nowrap ${cfg.badgeClass}`}
                      >
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>
                    </div>

                    {/* Scheduled Time */}
                    <div className="w-[160px] shrink-0 flex flex-col min-w-0 pr-2">
                      <span
                        className={`text-[11px] font-mono flex items-center gap-1 ${
                          isOverdue
                            ? 'text-rose-400 font-semibold'
                            : isToday
                            ? 'text-amber-400 font-semibold'
                            : 'text-[var(--t-font-color-secondary)]'
                        }`}
                      >
                        {isOverdue && <IconAlertTriangle size={11} className="text-rose-400 shrink-0" />}
                        <span>{formatScheduledLabel(item.followUp.scheduledDate)}</span>
                      </span>
                      <span className="text-[9.5px] text-[var(--t-font-color-tertiary)]">
                        {isOverdue ? 'Overdue' : isToday ? 'Due Today' : isCompleted ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>

                    {/* Follow-up Note */}
                    <div className="w-[200px] flex-1 shrink-0 min-w-0 pr-2">
                      <p className="text-[11px] text-[var(--t-font-color-secondary)] truncate">
                        {item.followUp.note || (
                          <span className="text-[var(--t-font-color-tertiary)] italic">
                            No custom note specified
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Deal Value */}
                    <div className="w-[90px] shrink-0 text-right font-mono text-[11.5px] text-[var(--t-font-color-primary)] pr-3">
                      {formatCurrency(item.lead.dealValue, currency)}
                    </div>

                    {/* Actions (Horizontal Single Line, Crisp Twenty CRM Aesthetic) */}
                    <div
                      className="w-[210px] shrink-0 flex items-center justify-end gap-1.5 pr-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isCompleted ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleExecuteAction(item)}
                            className={`h-[26px] px-2.5 rounded-[4px] text-[11px] font-medium border inline-flex items-center gap-1.5 whitespace-nowrap flex-nowrap shrink-0 transition-colors cursor-pointer shadow-2xs ${cfg.btnClass}`}
                            title={cfg.actionLabel}
                          >
                            {cfg.icon}
                            <span className="whitespace-nowrap shrink-0">{cfg.actionLabel}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => completeFollowUp(item.lead.id, item.followUp.id)}
                            className="w-[26px] h-[26px] rounded-[4px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Mark Follow-Up Done"
                          >
                            <IconCheck size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setFollowUpModalLead(item.lead)}
                            className="w-[26px] h-[26px] rounded-[4px] bg-[var(--t-background-primary)] hover:bg-[var(--t-background-tertiary)] border border-[var(--t-border-color-light)] text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Reschedule Follow-Up"
                          >
                            <IconClock size={13} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <IconCheck size={11} /> Done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SELECT LEAD MODAL FOR SCHEDULING FOLLOW-UP */}
      <Modal
        isOpen={isSelectLeadModalOpen}
        onClose={() => setIsSelectLeadModalOpen(false)}
        title="Schedule Client Follow-Up"
        subtitle="Select a prospect or client to set a scheduled touchpoint reminder"
        maxWidth="max-w-[460px]"
        overflowVisible={true}
      >
        <div className="space-y-4 select-none">
          <SearchableLeadSelect
            value=""
            onChange={(leadId) => {
              if (leadId) {
                const matched = leads.find((l) => l.id === leadId);
                if (matched) {
                  setIsSelectLeadModalOpen(false);
                  setFollowUpModalLead(matched);
                }
              }
            }}
            label="Select Prospect / Client"
            placeholder="Search by company name, contact, phone, location..."
          />

          <div className="pt-2 border-t border-[var(--t-border-color-light)] flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSelectLeadModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
