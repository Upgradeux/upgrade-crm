'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Button } from '../ui/Button';
import {
  IconSearch,
  IconPlus,
  IconDownload,
  IconUpload,
  IconDotsVertical,
  IconEye,
  IconMenu2,
} from '@tabler/icons-react';
import { exportLeadsToCsv } from '@/lib/exportCsv';
import { SpaceSwitcher } from '../ui/SpaceSwitcher';

export function TopNav() {
  const {
    currentView,
    leads,
    agencyName,
    setIsNewLeadModalOpen,
    setIsNewProjectModalOpen,
    setIsImportModalOpen,
    setIsCommandPaletteOpen,
    setIsMobileMenuOpen,
  } = useCRM();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const titles: Record<string, { title: string; subtitle: string }> = {
    pipeline: {
      title: `${agencyName} Deals Pipeline`,
      subtitle: 'Visual Kanban workflow from cold lead to won client',
    },
    'needs-outreach': {
      title: 'Cold Outreach Queue',
      subtitle: 'Untouched Google Maps & Instagram prospects ready for 1-click contact',
    },
    contacted: {
      title: 'Contacted Leads & Follow-Ups',
      subtitle: 'Leads in active conversation with call logs and elapsed time tracking',
    },
    'all-leads': {
      title: 'Client Prospects Directory',
      subtitle: 'Master spreadsheet view with multi-column filtering and sorting',
    },
    projects: {
      title: 'Active Deliverables Tracker',
      subtitle: 'Sprint progress bars, milestone checklists, and production builds',
    },
    'client-portal-preview': {
      title: 'Client Portal Live View',
      subtitle: 'Branded read-only milestone view that clients see',
    },
    team: {
      title: 'Team Management & Roles',
      subtitle: 'Assign callers, closers, and developers to client leads',
    },
    analytics: {
      title: `${agencyName} Revenue & Analytics`,
      subtitle: 'Pipeline value, closing win rates, and service breakdowns',
    },
    settings: {
      title: 'Workspace Settings',
      subtitle: 'Agency profile, Supabase Cloud database, appearance, and data backup',
    },
  };

  const { title, subtitle } = titles[currentView] || {
    title: `${agencyName} Agency CRM`,
    subtitle: 'High performance CRM for Web & AI Automation Agencies',
  };

  return (
    <header className="h-[48px] px-2 sm:px-4 border-b border-[var(--t-border-color-light)] bg-[var(--t-background-primary)] flex items-center justify-between gap-2 sm:gap-3 select-none shrink-0 z-10">
      {/* Left: View Title & Space Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <h1 className="text-[13px] sm:text-[13.5px] font-bold text-[var(--t-font-color-primary)] truncate">
            {title}
          </h1>
          <span className="hidden xl:inline-block text-[11px] text-[var(--t-font-color-tertiary)] truncate max-w-[260px]">
            • {subtitle}
          </span>
        </div>

        {/* Multi-Industry Space Switcher */}
        <div className="shrink-0 hidden xs:block">
          <SpaceSwitcher />
        </div>
      </div>

      {/* Right Controls: Search, CSV, and Quick Add */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Command Palette Trigger Search Box */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="h-[30px] sm:h-[32px] px-2 sm:px-2.5 rounded-[8px] bg-[var(--t-background-transparent-lighter)] border border-[var(--t-border-color-medium)] hover:border-[var(--t-border-color-strong)] flex items-center gap-1.5 sm:gap-2 text-[11.5px] sm:text-[12px] text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-secondary)] transition-colors cursor-pointer w-auto sm:w-[220px] justify-between"
          title="Search anything (⌘K)"
        >
          <div className="flex items-center gap-1.5 truncate">
            <IconSearch size={14} className="shrink-0" />
            <span className="truncate hidden sm:inline">Search phone, link, user...</span>
          </div>
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded-[4px] bg-[var(--t-background-transparent-light)] text-[10px] font-mono border border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]">
            ⌘K
          </kbd>
        </button>

        {/* CSV Import / Export Actions */}
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<IconDotsVertical size={13} />}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title="Import/Export Tools"
            className="h-[30px] sm:h-[32px] px-2"
          />

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-[180px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] rounded-[8px] shadow-xl py-1 z-40 animate-fade-in text-[12px]">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    exportLeadsToCsv(leads);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors"
                >
                  <IconDownload size={14} className="text-[var(--t-font-color-tertiary)]" />
                  <span>Export Leads (CSV)</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsImportModalOpen(true);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors"
                >
                  <IconUpload size={14} className="text-[var(--t-font-color-tertiary)]" />
                  <span>Import Leads (CSV)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Primary View Action Button */}
        {currentView === 'projects' ? (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<IconPlus size={13} />}
            onClick={() => setIsNewProjectModalOpen(true)}
            className="h-[30px] sm:h-[32px] text-[11px] sm:text-[12px] px-2.5 sm:px-3"
          >
            <span className="hidden xs:inline">New Deliverable</span>
            <span className="xs:hidden">Project</span>
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<IconPlus size={13} />}
            onClick={() => setIsNewLeadModalOpen(true)}
            className="h-[30px] sm:h-[32px] text-[11px] sm:text-[12px] px-2.5 sm:px-3"
          >
            <span className="hidden xs:inline">Add Client Lead</span>
            <span className="xs:hidden">Lead</span>
          </Button>
        )}
      </div>
    </header>
  );
}
