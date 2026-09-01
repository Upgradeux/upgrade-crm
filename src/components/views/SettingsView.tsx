'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import {
  IconSettings,
  IconBuilding,
  IconDatabase,
  IconMoon,
  IconSun,
  IconDownload,
  IconCheck,
  IconCopy,
  IconCloudCheck,
  IconKey,
  IconLink,
  IconInfoCircle,
  IconTrash,
} from '@tabler/icons-react';
import { SUPABASE_SQL_SCHEMA } from '@/lib/supabase';
import { exportLeadsToCsv } from '@/lib/exportCsv';

export function SettingsView() {
  const {
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
    supabaseConfig,
    setSupabaseConfig,
    isSyncing,
    syncWithCloud,
    leads,
    projects,
    clearAllData,
    addToast,
  } = useCRM();

  const currencyOptions = [
    { value: 'INR (₹)', label: 'INR (₹) - Indian Rupee' },
    { value: 'USD ($)', label: 'USD ($) - US Dollar' },
    { value: 'EUR (€)', label: 'EUR (€) - Euro' },
    { value: 'GBP (£)', label: 'GBP (£) - British Pound' },
    { value: 'AED (د.إ)', label: 'AED (د.إ) - UAE Dirham' },
  ];

  const timezoneOptions = [
    { value: 'Asia/Kolkata (IST)', label: 'Asia/Kolkata (IST - India +5:30)' },
    { value: 'America/New_York (EST)', label: 'America/New_York (EST - USA -5:00)' },
    { value: 'America/Los_Angeles (PST)', label: 'America/Los_Angeles (PST - USA -8:00)' },
    { value: 'Europe/London (GMT)', label: 'Europe/London (GMT - UK +0:00)' },
    { value: 'Asia/Dubai (GST)', label: 'Asia/Dubai (GST - UAE +4:00)' },
  ];

  const [activeTab, setActiveTab] = useState<'profile' | 'database' | 'appearance' | 'data'>('profile');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    addToast(`Agency settings saved: ${agencyName} (${currency} • ${timezone})`, 'success');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    addToast('Copied SQL schema to clipboard!', 'info');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleExportJsonBackup = () => {
    const data = {
      agency: 'upgradeUX',
      exportedAt: new Date().toISOString(),
      currency,
      timezone,
      leads,
      projects,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `upgradeux-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addToast('Exported complete JSON backup!', 'success');
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-y-auto bg-[var(--t-background-primary)] flex flex-col gap-3 select-none">
      {/* Settings Navigation Bar */}
      <div className="h-[38px] px-2.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-1">
          {[
            { id: 'profile', label: 'Agency Profile', icon: <IconBuilding size={13} /> },
            { id: 'database', label: 'Supabase Cloud DB', icon: <IconDatabase size={13} /> },
            { id: 'appearance', label: 'Theme & Display', icon: <IconSun size={13} /> },
            { id: 'data', label: 'Data & Backups', icon: <IconDownload size={13} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`h-[24px] px-2 rounded-[4px] text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] font-semibold shadow-2xs'
                  : 'text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-[var(--t-font-color-tertiary)] hidden sm:inline">
          upgradeUX Workspace v3.0 ({currency})
        </div>
      </div>

      {/* Tab Content Container */}
      <div className="max-w-[720px] w-full mx-auto space-y-4 pt-1">
        {/* Tab 1: Agency Profile (Indian Currency & Timezone) */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="p-4 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-3">
              <div className="text-[11px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                Agency Brand & Regional Settings
              </div>

              {/* Logo Preview */}
              <div className="flex items-center gap-3 pb-2 border-b border-[var(--t-border-color-light)]">
                <div className="w-[36px] h-[36px] rounded-[8px] bg-[#1a1a24] border border-[#33334d] flex items-center justify-center p-1 shadow-sm shrink-0">
                  <img
                    src="/logo.png"
                    alt="upgradeUX"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[var(--t-font-color-primary)]">
                    {agencyName} Studio
                  </div>
                  <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                    Web & AI Automation Agency CRM
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Agency Display Name
                  </label>
                  <Input
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="h-[28px] text-[12px]"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Primary Contact Email
                  </label>
                  <Input
                    type="email"
                    value={agencyEmail}
                    onChange={(e) => setAgencyEmail(e.target.value)}
                    className="h-[28px] text-[12px]"
                  />
                </div>
              </div>

              {/* Indian Currency & India Timezone Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Default Pipeline Currency
                  </label>
                  <Dropdown
                    value={currency}
                    onChange={(val) => {
                      setCurrency(val);
                      addToast(`Switched currency to ${val}`, 'success');
                    }}
                    options={currencyOptions}
                    size="sm"
                    buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Timezone
                  </label>
                  <Dropdown
                    value={timezone}
                    onChange={(val) => {
                      setTimezone(val);
                      addToast(`Switched timezone to ${val}`, 'success');
                    }}
                    options={timezoneOptions}
                    size="sm"
                    buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm">
                Save Profile Changes
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Supabase Cloud Database */}
        {activeTab === 'database' && (
          <div className="space-y-3">
            {/* Connected Clean State */}
            {(supabaseConfig.isConnected || Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)) ? (
              <div className="p-4 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-3.5">
                {/* Header Strip */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--t-border-color-light)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[32px] h-[32px] rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <IconCloudCheck size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[var(--t-font-color-primary)]">
                          Supabase PostgreSQL
                        </span>
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-medium border border-emerald-500/20">
                          Active & Connected
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--t-font-color-tertiary)] font-mono mt-0.5">
                        {process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.url}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSyncing}
                    onClick={syncWithCloud}
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Database Now'}
                  </Button>
                </div>

                {/* Database Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                  <div className="p-2.5 rounded-[5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)]">
                    <div className="text-[10px] uppercase font-semibold text-[var(--t-font-color-tertiary)] tracking-wider">
                      Synced Leads
                    </div>
                    <div className="text-[14px] font-mono font-bold text-[var(--t-font-color-primary)] mt-1">
                      {leads.length} Records
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)]">
                    <div className="text-[10px] uppercase font-semibold text-[var(--t-font-color-tertiary)] tracking-wider">
                      Client Deliverables
                    </div>
                    <div className="text-[14px] font-mono font-bold text-[var(--t-font-color-primary)] mt-1">
                      {projects.length} Active
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)]">
                    <div className="text-[10px] uppercase font-semibold text-[var(--t-font-color-tertiary)] tracking-wider">
                      Security & Storage
                    </div>
                    <div className="text-[12px] font-medium text-emerald-400 mt-1 flex items-center gap-1">
                      <span>Row Level Security (RLS)</span>
                    </div>
                  </div>
                </div>

                {/* Subtle Schema Helper Button */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--t-border-color-light)] text-[11px] text-[var(--t-font-color-tertiary)]">
                  <span>Tables: <code className="font-mono text-[var(--t-font-color-secondary)]">public.leads</code>, <code className="font-mono text-[var(--t-font-color-secondary)]">public.projects</code></span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-[11px] text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] flex items-center gap-1 cursor-pointer"
                  >
                    <IconCopy size={11} />
                    <span>{copiedSql ? 'Copied SQL Schema' : 'Copy PostgreSQL Schema'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Setup Instructions only when NOT connected */
              <div className="space-y-3">
                <div className="p-4 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-2.5">
                  <div className="text-[12.5px] font-medium text-[var(--t-font-color-primary)]">
                    Connect Supabase Database
                  </div>
                  <p className="text-[11.5px] text-[var(--t-font-color-secondary)] leading-relaxed">
                    Add your credentials into your local <code className="px-1.5 py-0.5 rounded bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[11px] font-mono text-emerald-400">.env.local</code> file or under Vercel Environment Variables:
                  </p>
                  <pre className="p-3 rounded-[5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] text-[11px] font-mono text-[var(--t-font-color-primary)] overflow-x-auto select-all">
                    {`NEXT_PUBLIC_SUPABASE_URL="https://your-ref.supabase.co"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Appearance */}
        {activeTab === 'appearance' && (
          <div className="p-4 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-3">
            <div className="text-[11px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
              Theme & Interface Scale
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[var(--t-border-color-light)]">
              <div>
                <div className="text-[12.5px] font-medium text-[var(--t-font-color-primary)]">
                  Color Mode
                </div>
                <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                  Currently using {theme === 'dark' ? 'Twenty Charcoal Dark Mode' : 'Twenty Clean Light Mode'}
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={theme === 'dark' ? <IconSun size={13} /> : <IconMoon size={13} />}
                onClick={toggleTheme}
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-[12.5px] font-medium text-[var(--t-font-color-primary)]">
                  Typography Scale
                </div>
                <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                  Twenty 13px base Inter scale with 4px multiplier grid
                </div>
              </div>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--t-background-quaternary)] text-[var(--t-font-color-secondary)]">
                13px (Base)
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Data & Backups */}
        {activeTab === 'data' && (
          <div className="p-4 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-3">
            <div className="text-[11px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
              Export & Backup Tools
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[var(--t-border-color-light)]">
              <div>
                <div className="text-[12.5px] font-medium text-[var(--t-font-color-primary)]">
                  Full JSON Workspace Backup
                </div>
                <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                  Download all client leads, deliverable projects, and milestones as a JSON snapshot ({currency})
                </div>
              </div>

              <Button
                variant="subtle"
                size="sm"
                leftIcon={<IconDownload size={13} />}
                onClick={handleExportJsonBackup}
              >
                Download JSON
              </Button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[var(--t-border-color-light)]">
              <div>
                <div className="text-[12.5px] font-medium text-[var(--t-font-color-primary)]">
                  Export Leads as CSV Spreadsheet
                </div>
                <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                  Compatible with Microsoft Excel, Google Sheets, and CRM migrators
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<IconDownload size={13} />}
                onClick={() => exportLeadsToCsv(leads)}
              >
                Export CSV
              </Button>
            </div>

            {/* Danger Zone: Clear Sample Data */}
            <div className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-[12.5px] font-medium text-rose-400 flex items-center gap-1.5">
                  <IconTrash size={14} />
                  <span>Clear All Workspace Data</span>
                </div>
                <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                  Removes all cached dummy leads and sample projects to start with a fresh workspace
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all data and start completely fresh?')) {
                    clearAllData();
                  }
                }}
                className="h-[28px] px-3 rounded-[4px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-medium transition-colors cursor-pointer"
              >
                Clear All Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
