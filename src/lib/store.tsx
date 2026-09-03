'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Lead,
  Project,
  CRMView,
  FilterState,
  LeadStatus,
  OutreachStage,
  ServiceType,
  Note,
  SupabaseConfig,
  TeamMember,
  IntegrationsConfig,
  IndustrySpace,
  InboundSubmission,
  FollowUpChannel,
  FollowUpItem,
  CRMTask,
  CRMNote,
  TeamPresenceRecord,
} from '@/types/crm';
import { INITIAL_LEADS, INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_NOTES } from './initialData';
import { generateUUID, formatCurrency, formatDate, generateSecurePortalKey } from './utils';

export const DEFAULT_SPACES: IndustrySpace[] = [
  { id: 'all', name: 'All Spaces (Global)', slug: 'all', color: 'indigo', isDefault: true },
  { id: 'real-estate', name: 'Real Estate & Properties', slug: 'real-estate', color: 'emerald' },
  { id: 'healthcare', name: 'Healthcare & MedSpas', slug: 'healthcare', color: 'cyan' },
  { id: 'ecommerce', name: 'E-Commerce & D2C Brands', slug: 'ecommerce', color: 'amber' },
  { id: 'local-services', name: 'Local & Home Services', slug: 'local-services', color: 'rose' },
  { id: 'saas-b2b', name: 'SaaS & B2B Tech', slug: 'saas-b2b', color: 'purple' },
];
import { triggerConfetti } from './confetti';
import {
  syncLeadsToSupabase,
  fetchLeadsFromSupabase,
  syncProjectsToSupabase,
  fetchProjectsFromSupabase,
  fetchInboundSubmissionsFromSupabase,
  updateInboundSubmissionInSupabase,
  deleteInboundSubmissionFromSupabase,
  deleteLeadFromSupabase,
  deleteProjectFromSupabase,
  clearAllInboundSubmissionsFromSupabase,
  clearAllSupabaseTables,
  syncTeamPresenceToSupabase,
  fetchTeamPresenceFromSupabase,
} from './supabase';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member-swapnil',
    name: 'Swapnil',
    email: 'skalambe520@gmail.com',
    phone: '+91 8788581826',
    role: 'Founder',
    avatarUrl: '/status/swapnil.jpeg',
    avatarColor: '#6366f1',
    joinedAt: new Date().toISOString(),
    activityStatus: 'In Dev Mode',
    activityIcon: 'code',
    statusNote: 'Working on Agency CRM & client projects',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'member-suraj',
    name: 'Suraj',
    email: 'iamsurajsavle@gmail.com',
    phone: '+91 8369213418',
    role: 'Founder',
    avatarUrl: '/status/suraj.png',
    avatarColor: '#10b981',
    joinedAt: new Date().toISOString(),
    activityStatus: 'Calling Clients',
    activityIcon: 'phone',
    statusNote: 'Cold outreach & client meetings',
    lastActiveAt: new Date().toISOString(),
  },
];

const DEFAULT_INTEGRATIONS: IntegrationsConfig = {
  calComUsername: 'upgradeux',
  googleMeetEnabled: true,
  defaultGoogleMeetUrl: 'https://meet.google.com/oic-saem-syo',
  googleCalendarEmail: 'upgradeux.agency@gmail.com',
  emailSyncAddress: 'upgradeux.agency@gmail.com',
  whatsAppPhone: '+91 8369672169',
  webhookInboundUrl: 'https://upgradeuxcrm.vercel.app/api/inbound-leads',
};

interface CRMContextType {
  leads: Lead[];
  allLeads: Lead[];
  projects: Project[];
  allProjects: Project[];
  spaces: IndustrySpace[];
  activeSpaceId: string;
  activeSpace: IndustrySpace;
  setActiveSpaceId: (id: string) => void;
  addIndustrySpace: (name: string, color?: string) => void;
  updateIndustrySpace: (id: string, updates: { name?: string; color?: string }) => void;
  deleteIndustrySpace: (id: string) => void;
  isCreateSpaceModalOpen: boolean;
  setIsCreateSpaceModalOpen: (open: boolean) => void;
  editingSpace: IndustrySpace | null;
  setEditingSpace: (space: IndustrySpace | null) => void;
  integrationsConfig: IntegrationsConfig;
  currentView: CRMView;
  setCurrentView: (view: CRMView) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  projectsLayout: 'table' | 'cards';
  setProjectsLayout: (layout: 'table' | 'cards') => void;
  activeLeadId: string | null;
  activeLead: Lead | null;
  openLeadDrawer: (id: string) => void;
  closeLeadDrawer: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  agencyName: string;
  setAgencyName: (name: string) => void;
  agencyEmail: string;
  setAgencyEmail: (email: string) => void;
  currency: string;
  setCurrency: (c: string) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  formatMoney: (amount: number) => string;
  formatDateStr: (iso: string) => string;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  
  // Lead Operations
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'> & { initialNote?: string }) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLeadStatus: (id: string, status: LeadStatus) => void;
  markLeadContacted: (id: string) => void;
  bookCall: (id: string, dateStr?: string) => void;
  scheduleFollowUp: (leadId: string, channel: FollowUpChannel, scheduledDate: string, note?: string) => void;
  completeFollowUp: (leadId: string, followUpId?: string) => void;
  deleteFollowUp: (leadId: string, followUpId?: string) => void;
  addNote: (leadId: string, content: string, type?: Note['type']) => void;
  updateNote: (leadId: string, noteId: string, content: string) => void;
  togglePinLeadNote: (leadId: string, noteId: string) => void;
  deleteNote: (leadId: string, noteId: string) => void;
  bulkImportLeads: (newLeads: Partial<Lead>[]) => void;

  // Project Operations
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  addMilestone: (projectId: string, title: string, dueDate: string) => void;
  deleteMilestone: (projectId: string, milestoneId: string) => void;

