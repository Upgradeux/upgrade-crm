'use client';

import React, { useState, useMemo } from 'react';
import { useCRM } from '@/lib/store';
import { CRMTask, CRMNote, TaskPriority, TaskStatus, TaskCategory, NoteCategory } from '@/types/crm';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { SearchableLeadSelect } from '../ui/SearchableLeadSelect';
import {
  IconCheck,
  IconPlus,
  IconTrash,
  IconPin,
  IconCopy,
  IconSearch,
  IconClock,
  IconCalendar,
  IconUser,
  IconTag,
  IconFlame,
  IconListCheck,
  IconNotes,
  IconEdit,
  IconLayoutKanban,
  IconCalendarEvent,
  IconAlertCircle,
  IconBuilding,
  IconWriting,
  IconPhoneCall,
  IconMessageCircle,
  IconFilter,
  IconArrowUpRight,
  IconArrowsExchange,
  IconX,
} from '@tabler/icons-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface UnifiedNoteItem {
  id: string;
  rawNoteId?: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  leadId?: string;
  leadName?: string;
  createdAt: string;
  updatedAt: string;
  isLeadLog: boolean;
  logType: 'call' | 'note' | 'meeting' | 'system' | 'task';
  author: string;
}

export function TasksNotesView() {
  const {
    tasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    crmNotes,
    addCRMNote,
    updateCRMNote,
    togglePinCRMNote,
    deleteCRMNote,
    updateNote,
    togglePinLeadNote,
    deleteNote,
    scratchpadText,
    setScratchpadText,
    leads,
    openLeadDrawer,
    teamMembers,
    addToast,
    timezone,
    agencyEmail,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'scratchpad'>('tasks');
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'kanban'>('kanban');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [notesCategoryFilter, setNotesCategoryFilter] = useState<string>('all');

  // Drag and Drop States for Kanban
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<TaskStatus | null>(null);

  // Quick Inline Task Creator State
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<TaskPriority>('medium');
  const [quickTaskCategory, setQuickTaskCategory] = useState<TaskCategory>('Internal / Admin');

  // Detailed Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('Internal / Admin');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('todo');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('09:00');
  const [taskAssignedTo, setTaskAssignedTo] = useState('Alex (Founder)');
  const [taskLeadId, setTaskLeadId] = useState<string>('');
  const [sendEmailReminder, setSendEmailReminder] = useState<boolean>(false);

  // Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<UnifiedNoteItem | null>(null);
  const [isNoteEditMode, setIsNoteEditMode] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<string>('General');
  const [noteLeadId, setNoteLeadId] = useState<string>('');

  // Scratchpad save feedback
  const [scratchpadSaved, setScratchpadSaved] = useState(false);

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesLead = (t.leadName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLead) return false;
      }
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [tasks, search, priorityFilter, categoryFilter]);

  // Aggregate Standalone Workspace Notes + Lead Timeline Logs
  const allUnifiedNotes = useMemo((): UnifiedNoteItem[] => {
    const standalone: UnifiedNoteItem[] = crmNotes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      category: n.category as string,
      isPinned: Boolean(n.isPinned),
      leadId: n.leadId,
      leadName: n.leadName,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      isLeadLog: false,
      logType: 'note' as const,
      author: 'Workspace',
    }));

    const fromLeads: UnifiedNoteItem[] = leads.flatMap((l) =>
      (l.notes || [])
        .filter((noteItem) => {
          if (!noteItem.content || !noteItem.content.trim()) return false;
          if (noteItem.type === 'system' || noteItem.author === 'System') return false;
          if (noteItem.type === 'task') return false;
          return true;
        })
        .map((noteItem) => {
          let categoryName = 'Client Note';
          let noteTitle = `Note: ${l.companyName}`;
          let logType: 'call' | 'note' | 'meeting' | 'system' | 'task' = 'note';

          if (noteItem.type === 'call') {
            categoryName = 'Call Log';
            noteTitle = `Call Log: ${l.companyName}`;
            logType = 'call';
          } else if (noteItem.type === 'meeting') {
            categoryName = 'Meeting Note';
            noteTitle = `Meeting: ${l.companyName}`;
            logType = 'meeting';
          }

          return {
            id: `lead-note-${noteItem.id}`,
            rawNoteId: noteItem.id,
            title: noteTitle,
            content: noteItem.content,
            category: categoryName,
            isPinned: Boolean(noteItem.isPinned),
            leadId: l.id,
            leadName: l.companyName,
            createdAt: noteItem.createdAt,
            updatedAt: noteItem.createdAt,
            isLeadLog: true,
            logType,
            author: noteItem.author || l.leadOwner || 'Team Member',
          };
        })
    );

    return [...standalone, ...fromLeads];
  }, [crmNotes, leads]);

  // Filtered & Sorted Notes
  const unifiedNotes = useMemo(() => {
    let all = [...allUnifiedNotes];

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter((n) => {
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesLead = (n.leadName || '').toLowerCase().includes(q);
        const matchesAuthor = n.author.toLowerCase().includes(q);
        return matchesTitle || matchesContent || matchesLead || matchesAuthor;
      });
    }

    // Filter by Category Pill
    if (notesCategoryFilter === 'pinned') {
      all = all.filter((n) => n.isPinned);
    } else if (notesCategoryFilter === 'general') {
      all = all.filter((n) => !n.isLeadLog && (n.category === 'General' || n.category === 'Strategy & Ideas'));
    } else if (notesCategoryFilter === 'scripts') {
      all = all.filter((n) => !n.isLeadLog && (n.category === 'Sales Pitch & Scripts' || n.category === 'Standard SOP'));
    } else if (notesCategoryFilter === 'lead-notes') {
      all = all.filter((n) => n.isLeadLog && n.logType === 'note');
    } else if (notesCategoryFilter === 'call-logs') {
      all = all.filter((n) => n.isLeadLog && n.logType === 'call');
    } else if (notesCategoryFilter === 'meeting-notes') {
      all = all.filter((n) => n.isLeadLog && n.logType === 'meeting');
    }

    // Sort: Pinned first, then newest updated
    return all.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [allUnifiedNotes, search, notesCategoryFilter]);

  // Counts for category badges
  const noteCategoryCounts = useMemo(() => {
    return {
      all: allUnifiedNotes.length,
      pinned: allUnifiedNotes.filter((n) => n.isPinned).length,
      general: allUnifiedNotes.filter((n) => !n.isLeadLog && (n.category === 'General' || n.category === 'Strategy & Ideas')).length,
      scripts: allUnifiedNotes.filter((n) => !n.isLeadLog && (n.category === 'Sales Pitch & Scripts' || n.category === 'Standard SOP')).length,
      leadNotes: allUnifiedNotes.filter((n) => n.isLeadLog && n.logType === 'note').length,
      callLogs: allUnifiedNotes.filter((n) => n.isLeadLog && n.logType === 'call').length,
      meetingNotes: allUnifiedNotes.filter((n) => n.isLeadLog && n.logType === 'meeting').length,
    };
  }, [allUnifiedNotes]);

  // Quick Task Submit
  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    addTask({
      title: quickTaskTitle.trim(),
      priority: quickTaskPriority,
      status: 'todo',
      category: quickTaskCategory,
      assignedTo: 'Alex (Founder)',
    });
    setQuickTaskTitle('');
  };

  // Detailed Task Modal Open
  const openNewTaskModal = (prefilledLeadId?: string, defaultTitle?: string, defaultDesc?: string) => {
    setEditingTaskId(null);
    setTaskTitle(defaultTitle || '');
    setTaskDesc(defaultDesc || '');
    setTaskPriority('medium');
    setTaskCategory('Internal / Admin');
    setTaskStatus('todo');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTaskDueDate(tomorrow.toISOString().split('T')[0]);
    setTaskDueTime('09:00');
    setTaskAssignedTo('Alex (Founder)');
    setTaskLeadId(prefilledLeadId || '');
    setSendEmailReminder(false);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (t: CRMTask) => {
    setEditingTaskId(t.id);
    setTaskTitle(t.title);
    setTaskDesc(t.description || '');
    setTaskPriority(t.priority);
    setTaskCategory(t.category);
    setTaskStatus(t.status);
    if (t.dueDate) {
      try {
        setTaskDueDate(t.dueDate.split('T')[0]);
      } catch {
        setTaskDueDate('');
      }
    } else {
      setTaskDueDate('');
    }
    setTaskDueTime(t.dueTime || '09:00');
    setTaskAssignedTo(t.assignedTo || 'Alex (Founder)');
    setTaskLeadId(t.leadId || '');
    setSendEmailReminder(false);
    setIsTaskModalOpen(true);
  };

  const handleSaveTaskModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const matchedLead = leads.find((l) => l.id === taskLeadId);

    const taskPayload = {
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      priority: taskPriority,
      status: taskStatus,
      category: taskCategory,
      dueDate: taskDueDate ? new Date(`${taskDueDate}T${taskDueTime || '09:00'}:00`).toISOString() : undefined,
      dueTime: taskDueTime || undefined,
      assignedTo: taskAssignedTo,
      leadId: taskLeadId || undefined,
      leadName: matchedLead?.companyName || undefined,
    };

    if (editingTaskId) {
      updateTask(editingTaskId, taskPayload);
      addToast('Task updated!', 'success');
    } else {
      addTask(taskPayload);
    }

    // Send email alert to user if requested
    if (sendEmailReminder && agencyEmail) {
      const emailSubject = `[Self-Reminder / Task] ${taskTitle.trim()}${matchedLead ? ` (${matchedLead.companyName})` : ''}`;
      const emailBody = `Hi Alex,\n\nYou created an internal task / self-reminder:\n\n• Task: ${taskTitle.trim()}\n• Category: ${taskCategory}\n• Priority: ${taskPriority.toUpperCase()}\n• Deadline: ${taskDueDate || 'No date'} at ${taskDueTime || '09:00'}\n${matchedLead ? `• Linked Client: ${matchedLead.companyName} (Phone: ${matchedLead.phone || 'N/A'}, Email: ${matchedLead.email || 'N/A'})\n` : ''}${taskDesc ? `\n• Details / Notes:\n${taskDesc.trim()}\n` : ''}\nView and manage your tasks in the agency CRM workspace.`;

      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: agencyEmail,
          subject: emailSubject,
          text: emailBody,
        }),
      }).catch(() => {});

      addToast(`Email alert sent to ${agencyEmail}!`, 'info');
    }

    setIsTaskModalOpen(false);
  };

  // Note Actions (View, Edit, Pin, Delete)
  const openNewNoteModal = () => {
    setSelectedNote(null);
    setIsNoteEditMode(true);
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('General');
    setNoteLeadId('');
    setIsNoteModalOpen(true);
  };

  const openViewNoteModal = (n: UnifiedNoteItem) => {
    setSelectedNote(n);
    setIsNoteEditMode(false);
    setNoteTitle(n.title);
    setNoteContent(n.content);
    setNoteCategory(n.category);
    setNoteLeadId(n.leadId || '');
    setIsNoteModalOpen(true);
  };

  const openEditNoteModal = (n: UnifiedNoteItem) => {
    setSelectedNote(n);
    setIsNoteEditMode(true);
    setNoteTitle(n.title);
    setNoteContent(n.content);
    setNoteCategory(n.category);
    setNoteLeadId(n.leadId || '');
    setIsNoteModalOpen(true);
  };

  const handleTogglePin = (n: UnifiedNoteItem) => {
    if (!n.isLeadLog) {
      togglePinCRMNote(n.id);
    } else if (n.leadId && n.rawNoteId) {
      togglePinLeadNote(n.leadId, n.rawNoteId);
    }
  };

  const handleDeleteNote = (n: UnifiedNoteItem) => {
    if (!n.isLeadLog) {
      deleteCRMNote(n.id);
    } else if (n.leadId && n.rawNoteId) {
      deleteNote(n.leadId, n.rawNoteId);
    }
    if (selectedNote?.id === n.id) {
      setIsNoteModalOpen(false);
    }
  };

  const handleSaveNoteModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const matchedLead = leads.find((l) => l.id === noteLeadId);

    if (selectedNote) {
      if (!selectedNote.isLeadLog) {
        updateCRMNote(selectedNote.id, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
          category: noteCategory as NoteCategory,
          leadId: noteLeadId || undefined,
          leadName: matchedLead?.companyName || undefined,
        });
        addToast('Note updated!', 'success');
      } else if (selectedNote.leadId && selectedNote.rawNoteId) {
        updateNote(selectedNote.leadId, selectedNote.rawNoteId, noteContent.trim());
      }
    } else {
      addCRMNote({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        category: noteCategory as NoteCategory,
        isPinned: false,
        leadId: noteLeadId || undefined,
        leadName: matchedLead?.companyName || undefined,
      });
    }

    setIsNoteModalOpen(false);
  };

  const handleCopyNote = (content: string) => {
    navigator.clipboard.writeText(content);
    addToast('Note copied to clipboard!', 'success');
  };

  const handleConvertNoteToTask = (n: UnifiedNoteItem) => {
    setIsNoteModalOpen(false);
    openNewTaskModal(n.leadId, `Follow-up on: ${n.title}`, n.content);
  };

  const handleScratchpadChange = (text: string) => {
    setScratchpadText(text);
    setScratchpadSaved(true);
    setTimeout(() => setScratchpadSaved(false), 2000);
  };

  const priorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[3px] bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-[9.5px]">
            <IconFlame size={10} />
            <span>High</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[3px] bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[9.5px]">
            <span>Med</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[3px] bg-slate-500/15 border border-slate-500/30 text-slate-400 font-mono text-[9.5px]">
            <span>Low</span>
          </span>
        );
    }
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-hidden bg-[var(--t-background-primary)] flex flex-col gap-2">
      {/* Top Twenty Style Toolbar */}
      <div className="p-2 sm:px-2.5 sm:py-1.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        {/* Row 1: Mode Switcher + Action Button (Mobile) */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Main Segmented Mode Switcher */}
          <div className="flex items-center bg-[var(--t-background-primary)] p-0.5 rounded-[4px] border border-[var(--t-border-color-light)] text-[11px] shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-2 sm:px-2.5 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                activeTab === 'tasks'
                  ? 'bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] font-medium shadow-2xs'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)]'
              }`}
            >
              <IconListCheck size={13} className="text-[#5d4ef7]" />
              <span>Tasks</span>
              <span className="text-[9.5px] px-1 rounded-full bg-[var(--t-background-quaternary)] font-mono">
                {pendingTasksCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-2 sm:px-2.5 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] font-medium shadow-2xs'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)]'
              }`}
            >
              <IconNotes size={13} className="text-amber-400" />
              <span className="hidden xs:inline">Notes & Call Logs</span>
              <span className="xs:hidden">Notes</span>
              <span className="text-[9.5px] px-1 rounded-full bg-[var(--t-background-quaternary)] font-mono">
                {allUnifiedNotes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('scratchpad')}
              className={`px-2 sm:px-2.5 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                activeTab === 'scratchpad'
                  ? 'bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] font-medium shadow-2xs'
                  : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)]'
              }`}
            >
              <IconWriting size={13} className="text-emerald-400" />
              <span>Scratchpad</span>
            </button>
          </div>

          {/* Action Button on Mobile (<sm) */}
          <div className="flex sm:hidden items-center shrink-0">
            {activeTab === 'tasks' ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<IconPlus size={12} />}
                onClick={() => openNewTaskModal()}
                className="h-[26px] text-[11px] px-2"
              >
                Task
              </Button>
            ) : activeTab === 'notes' ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<IconPlus size={12} />}
                onClick={openNewNoteModal}
                className="h-[26px] text-[11px] px-2"
              >
                Note
              </Button>
            ) : (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                <IconCheck size={11} /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Row 2 on Mobile / Inline on Desktop: Search & Filters */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
          <div className="w-full sm:w-[220px] shrink-0">
            <Input
              placeholder={`Search ${activeTab === 'tasks' ? 'tasks & leads' : 'notes & scripts'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<IconSearch size={13} className="text-[var(--t-font-color-tertiary)]" />}
              className="h-6.5 text-[11px] bg-[var(--t-background-primary)] w-full"
            />
          </div>

          {/* Prominent Task Filters */}
          {activeTab === 'tasks' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="h-6.5 px-1.5 sm:px-2 bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[10.5px] text-[var(--t-font-color-secondary)] rounded-[4px] outline-none cursor-pointer"
              >
                <option value="all">Priority: All</option>
                <option value="high">🔥 High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-6.5 px-2 bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[10.5px] text-[var(--t-font-color-secondary)] rounded-[4px] outline-none cursor-pointer hidden md:block"
              >
                <option value="all">All Categories</option>
                <option value="Outreach & Calls">Outreach & Calls</option>
                <option value="Proposal & Sales">Proposal & Sales</option>
                <option value="Client Work">Client Work</option>
                <option value="Internal / Admin">Internal / Admin</option>
                <option value="Self Reminder">Self Reminder</option>
              </select>
            </div>
          )}

          {/* Notes Category Filter Pills */}
          {activeTab === 'notes' && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 shrink-0 text-[10.5px]">
              {[
                { id: 'all', label: 'All Notes', count: noteCategoryCounts.all },
                { id: 'pinned', label: 'Pinned', count: noteCategoryCounts.pinned, icon: <IconPin size={11} className="text-amber-400" /> },
                { id: 'general', label: 'General & Ideas', count: noteCategoryCounts.general },
                { id: 'scripts', label: 'Scripts & SOPs', count: noteCategoryCounts.scripts },
                { id: 'lead-notes', label: 'Client Notes', count: noteCategoryCounts.leadNotes, icon: <IconBuilding size={11} /> },
                { id: 'call-logs', label: 'Call Logs', count: noteCategoryCounts.callLogs, icon: <IconPhoneCall size={11} className="text-sky-400" /> },
                { id: 'meeting-notes', label: 'Meeting Notes', count: noteCategoryCounts.meetingNotes, icon: <IconCalendarEvent size={11} className="text-emerald-400" /> },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setNotesCategoryFilter(pill.id)}
                  className={`h-[24px] px-2 rounded-[4px] transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    notesCategoryFilter === pill.id
                      ? 'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] font-semibold shadow-2xs'
                      : 'text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)]'
                  }`}
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                  {pill.count > 0 && (
                    <span className={`text-[9px] px-1 rounded-full font-mono ${
                      notesCategoryFilter === pill.id
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--t-background-transparent-medium)] text-[var(--t-font-color-tertiary)]'
                    }`}>
                      {pill.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Button on Desktop (sm+) */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {activeTab === 'tasks' && (
            <>
              <div className="flex items-center bg-[var(--t-background-primary)] p-0.5 rounded-[4px] border border-[var(--t-border-color-light)] text-[11px]">
                <button
                  onClick={() => setTaskViewMode('kanban')}
                  className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 ${
                    taskViewMode === 'kanban'
                      ? 'bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] font-medium'
                      : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)]'
                  }`}
                >
                  <IconLayoutKanban size={12} />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setTaskViewMode('list')}
                  className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer flex items-center gap-1 ${
                    taskViewMode === 'list'
                      ? 'bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] font-medium'
                      : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)]'
                  }`}
                >
                  <IconListCheck size={12} />
                  <span>List</span>
                </button>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<IconPlus size={13} />}
                onClick={() => openNewTaskModal()}
                className="h-[26px] text-[11px]"
              >
                New Task
              </Button>
            </>
          )}

          {activeTab === 'notes' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<IconPlus size={13} />}
              onClick={openNewNoteModal}
              className="h-[26px] text-[11px]"
            >
              New Note / Script
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* TAB 1: TASKS KANBAN & LIST */}
        {activeTab === 'tasks' && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            {/* Quick Task Creation Strip */}
            <form
              onSubmit={handleQuickTaskSubmit}
              className="h-[34px] px-2.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center gap-2 shrink-0 select-none"
            >
              <IconPlus size={13} className="text-[#5d4ef7] shrink-0" />
              <input
                type="text"
                placeholder="Quick add task: 'Call Rahul tomorrow about AI Voice agent'..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[11.5px] text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)]"
              />

              <select
                value={quickTaskPriority}
                onChange={(e) => setQuickTaskPriority(e.target.value as TaskPriority)}
                className="h-[22px] px-1.5 bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[10.5px] text-[var(--t-font-color-secondary)] rounded-[3px] outline-none cursor-pointer"
              >
                <option value="high">🔥 High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={quickTaskCategory}
                onChange={(e) => setQuickTaskCategory(e.target.value as TaskCategory)}
                className="h-[22px] px-1.5 bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[10.5px] text-[var(--t-font-color-secondary)] rounded-[3px] outline-none cursor-pointer hidden sm:block"
              >
                <option value="Outreach & Calls">Outreach & Calls</option>
                <option value="Proposal & Sales">Proposal & Sales</option>
                <option value="Client Work">Client Work</option>
                <option value="Internal / Admin">Internal / Admin</option>
                <option value="Self Reminder">Self Reminder</option>
              </select>

              <Button type="submit" variant="secondary" size="sm" className="h-[22px] text-[10.5px] px-2">
                Add
              </Button>
            </form>

            {/* List Mode */}
            {taskViewMode === 'list' && (
              <div className="flex-1 overflow-y-auto bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] rounded-[6px] p-2 space-y-1">
                {filteredTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => openEditTaskModal(t)}
                    className="p-2 rounded-[4px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] flex items-center justify-between gap-2.5 transition-colors cursor-pointer group select-none"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(t.id);
                        }}
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors cursor-pointer ${
                          t.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-[var(--t-border-color-medium)] hover:border-[#5d4ef7]'
                        }`}
                      >
                        {t.completed && <IconCheck size={11} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[12px] font-medium truncate ${
                              t.completed
                                ? 'line-through text-[var(--t-font-color-tertiary)]'
                                : 'text-[var(--t-font-color-primary)]'
                            }`}
                          >
                            {t.title}
                          </span>
                          {priorityBadge(t.priority)}
                        </div>
                        {t.description && (
                          <p className="text-[10.5px] text-[var(--t-font-color-tertiary)] truncate">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-[10.5px] text-[var(--t-font-color-tertiary)]">
                      {t.leadName && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (t.leadId) openLeadDrawer(t.leadId);
                          }}
                          className="text-[#5d4ef7] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          title="Open Lead Drawer"
                        >
                          <IconBuilding size={11} />
                          <span>{t.leadName}</span>
                          <IconArrowUpRight size={9} />
                        </button>
                      )}
                      {t.dueDate && <span className="font-mono">{formatDate(t.dueDate, timezone)}</span>}
                      <span className="px-1.5 py-0.2 rounded bg-[var(--t-background-quaternary)]">
                        {t.category}
                      </span>
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openEditTaskModal(t)}
                          className="p-1 text-[var(--t-font-color-tertiary)] hover:text-[#5d4ef7] hover:bg-[var(--t-background-transparent-light)] rounded transition-colors cursor-pointer"
                          title="Edit Task"
                        >
                          <IconEdit size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(t.id)}
                          className="p-1 text-[var(--t-font-color-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTasks.length === 0 && (
                  <div className="h-[180px] flex flex-col items-center justify-center gap-1 text-[11.5px] text-[var(--t-font-color-tertiary)]">
                    <IconListCheck size={20} />
                    <span>No tasks found matching current filters</span>
                  </div>
                )}
              </div>
            )}

            {/* Kanban Mode */}
            {taskViewMode === 'kanban' && (
              <div className="flex-1 flex gap-2.5 overflow-x-auto overflow-y-hidden pb-1 snap-x snap-mandatory">
                {[
                  { id: 'todo' as TaskStatus, label: 'To Do', color: 'bg-slate-400' },
                  { id: 'in_progress' as TaskStatus, label: 'In Progress', color: 'bg-amber-400' },
                  { id: 'done' as TaskStatus, label: 'Done', color: 'bg-emerald-400' },
                ].map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col.id);
                  const isDragOver = dragOverColumnId === col.id;

                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverColumnId !== col.id) {
                          setDragOverColumnId(col.id);
                        }
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                        if (dragOverColumnId === col.id) {
                          setDragOverColumnId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
                        if (taskId) {
                          updateTask(taskId, {
                            status: col.id,
                            completed: col.id === 'done',
                            completedAt: col.id === 'done' ? new Date().toISOString() : undefined,
                          });
                          addToast(`Task moved to ${col.label}`, 'info');
                        }
                        setDraggingTaskId(null);
                        setDragOverColumnId(null);
                      }}
                      className={`w-[85vw] sm:w-[270px] shrink-0 h-full flex flex-col rounded-[6px] bg-[var(--t-background-secondary)] border transition-colors snap-center ${
                        isDragOver
                          ? 'border-[#5d4ef7] ring-2 ring-[#5d4ef7]/30 bg-[#5d4ef7]/5'
                          : 'border-[var(--t-border-color-light)]'
                      }`}
                    >
                      <div className="p-2.5 border-b border-[var(--t-border-color-light)] flex items-center justify-between shrink-0 bg-[var(--t-background-tertiary)]">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-[6px] h-[6px] rounded-full ${col.color}`} />
                          <span className="text-[11.5px] font-medium text-[var(--t-font-color-primary)]">
                            {col.label}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-[3px] bg-[var(--t-background-transparent-medium)] text-[10px] font-mono text-[var(--t-font-color-secondary)]">
                            {colTasks.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 p-2 overflow-y-auto space-y-2">
                        {colTasks.map((t) => {
                          const isDragging = draggingTaskId === t.id;

                          return (
                            <div
                              key={t.id}
                              draggable={true}
                              onDragStart={(e) => {
                                setDraggingTaskId(t.id);
                                e.dataTransfer.setData('text/plain', t.id);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                setDraggingTaskId(null);
                                setDragOverColumnId(null);
                              }}
                              onClick={() => openEditTaskModal(t)}
                              className={`p-2.5 rounded-[5px] bg-[var(--t-background-primary)] border transition-all cursor-grab active:cursor-grabbing group space-y-1.5 shadow-2xs select-none ${
                                isDragging
                                  ? 'opacity-40 border-dashed border-[#5d4ef7] scale-[0.98]'
                                  : 'border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTask(t.id);
                                    }}
                                    className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                      t.completed
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-[var(--t-border-color-medium)] hover:border-[#5d4ef7]'
                                    }`}
                                    title={t.completed ? 'Mark incomplete' : 'Mark complete'}
                                  >
                                    {t.completed && <IconCheck size={9} />}
                                  </button>
                                  <span
                                    className={`text-[12px] font-medium truncate ${
                                      t.completed ? 'line-through text-[var(--t-font-color-tertiary)]' : 'text-[var(--t-font-color-primary)]'
                                    }`}
                                  >
                                    {t.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  {priorityBadge(t.priority)}
                                  <button
                                    type="button"
                                    onClick={() => openEditTaskModal(t)}
                                    className="p-0.5 text-[var(--t-font-color-tertiary)] hover:text-[#5d4ef7] hover:bg-[var(--t-background-transparent-light)] rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                    title="Edit Task"
                                  >
                                    <IconEdit size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteTask(t.id)}
                                    className="p-0.5 text-[var(--t-font-color-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                    title="Delete Task"
                                  >
                                    <IconTrash size={12} />
                                  </button>
                                </div>
                              </div>

                              {t.description && (
                                <p className="text-[10.5px] text-[var(--t-font-color-tertiary)] line-clamp-2">
                                  {t.description}
                                </p>
                              )}

                              <div className="pt-1 border-t border-[var(--t-border-color-light)] flex items-center justify-between text-[10px] text-[var(--t-font-color-tertiary)]">
                                {t.leadId && t.leadName ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openLeadDrawer(t.leadId!);
                                    }}
                                    className="text-[10.5px] text-[#5d4ef7] hover:underline truncate max-w-[130px] flex items-center gap-1 font-medium cursor-pointer"
                                    title="Open Lead Drawer"
                                  >
                                    <IconBuilding size={11} className="shrink-0" />
                                    <span className="truncate">{t.leadName}</span>
                                    <IconArrowUpRight size={9} className="shrink-0" />
                                  </button>
                                ) : (
                                  <span className="truncate max-w-[120px] text-[var(--t-font-color-tertiary)]">
                                    {t.category}
                                  </span>
                                )}
                                {t.dueDate && (
                                  <span className="font-mono">{formatDate(t.dueDate, timezone)}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {colTasks.length === 0 && (
                          <div
                            className={`h-[70px] border border-dashed rounded-[4px] flex items-center justify-center text-[10.5px] transition-colors ${
                              isDragOver
                                ? 'border-[#5d4ef7] text-[#5d4ef7] bg-[#5d4ef7]/10'
                                : 'border-[var(--t-border-color-light)] text-[var(--t-font-color-tertiary)]'
                            }`}
                          >
                            {isDragOver ? 'Drop task here' : 'No tasks'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UNIFIED NOTES & CALL LOGS STREAM */}
        {activeTab === 'notes' && (
          <div className="flex-1 overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {unifiedNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => openViewNoteModal(n)}
                  className={`p-3 rounded-[8px] bg-[var(--t-background-secondary)] border transition-all flex flex-col justify-between gap-2.5 group cursor-pointer shadow-2xs relative ${
                    n.isPinned
                      ? 'border-amber-500/40 bg-amber-500/[0.03] shadow-amber-500/5'
                      : 'border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)]'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Card Header: Badges & Direct Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Category Badge */}
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-[3px] border flex items-center gap-1 ${
                            n.logType === 'call'
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                              : n.logType === 'meeting'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : n.logType === 'system'
                              ? 'bg-slate-500/10 text-slate-400 border-slate-500/25'
                              : n.isPinned
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                          }`}
                        >
                          {n.logType === 'call' && <IconPhoneCall size={10} />}
                          {n.logType === 'meeting' && <IconCalendarEvent size={10} />}
                          {n.logType === 'note' && <IconNotes size={10} />}
                          <span>{n.category}</span>
                        </span>

                        {/* Linked Lead Badge (ONLY clicking this opens Lead Drawer) */}
                        {n.leadName && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (n.leadId) openLeadDrawer(n.leadId);
                            }}
                            className="text-[10px] text-[#5d4ef7] hover:underline font-mono truncate max-w-[140px] flex items-center gap-0.5 cursor-pointer bg-[#5d4ef7]/10 px-1.5 py-0.2 rounded border border-[#5d4ef7]/20"
                            title="Open Lead Drawer"
                          >
                            <IconBuilding size={10} />
                            <span className="truncate">{n.leadName}</span>
                            <IconArrowUpRight size={9} />
                          </button>
                        )}
                      </div>

                      {/* Card Action Icons (Pin, Edit, Copy, Delete) */}
                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(n)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            n.isPinned
                              ? 'text-amber-400 bg-amber-500/15'
                              : 'text-[var(--t-font-color-tertiary)] hover:text-amber-400 hover:bg-[var(--t-background-transparent-light)]'
                          }`}
                          title={n.isPinned ? 'Unpin Note' : 'Pin Note to Top'}
                        >
                          <IconPin size={12} className={n.isPinned ? 'fill-amber-400' : ''} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditNoteModal(n)}
                          className="p-1 text-[var(--t-font-color-tertiary)] hover:text-[#5d4ef7] hover:bg-[var(--t-background-transparent-light)] rounded transition-colors cursor-pointer"
                          title="Edit Note"
                        >
                          <IconEdit size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyNote(n.content)}
                          className="p-1 text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] rounded transition-colors cursor-pointer"
                          title="Copy Note Content"
                        >
                          <IconCopy size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteNote(n)}
                          className="p-1 text-[var(--t-font-color-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          title="Delete Note"
                        >
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Note Title */}
                    <h3 className="text-[13px] font-semibold text-[var(--t-font-color-primary)] group-hover:text-[#5d4ef7] transition-colors leading-tight">
                      {n.title}
                    </h3>

                    {/* Note Content Preview */}
                    <p className="text-[11.5px] text-[var(--t-font-color-secondary)] whitespace-pre-wrap line-clamp-4 leading-relaxed font-mono">
                      {n.content}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-1.5 border-t border-[var(--t-border-color-light)] flex items-center justify-between text-[10px] text-[var(--t-font-color-tertiary)] font-mono">
                    <span>
                      {n.author} • {formatRelativeTime(n.updatedAt || n.createdAt)}
                    </span>
                    <span className="text-[9.5px] text-[#5d4ef7] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 font-sans">
                      Click to open modal
                    </span>
                  </div>
                </div>
              ))}

              {unifiedNotes.length === 0 && (
                <div className="col-span-full h-[240px] flex flex-col items-center justify-center gap-1.5 text-center p-4 bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)]">
                  <IconNotes size={22} className="text-[var(--t-font-color-tertiary)]" />
                  <p className="text-[12.5px] font-medium text-[var(--t-font-color-primary)]">
                    No notes or logs found
                  </p>
                  <p className="text-[11px] text-[var(--t-font-color-tertiary)]">
                    Click &quot;New Note / Script&quot; or log activity in any lead drawer to see them here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE AUTOSAVING SCRATCHPAD */}
        {activeTab === 'scratchpad' && (
          <div className="flex-1 bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] rounded-[6px] p-3 flex flex-col gap-2 overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between text-[11px] text-[var(--t-font-color-secondary)] pb-1.5 border-b border-[var(--t-border-color-light)]">
              <span className="font-medium flex items-center gap-1.5">
                <IconWriting size={13} className="text-emerald-400" />
                <span>Live Agency Scratchpad & Call Notes (Real-time autosave)</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--t-font-color-tertiary)]">
                {scratchpadSaved ? '✓ Changes saved' : 'Autosaved'}
              </span>
            </div>

            <textarea
              value={scratchpadText}
              onChange={(e) => handleScratchpadChange(e.target.value)}
              placeholder="Paste raw phone numbers, fast sales notes, ideas, or meeting transcripts here..."
              className="flex-1 w-full bg-transparent border-none outline-none text-[12px] text-[var(--t-font-color-primary)] font-mono resize-none leading-relaxed p-1"
            />
          </div>
        )}
      </div>

      {/* DETAILED TASK MODAL */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTaskId ? 'Edit Workspace Task' : 'Create New Task'}
        subtitle="Manage agency deliverables, outreach follow-ups, and internal to-dos"
        maxWidth="max-w-[480px]"
      >
        <form onSubmit={handleSaveTaskModal} className="space-y-3.5 select-none">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Task Title
            </label>
            <Input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Follow up on proposal with Priya"
              className="h-[28px] text-[12px]"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Description / Action Steps <span className="text-[10px] text-[var(--t-font-color-tertiary)]">(Optional)</span>
            </label>
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Add key details or instructions..."
              rows={2}
              className="w-full p-2 text-[11.5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[6px] outline-none text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full h-[28px] px-2 rounded-[4px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[11.5px] text-[var(--t-font-color-primary)] outline-none cursor-pointer"
              >
                <option value="high">🔥 High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
                Category
              </label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                className="w-full h-[28px] px-2 rounded-[4px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[11.5px] text-[var(--t-font-color-primary)] outline-none cursor-pointer"
              >
                <option value="Internal / Admin">Internal / Admin</option>
                <option value="Self Reminder">Self Reminder / Follow-Up</option>
                <option value="Outreach & Calls">Outreach & Calls</option>
                <option value="Proposal & Sales">Proposal & Sales</option>
                <option value="Client Work">Client Work</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
                Deadline Date
              </label>
              <Input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="h-[28px] text-[12px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
                Time
              </label>
              <Input
                type="time"
                value={taskDueTime}
                onChange={(e) => setTaskDueTime(e.target.value)}
                className="h-[28px] text-[12px]"
              />
            </div>
          </div>

          <div>
            <SearchableLeadSelect
              value={taskLeadId}
              onChange={(val) => setTaskLeadId(val)}
              label="Link to Lead / Client (Optional)"
              placeholder="Search and select lead (optional)..."
            />
          </div>

          {/* Optional Email Notification to Self */}
          <div className="p-2.5 rounded-[5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)]">
            <label className="flex items-center gap-2 text-[11px] text-[var(--t-font-color-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmailReminder}
                onChange={(e) => setSendEmailReminder(e.target.checked)}
                className="rounded border-[var(--t-border-color-medium)] accent-[#5d4ef7] w-3.5 h-3.5"
              />
              <span>Send notification email with task details to my inbox ({agencyEmail || 'upgradeux.agency@gmail.com'})</span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--t-border-color-light)]">
            {editingTaskId ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={<IconTrash size={12} />}
                onClick={() => {
                  deleteTask(editingTaskId);
                  setIsTaskModalOpen(false);
                }}
                className="h-[26px] text-[11px]"
              >
                Delete Task
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsTaskModalOpen(false)}
                className="h-[26px] text-[11px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<IconCheck size={13} />}
                className="h-[26px] text-[11px]"
              >
                {editingTaskId ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* RICH NOTE DETAIL & EDIT MODAL */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={
          isNoteEditMode
            ? selectedNote
              ? 'Edit Note'
              : 'Create New Note / Script'
            : selectedNote?.title || 'Note Details'
        }
        subtitle={
          isNoteEditMode
            ? 'Write or update agency scripts, meeting records, or client notes'
            : `${selectedNote?.author || 'Workspace'} • ${selectedNote ? formatRelativeTime(selectedNote.updatedAt || selectedNote.createdAt) : ''}`
        }
        maxWidth="max-w-[540px]"
      >
        {isNoteEditMode ? (
          /* EDIT / CREATE MODE */
          <form onSubmit={handleSaveNoteModal} className="space-y-3.5 select-none">
            <div>
              <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
                Note Title
              </label>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. AI Voice Receptionist 30s Pitch Script"
                className="h-[28px] text-[12px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
                  Category
                </label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full h-[28px] px-2 rounded-[4px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[11.5px] text-[var(--t-font-color-primary)] outline-none cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Sales Pitch & Scripts">Sales Pitch & Scripts</option>
                  <option value="Client Meeting">Client Meeting</option>
                  <option value="Strategy & Ideas">Strategy & Ideas</option>
                  <option value="Standard SOP">Standard SOP</option>
                </select>
              </div>

              <div>
                <SearchableLeadSelect
                  value={noteLeadId}
                  onChange={(val) => setNoteLeadId(val)}
                  label="Link to Lead"
                  placeholder="Select lead (optional)..."
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
                Note Content
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write or paste your sales pitch, phone script, or notes..."
                rows={7}
                className="w-full p-2.5 text-[11.5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[6px] outline-none text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)] font-mono resize-none leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--t-border-color-light)]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (selectedNote) {
                    setIsNoteEditMode(false);
                  } else {
                    setIsNoteModalOpen(false);
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<IconCheck size={13} />}
              >
                {selectedNote ? 'Save Changes' : 'Create Note'}
              </Button>
            </div>
          </form>
        ) : (
          /* VIEW DETAIL MODE */
          selectedNote && (
            <div className="space-y-3.5 select-none">
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-[5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                    {selectedNote.category}
                  </span>
                  {selectedNote.isPinned && (
                    <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-1">
                      <IconPin size={11} className="fill-amber-400" /> Pinned
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(selectedNote)}
                    className={`p-1.5 rounded transition-colors cursor-pointer text-[11px] flex items-center gap-1 border ${
                      selectedNote.isPinned
                        ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                        : 'border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)] hover:text-amber-400'
                    }`}
                  >
                    <IconPin size={12} className={selectedNote.isPinned ? 'fill-amber-400' : ''} />
                    <span>{selectedNote.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsNoteEditMode(true)}
                    className="p-1.5 rounded transition-colors cursor-pointer text-[11px] flex items-center gap-1 border border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)]"
                  >
                    <IconEdit size={12} />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Linked Lead Banner */}
              {selectedNote.leadName && (
                <div className="p-2.5 rounded-[5px] bg-[#5d4ef7]/5 border border-[#5d4ef7]/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <IconBuilding size={15} className="text-[#5d4ef7] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-[var(--t-font-color-tertiary)] block uppercase font-mono tracking-wider">
                        Linked Client / Prospect
                      </span>
                      <span className="text-[12px] font-medium text-[var(--t-font-color-primary)] truncate block">
                        {selectedNote.leadName}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsNoteModalOpen(false);
                      if (selectedNote.leadId) openLeadDrawer(selectedNote.leadId);
                    }}
                    className="h-[24px] px-2 rounded-[3px] bg-[#5d4ef7] hover:bg-[#4d3ef0] text-white text-[10.5px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <span>Open Lead Drawer</span>
                    <IconArrowUpRight size={11} />
                  </button>
                </div>
              )}

              {/* Note Content */}
              <div className="p-3 rounded-[6px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] max-h-[300px] overflow-y-auto">
                <p className="text-[12px] text-[var(--t-font-color-primary)] font-mono whitespace-pre-wrap leading-relaxed select-text">
                  {selectedNote.content}
                </p>
              </div>

              {/* Bottom Quick Action Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--t-border-color-light)]">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<IconArrowsExchange size={12} />}
                    onClick={() => handleConvertNoteToTask(selectedNote)}
                    className="h-[26px] text-[11px]"
                  >
                    Convert to Task
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<IconCopy size={12} />}
                    onClick={() => handleCopyNote(selectedNote.content)}
                    className="h-[26px] text-[11px]"
                  >
                    Copy Text
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    leftIcon={<IconTrash size={12} />}
                    onClick={() => handleDeleteNote(selectedNote)}
                    className="h-[26px] text-[11px]"
                  >
                    Delete Note
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsNoteModalOpen(false)}
                    className="h-[26px] text-[11px]"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
