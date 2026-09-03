'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '@/lib/store';
import {
  IconSearch,
  IconBuilding,
  IconRocket,
  IconPlus,
  IconLayoutKanban,
  IconMailForward,
  IconTable,
  IconSun,
  IconMoon,
  IconDownload,
  IconSettings,
  IconArrowRight,
  IconX,
  IconPhone,
  IconBrandInstagram,
  IconMail,
  IconMapPin,
} from '@tabler/icons-react';
import { formatCurrency, matchLeadSearch, matchProjectSearch } from '@/lib/utils';
import { exportLeadsToCsv } from '@/lib/exportCsv';

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    leads,
    allLeads,
    projects,
    allProjects,
    openLeadDrawer,
    setCurrentView,
    setIsNewLeadModalOpen,
    setIsSettingsModalOpen,
    toggleTheme,
    theme,
  } = useCRM();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const q = query.toLowerCase().trim();

  // Search across all leads with universal search matcher
  const searchPoolLeads = allLeads?.length > 0 ? allLeads : leads;
  const matchedLeads = q
    ? searchPoolLeads.filter((l) => matchLeadSearch(l, q))
    : searchPoolLeads.slice(0, 5);

  // Search across all projects with universal search matcher
  const searchPoolProjects = allProjects?.length > 0 ? allProjects : projects;
  const matchedProjects = q
    ? searchPoolProjects.filter((p) => matchProjectSearch(p, q))
    : searchPoolProjects.slice(0, 4);

  const handleSelectLead = (id: string) => {
    setIsCommandPaletteOpen(false);
    openLeadDrawer(id);
  };

  const handleSelectProject = () => {
    setIsCommandPaletteOpen(false);
    setCurrentView('projects');
  };

  const handleAction = (action: () => void) => {
    setIsCommandPaletteOpen(false);
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => setIsCommandPaletteOpen(false)}
      />

      <div className="relative w-full max-w-[560px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-medium)] rounded-[12px] shadow-2xl z-10 animate-fade-in overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[var(--t-border-color-light)]">
          <IconSearch size={18} className="text-[var(--t-font-color-tertiary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search companies, contacts, projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)] outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--t-background-transparent-light)] text-[10px] font-mono border border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-2 flex flex-col gap-3 text-[12px]">
          {/* Quick Actions (when query matches action keywords or empty) */}
          {(!q || 'new lead pipeline outreach theme export settings'.includes(q)) && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="flex flex-col gap-[2px]">
                <button
                  onClick={() => handleAction(() => setIsNewLeadModalOpen(true))}
                  className="w-full px-2.5 py-1.5 rounded-[6px] flex items-center justify-between text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <IconPlus size={15} className="text-[#5d4ef7]" />
                    <span>Create New Lead</span>
                  </div>
                  <IconArrowRight size={13} className="text-[var(--t-font-color-tertiary)]" />
                </button>

                <button
                  onClick={() => handleAction(() => setCurrentView('pipeline'))}
                  className="w-full px-2.5 py-1.5 rounded-[6px] flex items-center justify-between text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <IconLayoutKanban size={15} className="text-[var(--t-font-color-secondary)]" />
                    <span>Go to Deals Pipeline</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(() => setCurrentView('needs-outreach'))}
                  className="w-full px-2.5 py-1.5 rounded-[6px] flex items-center justify-between text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <IconMailForward size={15} className="text-amber-500" />
                    <span>Open Cold Outreach Queue</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(() => toggleTheme())}
                  className="w-full px-2.5 py-1.5 rounded-[6px] flex items-center justify-between text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <IconSun size={15} className="text-amber-400" /> : <IconMoon size={15} className="text-indigo-400" />}
                    <span>Toggle Theme ({theme === 'dark' ? 'Light' : 'Dark'})</span>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(() => exportLeadsToCsv(leads))}
                  className="w-full px-2.5 py-1.5 rounded-[6px] flex items-center justify-between text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <IconDownload size={15} className="text-[var(--t-font-color-secondary)]" />
                    <span>Export Leads to CSV</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Matched Leads */}
          {matchedLeads.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                Leads & Companies ({matchedLeads.length})
              </div>
              <div className="flex flex-col gap-[2px]">
                {matchedLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectLead(lead.id)}
                    className="w-full px-2.5 py-2 rounded-[6px] flex items-center justify-between text-left hover:bg-[var(--t-background-transparent-light)] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-[24px] h-[24px] rounded-[4px] bg-[var(--t-background-transparent-medium)] flex items-center justify-center text-[var(--t-font-color-secondary)] shrink-0">
                        <IconBuilding size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-[var(--t-font-color-primary)] group-hover:text-[#5d4ef7] truncate">
                            {lead.companyName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--t-background-transparent-light)] text-[var(--t-font-color-tertiary)]">
                            {lead.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--t-font-color-tertiary)] truncate flex items-center gap-2 flex-wrap">
                          <span>{lead.serviceInterest || 'Web Development'}</span>
                          {lead.phone && (
                            <span className="font-mono text-[10.5px] text-[var(--t-font-color-secondary)] inline-flex items-center gap-1">
                              <IconPhone size={11} className="text-[var(--t-font-color-tertiary)] shrink-0" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.socials?.instagram && (
                            <span className="text-[10.5px] text-pink-400 inline-flex items-center gap-1">
                              <IconBrandInstagram size={11} className="shrink-0" />
                              {lead.socials.instagram}
                            </span>
                          )}
                          {lead.email && !lead.phone && (
                            <span className="text-[10.5px] text-indigo-400 inline-flex items-center gap-1">
                              <IconMail size={11} className="shrink-0" />
                              {lead.email}
                            </span>
                          )}
                          {lead.location && (
                            <span className="text-[10.5px] text-emerald-400 inline-flex items-center gap-1">
                              <IconMapPin size={11} className="shrink-0" />
                              {lead.location}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <span className="text-[12px] font-semibold text-[var(--t-font-color-primary)] font-mono shrink-0">
                      {formatCurrency(lead.dealValue)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Projects */}
          {matchedProjects.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                Active Projects ({matchedProjects.length})
              </div>
              <div className="flex flex-col gap-[2px]">
                {matchedProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={handleSelectProject}
                    className="w-full px-2.5 py-2 rounded-[6px] flex items-center justify-between text-left hover:bg-[var(--t-background-transparent-light)] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-[24px] h-[24px] rounded-[4px] bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <IconRocket size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-medium text-[var(--t-font-color-primary)] group-hover:text-indigo-400 truncate">
                          {proj.projectName}
                        </span>
                        <span className="text-[11px] text-[var(--t-font-color-tertiary)] truncate">
                          {proj.companyName} • {proj.status} ({proj.progressPercent}%)
                        </span>
                      </div>
                    </div>
                    <span className="text-[12px] font-semibold text-[var(--t-font-color-primary)] font-mono shrink-0">
                      {formatCurrency(proj.budget)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && matchedLeads.length === 0 && matchedProjects.length === 0 && (
            <div className="py-6 text-center text-[var(--t-font-color-tertiary)]">
              No matching leads or projects found for &quot;{query}&quot;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