  // Team Operations
  teamMembers: TeamMember[];
  activeMemberId: string;
  setActiveMemberId: (id: string) => void;
  teamPresence: Record<string, TeamPresenceRecord>;
  setMyActivityStatus: (status: string, emoji?: string, customText?: string) => void;
  addTeamMember: (member: Omit<TeamMember, 'id' | 'joinedAt'>) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  // Tasks & Workspace Operations
  tasks: CRMTask[];
  addTask: (task: Omit<CRMTask, 'id' | 'createdAt' | 'updatedAt' | 'completed'>) => void;
  updateTask: (id: string, updates: Partial<CRMTask>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Notes & Scratchpad Operations
  crmNotes: CRMNote[];
  addCRMNote: (note: Omit<CRMNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCRMNote: (id: string, updates: Partial<CRMNote>) => void;
  togglePinCRMNote: (id: string) => void;
  deleteCRMNote: (id: string) => void;
  scratchpadText: string;
  setScratchpadText: (text: string) => void;

  // Inbound Submissions
  inboundSubmissions: InboundSubmission[];
  addInboundSubmission: (submission: Omit<InboundSubmission, 'id' | 'createdAt' | 'status'>) => void;
  convertInboundToLead: (submissionId: string, targetSpaceId?: string, dealValue?: number) => void;
  dismissInboundSubmission: (submissionId: string) => void;
  deleteInboundSubmission: (submissionId: string) => void;
  clearAllInboundSubmissions: () => Promise<void>;

  // Integrations
  updateIntegrationsConfig: (updates: Partial<IntegrationsConfig>) => void;

  // Modals
  isNewLeadModalOpen: boolean;
  setIsNewLeadModalOpen: (open: boolean) => void;
  isWonModalOpen: boolean;
  setIsWonModalOpen: (open: boolean) => void;
  wonLeadForModal: Lead | null;
  setWonLeadForModal: (lead: Lead | null) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isTeamModalOpen: boolean;
  setIsTeamModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isNewProjectModalOpen: boolean;
  setIsNewProjectModalOpen: (open: boolean) => void;
  whatsAppLeadModal: Lead | null;
  setWhatsAppLeadModal: (lead: Lead | null) => void;
  instagramDMLeadModal: Lead | null;
  setInstagramDMLeadModal: (lead: Lead | null) => void;
  emailComposerLeadModal: Lead | null;
  setEmailComposerLeadModal: (lead: Lead | null) => void;
  meetingModalLead: Lead | null;
  setMeetingModalLead: (lead: Lead | null) => void;
  followUpModalLead: Lead | null;
  setFollowUpModalLead: (lead: Lead | null) => void;

  // Supabase
  supabaseConfig: SupabaseConfig;
  setSupabaseConfig: (config: SupabaseConfig) => void;
  isSyncing: boolean;
  syncWithCloud: () => Promise<void>;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Confirm Modal
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null;
  confirmAction: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }) => void;
  closeConfirmModal: () => void;

  // Auth
  isAuthenticated: boolean;
  currentUser: { email: string; name: string } | null;
  isAuthLoading: boolean;
  login: (user: { email: string; name: string }) => void;
  logout: () => Promise<void>;

  // Data Management
  clearAllData: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  status: 'All',
  outreachStage: 'All',
  serviceType: 'All',
  source: 'All',
  assignedTo: 'All',
  location: '',
  minDealValue: 0,
  maxDealValue: 100000,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const CRMContext = createContext<CRMContextType | null>(null);

const STORAGE_KEY_LEADS = 'upgradeux_crm_leads_v3';
const STORAGE_KEY_PROJECTS = 'upgradeux_crm_projects_v3';
const STORAGE_KEY_TEAM = 'upgradeux_crm_team_v3';
const STORAGE_KEY_INTEGRATIONS = 'upgradeux_crm_integrations_v3';
const STORAGE_KEY_THEME = 'upgradeux_crm_theme_v3';
const STORAGE_KEY_SUPABASE = 'upgradeux_crm_supabase_v3';
const STORAGE_KEY_CURRENCY = 'upgradeux_crm_currency_v3';
const STORAGE_KEY_TIMEZONE = 'upgradeux_crm_timezone_v3';
const STORAGE_KEY_AGENCY_NAME = 'upgradeux_crm_agency_name_v3';
const STORAGE_KEY_AGENCY_EMAIL = 'upgradeux_crm_agency_email_v3';
const STORAGE_KEY_SPACES = 'upgradeux_crm_spaces_v3';
const STORAGE_KEY_ACTIVE_SPACE = 'upgradeux_crm_active_space_v3';
const STORAGE_KEY_INBOUND = 'upgradeux_crm_inbound_v3';
const STORAGE_KEY_TASKS = 'upgradeux_crm_tasks_v3';
const STORAGE_KEY_NOTES = 'upgradeux_crm_notes_v3';
const STORAGE_KEY_SCRATCHPAD = 'upgradeux_crm_scratchpad_v3';
const STORAGE_KEY_ACTIVE_MEMBER = 'upgradeux_crm_active_member_v3';
const STORAGE_KEY_PRESENCE = 'upgradeux_crm_presence_v3';

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [rawLeads, setRawLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [rawProjects, setRawProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<CRMTask[]>(INITIAL_TASKS);
  const [crmNotes, setCrmNotes] = useState<CRMNote[]>(INITIAL_NOTES);
  const [scratchpadText, setScratchpadTextState] = useState<string>(
    '# Quick Workspace Scratchpad\n- Call back salon lead regarding audio demo\n- Check Google Maps business profile ranking\n- Follow up on proposed Web Dev revisions'
  );
  const [spaces, setSpaces] = useState<IndustrySpace[]>(DEFAULT_SPACES);
  const [activeSpaceId, setActiveSpaceIdState] = useState<string>('all');
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<IndustrySpace | null>(null);
  const [inboundSubmissions, setInboundSubmissions] = useState<InboundSubmission[]>([]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_TEAM_MEMBERS);
  const [activeMemberId, setActiveMemberIdState] = useState<string>('member-swapnil');
  const [teamPresence, setTeamPresence] = useState<Record<string, TeamPresenceRecord>>({
    'member-swapnil': {
      memberId: 'member-swapnil',
      memberName: 'Swapnil',
      memberEmail: 'skalambe520@gmail.com',
      role: 'Founder',
      avatarUrl: '/status/swapnil.jpeg',
      avatarColor: '#6366f1',
      lastActiveAt: new Date().toISOString(),
      activityStatus: 'In Dev Mode',
      activityIcon: 'code',
      statusNote: 'Working on Agency CRM & client projects',
    },
    'member-suraj': {
      memberId: 'member-suraj',
      memberName: 'Suraj',
      memberEmail: 'iamsurajsavle@gmail.com',
      role: 'Founder',
      avatarUrl: '/status/suraj.png',
      avatarColor: '#10b981',
      lastActiveAt: new Date().toISOString(),
      activityStatus: 'Calling Clients',
      activityIcon: 'phone',
      statusNote: 'Cold outreach & client meetings',
    },
  });
  const [integrationsConfig, setIntegrationsConfig] = useState<IntegrationsConfig>(DEFAULT_INTEGRATIONS);
  const [currentView, setCurrentView] = useState<CRMView>('pipeline');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [projectsLayout, setProjectsLayout] = useState<'table' | 'cards'>('table');
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [agencyName, setAgencyNameState] = useState<string>('upgradeUX');
  const [agencyEmail, setAgencyEmailState] = useState<string>('upgradeux.agency@gmail.com');
  const [currency, setCurrencyState] = useState<string>('INR (₹)');
  const [timezone, setTimezoneState] = useState<string>('Asia/Kolkata (IST)');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const activeSpace = useMemo(() => {
    return spaces.find((s) => s.id === activeSpaceId) || spaces[0] || DEFAULT_SPACES[0];
  }, [spaces, activeSpaceId]);

  const setActiveSpaceId = (id: string) => {
    setActiveSpaceIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SPACE, id);
    } catch {}
    const space = spaces.find((s) => s.id === id);
    if (space) {
      addToast(`Switched workspace space to: ${space.name}`, 'info');
    }
  };

