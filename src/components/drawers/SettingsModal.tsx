'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { testSupabaseConnection, SUPABASE_SQL_SCHEMA } from '@/lib/supabase';
import { UserRole } from '@/types/crm';
import {
  IconCloudCheck,
  IconDatabase,
  IconCopy,
  IconCheck,
  IconInfoCircle,
  IconLink,
  IconKey,
  IconUsers,
  IconVideo,
  IconMail,
  IconCalendar,
  IconTrash,
  IconPlus,
  IconBrandGoogleFilled,
} from '@tabler/icons-react';
import { getInitials } from '@/lib/utils';

export function SettingsModal() {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    supabaseConfig,
    setSupabaseConfig,
    syncWithCloud,
    isSyncing,
    teamMembers,
    addTeamMember,
    deleteTeamMember,
    integrationsConfig,
    updateIntegrationsConfig,
    addToast,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'team' | 'integrations' | 'supabase'>('team');

  // Supabase State
  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Invite Team State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('Cold Caller / Outreach Specialist');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);

  // Integrations State
  const [calCom, setCalCom] = useState(integrationsConfig.calComUsername || 'upgradeux');
  const [googleEmail, setGoogleEmail] = useState(integrationsConfig.googleCalendarEmail || 'meetings@upgradeux.com');
  const [outreachEmail, setOutreachEmail] = useState(integrationsConfig.emailSyncAddress || 'outreach@upgradeux.com');

  const handleTestAndSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      addToast('Please enter both Supabase Project URL and Anon Key', 'warning');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      setSupabaseConfig({
        url: url.trim(),
        anonKey: anonKey.trim(),
        isConnected: true,
        lastSyncedAt: new Date().toISOString(),
      });
      addToast('Supabase PostgreSQL connected!', 'success');
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const colors = [
      'from-cyan-500 to-blue-600',
      'from-purple-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-rose-600',
    ];

    addTeamMember({
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      phone: newMemberPhone.trim() || undefined,
    });

    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setIsInviteFormOpen(false);
  };

  const handleSaveIntegrations = (e: React.FormEvent) => {
    e.preventDefault();
    updateIntegrationsConfig({
      calComUsername: calCom.trim(),
      googleCalendarEmail: googleEmail.trim(),
      emailSyncAddress: outreachEmail.trim(),
    });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    addToast('Copied SQL schema to clipboard!', 'info');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <Modal
      isOpen={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
      title="upgradeUX Workspace Settings"
      subtitle="Manage team members, roles, Google Meet / Cal.com integrations, and Supabase cloud sync"
      maxWidth="max-w-[680px]"
    >
      <div className="space-y-4 text-[12px]">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--t-border-color-light)] -mt-1">
          <button
            onClick={() => setActiveTab('team')}
            className={`py-2 px-3 text-[12px] font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'team'
                ? 'border-[#30AFFF] text-[#30AFFF] font-semibold'
                : 'border-transparent text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)]'
            }`}
          >
            <IconUsers size={15} />
            <span>Team & Roles ({teamMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-2 px-3 text-[12px] font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'integrations'
                ? 'border-[#30AFFF] text-[#30AFFF] font-semibold'
                : 'border-transparent text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)]'
            }`}
          >
            <IconVideo size={15} />
            <span>Google Meet, Cal.com & Email</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-2 px-3 text-[12px] font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'border-[#30AFFF] text-[#30AFFF] font-semibold'
                : 'border-transparent text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)]'
            }`}
          >
            <IconDatabase size={15} />
            <span>Supabase Cloud DB</span>
          </button>
        </div>

        {/* Tab 1: Team & Roles */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-[var(--t-font-color-primary)]">
                  upgradeUX Team Members
                </h4>
                <p className="text-[11px] text-[var(--t-font-color-secondary)]">
                  Assign callers, closers, and developers to client leads.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<IconPlus size={13} />}
                onClick={() => setIsInviteFormOpen((prev) => !prev)}
              >
                {isInviteFormOpen ? 'Cancel' : 'Invite Member'}
              </Button>
            </div>

            {/* Invite Form */}
            {isInviteFormOpen && (
              <form
                onSubmit={handleInviteSubmit}
                className="p-3.5 rounded-[8px] bg-[var(--t-background-secondary)] border border-[#30AFFF]/40 shadow-sm space-y-3 animate-fade-in"
              >
                <div className="text-[11.5px] font-bold text-[var(--t-font-color-primary)]">
                  Add / Invite New Member
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--t-font-color-secondary)] block mb-1">
                      Full Name
                    </label>
                    <Input
                      required
                      placeholder="e.g. Jordan Smith"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--t-font-color-secondary)] block mb-1">
                      Email Address
                    </label>
                    <Input
                      required
                      type="email"
                      placeholder="jordan@upgradeux.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--t-font-color-secondary)] block mb-1">
                      Role & Permissions
                    </label>
                    <Dropdown
                      value={newMemberRole}
                      onChange={(val) => setNewMemberRole(val as UserRole)}
                      options={[
                        { value: 'Admin (Full Access)', label: 'Admin (Full Access)' },
                        { value: 'Closer / Sales Lead', label: 'Closer / Sales Lead' },
                        { value: 'Cold Caller / Outreach Specialist', label: 'Cold Caller / Outreach' },
                        { value: 'Project Manager', label: 'Project Manager' },
                        { value: 'Developer', label: 'Developer' },
                      ]}
                      size="sm"
                      buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--t-font-color-secondary)] block mb-1">
                      Phone Number (Optional)
                    </label>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 019-3321"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInviteFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Confirm & Add Member
                  </Button>
                </div>
              </form>
            )}

            {/* Team Members List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3 rounded-[8px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-[32px] h-[32px] rounded-full bg-gradient-to-tr ${member.avatarColor} text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs`}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--t-font-color-primary)]">
                          {member.name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            member.role.includes('Admin')
                              ? 'bg-[#30AFFF]/15 text-[#30AFFF]'
                              : member.role.includes('Closer')
                              ? 'bg-purple-500/15 text-purple-400'
                              : 'bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                        {member.email} {member.phone ? `• ${member.phone}` : ''}
                      </div>
                    </div>
                  </div>

                  {teamMembers.length > 1 && (
                    <button
                      onClick={() => deleteTeamMember(member.id)}
                      className="p-1 text-[var(--t-font-color-tertiary)] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove Member"
                    >
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Integrations (Google Meet, Cal.com, Email) */}
        {activeTab === 'integrations' && (
          <form onSubmit={handleSaveIntegrations} className="space-y-4">
            <div>
              <h4 className="text-[13px] font-bold text-[var(--t-font-color-primary)]">
                Connect Calendar, Meetings & Email
              </h4>
              <p className="text-[11px] text-[var(--t-font-color-secondary)]">
                Configure direct meeting booking and email syncing for your agency.
              </p>
            </div>

            {/* Cal.com Integration */}
            <div className="p-3.5 rounded-[8px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-[26px] h-[26px] rounded-[6px] bg-black border border-white/20 text-white flex items-center justify-center font-bold text-[11px]">
                    C
                  </div>
                  <span className="font-bold text-[var(--t-font-color-primary)]">
                    Cal.com Booking Integration
                  </span>
                </div>
                <a
                  href={`https://cal.com/${calCom}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#30AFFF] hover:underline"
                >
                  Test cal.com/{calCom}
                </a>
              </div>

              <div>
                <label className="text-[11px] text-[var(--t-font-color-secondary)] block mb-1">
                  Cal.com Username or Booking Link Slug
                </label>
                <Input
                  value={calCom}
                  onChange={(e) => setCalCom(e.target.value)}
                  placeholder="e.g. upgradeux or alex-upgradeux"
                />
              </div>
            </div>

            {/* Google Meet / Google Calendar */}
            <div className="p-3.5 rounded-[8px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-2">
              <div className="flex items-center gap-2">
                <IconVideo size={18} className="text-emerald-400" />
                <span className="font-bold text-[var(--t-font-color-primary)]">
                  Google Meet Room Auto-Generator
                </span>
              </div>

              <div>
                <label className="text-[11px] text-[var(--t-font-color-secondary)] block mb-1">
                  Google Calendar Account Email
                </label>
                <Input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="meetings@upgradeux.com"
                />
              </div>
            </div>

            {/* Inbound Form Webhook */}
            <div className="p-3.5 rounded-[8px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] space-y-2">
              <div className="flex items-center gap-2">
                <IconMail size={18} className="text-purple-400" />
                <span className="font-bold text-[var(--t-font-color-primary)]">
                  Website Inbound Webhook Endpoint
                </span>
              </div>
              <p className="text-[11px] text-[var(--t-font-color-tertiary)]">
                Send form submissions from your agency website directly to this CRM:
              </p>
              <div className="p-2 bg-[var(--t-background-quaternary)] rounded-[6px] font-mono text-[11px] text-[var(--t-font-color-primary)] select-all">
                {integrationsConfig.webhookInboundUrl}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="md">
                Save Integrations
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Supabase Cloud Sync */}
        {activeTab === 'supabase' && (
          <div className="space-y-4">
            {/* Connection Status Card */}
            <div
              className={`p-3 rounded-[8px] border flex items-center justify-between ${
                supabaseConfig.isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-[var(--t-background-secondary)] border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-[28px] h-[28px] rounded-full flex items-center justify-center ${
                    supabaseConfig.isConnected ? 'bg-emerald-500 text-white' : 'bg-[var(--t-background-transparent-medium)] text-[var(--t-font-color-tertiary)]'
                  }`}
                >
                  <IconCloudCheck size={16} />
                </div>
                <div>
                  <div className="font-bold text-[var(--t-font-color-primary)]">
                    {supabaseConfig.isConnected ? 'Supabase PostgreSQL: Connected' : 'Local Storage Mode (Active)'}
                  </div>
                  <div className="text-[11px] text-[var(--t-font-color-tertiary)]">
                    {supabaseConfig.isConnected
                      ? `Last synced: ${supabaseConfig.lastSyncedAt ? new Date(supabaseConfig.lastSyncedAt).toLocaleTimeString() : 'Just now'}`
                      : 'Leads persist in local cache. Connect Supabase for multi-device live team sync.'}
                  </div>
                </div>
              </div>

              {supabaseConfig.isConnected && (
                <Button
                  variant="subtle"
                  size="sm"
                  disabled={isSyncing}
                  onClick={syncWithCloud}
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              )}
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleTestAndSaveSupabase} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
                  Supabase Project URL
                </label>
                <Input
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  leftIcon={<IconLink size={14} />}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
                  Supabase Anon / Public API Key
                </label>
                <Input
                  required
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  leftIcon={<IconKey size={14} />}
                />
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-[6px] text-[11px] flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  <IconInfoCircle size={14} className="shrink-0" />
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isTesting}
                >
                  {isTesting ? 'Testing Connection...' : 'Save & Verify Supabase'}
                </Button>
              </div>
            </form>

            {/* 1-Click SQL Helper */}
            <div className="bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] rounded-[8px] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconDatabase size={15} className="text-[#30AFFF]" />
                  <span className="font-bold text-[var(--t-font-color-primary)]">
                    1-Click PostgreSQL Schema
                  </span>
                </div>
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={copiedSql ? <IconCheck size={13} className="text-emerald-400" /> : <IconCopy size={13} />}
                  onClick={handleCopySql}
                >
                  {copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}
                </Button>
              </div>
              <p className="text-[11px] text-[var(--t-font-color-tertiary)]">
                Copy and run this in your Supabase SQL Editor to generate the `leads` & `projects` tables.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
