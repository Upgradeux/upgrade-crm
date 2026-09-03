'use client';

import React from 'react';
import { useCRM } from '@/lib/store';
import {
  IconLayoutKanban,
  IconMailForward,
  IconClock,
  IconListCheck,
  IconMenu2,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { CRMView } from '@/types/crm';

export function MobileBottomNav() {
  const {
    currentView,
    setCurrentView,
    leads,
    tasks,
    inboundSubmissions,
    setIsMobileMenuOpen,
  } = useCRM();

  // Badges
  const needsOutreachCount = leads.filter(
    (l) => l.outreachStage === 'Needs Outreach' || l.status === 'Leads' || l.status === 'Not Contacted'
  ).length;

  const dueOrOverdueFollowUpsCount = leads.filter((l) => {
    if (!l.activeFollowUp || l.activeFollowUp.completed) return false;
    const endOfToday = new Date().setHours(23, 59, 59, 999);
    return new Date(l.activeFollowUp.scheduledDate).getTime() <= endOfToday;
  }).length;

  const pendingTasksCount = tasks?.filter((t) => !t.completed).length || 0;

  const tabs: Array<{
    id: CRMView | 'menu';
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
    isMenuTrigger?: boolean;
  }> = [
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: <IconLayoutKanban size={18} />,
    },
    {
      id: 'needs-outreach',
      label: 'Outreach',
      icon: <IconMailForward size={18} />,
      badge: needsOutreachCount,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'follow-ups',
      label: 'Follow-Ups',
      icon: <IconClock size={18} />,
      badge: dueOrOverdueFollowUpsCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'tasks-notes',
      label: 'Tasks',
      icon: <IconListCheck size={18} />,
      badge: pendingTasksCount,
      badgeColor: 'bg-indigo-500 text-white',
    },
    {
      id: 'menu',
      label: 'More',
      icon: <IconMenu2 size={18} />,
      isMenuTrigger: true,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[56px] bg-[var(--t-background-secondary)] border-t border-[var(--t-border-color-light)] px-2 flex items-center justify-around z-30 select-none backdrop-blur-md pb-safe">
      {tabs.map((tab) => {
        const isActive = !tab.isMenuTrigger && currentView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.isMenuTrigger) {
                setIsMobileMenuOpen(true);
              } else {
                setCurrentView(tab.id as CRMView);
              }
            }}
            className={cn(
              'flex-1 h-full flex flex-col items-center justify-center gap-0.5 relative transition-colors cursor-pointer',
              isActive
                ? 'text-[#5d4ef7] font-semibold'
                : 'text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)]'
            )}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={cn(
                    'absolute -top-1 -right-2 px-1 py-0.1 min-w-[14px] h-[14px] rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow-2xs',
                    tab.badgeColor || 'bg-[#5d4ef7] text-white'
                  )}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
