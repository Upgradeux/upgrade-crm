'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import {
  IconX,
  IconExternalLink,
  IconPhone,
  IconMail,
  IconMapPin,
  IconCurrencyDollar,
  IconUser,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconPlus,
  IconTrash,
  IconCheck,
  IconSparkles,
  IconMessageCircle,
  IconCalendarEvent,
  IconPhoneCall,
  IconClock,
  IconCalendar,
  IconBuilding,
  IconBrandWhatsapp,
  IconBrandX,
  IconVideo,
  IconSend,
  IconGlobe,
  IconTag,
  IconEdit,
  IconArrowsExchange,
  IconStar,
  IconStarFilled,
  IconUsers,
} from '@tabler/icons-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { LeadStatus, ServiceType, Note, LeadSource, CallOutcome, TaskPriority } from '@/types/crm';
import { formatCurrency, formatDate, formatRelativeTime, getGoogleMapsUrl, getTwitterUrl, getInstagramUrl, getLinkedInUrl, getFacebookUrl } from '@/lib/utils';

export function LeadDetailDrawer() {
  const {
    activeLead,
    closeLeadDrawer,
    updateLead,
    deleteLead,
    confirmAction,
    moveLeadStatus,
    bookCall,
    addNote,
    deleteNote,
    setWonLeadForModal,
    setIsWonModalOpen,
    setWhatsAppLeadModal,
    setInstagramDMLeadModal,
    setEmailComposerLeadModal,
    setMeetingModalLead,
    setFollowUpModalLead,
    completeFollowUp,
    deleteFollowUp,
    addTask,
    tasks,
    teamMembers,
    spaces,
    currency,
    timezone,
    agencyEmail,
    addToast,
  } = useCRM();

  const [noteInput, setNoteInput] = useState('');
  const [noteType, setNoteType] = useState<Note['type']>('call');
  const [createTaskFromNote, setCreateTaskFromNote] = useState<boolean>(false);
  const [emailMeTask, setEmailMeTask] = useState<boolean>(false);
  const [taskDueDate, setTaskDueDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [taskDueTime, setTaskDueTime] = useState<string>('09:00');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('high');
  const [activeTab, setActiveTab] = useState<'timeline' | 'details'>('timeline');

  // Dynamically assemble chronological Timeline & Activity stream from all lead lifecycle events, activity logs & notes
  const timelineItems = React.useMemo(() => {
    if (!activeLead) return [];

    const items: Array<{
      id: string;
      type: 'created' | 'call' | 'meeting' | 'followup' | 'task' | 'note' | 'activity_log';
      title: string;
      subtitle?: string;
      description?: string;
      timestamp: string;
      author?: string;
      badge?: { label: string; colorClass?: string };
      icon: React.ReactNode;
      iconBg: string;
      iconColor: string;
      noteId?: string;
      followUpId?: string;
      followUpCompleted?: boolean;
      taskId?: string;
      taskCompleted?: boolean;
      isNote?: boolean;
    }> = [];

    // 1. System Activity & Audit Logs (Status updates, renames, reassignment, deal changes, etc.)
    if (activeLead.activityLogs && activeLead.activityLogs.length > 0) {
      activeLead.activityLogs.forEach((log) => {
        let icon = <IconEdit size={13} />;
        let iconBg = 'bg-slate-500/10 border border-slate-500/20';
        let iconColor = 'text-slate-300';
        let badgeColor = 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
        let badgeLabel = 'Activity';

        if (log.type === 'status_change') {
          icon = <IconArrowsExchange size={13} />;
          iconBg = 'bg-blue-500/10 border border-blue-500/20';
          iconColor = 'text-blue-400';
          badgeColor = 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
          badgeLabel = 'Status';
        } else if (log.type === 'reassign') {
          icon = <IconUser size={13} />;
          iconBg = 'bg-purple-500/10 border border-purple-500/20';
          iconColor = 'text-purple-400';
          badgeColor = 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
          badgeLabel = 'Reassigned';
        } else if (log.type === 'meeting') {
          icon = <IconVideo size={13} />;
          iconBg = 'bg-emerald-500/10 border border-emerald-500/20';
          iconColor = 'text-emerald-400';
          badgeColor = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
          badgeLabel = 'Meeting';
        } else if (log.type === 'followup') {
          icon = <IconClock size={13} />;
          iconBg = 'bg-amber-500/10 border border-amber-500/20';
          iconColor = 'text-amber-400';
          badgeColor = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
          badgeLabel = 'Follow-Up';
        } else if (log.type === 'created') {
          icon = <IconSparkles size={13} />;
          iconBg = 'bg-indigo-500/10 border border-indigo-500/20';
          iconColor = 'text-indigo-400';
          badgeColor = 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
          badgeLabel = 'Created';
        }

        items.push({
          id: `log-${log.id}`,
          type: 'activity_log',
          title: log.title,
          subtitle: log.author ? `By ${log.author}` : undefined,
          description: log.description,
          timestamp: log.createdAt,
          author: log.author,
          badge: {
            label: badgeLabel,
            colorClass: badgeColor,
          },
          icon,
          iconBg,
          iconColor,
        });
      });
    }

    // 2. Fallback Lead Creation (if not in activityLogs)
    const hasCreationLog = activeLead.activityLogs?.some((l) => l.type === 'created');
    if (!hasCreationLog && activeLead.createdAt) {
      items.push({
        id: `created-${activeLead.id}`,
        type: 'created',
        title: 'Lead Added to Pipeline',
        subtitle: `Captured via ${activeLead.source || 'Direct Outreach'}`,
        description: `Assigned: ${activeLead.leadOwner || 'Unassigned'} • Initial Deal Value: ${formatCurrency(activeLead.dealValue || 0, currency)}`,
        timestamp: activeLead.createdAt,
        badge: {
          label: activeLead.source || 'New Lead',
          colorClass: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
        },
        icon: <IconSparkles size={13} />,
        iconBg: 'bg-indigo-500/10 border border-indigo-500/20',
        iconColor: 'text-indigo-400',
      });
    }

    // 3. Follow-up touchpoints (from followUps array + activeFollowUp)
    const allFollowUps = [...(activeLead.followUps || [])];
    if (activeLead.activeFollowUp && !allFollowUps.some((f) => f.id === activeLead.activeFollowUp?.id)) {
      allFollowUps.push(activeLead.activeFollowUp);
    }

    allFollowUps.forEach((f) => {
      const channelLabel = f.channel.toUpperCase();
      let icon = <IconClock size={13} />;
      if (f.channel === 'whatsapp') icon = <IconBrandWhatsapp size={13} />;
      else if (f.channel === 'email') icon = <IconMail size={13} />;
      else if (f.channel === 'instagram') icon = <IconBrandInstagram size={13} />;

      // Avoid duplicate if already covered by activityLogs
      if (!items.some((it) => it.id === `log-${f.id}` || it.description?.includes(f.id))) {
        items.push({
          id: `followup-${f.id}`,
          type: 'followup',
          title: `Follow-Up (${channelLabel}) ${f.completed ? 'Completed' : 'Scheduled'}`,
          subtitle: `Due: ${formatDate(f.scheduledDate, timezone)}`,
          description: f.note || (f.completed ? 'Follow-up touchpoint completed' : 'Follow-up touchpoint scheduled'),
          timestamp: f.completedAt || f.createdAt || f.scheduledDate,
          followUpId: f.id,
          followUpCompleted: f.completed,
          badge: {
            label: f.completed ? 'Completed' : 'Scheduled',
            colorClass: f.completed
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          },
          icon,
          iconBg: f.completed
            ? 'bg-emerald-500/10 border border-emerald-500/20'
            : 'bg-amber-500/10 border border-amber-500/20',
          iconColor: f.completed ? 'text-emerald-400' : 'text-amber-400',
        });
      }
    });

    // 4. Linked Workspace Tasks
    if (tasks && tasks.length > 0) {
      const leadTasks = tasks.filter((t) => t.leadId === activeLead.id);
      leadTasks.forEach((t) => {
        items.push({
          id: `task-${t.id}`,
          type: 'task',
          title: `Task: ${t.title}`,
          subtitle: `Priority: ${t.priority.toUpperCase()} • Assignee: ${t.assignedTo}`,
          description: t.description,
          timestamp: t.completedAt || t.createdAt,
          taskId: t.id,
          taskCompleted: t.completed,
          badge: {
            label: t.completed ? 'Task Done' : 'Task Pending',
            colorClass: t.completed
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
          },
          icon: <IconCheck size={13} />,
          iconBg: t.completed
            ? 'bg-emerald-500/10 border border-emerald-500/20'
            : 'bg-purple-500/10 border border-purple-500/20',
          iconColor: t.completed ? 'text-emerald-400' : 'text-purple-400',
        });
      });
    }

    // 5. Handwritten / Typed Team Notes (Call Logs, Meeting Notes, General Notes)
    (activeLead.notes || []).forEach((n) => {
      let icon = <IconMessageCircle size={13} />;
      let title = 'General Note';
      let badgeLabel = 'General Note';
      let badgeClass = 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
      let iconBg = 'bg-indigo-500/10 border border-indigo-500/20';
      let iconColor = 'text-indigo-400';

      if (n.type === 'call') {
        icon = <IconPhoneCall size={13} />;
        title = 'Call Log';
        badgeLabel = 'Call Log';
        badgeClass = 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
        iconBg = 'bg-sky-500/10 border border-sky-500/20';
        iconColor = 'text-sky-400';
      } else if (n.type === 'meeting') {
        icon = <IconVideo size={13} />;
        title = 'Meeting Note';
        badgeLabel = 'Meeting Note';
        badgeClass = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
        iconBg = 'bg-emerald-500/10 border border-emerald-500/20';
        iconColor = 'text-emerald-400';
      }

      items.push({
        id: `note-${n.id}`,
        type: 'note',
        isNote: true,
        noteId: n.id,
        title,
        subtitle: `By ${n.author || 'Team Member'}`,
        description: n.content,
        timestamp: n.createdAt,
        author: n.author,
        badge: {
          label: badgeLabel,
          colorClass: badgeClass,
        },
        icon,
        iconBg,
        iconColor,
      });
    });

    // Sort descending by timestamp (newest first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activeLead, tasks, currency, timezone]);

  if (!activeLead) return null;

  const spaceOptions = [
    { value: 'all', label: 'All Spaces (General / Global)' },
    ...spaces
      .filter((s) => s.id !== 'all')
      .map((s) => ({
        value: s.id,
        label: s.name,
      })),
  ];

  const statusOptions = [
    { value: 'Leads', label: 'Leads', badge: <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" /> },
    { value: 'Not Contacted', label: 'Not Contacted', badge: <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" /> },
    { value: 'Contacted', label: 'Contacted', badge: <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" /> },
    { value: 'Booked Meeting', label: 'Booked Meeting', badge: <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" /> },
    { value: 'Proposal Sent', label: 'Proposal Sent', badge: <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" /> },
    { value: 'Lost', label: 'Lost', badge: <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" /> },
    { value: 'Won', label: 'Won (Closed)', badge: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> },
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

  const ALL_SERVICES: ServiceType[] = [
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

  const serviceOptions = ALL_SERVICES.map((s) => ({ value: s, label: s }));

  if (!activeLead) return null;

  const handlePresetTaskDate = (daysFromNow: number, hour = 9) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setTaskDueDate(`${yyyy}-${mm}-${dd}`);
    setTaskDueTime(`${String(hour).padStart(2, '0')}:00`);
  };

  const handleTaskNextMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
    d.setDate(diff);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setTaskDueDate(`${yyyy}-${mm}-${dd}`);
    setTaskDueTime('09:00');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    const content = noteInput.trim();
    addNote(activeLead.id, content, noteType);

    if (createTaskFromNote) {
      const fullIso = taskDueDate
        ? new Date(`${taskDueDate}T${taskDueTime || '09:00'}:00`).toISOString()
        : undefined;

      addTask({
        title: `${noteType === 'call' ? 'Call follow-up' : noteType === 'meeting' ? 'Meeting action item' : 'Task'}: ${activeLead.companyName}`,
        description: content,
        priority: taskPriority,
        status: 'todo',
        category: noteType === 'call' ? 'Outreach & Calls' : noteType === 'meeting' ? 'Client Work' : 'Internal / Admin',
        dueDate: fullIso,
        dueTime: taskDueTime || '09:00',
        assignedTo: activeLead.leadOwner || 'Founder',
        leadId: activeLead.id,
        leadName: activeLead.companyName,
      });

      if (emailMeTask && agencyEmail) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: agencyEmail,
            subject: `[Internal Task / Reminder] ${activeLead.companyName}`,
            text: `Hi,\n\nYou logged a note and created an internal task for ${activeLead.companyName}:\n\n• Note Type: ${(noteType || 'note').toUpperCase()}\n• Priority: ${taskPriority.toUpperCase()}\n• Due Date: ${taskDueDate} at ${taskDueTime}\n• Client: ${activeLead.companyName} (Phone: ${activeLead.phone || 'N/A'}, Email: ${activeLead.email || 'N/A'})\n• Content:\n${content}\n\nView details inside your agency CRM.`,
          }),
        }).catch(() => {});
        addToast(`Note saved, task scheduled for ${taskDueDate} & email sent to ${agencyEmail}!`, 'success');
      } else {
        addToast(`Note saved and task scheduled for ${taskDueDate}!`, 'success');
      }
    } else {
      addToast('Note logged to lead timeline', 'success');
    }

    setNoteInput('');
    setCreateTaskFromNote(false);
    setEmailMeTask(false);
  };

  const handleConvertProject = () => {
    setWonLeadForModal(activeLead);
    setIsWonModalOpen(true);
    closeLeadDrawer();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
        onClick={closeLeadDrawer}
      />

      {/* Drawer Container (460px Twenty High-Density Inspector on Desktop, Full Width on Mobile) */}
      <div className="relative z-10 w-full max-w-full sm:max-w-[480px] h-full bg-[var(--t-background-primary)] border-l border-[var(--t-border-color-medium)] shadow-2xl flex flex-col font-sans animate-slide-left pb-16 sm:pb-0">
        {/* Header Strip */}
        <div className="px-4 pt-3.5 pb-2.5 border-b border-[var(--t-border-color-light)] space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge value={activeLead.source || 'Google Maps'} size="sm" />
              <span className="text-[11px] text-[var(--t-font-color-tertiary)]">•</span>
              <span className="text-[11px] text-[var(--t-font-color-secondary)]">
                Assigned: {activeLead.leadOwner}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  confirmAction({
                    title: 'Delete Lead',
                    message: `Are you sure you want to delete "${activeLead.companyName}"? This will permanently remove the lead and all associated logs.`,
                    confirmText: 'Delete Lead',
                    variant: 'danger',
                    onConfirm: () => {
                      deleteLead(activeLead.id);
                      closeLeadDrawer();
                    },
                  });
                }}
                title="Delete Lead"
              >
                <IconTrash size={13} className="text-rose-500" />
              </Button>
              <button
                onClick={closeLeadDrawer}
                className="w-[24px] h-[24px] rounded-[4px] flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer"
              >
                <IconX size={15} />
              </button>
            </div>
          </div>

          {/* Company Title & Convert Action */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <input
                type="text"
                value={activeLead.companyName}
                onChange={(e) => updateLead(activeLead.id, { companyName: e.target.value })}
                className="text-[15px] font-semibold text-[var(--t-font-color-primary)] bg-transparent outline-none border-b border-transparent hover:border-[var(--t-border-color-medium)] focus:border-[var(--t-border-color-focus)] px-0.5 truncate max-w-[220px]"
              />
              
              {/* Quick Jump Links (Website, Google Maps, Instagram, LinkedIn, X) */}
              <div className="flex items-center gap-0.5 shrink-0">
                {activeLead.websiteUrl && (
                  <a
                    href={activeLead.websiteUrl.startsWith('http') ? activeLead.websiteUrl : `https://${activeLead.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open Website: ${activeLead.websiteUrl}`}
                    className="w-[22px] h-[22px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors"
                  >
                    <IconExternalLink size={13} />
                  </a>
                )}

                <a
                  href={getGoogleMapsUrl(activeLead)}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in Google Maps"
                  className="w-[22px] h-[22px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                >
                  <IconMapPin size={13} />
                </a>

                {activeLead.socials?.instagram && (
                  <a
                    href={getInstagramUrl(activeLead.socials.instagram)}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open on Instagram: ${activeLead.socials.instagram}`}
                    className="w-[22px] h-[22px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-pink-500 hover:bg-pink-500/10 transition-colors"
                  >
                    <IconBrandInstagram size={13} />
                  </a>
                )}

                {activeLead.socials?.linkedin && (
                  <a
                    href={getLinkedInUrl(activeLead.socials.linkedin)}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open on LinkedIn: ${activeLead.socials.linkedin}`}
                    className="w-[22px] h-[22px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
                  >
                    <IconBrandLinkedin size={13} />
                  </a>
                )}

                {activeLead.socials?.twitter && (
                  <a
                    href={getTwitterUrl(activeLead.socials.twitter)}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open on X (Twitter): ${activeLead.socials.twitter}`}
                    className="w-[22px] h-[22px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors"
                  >
                    <IconBrandX size={13} />
                  </a>
                )}
              </div>
            </div>

            {activeLead.status !== 'Won' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<IconSparkles size={12} />}
                onClick={handleConvertProject}
              >
                Convert to Won
              </Button>
            )}
          </div>

          {/* Twenty-Style Metadata Chips (Rating, Followers, Location, Source) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px]">
            {activeLead.location && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]">
                <IconMapPin size={11} className="text-emerald-500 shrink-0" />
                <span className="truncate max-w-[170px]">{activeLead.location}</span>
              </span>
            )}

            {(activeLead.rating !== undefined && activeLead.rating !== null && activeLead.rating > 0) && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-medium">
                <IconStarFilled size={11} className="text-amber-400 shrink-0" />
                <span>{activeLead.rating.toFixed(1)}</span>
                {activeLead.reviewCount && <span className="text-[10px] text-amber-400/80">({activeLead.reviewCount})</span>}
              </span>
            )}

            {activeLead.followers && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-pink-500/10 border border-pink-500/20 text-pink-400 font-mono font-medium">
                <IconBrandInstagram size={11} className="shrink-0" />
                <span>{activeLead.followers}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[var(--t-font-color-tertiary)]">
              <span>{activeLead.source}</span>
            </span>

            {activeLead.industry && activeLead.industry !== 'All Spaces' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[var(--t-font-color-tertiary)]">
                <span>{activeLead.industry}</span>
              </span>
            )}
          </div>

          {/* Single Unified Status & Assigned Member Controls */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                Pipeline Status
              </label>
              <Dropdown
                value={activeLead.status}
                onChange={(val) => moveLeadStatus(activeLead.id, val as LeadStatus)}
                options={statusOptions}
                size="sm"
                buttonClassName="h-[28px] bg-[var(--t-background-primary)] text-[11.5px]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                Assigned Team Member
              </label>
              <Dropdown
                value={activeLead.leadOwner}
                onChange={(val) => updateLead(activeLead.id, { leadOwner: val })}
                options={teamMemberOptions}
                size="sm"
                buttonClassName="h-[28px] bg-[var(--t-background-primary)] text-[11.5px]"
              />
            </div>
          </div>
        </div>

        {/* Active Scheduled Meeting Banner with Direct Join and Cancel Options */}
        {(activeLead.status === 'Booked Call' || activeLead.googleMeetLink || activeLead.bookedMeetingDate) && (
          <div className="px-3.5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/25 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-[26px] h-[26px] rounded-[5px] bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <IconVideo size={14} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-[11.5px] font-bold text-[var(--t-font-color-primary)]">
                    Confirmed Google Meet
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-[var(--t-font-color-secondary)] font-mono truncate">
                  {activeLead.bookedMeetingDate ? formatDate(activeLead.bookedMeetingDate, timezone) : 'Scheduled Call'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Join Meeting Button */}
              <a
                href={activeLead.googleMeetLink || 'https://meet.google.com/oic-saem-syo'}
                target="_blank"
                rel="noreferrer"
                className="h-[26px] px-2.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <IconVideo size={12} />
                <span>Join Meeting</span>
              </a>

              {/* Cancel / Delete Meeting Button */}
              <button
                onClick={() => {
                  confirmAction({
                    title: 'Cancel Scheduled Meeting',
                    message: `Cancel the scheduled meeting with ${activeLead.companyName}? This will reset the meeting status back to Contacted.`,
                    confirmText: 'Cancel Meeting',
                    variant: 'danger',
                    onConfirm: () => {
                      updateLead(activeLead.id, {
                        bookedMeetingDate: undefined,
                        googleMeetLink: undefined,
                        status: 'Contacted',
                        outreachStage: 'Contacted',
                      });
                      addNote(activeLead.id, 'Cancelled scheduled Google Meet.', 'system');
                      addToast(`Meeting cancelled for ${activeLead.companyName}`, 'info');
                    },
                  });
                }}
                className="h-[26px] px-2 rounded-[4px] bg-[var(--t-background-primary)] hover:bg-rose-500/15 border border-[var(--t-border-color-medium)] hover:border-rose-500/30 text-[var(--t-font-color-tertiary)] hover:text-rose-400 text-[10.5px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Cancel and remove scheduled meeting"
              >
                <IconX size={11} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Scheduled Follow-Up Banner */}
        {activeLead.activeFollowUp && !activeLead.activeFollowUp.completed && (
          <div className="px-3.5 py-2.5 bg-amber-500/10 border-b border-amber-500/25 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-[26px] h-[26px] rounded-[5px] bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                {activeLead.activeFollowUp.channel === 'whatsapp' && <IconBrandWhatsapp size={14} />}
                {activeLead.activeFollowUp.channel === 'email' && <IconMail size={14} />}
                {activeLead.activeFollowUp.channel === 'instagram' && <IconBrandInstagram size={14} />}
                {activeLead.activeFollowUp.channel === 'reminder' && <IconClock size={14} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-[11.5px] font-bold text-[var(--t-font-color-primary)]">
                    Follow-Up ({activeLead.activeFollowUp.channel.toUpperCase()})
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium">
                    {formatDate(activeLead.activeFollowUp.scheduledDate, timezone)}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--t-font-color-secondary)] truncate">
                  {activeLead.activeFollowUp.note || 'Scheduled follow-up touchpoint'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Execute Action only for external communication channels */}
              {activeLead.activeFollowUp.channel !== 'reminder' && (
                <button
                  onClick={() => {
                    if (activeLead.activeFollowUp?.channel === 'whatsapp') setWhatsAppLeadModal(activeLead);
                    else if (activeLead.activeFollowUp?.channel === 'email') setEmailComposerLeadModal(activeLead);
                    else if (activeLead.activeFollowUp?.channel === 'instagram') setInstagramDMLeadModal(activeLead);
                  }}
                  className="h-[24px] px-2 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[10.5px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  {activeLead.activeFollowUp.channel === 'whatsapp' && <span>Open WhatsApp</span>}
                  {activeLead.activeFollowUp.channel === 'email' && <span>Compose Email</span>}
                  {activeLead.activeFollowUp.channel === 'instagram' && <span>Send DM</span>}
                </button>
              )}

              {/* Complete Follow-Up */}
              <button
                onClick={() => completeFollowUp(activeLead.id)}
                className="h-[24px] px-1.5 rounded-[4px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
                title="Mark Follow-up as Completed"
              >
                <IconCheck size={11} />
                <span>Done</span>
              </button>

              {/* Reschedule Follow-Up */}
              <button
                onClick={() => setFollowUpModalLead(activeLead)}
                className="h-[24px] px-1.5 rounded-[4px] bg-[var(--t-background-primary)] hover:bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] text-[var(--t-font-color-secondary)] text-[10px] transition-colors cursor-pointer"
                title="Reschedule"
              >
                <IconClock size={11} />
              </button>

              {/* Cancel Follow-Up */}
              <button
                onClick={() => deleteFollowUp(activeLead.id)}
                className="h-[24px] px-1.5 rounded-[4px] bg-[var(--t-background-primary)] hover:bg-rose-500/15 border border-[var(--t-border-color-medium)] hover:border-rose-500/30 text-[var(--t-font-color-tertiary)] hover:text-rose-400 text-[10px] transition-colors cursor-pointer"
                title="Cancel Follow-Up"
              >
                <IconX size={11} />
              </button>
            </div>
          </div>
        )}

        {/* High-Density Action & Outreach Toolbar */}
        <div className="px-3.5 py-2 bg-[var(--t-background-transparent-lighter)] border-b border-[var(--t-border-color-light)] space-y-2 shrink-0">
          {/* Main Direct Actions (Google Meet, Email, WhatsApp, Instagram DM, Follow-Up) */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => setMeetingModalLead(activeLead)}
              className="h-[26px] px-1.5 rounded-[5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] text-[var(--t-font-color-primary)] border border-[var(--t-border-color-medium)] hover:border-[var(--t-border-color-focus)] text-[10.5px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <IconCalendarEvent size={12} className="text-emerald-500 shrink-0" />
              <span className="truncate">Meet</span>
            </button>

            <button
              onClick={() => setEmailComposerLeadModal(activeLead)}
              className="h-[26px] px-1.5 rounded-[5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] text-[var(--t-font-color-primary)] border border-[var(--t-border-color-medium)] hover:border-[var(--t-border-color-focus)] text-[10.5px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <IconMail size={12} className="text-blue-400 shrink-0" />
              <span className="truncate">Email</span>
            </button>

            <button
              onClick={() => setWhatsAppLeadModal(activeLead)}
              className="h-[26px] px-1.5 rounded-[5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] text-[var(--t-font-color-primary)] border border-[var(--t-border-color-medium)] hover:border-[var(--t-border-color-focus)] text-[10.5px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <IconBrandWhatsapp size={12} className="text-emerald-400 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </button>

            <button
              onClick={() => setInstagramDMLeadModal(activeLead)}
              className="h-[26px] px-1.5 rounded-[5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] text-[var(--t-font-color-primary)] border border-[var(--t-border-color-medium)] hover:border-pink-500/50 text-[10.5px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <IconBrandInstagram size={12} className="text-pink-500 shrink-0" />
              <span className="truncate">Insta DM</span>
            </button>

            <button
              onClick={() => setFollowUpModalLead(activeLead)}
              className="h-[26px] px-1.5 rounded-[5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] text-[var(--t-font-color-primary)] border border-amber-500/40 hover:border-amber-500/80 text-[10.5px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <IconClock size={12} className="text-amber-400 shrink-0" />
              <span className="truncate">Follow-Up</span>
            </button>
          </div>

          {/* Last Outreach Indicator (if contacted) */}
          {activeLead.lastContactedAt && (
            <div className="flex items-center justify-end text-[10px] text-[var(--t-font-color-tertiary)] font-mono pt-0.5">
              <span className="flex items-center gap-1">
                <IconClock size={11} />
                <span>Last outreach: {formatRelativeTime(activeLead.lastContactedAt)}</span>
              </span>
            </div>
          )}

          {/* Active Booked Meeting & Google Meet Banner */}
          {activeLead.bookedMeetingDate && activeLead.googleMeetLink && (
            <div className="p-2 rounded-[5px] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-[var(--t-font-color-primary)] truncate">
                    Google Meet: {formatDate(activeLead.bookedMeetingDate, timezone)} ({new Date(activeLead.bookedMeetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </div>
                  <div className="text-[9.5px] font-mono text-[var(--t-font-color-tertiary)] truncate">
                    {activeLead.googleMeetLink}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => window.open(activeLead.googleMeetLink, '_blank')}
                  className="h-[22px] px-2 rounded-[4px] bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] hover:opacity-90 text-[10.5px] font-medium flex items-center gap-1 transition-opacity cursor-pointer"
                >
                  <IconVideo size={11} /> Join
                </button>
                <button
                  onClick={() => setMeetingModalLead(activeLead)}
                  className="h-[22px] px-1.5 rounded-[4px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] text-[var(--t-font-color-secondary)] border border-[var(--t-border-color-light)] text-[10.5px] font-medium transition-colors cursor-pointer"
                >
                  Reschedule
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Twenty Segmented Tab Toggle */}
        <div className="px-3.5 py-2 border-b border-[var(--t-border-color-light)] bg-[var(--t-background-primary)] shrink-0">
          <div className="flex bg-[var(--t-background-secondary)] p-0.5 rounded-[5px] border border-[var(--t-border-color-light)]">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-1 text-[11px] rounded-[4px] font-medium transition-all cursor-pointer text-center ${
                activeTab === 'timeline'
                  ? 'bg-[var(--t-background-primary)] text-[var(--t-font-color-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-secondary)]'
              }`}
            >
              Activity & Notes ({timelineItems.length})
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1 text-[11px] rounded-[4px] font-medium transition-all cursor-pointer text-center ${
                activeTab === 'details'
                  ? 'bg-[var(--t-background-primary)] text-[var(--t-font-color-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-secondary)]'
              }`}
            >
              Lead Properties
            </button>
          </div>
        </div>

        {/* Tab 1: Timeline & Notes */}
        {activeTab === 'timeline' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-[12px]">
            {/* New Note Form */}
            <form
              onSubmit={handleAddNote}
              className="p-2.5 bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] space-y-2"
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setNoteType('call')}
                  className={`px-2 py-0.5 rounded-[3px] text-[10px] font-medium transition-colors cursor-pointer ${
                    noteType === 'call'
                      ? 'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] font-semibold'
                      : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] bg-[var(--t-background-primary)]'
                  }`}
                >
                  Call Log
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType('note')}
                  className={`px-2 py-0.5 rounded-[3px] text-[10px] font-medium transition-colors cursor-pointer ${
                    noteType === 'note'
                      ? 'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] font-semibold'
                      : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] bg-[var(--t-background-primary)]'
                  }`}
                >
                  General Note
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType('meeting')}
                  className={`px-2 py-0.5 rounded-[3px] text-[10px] font-medium transition-colors cursor-pointer ${
                    noteType === 'meeting'
                      ? 'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] font-semibold'
                      : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] bg-[var(--t-background-primary)]'
                  }`}
                >
                  Meeting Note
                </button>
              </div>

              <textarea
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Log notes, client objections, or next steps..."
                className="w-full bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] focus:border-[var(--t-border-color-focus)] rounded-[4px] p-2 text-[11.5px] text-[var(--t-font-color-primary)] outline-none resize-none leading-relaxed"
              />

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-[10.5px] text-[var(--t-font-color-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createTaskFromNote}
                      onChange={(e) => {
                        setCreateTaskFromNote(e.target.checked);
                        if (!e.target.checked) setEmailMeTask(false);
                      }}
                      className="rounded border-[var(--t-border-color-medium)] accent-[#5d4ef7] w-3.5 h-3.5"
                    />
                    <span className="font-medium">Also add to Workspace Tasks</span>
                  </label>

                  <Button type="submit" variant="primary" size="sm" className="h-[24px] text-[11px]">
                    Save Note
                  </Button>
                </div>

                {/* When creating task from note, allow picking date, time, priority & email alert */}
                {createTaskFromNote && (
                  <div className="p-2.5 rounded-[5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] space-y-2 animate-fade-in text-[11px]">
                    {/* Quick Timing Presets */}
                    <div>
                      <span className="text-[10px] text-[var(--t-font-color-tertiary)] block mb-1">
                        Task Deadline Presets:
                      </span>
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'Tomorrow 9 AM', onClick: () => handlePresetTaskDate(1, 9) },
                          { label: 'In 2 Days', onClick: () => handlePresetTaskDate(2, 9) },
                          { label: 'Next Monday', onClick: handleTaskNextMonday },
                        ].map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={p.onClick}
                            className="h-[20px] px-1.5 rounded-[3px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-tertiary)] text-[10px] text-[var(--t-font-color-secondary)] border border-[var(--t-border-color-light)] transition-colors cursor-pointer truncate"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date, Time & Priority Pickers */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="text-[9.5px] text-[var(--t-font-color-tertiary)] block mb-0.5">
                          Due Date
                        </label>
                        <Input
                          type="date"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                          className="h-[24px] text-[10.5px] font-mono px-1.5"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9.5px] text-[var(--t-font-color-tertiary)] block mb-0.5">
                          Due Time
                        </label>
                        <Input
                          type="time"
                          value={taskDueTime}
                          onChange={(e) => setTaskDueTime(e.target.value)}
                          className="h-[24px] text-[10.5px] font-mono px-1.5"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9.5px] text-[var(--t-font-color-tertiary)] block mb-0.5">
                          Priority
                        </label>
                        <select
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                          className="w-full h-[24px] px-1 bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] rounded-[4px] text-[10.5px] text-[var(--t-font-color-primary)] outline-none cursor-pointer"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>

                    {/* Email alert option */}
                    <label className="flex items-center gap-1.5 text-[10px] text-[var(--t-font-color-secondary)] cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={emailMeTask}
                        onChange={(e) => setEmailMeTask(e.target.checked)}
                        className="rounded accent-[#5d4ef7] w-3 h-3"
                      />
                      <span>Send notification email to my inbox ({agencyEmail || 'upgradeux.agency@gmail.com'})</span>
                    </label>
                  </div>
                )}
              </div>
            </form>

            {/* Twenty Style Clean Minimal Vertical Activity Stream */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider px-1">
                <span>Activity & History</span>
                <span className="font-mono text-[9.5px] text-[var(--t-font-color-tertiary)]">
                  {timelineItems.length} {timelineItems.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {/* Continuous Timeline with Spine */}
              <div className="relative pl-6 space-y-3.5 pt-1 before:absolute before:left-2.5 before:top-2.5 before:bottom-2 before:w-[1px] before:bg-[var(--t-border-color-light)]">
                {timelineItems.map((item) => (
                  <div key={item.id} className="relative group text-[11.5px]">
                    {/* Node Icon on Spine */}
                    <div
                      className={`absolute -left-6 top-0.5 w-[20px] h-[20px] rounded-full flex items-center justify-center bg-[var(--t-background-primary)] border text-[10.5px] z-10 ${item.iconBg} ${item.iconColor}`}
                    >
                      {item.icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 space-y-1">
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          {item.author && (
                            <span className="font-semibold text-[var(--t-font-color-primary)] text-[11px]">
                              {item.author}
                            </span>
                          )}
                          <span className="text-[11px] text-[var(--t-font-color-secondary)]">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${item.badge.colorClass}`}>
                              {item.badge.label}
                            </span>
                          )}
                        </div>

                        {/* Timestamp & Quick Action */}
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-[var(--t-font-color-tertiary)]">
                          <span className="font-mono text-[9.5px]" title={formatDate(item.timestamp, timezone)}>
                            {formatRelativeTime(item.timestamp)}
                          </span>

                          {/* Delete note button on hover */}
                          {item.isNote && item.noteId && (
                            <button
                              onClick={() => deleteNote(activeLead.id, item.noteId!)}
                              className="opacity-0 group-hover:opacity-100 text-[var(--t-font-color-tertiary)] hover:text-rose-500 p-0.5 transition-opacity cursor-pointer"
                              title="Delete note"
                            >
                              <IconTrash size={11} />
                            </button>
                          )}

                          {/* Follow up complete action */}
                          {item.type === 'followup' && item.followUpId && !item.followUpCompleted && (
                            <button
                              onClick={() => completeFollowUp(activeLead.id, item.followUpId)}
                              className="h-[18px] px-1.5 rounded-[3px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9.5px] font-medium flex items-center gap-0.5 cursor-pointer"
                              title="Mark as completed"
                            >
                              <IconCheck size={9} />
                              <span>Done</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description / Note Bubble */}
                      {item.description && (
                        <div
                          className={`text-[11px] leading-relaxed whitespace-pre-wrap ${
                            item.isNote
                              ? 'p-2 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] text-[var(--t-font-color-primary)]'
                              : 'text-[var(--t-font-color-tertiary)] text-[10.5px]'
                          }`}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {timelineItems.length === 0 && (
                  <div className="py-6 text-center text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
                    No activity logs yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Lead Properties (Twenty High-Density Property Inspector Grid) */}
        {activeTab === 'details' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-[11.5px] pb-32">
            {/* Core Properties Card */}
            <div className="bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] divide-y divide-[var(--t-border-color-light)] relative z-10">
              <div className="px-3 py-1.5 bg-[var(--t-background-transparent-light)] text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider rounded-t-[5px]">
                Contact & Company Information
              </div>

              {/* Property: Company Name */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconBuilding size={12} className="shrink-0 text-indigo-400" />
                  <span className="font-medium text-[var(--t-font-color-primary)]">Company Name</span>
                </div>
                <div className="col-span-8">
                  <input
                    type="text"
                    value={activeLead.companyName || ''}
                    onChange={(e) => updateLead(activeLead.id, { companyName: e.target.value })}
                    placeholder="Business / Company Name"
                    className="w-full h-[24px] px-1.5 text-[11.5px] font-medium bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
                  />
                </div>
              </div>

              {/* Property: Contact Name */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconUser size={12} className="shrink-0" />
                  <span>Contact Person</span>
                </div>
                <div className="col-span-8">
                  <input
                    type="text"
                    value={activeLead.contactName || ''}
                    onChange={(e) => updateLead(activeLead.id, { contactName: e.target.value })}
                    placeholder="Contact person / decision maker"
                    className="w-full h-[24px] px-1.5 text-[11.5px] bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
                  />
                </div>
              </div>

              {/* Property: Website URL */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconGlobe size={12} className="shrink-0 text-sky-400" />
                  <span>Website URL</span>
                </div>
                <div className="col-span-8 flex items-center gap-1">
                  <input
                    type="text"
                    value={activeLead.websiteUrl || ''}
                    onChange={(e) => updateLead(activeLead.id, { websiteUrl: e.target.value })}
                    placeholder="https://company.com"
                    className="flex-1 min-w-0 h-[24px] px-1.5 text-[11.5px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)] truncate"
                  />
                  {activeLead.websiteUrl && (
                    <a
                      href={activeLead.websiteUrl.startsWith('http') ? activeLead.websiteUrl : `https://${activeLead.websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-[20px] h-[20px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-sky-400 shrink-0"
                      title="Open Website in new tab"
                    >
                      <IconExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Property: Phone */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconPhone size={12} className="shrink-0" />
                  <span>Phone (Primary)</span>
                </div>
                <div className="col-span-8">
                  <input
                    type="text"
                    value={activeLead.phone || ''}
                    onChange={(e) => updateLead(activeLead.id, { phone: e.target.value })}
                    placeholder="+91 / +1 Phone"
                    className="w-full h-[24px] px-1.5 text-[11.5px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
                  />
                </div>
              </div>

              {/* Property: Alternate Phone */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconPhoneCall size={12} className="shrink-0 text-amber-500" />
                  <span>Alt Phone</span>
                </div>
                <div className="col-span-8">
                  <input
                    type="text"
                    value={activeLead.alternatePhone || ''}
                    onChange={(e) => updateLead(activeLead.id, { alternatePhone: e.target.value })}
                    placeholder="Secondary phone / landline"
                    className="w-full h-[24px] px-1.5 text-[11.5px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
                  />
                </div>
              </div>

              {/* Property: Email */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconMail size={12} className="shrink-0" />
                  <span>Email</span>
                </div>
                <div className="col-span-8">
                  <input
                    type="email"
                    value={activeLead.email || ''}
                    onChange={(e) => updateLead(activeLead.id, { email: e.target.value })}
                    placeholder="client@company.com"
                    className="w-full h-[24px] px-1.5 text-[11.5px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
                  />
                </div>
              </div>

              {/* Property: Location */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconMapPin size={12} className="shrink-0 text-emerald-500" />
                  <span>Location</span>
                </div>
                <div className="col-span-8 flex items-center gap-1">
                  <input
                    type="text"
                    value={activeLead.location || ''}
                    onChange={(e) => updateLead(activeLead.id, { location: e.target.value })}
                    placeholder="City, State"
                    className="flex-1 min-w-0 h-[24px] px-1.5 text-[11.5px] bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)] truncate"
                  />
                  <a
                    href={getGoogleMapsUrl(activeLead)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-[20px] h-[20px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-emerald-500 shrink-0"
                    title="View on Google Maps"
                  >
                    <IconExternalLink size={11} />
                  </a>
                </div>
              </div>

              {/* Property: Direct Google Maps URL */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconMapPin size={12} className="shrink-0 text-emerald-500" />
                  <span>Maps Link</span>
                </div>
                <div className="col-span-8 flex items-center gap-1">
                  <input
                    type="text"
                    value={activeLead.mapsUrl || activeLead.socials?.maps || ''}
                    onChange={(e) =>
                      updateLead(activeLead.id, {
                        mapsUrl: e.target.value,
                        socials: { ...activeLead.socials, maps: e.target.value },
                      })
                    }
                    placeholder="https://maps.google.com/?q=..."
                    className="flex-1 min-w-0 h-[24px] px-1.5 text-[11px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)] truncate"
                  />
                  <a
                    href={getGoogleMapsUrl(activeLead)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-[20px] h-[20px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-emerald-500 shrink-0"
                    title="Open in Google Maps"
                  >
                    <IconExternalLink size={11} />
                  </a>
                </div>
              </div>
              {/* Online Reputation & Audience Metrics */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconStarFilled size={12} className="shrink-0 text-amber-400" />
                  <span>Star Rating</span>
                </div>
                <div className="col-span-8 flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={activeLead.rating !== undefined && activeLead.rating !== null ? activeLead.rating : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      updateLead(activeLead.id, { rating: val });
                    }}
                    placeholder="e.g. 4.8"
                    className="w-20 h-[24px] px-1.5 text-[11.5px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
                  />
                  <span className="text-[10px] text-[var(--t-font-color-tertiary)]">/ 5.0</span>
                </div>
              </div>

              {/* Property: Review Count */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconStar size={12} className="shrink-0 text-amber-400" />
                  <span>Reviews Count</span>
                </div>
                <div className="col-span-8">
                  <input
                    type="number"
                    value={activeLead.reviewCount !== undefined && activeLead.reviewCount !== null ? activeLead.reviewCount : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      updateLead(activeLead.id, { reviewCount: isNaN(val as number) ? undefined : val });
                    }}
                    placeholder="e.g. 142"
                    className="w-full h-[24px] px-1.5 text-[11.5px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
                  />
                </div>
              </div>

              {/* Property: Followers */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconUsers size={12} className="shrink-0 text-pink-400" />
                  <span>Followers Reach</span>
                </div>
                <div className="col-span-8">
                  <input
                    type="text"
                    value={activeLead.followers || ''}
                    onChange={(e) => updateLead(activeLead.id, { followers: e.target.value })}
                    placeholder="e.g. 12.4K or 50K"
                    className="w-full h-[24px] px-1.5 text-[11.5px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Deal & Service Intelligence */}
            <div className="bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] divide-y divide-[var(--t-border-color-light)] relative z-20">
              <div className="px-3 py-1.5 bg-[var(--t-background-transparent-light)] text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider rounded-t-[5px]">
                Deal & Service Scope
              </div>

              {/* Property: Deal Value */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconCurrencyDollar size={12} className="shrink-0" />
                  <span>Deal Value ({currency.split(' ')[0]})</span>
                </div>
                <div className="col-span-8">
                  <input
                    type="number"
                    value={activeLead.dealValue || ''}
                    onChange={(e) => updateLead(activeLead.id, { dealValue: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full h-[24px] px-1.5 text-[11.5px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)]"
                  />
                </div>
              </div>

              {/* Property: Services to Pitch (Multi-Select) */}
              <div className="px-3 py-2 space-y-1.5 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="flex items-center justify-between text-[11px] text-[var(--t-font-color-tertiary)]">
                  <div className="flex items-center gap-1.5">
                    <IconBuilding size={12} className="shrink-0" />
                    <span>Services to Pitch</span>
                  </div>
                  <span className="text-[10px] text-[#5d4ef7] font-mono font-medium">
                    {(activeLead.services || [activeLead.serviceInterest]).length} Selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {ALL_SERVICES.map((svc) => {
                    const currentList = activeLead.services || [activeLead.serviceInterest];
                    const isSelected = currentList.includes(svc);
                    return (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? currentList.filter((s) => s !== svc)
                            : [...currentList, svc];
                          updateLead(activeLead.id, {
                            services: updated,
                            serviceInterest: updated[0] || 'Web Development',
                          });
                        }}
                        className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border transition-all flex items-center gap-1 cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#5d4ef7]/15 border-[#5d4ef7] text-[#5d4ef7] font-semibold'
                            : 'bg-[var(--t-background-secondary)] border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)]'
                        }`}
                      >
                        {isSelected && <IconCheck size={10} className="text-[#5d4ef7] shrink-0" />}
                        <span>{svc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Property: Industry Space */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconBuilding size={12} className="shrink-0 text-indigo-500" />
                  <span>Industry Space</span>
                </div>
                <div className="col-span-8">
                  <Dropdown
                    value={activeLead.industrySpaceId || 'all'}
                    onChange={(val) => {
                      const matched = spaces.find((s) => s.id === val);
                      updateLead(activeLead.id, {
                        industrySpaceId: val,
                        industry: val === 'all' ? 'All Spaces' : matched?.name || 'All Spaces',
                      });
                    }}
                    options={spaceOptions}
                    size="sm"
                    buttonClassName="h-[24px] px-1 text-[11px] bg-transparent border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)]"
                  />
                </div>
              </div>
            </div>

            {/* Social & Digital Profiles */}
            <div className="bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] divide-y divide-[var(--t-border-color-light)] relative z-10">
              <div className="px-3 py-1.5 bg-[var(--t-background-transparent-light)] text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider rounded-t-[5px]">
                Social & Digital Profiles
              </div>

              {/* Property: X (Twitter) */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconBrandX size={12} className="shrink-0 text-[var(--t-font-color-primary)]" />
                  <span>X (Twitter)</span>
                </div>
                <div className="col-span-8 flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="https://x.com/... or @handle"
                    value={activeLead.socials?.twitter || ''}
                    onChange={(e) =>
                      updateLead(activeLead.id, {
                        socials: { ...activeLead.socials, twitter: e.target.value },
                      })
                    }
                    className="flex-1 min-w-0 h-[24px] px-1.5 text-[11px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)] truncate"
                  />
                  {activeLead.socials?.twitter && (
                    <a
                      href={getTwitterUrl(activeLead.socials.twitter)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-[20px] h-[20px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] shrink-0"
                      title="Open profile on X"
                    >
                      <IconExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Property: Instagram */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconBrandInstagram size={12} className="shrink-0 text-pink-500" />
                  <span>Instagram</span>
                </div>
                <div className="col-span-8 flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="https://instagram.com/..."
                    value={activeLead.socials?.instagram || ''}
                    onChange={(e) =>
                      updateLead(activeLead.id, {
                        socials: { ...activeLead.socials, instagram: e.target.value },
                      })
                    }
                    className="flex-1 min-w-0 h-[24px] px-1.5 text-[11px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)] truncate"
                  />
                  {activeLead.socials?.instagram && (
                    <a
                      href={activeLead.socials.instagram.startsWith('http') ? activeLead.socials.instagram : `https://instagram.com/${activeLead.socials.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-[20px] h-[20px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-pink-500 shrink-0"
                      title="Open Instagram Profile"
                    >
                      <IconExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Property: LinkedIn */}
              <div className="grid grid-cols-12 items-center px-3 py-1 hover:bg-[var(--t-background-primary)] transition-colors">
                <div className="col-span-4 flex items-center gap-1.5 text-[11px] text-[var(--t-font-color-tertiary)]">
                  <IconBrandLinkedin size={12} className="shrink-0 text-sky-500" />
                  <span>LinkedIn</span>
                </div>
                <div className="col-span-8 flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/..."
                    value={activeLead.socials?.linkedin || ''}
                    onChange={(e) =>
                      updateLead(activeLead.id, {
                        socials: { ...activeLead.socials, linkedin: e.target.value },
                      })
                    }
                    className="flex-1 min-w-0 h-[24px] px-1.5 text-[11px] font-mono bg-transparent hover:bg-[var(--t-background-secondary)] focus:bg-[var(--t-background-primary)] border border-transparent hover:border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[3px] outline-none text-[var(--t-font-color-primary)] truncate"
                  />
                  {activeLead.socials?.linkedin && (
                    <a
                      href={activeLead.socials.linkedin.startsWith('http') ? activeLead.socials.linkedin : `https://${activeLead.socials.linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-[20px] h-[20px] rounded flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-sky-500 shrink-0"
                      title="Open LinkedIn Profile"
                    >
                      <IconExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
