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
} from '@/types/crm';
import { INITIAL_LEADS, INITIAL_PROJECTS } from './initialData';
import { generateUUID, formatCurrency, formatDate } from './utils';

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
  fetchInboundSubmissionsFromSupabase,
  updateInboundSubmissionInSupabase,
  deleteInboundSubmissionFromSupabase,
} from './supabase';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [];

const DEFAULT_INTEGRATIONS: IntegrationsConfig = {
  calComUsername: 'upgradeux',
  googleMeetEnabled: true,
  googleCalendarEmail: 'meetings@upgradeux.com',
  emailSyncAddress: 'outreach@upgradeux.com',
  webhookInboundUrl: 'https://api.upgradeux.com/v1/inbound-leads',
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
  teamMembers: TeamMember[];
  integrationsConfig: IntegrationsConfig;
  currentView: CRMView;
  setCurrentView: (view: CRMView) => void;
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
  addNote: (leadId: string, content: string, type?: Note['type']) => void;
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
  addTeamMember: (member: Omit<TeamMember, 'id' | 'joinedAt'>) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  // Inbound Submissions
  inboundSubmissions: InboundSubmission[];
  addInboundSubmission: (submission: Omit<InboundSubmission, 'id' | 'createdAt' | 'status'>) => void;
  convertInboundToLead: (submissionId: string, targetSpaceId?: string, dealValue?: number) => void;
  dismissInboundSubmission: (submissionId: string) => void;
  deleteInboundSubmission: (submissionId: string) => void;

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

  // Supabase
  supabaseConfig: SupabaseConfig;
  setSupabaseConfig: (config: SupabaseConfig) => void;
  isSyncing: boolean;
  syncWithCloud: () => Promise<void>;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

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

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [rawLeads, setRawLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [rawProjects, setRawProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [spaces, setSpaces] = useState<IndustrySpace[]>(DEFAULT_SPACES);
  const [activeSpaceId, setActiveSpaceIdState] = useState<string>('all');
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<IndustrySpace | null>(null);
  const [inboundSubmissions, setInboundSubmissions] = useState<InboundSubmission[]>([]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_TEAM_MEMBERS);
  const [integrationsConfig, setIntegrationsConfig] = useState<IntegrationsConfig>(DEFAULT_INTEGRATIONS);
  const [currentView, setCurrentView] = useState<CRMView>('pipeline');
  const [projectsLayout, setProjectsLayout] = useState<'table' | 'cards'>('table');
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [agencyName, setAgencyNameState] = useState<string>('upgradeUX');
  const [agencyEmail, setAgencyEmailState] = useState<string>('alex@upgradeux.com');
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

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedLeads = localStorage.getItem(STORAGE_KEY_LEADS);
      if (savedLeads) setRawLeads(JSON.parse(savedLeads));

      const savedProjects = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (savedProjects) setRawProjects(JSON.parse(savedProjects));

      const savedSpaces = localStorage.getItem(STORAGE_KEY_SPACES);
      if (savedSpaces) setSpaces(JSON.parse(savedSpaces));

      const savedActiveSpace = localStorage.getItem(STORAGE_KEY_ACTIVE_SPACE);
      if (savedActiveSpace) setActiveSpaceIdState(savedActiveSpace);

      const savedTeam = localStorage.getItem(STORAGE_KEY_TEAM);
      if (savedTeam) {
        const parsed = JSON.parse(savedTeam);
        const cleanTeam = parsed.filter((m: any) => !['team-1', 'team-2', 'team-3', 'team-4'].includes(m.id));
        setTeamMembers(cleanTeam);
        localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(cleanTeam));
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
      const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url;
      const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.anonKey;
      if (envUrl && envKey) {
        try {
          const config = { url: envUrl, anonKey: envKey, isConnected: true };
          const [remoteLeads, remoteInbound] = await Promise.all([
            fetchLeadsFromSupabase(config),
            fetchInboundSubmissionsFromSupabase(config),
          ]);

          if (remoteLeads && remoteLeads.length > 0) {
            setRawLeads(remoteLeads);
          }

          if (remoteInbound) {
            setInboundSubmissions((prev) => {
              const existingIds = new Set(remoteInbound.map((s) => s.id));
              const localOnly = prev.filter((s) => !existingIds.has(s.id));
              return [...remoteInbound, ...localOnly];
            });
          }
        } catch (e) {
          console.warn('Background auto-sync:', e);
        }
      }
    };

    // Initial fetch on mount
    autoSyncFromCloud();

    // Auto-refresh every 15 seconds to catch live inbound leads from the website
    const interval = setInterval(autoSyncFromCloud, 15000);

    // Refresh when user focuses the tab
    const handleFocus = () => autoSyncFromCloud();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [supabaseConfig.url, supabaseConfig.anonKey]);

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
      const pushOk = await syncLeadsToSupabase(rawLeads, activeConfig);
      if (pushOk) {
        const [remoteLeads, remoteInbound] = await Promise.all([
          fetchLeadsFromSupabase(activeConfig),
          fetchInboundSubmissionsFromSupabase(activeConfig),
        ]);
        if (remoteLeads && remoteLeads.length > 0) {
          setRawLeads(remoteLeads);
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
      industrySpaceId: assignedSpaceId,
      industry: leadData.industry || matchedSpace?.name || 'Real Estate & Properties',
      notes: newNotes,
      createdAt: now,
      updatedAt: now,
    };

    setRawLeads((prev) => [newLead, ...prev]);
    addToast(`Added prospect: ${newLead.companyName}`, 'success');
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setRawLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== id) return lead;
        return {
          ...lead,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteLead = (id: string) => {
    const lead = rawLeads.find((l) => l.id === id);
    setRawLeads((prev) => prev.filter((l) => l.id !== id));
    if (activeLeadId === id) setActiveLeadId(null);
    addToast(`Deleted ${lead?.companyName || 'lead'}`, 'info');
  };

  const moveLeadStatus = (id: string, status: LeadStatus) => {
    const targetLead = rawLeads.find((l) => l.id === id);
    if (!targetLead) return;

    let outreachStage: OutreachStage = targetLead.outreachStage;
    if (status === 'Not Contacted') outreachStage = 'Needs Outreach';
    else if (status === 'Contacted' || status === 'Booked Call' || status === 'In Processing / Proposal') {
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
      status: lead.status === 'Not Contacted' ? 'Contacted' : lead.status,
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

    updateLead(id, {
      status: 'Booked Call',
      outreachStage: 'Contacted',
      lastContactedAt: now,
      googleMeetLink: `https://${randomMeetCode}`,
      notes: [note, ...(lead.notes || [])],
    });

    addToast(`Booked call for ${lead.companyName}`, 'success');
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
      status: item.status || 'Not Contacted',
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
      clientAccessKey: `ux-portal-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };

    setRawProjects((prev) => [newProject, ...prev]);
    triggerConfetti();
    addToast(`Created deliverable "${newProject.projectName}"`, 'success');
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setRawProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== id) return proj;
        return {
          ...proj,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteProject = (id: string) => {
    const proj = rawProjects.find((p) => p.id === id);
    setRawProjects((prev) => prev.filter((p) => p.id !== id));
    addToast(`Deleted deliverable "${proj?.projectName || ''}"`, 'info');
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

  // Team CRUD
  const addTeamMember = (memberData: Omit<TeamMember, 'id' | 'joinedAt'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: generateUUID(),
      joinedAt: new Date().toISOString(),
    };
    setTeamMembers((prev) => [...prev, newMember]);
    addToast(`Added team member: ${newMember.name}`, 'success');
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    addToast('Team member removed', 'info');
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
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyName: sub.name,
      contactName: sub.name,
      email: sub.email,
      phone: sub.phone || '',
      websiteUrl: '',
      socials: {},
      source: 'Website Inbound',
      serviceInterest: (primaryInterest as ServiceType) || 'Web Development',
      dealValue: dealValue,
      status: sub.source === 'Cal.com Booking' ? 'Booked Call' : 'Not Contacted',
      outreachStage: sub.source === 'Cal.com Booking' ? 'Contacted' : 'Needs Outreach',
      leadOwner: teamMembers[0]?.name ? `${teamMembers[0].name} (${teamMembers[0].role.split(' ')[0]})` : 'Unassigned',
      location: 'Website Inbound',
      industrySpaceId: targetSpaceId || (activeSpaceId !== 'all' ? activeSpaceId : undefined),
      notes: [
        {
          id: `note_${Date.now()}`,
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

  const clearAllData = () => {
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
    addToast('All workspace data and team members cleared. Workspace is 100% clean!', 'success');
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
        inboundSubmissions,
        addInboundSubmission,
        convertInboundToLead,
        dismissInboundSubmission,
        deleteInboundSubmission,
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
        meetingModalLead,
        setMeetingModalLead,
        supabaseConfig,
        setSupabaseConfig,
        isSyncing,
        syncWithCloud,
        toasts,
        addToast,
        removeToast,
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