  const addIndustrySpace = (name: string, color: string = '#10b981') => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = `space-${slug}-${generateUUID().substring(0, 4)}`;
    const newSpace: IndustrySpace = {
      id,
      name: cleanName,
      slug,
      color,
    };
    setSpaces((prev) => {
      const updated = [...prev, newSpace];
      try {
        localStorage.setItem(STORAGE_KEY_SPACES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActiveSpaceId(id);
    addToast(`Created new industry space "${cleanName}"`, 'success');
  };

  const updateIndustrySpace = (id: string, updates: { name?: string; color?: string }) => {
    const oldSpace = spaces.find((s) => s.id === id);
    if (!oldSpace) return;

    const newName = updates.name !== undefined ? updates.name.trim() : oldSpace.name;
    const newColor = updates.color !== undefined ? updates.color : oldSpace.color;
    const newSlug = newName ? newName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : oldSpace.slug;

    setSpaces((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          name: newName || s.name,
          slug: newSlug,
          color: newColor,
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_SPACES, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (updates.name && oldSpace.name !== newName) {
      setRawLeads((prev) =>
        prev.map((l) => (l.industrySpaceId === id ? { ...l, industry: newName } : l))
      );
      setRawProjects((prev) =>
        prev.map((p) => (p.industrySpaceId === id ? { ...p, industry: newName } : p))
      );
    }

    addToast(`Updated industry space "${newName}"`, 'success');
  };

  const deleteIndustrySpace = (id: string) => {
    if (id === 'all') return;
    setSpaces((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_SPACES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (activeSpaceId === id) {
      setActiveSpaceId('all');
    }
    addToast('Industry space deleted', 'info');
  };

  // Filtered leads based on currently active space
  const leads = useMemo(() => {
    if (activeSpaceId === 'all') return rawLeads;
    return rawLeads.filter((l) => {
      if (l.industrySpaceId === activeSpaceId) return true;
      if (l.industry && activeSpace?.name && l.industry.toLowerCase().includes(activeSpace.name.toLowerCase().split(' ')[0])) {
        return true;
      }
      return false;
    });
  }, [rawLeads, activeSpaceId, activeSpace]);

  // Filtered projects based on currently active space
  const projects = useMemo(() => {
    if (activeSpaceId === 'all') return rawProjects;
    return rawProjects.filter((p) => {
      if (p.industrySpaceId === activeSpaceId) return true;
      if (p.industry && activeSpace?.name && p.industry.toLowerCase().includes(activeSpace.name.toLowerCase().split(' ')[0])) {
        return true;
      }
      return false;
    });
  }, [rawProjects, activeSpaceId, activeSpace]);

  const setAgencyName = (name: string) => {
    setAgencyNameState(name);
    try {
      localStorage.setItem(STORAGE_KEY_AGENCY_NAME, name);
    } catch {}
  };

  const setAgencyEmail = (email: string) => {
    setAgencyEmailState(email);
    try {
      localStorage.setItem(STORAGE_KEY_AGENCY_EMAIL, email);
    } catch {}
  };

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, c);
    } catch {}
  };

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    try {
      localStorage.setItem(STORAGE_KEY_TIMEZONE, tz);
    } catch {}
  };

  const formatMoney = (amount: number) => formatCurrency(amount, currency);
  const formatDateStr = (iso: string) => formatDate(iso, timezone);

  // Modals
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [wonLeadForModal, setWonLeadForModal] = useState<Lead | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [whatsAppLeadModal, setWhatsAppLeadModal] = useState<Lead | null>(null);
  const [instagramDMLeadModal, setInstagramDMLeadModal] = useState<Lead | null>(null);
  const [emailComposerLeadModal, setEmailComposerLeadModal] = useState<Lead | null>(null);
  const [meetingModalLead, setMeetingModalLead] = useState<Lead | null>(null);
  const [followUpModalLead, setFollowUpModalLead] = useState<Lead | null>(null);

  // Supabase (Read directly from environment variables)
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(() => {
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return {
      url: envUrl,
      anonKey: envAnonKey,
      isConnected: Boolean(envUrl && envAnonKey),
    };
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = generateUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  const confirmAction = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      ...options,
      isOpen: true,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => (prev ? { ...prev, isOpen: false } : null));
  };

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Check auth session on load
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          const memberId = data.user.email?.toLowerCase().includes('suraj') ? 'member-suraj' : 'member-swapnil';
          setActiveMemberIdState(memberId);
          try {
            localStorage.setItem(STORAGE_KEY_ACTIVE_MEMBER, memberId);
          } catch {}
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    }
    checkAuthSession();
  }, []);

