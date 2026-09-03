'use client';

import React from 'react';
import { useCRM } from '@/lib/store';
import { CRMView } from '@/types/crm';
import {
  IconLayoutKanban,
  IconMailForward,
  IconUsersGroup,
  IconTable,
  IconRocket,
  IconChartBar,
  IconPlus,
  IconMoon,
  IconSun,
  IconSettings,
  IconCloud,
  IconCloudCheck,
  IconRefresh,
  IconEye,
  IconUsers,
  IconInbox,
  IconLogout,
  IconClock,
  IconListCheck,
  IconX,
} from '@tabler/icons-react';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '../ui/Button';

export function Sidebar() {
  const {
    currentView,
    setCurrentView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    leads,
    projects,
    tasks,
    teamMembers,
    inboundSubmissions,
    agencyName,
    theme,
    toggleTheme,
    setIsNewLeadModalOpen,
    setIsSettingsModalOpen,
    supabaseConfig,
    isSyncing,
    syncWithCloud,
    logout,
  } = useCRM();

  // Calculate live badge counts
  const inboundNewCount = inboundSubmissions?.filter((s) => s.status === 'new').length || 0;

  const needsOutreachCount = leads.filter(
    (l) => l.outreachStage === 'Needs Outreach' || l.status === 'Leads' || l.status === 'Not Contacted'
  ).length;

  const contactedCount = leads.filter(
    (l) => l.outreachStage === 'Contacted' || l.outreachStage === 'Follow-Up Needed'
  ).length;

  const activeProjectsCount = projects.filter(
    (p) => p.status !== 'Live / Deployed'
  ).length;

  const activeFollowUpsCount = leads.filter(
    (l) => l.activeFollowUp && !l.activeFollowUp.completed
  ).length;

  const dueOrOverdueFollowUpsCount = leads.filter((l) => {
    if (!l.activeFollowUp || l.activeFollowUp.completed) return false;
    const endOfToday = new Date().setHours(23, 59, 59, 999);
    return new Date(l.activeFollowUp.scheduledDate).getTime() <= endOfToday;
  }).length;

  const pendingTasksCount = tasks?.filter((t) => !t.completed).length || 0;

  const navItems: Array<{
    id: CRMView;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'pipeline',
      label: 'Deals Pipeline',
      icon: <IconLayoutKanban size={15} stroke={1.75} />,
      badge: leads.length,
    },
    {
      id: 'inbound-leads',
      label: 'Inbound Inquiries',
      icon: <IconInbox size={15} stroke={1.75} />,
      badge: inboundNewCount,
      badgeColor: inboundNewCount > 0 ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : undefined,
    },
    {
      id: 'needs-outreach',
      label: 'Needs Outreach',
      icon: <IconMailForward size={15} stroke={1.75} />,
      badge: needsOutreachCount,
      badgeColor: needsOutreachCount > 0 ? 'bg-amber-500/20 text-amber-400 font-semibold' : undefined,
    },
    {
      id: 'contacted',
      label: 'Contacted Leads',
      icon: <IconUsersGroup size={15} stroke={1.75} />,
      badge: contactedCount,
    },
    {
      id: 'follow-ups',
      label: 'Follow-Up Queue',
      icon: <IconClock size={15} stroke={1.75} />,
      badge: activeFollowUpsCount,
      badgeColor: dueOrOverdueFollowUpsCount > 0 ? 'bg-amber-500/20 text-amber-400 font-semibold' : undefined,
    },
    {
      id: 'tasks-notes',
      label: 'Tasks & Notes',
      icon: <IconListCheck size={15} stroke={1.75} />,
      badge: pendingTasksCount,
    },
    {
      id: 'all-leads',
      label: 'All Leads Directory',
      icon: <IconTable size={15} stroke={1.75} />,
    },
    {
      id: 'projects',
      label: 'Project Deliverables',
      icon: <IconRocket size={15} stroke={1.75} />,
      badge: activeProjectsCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'client-portal-preview',
      label: 'Client Portal View',
      icon: <IconEye size={15} stroke={1.75} />,
    },
    {
      id: 'team',
      label: 'Team Members',
      icon: <IconUsers size={15} stroke={1.75} />,
      badge: teamMembers.length,
    },
    {
      id: 'analytics',
      label: 'Agency Analytics',
      icon: <IconChartBar size={15} stroke={1.75} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <IconSettings size={15} stroke={1.75} />,
    },
  ];

  const handleNavClick = (viewId: CRMView) => {
    setCurrentView(viewId);
    setIsMobileMenuOpen(false);
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full">
      {/* Top Workspace Header */}
      <div className="flex flex-col">
        <div className="h-[48px] px-3 flex items-center justify-between border-b border-[var(--t-border-color-light)]">
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src="/logo.png"
              alt="upgradeUX"
              className="w-[22px] h-[22px] object-contain shrink-0"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[12.5px] font-bold text-[var(--t-font-color-primary)] tracking-tight truncate leading-tight">
                {agencyName}
              </span>
              <span className="text-[9.5px] text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                Agency CRM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setCurrentView('settings');
                if (isMobile) setIsMobileMenuOpen(false);
              }}
              title="Workspace Settings"
              className="w-[24px] h-[24px] rounded-[4px] flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer"
            >
              <IconSettings size={14} />
            </button>

            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                title="Close Menu"
                className="w-[24px] h-[24px] rounded-[4px] flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer"
              >
                <IconX size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Action: Add Client Lead Button */}
        <div className="p-2">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-start text-[12px]"
            leftIcon={<IconPlus size={14} />}
            onClick={() => {
              setIsNewLeadModalOpen(true);
              if (isMobile) setIsMobileMenuOpen(false);
            }}
          >
            Add Client Lead
          </Button>
        </div>

        {/* Section Label */}
        <div className="px-3 pt-1 pb-1 text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
          Workspace Views
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-[1px] px-1.5 overflow-y-auto max-h-[calc(100vh-240px)]">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'w-full h-[32px] sm:h-[30px] px-2 rounded-[5px] flex items-center justify-between text-[12px] sm:text-[11.5px] transition-colors cursor-pointer group',
                  isActive
                    ? 'bg-[var(--t-background-transparent-medium)] text-[var(--t-font-color-primary)] font-medium'
                    : 'text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)]'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-[var(--t-font-color-primary)]' : 'text-[var(--t-font-color-tertiary)] group-hover:text-[var(--t-font-color-secondary)]'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-[3px] text-[10px] font-mono tabular-nums',
                      item.badgeColor || 'bg-[var(--t-background-transparent-light)] text-[var(--t-font-color-tertiary)]'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile, Sync Status, and Theme */}
      <div className="p-2 border-t border-[var(--t-border-color-light)] flex flex-col gap-1.5">
        {/* Cloud Sync Status Pill */}
        <div
          onClick={syncWithCloud}
          className="flex items-center justify-between px-2 py-1 rounded-[5px] bg-[var(--t-background-transparent-lighter)] border border-[var(--t-border-color-light)] cursor-pointer hover:bg-[var(--t-background-transparent-light)] transition-colors group"
          title={supabaseConfig.isConnected ? 'Click to sync with Supabase PostgreSQL' : 'Click to sync or configure Supabase in .env.local'}
        >
          <div className="flex items-center gap-1.5">
            {supabaseConfig.isConnected ? (
              <IconCloudCheck size={13} className="text-emerald-500" />
            ) : (
              <IconCloud size={13} className="text-[var(--t-font-color-tertiary)]" />
            )}
            <span className="text-[10.5px] text-[var(--t-font-color-secondary)] group-hover:text-[var(--t-font-color-primary)] truncate">
              {supabaseConfig.isConnected ? 'Supabase' : 'Local Storage'}
            </span>
          </div>

          <button
            disabled={isSyncing}
            className={cn(
              'text-[var(--t-font-color-tertiary)] group-hover:text-[var(--t-font-color-primary)] p-0.5',
              isSyncing && 'animate-spin'
            )}
          >
            <IconRefresh size={12} />
          </button>
        </div>

        {/* User Profile & Theme Toggle */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <img
              src="/logo.png"
              alt="upgradeUX"
              className="w-[18px] h-[18px] object-contain shrink-0"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11.5px] font-medium text-[var(--t-font-color-primary)] truncate leading-tight">
                {agencyName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="w-[24px] h-[24px] rounded-[4px] flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <IconSun size={13} /> : <IconMoon size={13} />}
            </button>

            <button
              onClick={logout}
              title="Sign Out of CRM"
              className="w-[24px] h-[24px] rounded-[4px] flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <IconLogout size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[220px] h-screen bg-[var(--t-background-secondary)] border-r border-[var(--t-border-color-light)] flex-col justify-between select-none shrink-0 z-20">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[85vw] bg-[var(--t-background-secondary)] border-r border-[var(--t-border-color-medium)] flex flex-col justify-between select-none h-full shadow-2xl z-10 animate-slide-right">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