  const login = (user: { email: string; name: string }) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    const memberId = user.email?.toLowerCase().includes('suraj') ? 'member-suraj' : 'member-swapnil';
    setActiveMemberIdState(memberId);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_MEMBER, memberId);
    } catch {}
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setCurrentUser(null);
    addToast('Logged out of CRM workspace.', 'info');
  };

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedLeads = localStorage.getItem(STORAGE_KEY_LEADS);
      if (savedLeads) setRawLeads(JSON.parse(savedLeads));

      const savedProjects = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects).map((p: Project) => ({
          ...p,
          clientAccessKey:
            p.clientAccessKey && p.clientAccessKey.startsWith('ux_sec_')
              ? p.clientAccessKey
              : generateSecurePortalKey(),
        }));
        setRawProjects(parsed);
      }

      const savedSpaces = localStorage.getItem(STORAGE_KEY_SPACES);
      if (savedSpaces) setSpaces(JSON.parse(savedSpaces));

      const savedActiveSpace = localStorage.getItem(STORAGE_KEY_ACTIVE_SPACE);
      if (savedActiveSpace) setActiveSpaceIdState(savedActiveSpace);

      const savedTeam = localStorage.getItem(STORAGE_KEY_TEAM);
      if (savedTeam) {
        try {
          const parsed = JSON.parse(savedTeam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTeamMembers(parsed);
          } else {
            setTeamMembers(DEFAULT_TEAM_MEMBERS);
          }
        } catch {
          setTeamMembers(DEFAULT_TEAM_MEMBERS);
        }
      } else {
        setTeamMembers(DEFAULT_TEAM_MEMBERS);
      }

      const savedActiveMember = localStorage.getItem(STORAGE_KEY_ACTIVE_MEMBER);
      if (savedActiveMember) setActiveMemberIdState(savedActiveMember);

      const savedPresence = localStorage.getItem(STORAGE_KEY_PRESENCE);
      if (savedPresence) {
        try {
          setTeamPresence(JSON.parse(savedPresence));
        } catch {}
      }

      const savedIntegrations = localStorage.getItem(STORAGE_KEY_INTEGRATIONS);
      if (savedIntegrations) setIntegrationsConfig(JSON.parse(savedIntegrations));

      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as 'dark' | 'light';
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      }

      const savedAgencyName = localStorage.getItem(STORAGE_KEY_AGENCY_NAME);
      if (savedAgencyName) setAgencyNameState(savedAgencyName);

      const savedAgencyEmail = localStorage.getItem(STORAGE_KEY_AGENCY_EMAIL);
      if (savedAgencyEmail) setAgencyEmailState(savedAgencyEmail);

      const savedCurrency = localStorage.getItem(STORAGE_KEY_CURRENCY);
      if (savedCurrency) setCurrencyState(savedCurrency);

      const savedTimezone = localStorage.getItem(STORAGE_KEY_TIMEZONE);
      if (savedTimezone) setTimezoneState(savedTimezone);

      const savedSupabase = localStorage.getItem(STORAGE_KEY_SUPABASE);
      if (savedSupabase) setSupabaseConfigState(JSON.parse(savedSupabase));

      const savedInbound = localStorage.getItem(STORAGE_KEY_INBOUND);
      if (savedInbound) setInboundSubmissions(JSON.parse(savedInbound));

      const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
      if (savedTasks) setTasks(JSON.parse(savedTasks));

      const savedNotes = localStorage.getItem(STORAGE_KEY_NOTES);
      if (savedNotes) setCrmNotes(JSON.parse(savedNotes));

      const savedScratchpad = localStorage.getItem(STORAGE_KEY_SCRATCHPAD);
      if (savedScratchpad) setScratchpadTextState(savedScratchpad);
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
  }, []);

  // Save Inbound Submissions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INBOUND, JSON.stringify(inboundSubmissions));
    } catch {}
  }, [inboundSubmissions]);

  // Background Auto-Sync on Mount & Periodic Polling with Supabase Cloud DB
  useEffect(() => {
    const autoSyncFromCloud = async () => {
      const envUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url || '').trim();
      const envKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey || '').trim();
      
      // Only attempt sync if a valid URL & key are present and connected
      if (!envUrl || !envKey || !envUrl.startsWith('http') || (!supabaseConfig.isConnected && !process.env.NEXT_PUBLIC_SUPABASE_URL)) {
        return;
      }

      try {
        const config = { url: envUrl, anonKey: envKey, isConnected: true };
        const [remoteLeads, remoteInbound, remoteProjects, remoteTeamData] = await Promise.all([
          fetchLeadsFromSupabase(config).catch(() => null),
          fetchInboundSubmissionsFromSupabase(config).catch(() => null),
          fetchProjectsFromSupabase(config).catch(() => null),
          fetchTeamPresenceFromSupabase(config).catch(() => null),
        ]);

        if (remoteTeamData) {
          if (remoteTeamData.teamMembers && remoteTeamData.teamMembers.length > 0) {
            setTeamMembers((prev) => {
              const localMap = new Map(prev.map((m) => [m.id, m]));
              const remoteIds = new Set(remoteTeamData.teamMembers?.map((m) => m.id));
              const merged = (remoteTeamData.teamMembers || []).map((rm) => {
                const local = localMap.get(rm.id);
                return local ? { ...rm, ...local } : rm;
              });
              const localOnly = prev.filter((m) => !remoteIds.has(m.id));
              return [...merged, ...localOnly];
            });
          }
          if (remoteTeamData.presence && Array.isArray(remoteTeamData.presence)) {
            setTeamPresence((prev) => {
              const next = { ...prev };
              remoteTeamData.presence?.forEach((p) => {
                next[p.memberId] = p;
              });
              return next;
            });
          }
        }

        if (remoteLeads && remoteLeads.length > 0) {
          setRawLeads((prevLeads) => {
            const localMap = new Map(prevLeads.map((l) => [l.id, l]));
            const remoteIds = new Set(remoteLeads.map((l) => l.id));

            const merged = remoteLeads.map((remoteLead) => {
              const local = localMap.get(remoteLead.id);
              if (!local) return remoteLead;

              // Preserve local active follow-up, leadOwner, and notes if local has active data
              return {
                ...remoteLead,
                leadOwner: local.leadOwner || remoteLead.leadOwner || 'Unassigned',
                activeFollowUp: local.activeFollowUp || remoteLead.activeFollowUp,
                followUps: (local.followUps && local.followUps.length > (remoteLead.followUps?.length || 0))
                  ? local.followUps
                  : (remoteLead.followUps || local.followUps || []),
                nextFollowUpDate: local.nextFollowUpDate || remoteLead.nextFollowUpDate,
                bookedMeetingDate: local.bookedMeetingDate || remoteLead.bookedMeetingDate,
                googleMeetLink: local.googleMeetLink || remoteLead.googleMeetLink,
                industrySpaceId: local.industrySpaceId || remoteLead.industrySpaceId,
                notes: (local.notes && local.notes.length > (remoteLead.notes?.length || 0))
                  ? local.notes
                  : (remoteLead.notes || local.notes || []),
              };
            });

            const localOnly = prevLeads.filter((l) => !remoteIds.has(l.id));
            return [...merged, ...localOnly];
          });
        }

        if (remoteProjects && remoteProjects.length > 0) {
          setRawProjects((prevProjects) => {
            const localMap = new Map(prevProjects.map((p) => [p.id, p]));
            const remoteIds = new Set(remoteProjects.map((p) => p.id));
            const merged = remoteProjects.map((p) => {
              const local = localMap.get(p.id);
              return local ? { ...p, milestones: local.milestones?.length ? local.milestones : p.milestones } : p;
            });
            const localOnly = prevProjects.filter((p) => !remoteIds.has(p.id));
            return [...merged, ...localOnly];
          });
        }

        if (remoteInbound && remoteInbound.length > 0) {
          setInboundSubmissions((prev) => {
            const existingIds = new Set(remoteInbound.map((s) => s.id));
            const localOnly = prev.filter((s) => !existingIds.has(s.id));
            return [...remoteInbound, ...localOnly];
          });
        }
      } catch {
        // Silently fallback to local storage
      }
    };

    // Initial fetch on mount
    autoSyncFromCloud();

    // User presence heartbeat - update active user's lastActiveAt when interacting
    let lastHeartbeat = 0;
    const sendHeartbeat = () => {
      const now = Date.now();
      if (now - lastHeartbeat < 20000) return; // Throttle to every 20s
      lastHeartbeat = now;
      const currentMember = teamMembers.find((m) => m.id === activeMemberId);
      if (currentMember) {
        const nowIso = new Date().toISOString();
        const updatedPres: TeamPresenceRecord = {
          memberId: currentMember.id,
          memberName: currentMember.name,
          memberEmail: currentMember.email,
          role: currentMember.role,
          avatarUrl: currentMember.avatarUrl,
          avatarColor: currentMember.avatarColor,
          lastActiveAt: nowIso,
          activityStatus: currentMember.activityStatus || 'Available / Online',
          activityIcon: currentMember.activityIcon || 'check',
          statusNote: currentMember.statusNote,
        };
        setTeamPresence((prev) => ({ ...prev, [currentMember.id]: updatedPres }));
        if (supabaseConfig.isConnected) {
          const presenceList = Object.values({ ...teamPresence, [currentMember.id]: updatedPres });
          syncTeamPresenceToSupabase(teamMembers, presenceList, supabaseConfig);
        }
      }
    };

    // Auto-refresh periodically (every 15s) to synchronize seamlessly across laptops, mobiles, and team members
    const syncInterval = setInterval(autoSyncFromCloud, 15000);

    // Refresh instantly when user focuses the tab or switches back to the app on mobile/desktop
    const handleFocus = () => {
      sendHeartbeat();
      autoSyncFromCloud();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
        autoSyncFromCloud();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('pointerdown', sendHeartbeat);
    window.addEventListener('keydown', sendHeartbeat);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pointerdown', sendHeartbeat);
      window.removeEventListener('keydown', sendHeartbeat);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [supabaseConfig.isConnected, supabaseConfig.url, supabaseConfig.anonKey, activeMemberId, teamMembers, teamPresence]);

  // Save Leads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(rawLeads));
    } catch {}
  }, [rawLeads]);

  // Save Projects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(rawProjects));
    } catch {}
  }, [rawProjects]);

  // Save Team
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(teamMembers));
    } catch {}
  }, [teamMembers]);

  // Save Integrations
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INTEGRATIONS, JSON.stringify(integrationsConfig));
    } catch {}
  }, [integrationsConfig]);

  // Handle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, nextTheme);
    } catch {}
  };

  const setSupabaseConfig = (config: SupabaseConfig) => {
    setSupabaseConfigState(config);
    try {
      localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(config));
    } catch {}
  };

  const updateIntegrationsConfig = (updates: Partial<IntegrationsConfig>) => {
    setIntegrationsConfig((prev) => ({ ...prev, ...updates }));
    addToast('Integrations updated successfully!', 'success');
  };

  const syncWithCloud = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;

    if (!url || !anonKey) {
      addToast('Supabase is not configured yet. Please add credentials to your .env.local file.', 'warning');
      setCurrentView('settings');
      return;
    }

    const activeConfig: SupabaseConfig = {
      url,
      anonKey,
      isConnected: true,
      lastSyncedAt: new Date().toISOString(),
    };

    setIsSyncing(true);
    addToast('Syncing with Supabase Cloud database...', 'info');

    try {
      const [leadsOk, projectsOk] = await Promise.all([
        syncLeadsToSupabase(rawLeads, activeConfig),
        syncProjectsToSupabase(rawProjects, activeConfig),
      ]);

      if (leadsOk && projectsOk) {
        const [remoteLeads, remoteInbound, remoteProjects] = await Promise.all([
          fetchLeadsFromSupabase(activeConfig),
          fetchInboundSubmissionsFromSupabase(activeConfig),
          fetchProjectsFromSupabase(activeConfig),
        ]);

        if (remoteLeads && remoteLeads.length > 0) {
          setRawLeads(remoteLeads);
        }

        if (remoteProjects && remoteProjects.length > 0) {
          setRawProjects(remoteProjects);
        }

        if (remoteInbound) {
          setInboundSubmissions((prev) => {
            const existingIds = new Set(remoteInbound.map((s) => s.id));
            const localOnly = prev.filter((s) => !existingIds.has(s.id));
            return [...remoteInbound, ...localOnly];
          });
        }
        setSupabaseConfig(activeConfig);
        addToast('Synced successfully with Supabase PostgreSQL database!', 'success');
      } else {
        addToast('Connected to Supabase endpoint, but table sync returned an error. Ensure the SQL schema has been executed.', 'error');
      }
    } catch (err: any) {
      addToast(`Sync error: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Keyboard shortcut listener (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsNewLeadModalOpen(false);
        setIsWonModalOpen(false);
        setIsImportModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsTeamModalOpen(false);
        setIsNewProjectModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeLead = useMemo(() => {
    if (!activeLeadId) return null;
    return leads.find((l) => l.id === activeLeadId) || null;
  }, [leads, activeLeadId]);

  const openLeadDrawer = (id: string) => {
    setActiveLeadId(id);
  };

  const closeLeadDrawer = () => {
    setActiveLeadId(null);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Lead CRUD
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'> & { initialNote?: string }): Lead => {
    const id = generateUUID();
    const now = new Date().toISOString();
    const newNotes: Note[] = [];

    if (leadData.initialNote?.trim()) {
      newNotes.push({
        id: generateUUID(),
        content: leadData.initialNote.trim(),
        createdAt: now,
        author: leadData.leadOwner || 'Alex (Founder)',
        type: 'note',
      });
    }

    const assignedSpaceId = leadData.industrySpaceId || (activeSpaceId !== 'all' ? activeSpaceId : 'real-estate');
    const matchedSpace = spaces.find((s) => s.id === assignedSpaceId);

    const newLead: Lead = {
      ...leadData,
      id,
      status: leadData.status || 'Leads',
      industrySpaceId: assignedSpaceId,
      industry: leadData.industry || matchedSpace?.name || 'Real Estate & Properties',
      notes: newNotes,
      createdAt: now,
      updatedAt: now,
    };

    setRawLeads((prev) => [newLead, ...prev]);
    addToast(`Added prospect: ${newLead.companyName}`, 'success');

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      syncLeadsToSupabase([newLead, ...rawLeads], { url: envUrl, anonKey: envKey, isConnected: true });
    }

    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    const updatedLeads = rawLeads.map((lead) => {
      if (lead.id !== id) return lead;
      return {
        ...lead,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
    setRawLeads(updatedLeads);

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      syncLeadsToSupabase(updatedLeads, { url: envUrl, anonKey: envKey, isConnected: true });
    }
  };

  const deleteLead = (id: string) => {
    const lead = rawLeads.find((l) => l.id === id);
    setRawLeads((prev) => prev.filter((l) => l.id !== id));
    if (activeLeadId === id) setActiveLeadId(null);
    addToast(`Deleted ${lead?.companyName || 'lead'}`, 'info');

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      deleteLeadFromSupabase(id, { url: envUrl, anonKey: envKey });
    }
  };

  const moveLeadStatus = (id: string, status: LeadStatus) => {
    const targetLead = rawLeads.find((l) => l.id === id);
    if (!targetLead) return;

    let outreachStage: OutreachStage = targetLead.outreachStage;
    if (status === 'Leads' || status === 'Not Contacted') outreachStage = 'Needs Outreach';
    else if (status === 'Contacted' || status === 'Booked Meeting' || status === 'Booked Call' || status === 'Proposal Sent' || status === 'In Processing / Proposal') {
      outreachStage = 'Contacted';
    } else if (status === 'Won' || status === 'Lost') {
      outreachStage = 'Closed';
    }

    const noteAddition: Note = {
      id: generateUUID(),
      content: `Status updated to **${status}** (Stage: ${outreachStage})`,
      createdAt: new Date().toISOString(),
      author: 'System',
      type: 'system',
    };

    updateLead(id, {
      status,
      outreachStage,
      notes: [noteAddition, ...(targetLead.notes || [])],
    });

    if (status === 'Won') {
      triggerConfetti();
      setWonLeadForModal(targetLead);
      setIsWonModalOpen(true);
      addToast(`Deal Won for ${targetLead.companyName}!`, 'success');
    } else {
      addToast(`Moved ${targetLead.companyName} to ${status}`, 'info');
    }
  };

  const markLeadContacted = (id: string) => {
    const lead = rawLeads.find((l) => l.id === id);
    if (!lead) return;

    const now = new Date().toISOString();
    const note: Note = {
      id: generateUUID(),
      content: `Marked as contacted via Cold Queue.`,
      createdAt: now,
      author: lead.leadOwner || 'Agent',
      type: 'call',
    };

    updateLead(id, {
      status: (lead.status === 'Not Contacted' || lead.status === 'Leads') ? 'Contacted' : lead.status,
      outreachStage: 'Contacted',
      lastContactedAt: now,
      notes: [note, ...(lead.notes || [])],
    });

    addToast(`Marked ${lead.companyName} as Contacted`, 'success');
  };

  const bookCall = (id: string, dateStr?: string) => {
    const lead = rawLeads.find((l) => l.id === id);
    if (!lead) return;

    const now = new Date().toISOString();
    const randomMeetCode = 'meet.google.com/' + Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-ux';

    const note: Note = {
      id: generateUUID(),
      content: `Demo call scheduled${dateStr ? ` for ${dateStr}` : ''}. Google Meet: ${randomMeetCode}`,
      createdAt: now,
      author: lead.leadOwner || 'Closer',
      type: 'meeting',
    };

    const bookingDate = dateStr || new Date(Date.now() + 2 * 86400000).toISOString();

    updateLead(id, {
      status: 'Booked Meeting',
      outreachStage: 'Contacted',
      bookedMeetingDate: bookingDate,
      googleMeetLink: `https://${randomMeetCode}`,
      notes: [note, ...(lead.notes || [])],
    });

    addToast(`Booked Demo Call with ${lead.companyName}!`, 'success');
  };

  const scheduleFollowUp = (
    leadId: string,
    channel: FollowUpChannel,
    scheduledDate: string,
    noteText?: string
  ) => {
    const lead = rawLeads.find((l) => l.id === leadId);
    if (!lead) return;

    const newFollowUp: FollowUpItem = {
      id: generateUUID(),
      channel,
      scheduledDate,
      note: noteText?.trim() || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const channelLabels: Record<FollowUpChannel, string> = {
      whatsapp: 'WhatsApp',
      email: 'Email',
      instagram: 'Instagram DM',
      reminder: 'Internal Reminder',
    };

    const noteAddition: Note = {
      id: generateUUID(),
      content: `Follow-up scheduled for ${formatDate(scheduledDate)} via ${channelLabels[channel]}${noteText ? `: "${noteText}"` : ''}`,
      createdAt: new Date().toISOString(),
      author: lead.leadOwner || 'Agent',
      type: 'task',
    };

    const updatedFollowUps = [newFollowUp, ...(lead.followUps || [])];

    updateLead(leadId, {
      activeFollowUp: newFollowUp,
      followUps: updatedFollowUps,
      nextFollowUpDate: scheduledDate,
      notes: [noteAddition, ...(lead.notes || [])],
    });

    addToast(`Follow-up scheduled via ${channelLabels[channel]}!`, 'success');
  };

  const completeFollowUp = (leadId: string, followUpId?: string) => {
    const lead = rawLeads.find((l) => l.id === leadId);
    if (!lead) return;

    const now = new Date().toISOString();
    const updatedFollowUps = (lead.followUps || []).map((f) => {
      if (!followUpId || f.id === followUpId || f.id === lead.activeFollowUp?.id) {
        return { ...f, completed: true, completedAt: now };
      }
      return f;
    });

    const activeChannel = lead.activeFollowUp?.channel || 'reminder';
    const channelNames: Record<string, string> = {
      whatsapp: 'WhatsApp',
      email: 'Email',
      instagram: 'Instagram DM',
      reminder: 'Task Reminder',
    };

    const noteAddition: Note = {
      id: generateUUID(),
      content: `Follow-up completed on ${channelNames[activeChannel]}.`,
      createdAt: now,
      author: lead.leadOwner || 'Agent',
      type: 'task',
    };

    updateLead(leadId, {
      activeFollowUp: undefined,
      followUps: updatedFollowUps,
      nextFollowUpDate: undefined,
      lastContactedAt: now,
      notes: [noteAddition, ...(lead.notes || [])],
    });

    addToast('Follow-up marked as completed!', 'success');
  };

  const deleteFollowUp = (leadId: string, followUpId?: string) => {
    const lead = rawLeads.find((l) => l.id === leadId);
    if (!lead) return;

    const updatedFollowUps = (lead.followUps || []).filter((f) => f.id !== followUpId);
    const isClearingActive = !followUpId || lead.activeFollowUp?.id === followUpId;

    updateLead(leadId, {
      activeFollowUp: isClearingActive ? undefined : lead.activeFollowUp,
      followUps: updatedFollowUps,
      nextFollowUpDate: isClearingActive ? undefined : lead.nextFollowUpDate,
    });

    addToast('Follow-up cancelled', 'info');
  };

  const addNote = (leadId: string, content: string, type: Note['type'] = 'note') => {
    const lead = rawLeads.find((l) => l.id === leadId);
    if (!lead || !content.trim()) return;

    const newNote: Note = {
      id: generateUUID(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      author: lead.leadOwner || 'Alex (Founder)',
      type,
    };

    updateLead(leadId, {
      notes: [newNote, ...(lead.notes || [])],
    });

    addToast('Activity logged', 'info');
  };

  const deleteNote = (leadId: string, noteId: string) => {
    const lead = rawLeads.find((l) => l.id === leadId);
    if (!lead) return;

    updateLead(leadId, {
      notes: (lead.notes || []).filter((n) => n.id !== noteId),
    });
    addToast('Note deleted', 'info');
  };

  const updateNote = (leadId: string, noteId: string, content: string) => {
    const lead = rawLeads.find((l) => l.id === leadId);
    if (!lead) return;

    updateLead(leadId, {
      notes: (lead.notes || []).map((n) => (n.id === noteId ? { ...n, content: content.trim() } : n)),
    });
    addToast('Note updated', 'success');
  };

  const togglePinLeadNote = (leadId: string, noteId: string) => {
    const lead = rawLeads.find((l) => l.id === leadId);
    if (!lead) return;

    const isCurrentlyPinned = (lead.notes || []).find((n) => n.id === noteId)?.isPinned;
    updateLead(leadId, {
      notes: (lead.notes || []).map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned } : n)),
    });
    addToast(isCurrentlyPinned ? 'Note unpinned' : 'Note pinned to top', 'info');
  };

  const bulkImportLeads = (newLeads: Partial<Lead>[]) => {
    const defaultSpace = activeSpaceId !== 'all' ? activeSpaceId : 'real-estate';
    const matchedSpace = spaces.find((s) => s.id === defaultSpace);
    const formatted: Lead[] = newLeads.map((item) => ({
      id: item.id || generateUUID(),
      companyName: item.companyName || 'Untitled Company',
      contactName: item.contactName || '',
      websiteUrl: item.websiteUrl || '',
      location: item.location || 'Remote',
      phone: item.phone || '',
      email: item.email || '',
      source: item.source || 'Google Maps',
      callOutcome: item.callOutcome || 'Not Called',
      socials: item.socials || {},
      status: item.status || 'Leads',
      outreachStage: item.outreachStage || 'Needs Outreach',
      dealValue: item.dealValue || 5000,
      serviceInterest: item.serviceInterest || 'AI Voice Agent',
      industrySpaceId: item.industrySpaceId || defaultSpace,
      industry: item.industry || matchedSpace?.name || 'Real Estate & Properties',
      leadOwner: item.leadOwner || 'Alex (Founder)',
      notes: item.notes || [],
      lastContactedAt: item.lastContactedAt,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setRawLeads((prev) => [...formatted, ...prev]);
    addToast(`Successfully imported ${formatted.length} leads!`, 'success');
  };

  // Project CRUD
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project => {
    const id = generateUUID();
    const now = new Date().toISOString();
    const defaultSpace = projectData.industrySpaceId || (activeSpaceId !== 'all' ? activeSpaceId : 'real-estate');
    const matchedSpace = spaces.find((s) => s.id === defaultSpace);

    const newProject: Project = {
      ...projectData,
      id,
      industrySpaceId: defaultSpace,
      industry: projectData.industry || matchedSpace?.name || 'Real Estate & Properties',
      clientAccessKey: generateSecurePortalKey(),
      createdAt: now,
      updatedAt: now,
    };

    setRawProjects((prev) => [newProject, ...prev]);
    triggerConfetti();
    addToast(`Created deliverable "${newProject.projectName}"`, 'success');

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      syncProjectsToSupabase([newProject, ...rawProjects], { url: envUrl, anonKey: envKey, isConnected: true });
    }

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updatedProjects = rawProjects.map((proj) => {
      if (proj.id !== id) return proj;
      return {
        ...proj,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
    setRawProjects(updatedProjects);

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      syncProjectsToSupabase(updatedProjects, { url: envUrl, anonKey: envKey, isConnected: true });
    }
  };

  const deleteProject = (id: string) => {
    const proj = rawProjects.find((p) => p.id === id);
    setRawProjects((prev) => prev.filter((p) => p.id !== id));
    addToast(`Deleted deliverable "${proj?.projectName || ''}"`, 'info');

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      deleteProjectFromSupabase(id, { url: envUrl, anonKey: envKey });
    }
  };

  const toggleMilestone = (projectId: string, milestoneId: string) => {
    const project = rawProjects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedMilestones = project.milestones.map((m) => {
      if (m.id !== milestoneId) return m;
      return { ...m, completed: !m.completed };
    });

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const autoProgress = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);

    updateProject(projectId, {
      milestones: updatedMilestones,
      progressPercent: autoProgress,
    });
  };

  const addMilestone = (projectId: string, title: string, dueDate: string) => {
    const project = rawProjects.find((p) => p.id === projectId);
    if (!project || !title.trim()) return;

    const newMilestone = {
      id: generateUUID(),
      title: title.trim(),
      completed: false,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
    };

    const updatedMilestones = [...project.milestones, newMilestone];
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const autoProgress = Math.round((completedCount / updatedMilestones.length) * 100);

    updateProject(projectId, {
      milestones: updatedMilestones,
      progressPercent: autoProgress,
    });
  };

  const deleteMilestone = (projectId: string, milestoneId: string) => {
    const project = rawProjects.find((p) => p.id === projectId);
    if (!project) return;

    const updatedMilestones = project.milestones.filter((m) => m.id !== milestoneId);
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const autoProgress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : project.progressPercent;

    updateProject(projectId, {
      milestones: updatedMilestones,
      progressPercent: autoProgress,
    });
  };

  // Team & Presence CRUD
  const setActiveMemberId = (id: string) => {
    setActiveMemberIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_MEMBER, id);
    } catch {}
    const member = teamMembers.find((m) => m.id === id);
    if (member) {
      addToast(`Switched active profile to ${member.name}`, 'info');
    }
  };

  const setMyActivityStatus = (status: string, icon: string = 'check', note?: string) => {
    const currentMember = teamMembers.find((m) => m.id === activeMemberId) || teamMembers[0];
    if (!currentMember) return;

    const now = new Date().toISOString();
    const newRecord: TeamPresenceRecord = {
      memberId: currentMember.id,
      memberName: currentMember.name,
      memberEmail: currentMember.email,
      role: currentMember.role,
      avatarUrl: currentMember.avatarUrl,
      avatarColor: currentMember.avatarColor,
      lastActiveAt: now,
      activityStatus: status,
      activityIcon: icon,
      statusNote: note,
    };

    setTeamPresence((prev) => {
      const updated = { ...prev, [currentMember.id]: newRecord };
      try {
        localStorage.setItem(STORAGE_KEY_PRESENCE, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const updatedMembers = teamMembers.map((m) =>
      m.id === currentMember.id
        ? { ...m, activityStatus: status, activityIcon: icon, statusNote: note, lastActiveAt: now }
        : m
    );
    setTeamMembers(updatedMembers);

    if (supabaseConfig.isConnected) {
      const presenceList = Object.values({ ...teamPresence, [currentMember.id]: newRecord });
      syncTeamPresenceToSupabase(updatedMembers, presenceList, supabaseConfig);
    }

    addToast(`Status: ${status}`, 'success');
  };

  const addTeamMember = (memberData: Omit<TeamMember, 'id' | 'joinedAt'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: generateUUID(),
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      activityStatus: 'Available / Online',
      activityIcon: 'check',
    };
    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    if (supabaseConfig.isConnected) {
      syncTeamPresenceToSupabase(updated, Object.values(teamPresence), supabaseConfig);
    }
    addToast(`Added team member: ${newMember.name}`, 'success');
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    const updated = teamMembers.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setTeamMembers(updated);
    if (supabaseConfig.isConnected) {
      syncTeamPresenceToSupabase(updated, Object.values(teamPresence), supabaseConfig);
    }
  };

  const deleteTeamMember = (id: string) => {
    const updated = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(updated);
    if (supabaseConfig.isConnected) {
      syncTeamPresenceToSupabase(updated, Object.values(teamPresence), supabaseConfig);
    }
    addToast('Team member removed', 'info');
  };

  // Task Operations
  const addTask = (taskData: Omit<CRMTask, 'id' | 'createdAt' | 'updatedAt' | 'completed'>) => {
    const newTask: CRMTask = {
      ...taskData,
      id: `task-${generateUUID().substring(0, 8)}`,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => {
      const updated = [newTask, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast(`Task created: "${taskData.title}"`, 'success');
  };

  const updateTask = (id: string, updates: Partial<CRMTask>) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        return { ...t, ...updates, updatedAt: new Date().toISOString() };
      });
      try {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        const nowCompleted = !t.completed;
        return {
          ...t,
          completed: nowCompleted,
          status: nowCompleted ? ('done' as const) : ('todo' as const),
          completedAt: nowCompleted ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast('Task deleted', 'info');
  };

  // Note Operations
  const addCRMNote = (noteData: Omit<CRMNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: CRMNote = {
      ...noteData,
      id: `note-${generateUUID().substring(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCrmNotes((prev) => {
      const updated = [newNote, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast(`Note saved: "${noteData.title}"`, 'success');
  };

  const updateCRMNote = (id: string, updates: Partial<CRMNote>) => {
    setCrmNotes((prev) => {
      const updated = prev.map((n) => {
        if (n.id !== id) return n;
        return { ...n, ...updates, updatedAt: new Date().toISOString() };
      });
      try {
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const togglePinCRMNote = (id: string) => {
    setCrmNotes((prev) => {
      const updated = prev.map((n) => {
        if (n.id !== id) return n;
        return { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() };
      });
      try {
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const deleteCRMNote = (id: string) => {
    setCrmNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast('Note deleted', 'info');
  };

  const setScratchpadText = (text: string) => {
    setScratchpadTextState(text);
    try {
      localStorage.setItem(STORAGE_KEY_SCRATCHPAD, text);
    } catch {}
  };

  // Inbound Submissions
  const addInboundSubmission = (sub: Omit<InboundSubmission, 'id' | 'createdAt' | 'status'>) => {
    const newSub: InboundSubmission = {
      ...sub,
      id: `inbound_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    setInboundSubmissions((prev) => [newSub, ...prev]);
    addToast(`New inbound inquiry from ${newSub.name}!`, 'success');
  };

  const convertInboundToLead = (submissionId: string, targetSpaceId?: string, dealValue: number = 150000) => {
    const sub = inboundSubmissions.find((s) => s.id === submissionId);
    if (!sub) return;

    const primaryInterest = sub.interests[0] || 'Web Development';

    const newLead: Lead = {
      id: generateUUID(),
      companyName: sub.name,
      contactName: sub.name,
      email: sub.email,
      phone: sub.phone || '',
      websiteUrl: '',
      socials: {},
      source: 'Website Inbound',
      serviceInterest: (primaryInterest as ServiceType) || 'Web Development',
      dealValue: dealValue,
      status: sub.source === 'Cal.com Booking' ? 'Booked Meeting' : 'Leads',
      outreachStage: sub.source === 'Cal.com Booking' ? 'Contacted' : 'Needs Outreach',
      leadOwner: teamMembers[0]?.name ? `${teamMembers[0].name} (${teamMembers[0].role.split(' ')[0]})` : 'Unassigned',
      location: 'Website Inbound',
      industrySpaceId: targetSpaceId || (activeSpaceId !== 'all' ? activeSpaceId : undefined),
      notes: [
        {
          id: generateUUID(),
          content: `Inbound Form Submission (${sub.source}):\nInterests: ${sub.interests.join(', ') || 'N/A'}\nMessage / Project Brief: ${sub.message || 'None provided'}${sub.budget ? `\nBudget: ${sub.budget}` : ''}${sub.deadline ? `\nDeadline: ${sub.deadline}` : ''}`,
          createdAt: new Date().toISOString(),
          author: 'Website Form',
          type: 'system',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRawLeads((prev) => [newLead, ...prev]);
    setInboundSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: 'converted', convertedLeadId: newLead.id } : s))
    );
    addToast(`Converted "${sub.name}" into Deals Pipeline!`, 'success');

    // Async sync to Supabase
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      const config = { url: envUrl, anonKey: envKey, isConnected: true };
      syncLeadsToSupabase([newLead, ...rawLeads], config);
      updateInboundSubmissionInSupabase(submissionId, { status: 'converted', convertedLeadId: newLead.id }, config);
    }
  };

  const dismissInboundSubmission = (submissionId: string) => {
    setInboundSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: 'dismissed' } : s))
    );
    addToast('Inbound inquiry marked as dismissed', 'info');

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      updateInboundSubmissionInSupabase(submissionId, { status: 'dismissed' }, { url: envUrl, anonKey: envKey, isConnected: true });
    }
  };

  const deleteInboundSubmission = (submissionId: string) => {
    setInboundSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    addToast('Inbound submission removed', 'info');

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      deleteInboundSubmissionFromSupabase(submissionId, { url: envUrl, anonKey: envKey, isConnected: true });
    }
  };

  const clearAllInboundSubmissions = async () => {
    setInboundSubmissions([]);
    try {
      localStorage.setItem(STORAGE_KEY_INBOUND, JSON.stringify([]));
    } catch {}

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      await clearAllInboundSubmissionsFromSupabase({ url: envUrl, anonKey: envKey });
    }

    addToast('All inbound inquiries purged from workspace and Supabase cloud database!', 'info');
  };

  const clearAllData = async () => {
    setRawLeads([]);
    setRawProjects([]);
    setTeamMembers([]);
    setInboundSubmissions([]);
    setActiveLeadId(null);
    try {
      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEY_INBOUND, JSON.stringify([]));
    } catch {}

    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
    if (envUrl && envKey) {
      await clearAllSupabaseTables({ url: envUrl, anonKey: envKey });
    }

    addToast('All workspace data and Supabase cloud records cleared. Workspace is 100% clean!', 'success');
  };

  return (
    <CRMContext.Provider
      value={{
        leads,
        allLeads: rawLeads,
        projects,
        allProjects: rawProjects,
        spaces,
        activeSpaceId,
        activeSpace,
        setActiveSpaceId,
        addIndustrySpace,
        updateIndustrySpace,
        deleteIndustrySpace,
        isCreateSpaceModalOpen,
        setIsCreateSpaceModalOpen,
        editingSpace,
        setEditingSpace,
        teamMembers,
        integrationsConfig,
        currentView,
        setCurrentView,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        projectsLayout,
        setProjectsLayout,
        activeLeadId,
        activeLead,
        openLeadDrawer,
        closeLeadDrawer,
        theme,
        toggleTheme,
        agencyName,
        setAgencyName,
        agencyEmail,
        setAgencyEmail,
        currency,
        setCurrency,
        timezone,
        setTimezone,
        formatMoney,
        formatDateStr,
        filters,
        setFilters,
        resetFilters,
        addLead,
        updateLead,
        deleteLead,
        moveLeadStatus,
        markLeadContacted,
        bookCall,
        addNote,
        updateNote,
        togglePinLeadNote,
        deleteNote,
        bulkImportLeads,
        addProject,
        updateProject,
        deleteProject,
        toggleMilestone,
        addMilestone,
        deleteMilestone,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        activeMemberId,
        setActiveMemberId,
        teamPresence,
        setMyActivityStatus,
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
        scratchpadText,
        setScratchpadText,
        inboundSubmissions,
        addInboundSubmission,
        convertInboundToLead,
        dismissInboundSubmission,
        deleteInboundSubmission,
        clearAllInboundSubmissions,
        updateIntegrationsConfig,
        isNewLeadModalOpen,
        setIsNewLeadModalOpen,
        isWonModalOpen,
        setIsWonModalOpen,
        wonLeadForModal,
        setWonLeadForModal,
        isImportModalOpen,
        setIsImportModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isTeamModalOpen,
        setIsTeamModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isNewProjectModalOpen,
        setIsNewProjectModalOpen,
        whatsAppLeadModal,
        setWhatsAppLeadModal,
        instagramDMLeadModal,
        setInstagramDMLeadModal,
        emailComposerLeadModal,
        setEmailComposerLeadModal,
        scheduleFollowUp,
        completeFollowUp,
        deleteFollowUp,
        meetingModalLead,
        setMeetingModalLead,
        followUpModalLead,
        setFollowUpModalLead,
        supabaseConfig,
        setSupabaseConfig,
        isSyncing,
        syncWithCloud,
        toasts,
        addToast,
        removeToast,
        confirmModal,
        confirmAction,
        closeConfirmModal,
        isAuthenticated,
        currentUser,
        isAuthLoading,
        login,
        logout,
        clearAllData,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
