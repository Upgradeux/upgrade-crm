'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '@/lib/store';
import { ActivityStatusPreset, TeamMember } from '@/types/crm';
import {
  IconPhoneCall,
  IconMessageDots,
  IconUsers,
  IconSearch,
  IconBrandInstagram,
  IconCode,
  IconPalette,
  IconToolsKitchen2,
  IconMoon,
  IconCircleCheck,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconBrandWhatsapp,
  IconPhone,
  IconNotes,
  IconSparkles,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';

export const STATUS_ICON_MAP: Record<string, React.ReactNode> = {
  'Calling Clients': <IconPhoneCall size={13} className="text-amber-400" />,
  'Messaging Clients': <IconMessageDots size={13} className="text-sky-400" />,
  'In Meeting': <IconUsers size={13} className="text-emerald-400" />,
  'Finding Leads': <IconSearch size={13} className="text-indigo-400" />,
  'Working on Social Media': <IconBrandInstagram size={13} className="text-pink-400" />,
  'In Dev Mode': <IconCode size={13} className="text-cyan-400" />,
  'In Design Mode': <IconPalette size={13} className="text-purple-400" />,
  'Eating': <IconToolsKitchen2 size={13} className="text-orange-400" />,
  'Sleeping': <IconMoon size={13} className="text-slate-400" />,
  'Available / Online': <IconCircleCheck size={13} className="text-emerald-400" />,
  phone: <IconPhoneCall size={13} className="text-amber-400" />,
  message: <IconMessageDots size={13} className="text-sky-400" />,
  meeting: <IconUsers size={13} className="text-emerald-400" />,
  search: <IconSearch size={13} className="text-indigo-400" />,
  social: <IconBrandInstagram size={13} className="text-pink-400" />,
  code: <IconCode size={13} className="text-cyan-400" />,
  palette: <IconPalette size={13} className="text-purple-400" />,
  food: <IconToolsKitchen2 size={13} className="text-orange-400" />,
  moon: <IconMoon size={13} className="text-slate-400" />,
  check: <IconCircleCheck size={13} className="text-emerald-400" />,
  sparkles: <IconSparkles size={13} className="text-purple-400" />,
};

export const PRESET_OPTIONS: { label: ActivityStatusPreset; iconKey: string; icon: React.ReactNode }[] = [
  { label: 'Calling Clients', iconKey: 'phone', icon: <IconPhoneCall size={13} className="text-amber-400" /> },
  { label: 'Messaging Clients', iconKey: 'message', icon: <IconMessageDots size={13} className="text-sky-400" /> },
  { label: 'In Meeting', iconKey: 'meeting', icon: <IconUsers size={13} className="text-emerald-400" /> },
  { label: 'Finding Leads', iconKey: 'search', icon: <IconSearch size={13} className="text-indigo-400" /> },
  { label: 'Working on Social Media', iconKey: 'social', icon: <IconBrandInstagram size={13} className="text-pink-400" /> },
  { label: 'In Dev Mode', iconKey: 'code', icon: <IconCode size={13} className="text-cyan-400" /> },
  { label: 'In Design Mode', iconKey: 'palette', icon: <IconPalette size={13} className="text-purple-400" /> },
  { label: 'Eating', iconKey: 'food', icon: <IconToolsKitchen2 size={13} className="text-orange-400" /> },
  { label: 'Sleeping', iconKey: 'moon', icon: <IconMoon size={13} className="text-slate-400" /> },
  { label: 'Available / Online', iconKey: 'check', icon: <IconCircleCheck size={13} className="text-emerald-400" /> },
];

export function getStatusIcon(statusText?: string, iconKey?: string) {
  if (iconKey && STATUS_ICON_MAP[iconKey]) {
    return STATUS_ICON_MAP[iconKey];
  }
  if (statusText && STATUS_ICON_MAP[statusText]) {
    return STATUS_ICON_MAP[statusText];
  }
  return <IconCircleCheck size={13} className="text-emerald-400" />;
}

export function LiveTeamPresenceWidget() {
  const {
    teamMembers,
    activeMemberId,
    teamPresence,
    setMyActivityStatus,
  } = useCRM();

  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentMember = teamMembers.find((m) => m.id === activeMemberId) || teamMembers[0];
  const teammate = teamMembers.find((m) => m.id !== currentMember?.id) || teamMembers[1];

  const getMemberPresence = (member?: TeamMember) => {
    if (!member) {
      return {
        isOnline: false,
        timeAgoText: 'Offline',
        dotClass: 'bg-slate-500',
        displayStatus: 'Offline',
        chosenStatus: 'Available / Online',
        iconKey: 'check',
        icon: <IconMoon size={13} className="text-slate-400" />,
        note: '',
      };
    }

    const p = teamPresence[member.id];
    const lastActiveIso = p?.lastActiveAt || member.lastActiveAt || member.joinedAt;

    let isOnline = false;
    let timeAgoText = 'Offline';
    let dotClass = 'bg-slate-500';

    if (lastActiveIso) {
      const diffMs = Date.now() - new Date(lastActiveIso).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);

      // Online threshold: active within last 5 minutes
      if (diffMin <= 5) {
        isOnline = true;
        if (diffMin < 2) {
          timeAgoText = 'Online now';
          dotClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse';
        } else {
          timeAgoText = `${diffMin}m ago`;
          dotClass = 'bg-amber-400';
        }
      } else if (diffHours < 24) {
        timeAgoText = diffHours > 0 ? `${diffHours}h ago` : `${diffMin}m ago`;
        dotClass = 'bg-slate-500';
      } else {
        timeAgoText = 'Offline';
        dotClass = 'bg-slate-600';
      }
    }

    const chosenStatus = p?.activityStatus || member.activityStatus || 'Available / Online';
    const iconKey = p?.activityIcon || member.activityIcon || 'check';
    const note = p?.statusNote || member.statusNote || '';

    // If offline (>5 min), DO NOT show active status like Calling Clients; show "Offline"
    const displayStatus = isOnline ? chosenStatus : 'Offline';
    const icon = isOnline ? getStatusIcon(chosenStatus, iconKey) : <IconMoon size={13} className="text-slate-400" />;

    return { isOnline, timeAgoText, dotClass, displayStatus, chosenStatus, iconKey, icon, note };
  };

  const myPres = getMemberPresence(currentMember);
  const teammatePres = getMemberPresence(teammate);

  const handleSelectPreset = (preset: typeof PRESET_OPTIONS[0]) => {
    setMyActivityStatus(preset.label, preset.iconKey, personalNote || myPres.note);
    setIsCustomMode(false);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setMyActivityStatus(customText.trim(), 'sparkles', personalNote || myPres.note);
    setCustomText('');
    setIsCustomMode(false);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    setMyActivityStatus(myPres.chosenStatus, myPres.iconKey, personalNote);
  };

  return (
    <div
      className="fixed bottom-[68px] right-3 md:bottom-4 md:right-4 z-40 select-none flex flex-col items-end font-sans"
      ref={popoverRef}
    >
      {/* Twenty Style Compact Bottom-Right Floating Pill */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 rounded-[20px] bg-[var(--t-background-secondary)]/95 hover:bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] shadow-lg hover:shadow-xl backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all duration-150 hover:scale-[1.01] text-[11.5px]"
      >
        {/* Teammate Section Only */}
        {teammate && (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={teammate.avatarUrl || (teammate.name === 'Swapnil' ? '/status/swapnil.jpeg' : '/status/suraj.png')}
                alt={teammate.name}
                className="w-5 h-5 rounded-full object-cover border border-[var(--t-border-color-light)]"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--t-background-secondary)] ${teammatePres.dotClass}`}
              />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-[var(--t-font-color-primary)]">
                {teammate.name}
              </span>
              <div className="flex items-center gap-1 text-[var(--t-font-color-secondary)]">
                {teammatePres.icon}
                <span className="text-[11px] text-[var(--t-font-color-secondary)] max-w-[130px] truncate font-medium">
                  {teammatePres.isOnline ? teammatePres.displayStatus : `Offline (${teammatePres.timeAgoText})`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="text-[var(--t-font-color-tertiary)] pl-0.5 shrink-0">
          {isOpen ? <IconChevronDown size={12} /> : <IconChevronUp size={12} />}
        </div>
      </div>

      {/* Twenty CRM Ultra-Clean Presence Sheet */}
      {isOpen && (
        <div className="w-[330px] sm:w-[350px] mb-2 rounded-[10px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-medium)] shadow-2xl overflow-hidden flex flex-col divide-y divide-[var(--t-border-color-light)] animate-fade-in text-[12px]">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-[var(--t-background-secondary)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="text-[11.5px] font-semibold text-[var(--t-font-color-primary)]">
                Team Live Presence
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer"
            >
              <IconX size={13} />
            </button>
          </div>

          {/* Teammate Live Card (View-Only) */}
          {teammate && (
            <div className="p-3 bg-[var(--t-background-secondary)]/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                  Teammate Status
                </span>
                <span className="text-[10px] text-[var(--t-font-color-tertiary)] font-mono">
                  {teammatePres.timeAgoText}
                </span>
              </div>

              <div className="p-2.5 rounded-[8px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={teammate.avatarUrl || (teammate.name === 'Swapnil' ? '/status/swapnil.jpeg' : '/status/suraj.png')}
                        alt={teammate.name}
                        className="w-8 h-8 rounded-full object-cover border border-[var(--t-border-color-light)]"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--t-background-primary)] ${teammatePres.dotClass}`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-semibold text-[var(--t-font-color-primary)]">
                          {teammate.name}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              teammatePres.isOnline
                                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'
                                : 'bg-slate-500'
                            }`}
                          />
                          <span
                            className={
                              teammatePres.isOnline
                                ? 'text-emerald-400 font-medium'
                                : 'text-[var(--t-font-color-tertiary)]'
                            }
                          >
                            {teammatePres.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[var(--t-font-color-secondary)] mt-0.5">
                        {teammatePres.icon}
                        <span className="font-medium text-[var(--t-font-color-primary)] truncate">
                          {teammatePres.isOnline ? teammatePres.displayStatus : `Offline (${teammatePres.timeAgoText})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Call & WhatsApp Shortcuts */}
                  <div className="flex items-center gap-1 shrink-0">
                    {teammate.phone && (
                      <>
                        <a
                          href={`tel:${teammate.phone}`}
                          className="w-6 h-6 rounded-[5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-transparent-light)] text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] border border-[var(--t-border-color-light)] flex items-center justify-center transition-colors"
                          title={`Call ${teammate.name} (${teammate.phone})`}
                        >
                          <IconPhone size={12} />
                        </a>
                        <a
                          href={`https://wa.me/${teammate.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-6 h-6 rounded-[5px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 flex items-center justify-center transition-colors"
                          title={`WhatsApp ${teammate.name}`}
                        >
                          <IconBrandWhatsapp size={12} />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Teammate Note / Task details */}
                {teammatePres.note ? (
                  <div className="px-2 py-1.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] text-[11px] text-[var(--t-font-color-secondary)] flex items-start gap-1.5">
                    <IconNotes size={12} className="text-[var(--t-font-color-tertiary)] shrink-0 mt-0.5" />
                    <span className="leading-snug">{teammatePres.note}</span>
                  </div>
                ) : (
                  <div className="text-[10.5px] text-[var(--t-font-color-tertiary)] italic pl-0.5">
                    No active note attached
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Your Activity Section (Editable by You) */}
          <div className="p-3 bg-[var(--t-background-primary)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                  Your Status ({currentMember?.name})
                </span>
                <div className="flex items-center gap-1 text-[9.5px] font-mono">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      myPres.isOnline
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span
                    className={
                      myPres.isOnline
                        ? 'text-emerald-400 font-medium'
                        : 'text-[var(--t-font-color-tertiary)]'
                    }
                  >
                    {myPres.isOnline ? 'Online' : 'Active'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-[10.5px] text-[#5d4ef7] hover:underline cursor-pointer"
              >
                {isCustomMode ? 'Presets' : '+ Custom Status'}
              </button>
            </div>

            {/* Presets Grid */}
            {!isCustomMode ? (
              <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-0.5">
                {PRESET_OPTIONS.map((p) => {
                  const isCurrent = myPres.chosenStatus === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`px-2 py-1.5 rounded-[6px] text-left text-[11px] font-medium border flex items-center gap-1.5 transition-all cursor-pointer truncate ${
                        isCurrent
                          ? 'bg-[#5d4ef7]/15 border-[#5d4ef7]/50 text-[#5d4ef7] font-semibold'
                          : 'bg-[var(--t-background-secondary)] border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:border-[var(--t-border-color-medium)]'
                      }`}
                    >
                      <div className="shrink-0">{p.icon}</div>
                      <span className="truncate">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleSaveCustom} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Designing salon landing page..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="flex-1 h-[28px] px-2 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] text-[11.5px] text-[var(--t-font-color-primary)] outline-none focus:border-[#5d4ef7]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="h-[28px] px-2.5 rounded-[5px] text-[10.5px] font-semibold bg-[#5d4ef7] text-white hover:bg-[#4d3ef0] transition-colors cursor-pointer shrink-0"
                  >
                    Set
                  </button>
                </div>
              </form>
            )}

            {/* Personal Status Note (What you're currently working on) */}
            <form onSubmit={handleSaveNote} className="space-y-1.5 pt-1 border-t border-[var(--t-border-color-light)]">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
                  Your Current Note / Details
                </label>
                {myPres.note && (
                  <span className="text-[9.5px] text-emerald-400 flex items-center gap-0.5">
                    <IconCheck size={10} /> Synced
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder={myPres.note || "Add note for your teammate (e.g. 'Calling 15 clinic leads')..."}
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  className="flex-1 h-[26px] px-2 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] text-[11px] text-[var(--t-font-color-primary)] outline-none focus:border-[#5d4ef7] placeholder-[var(--t-font-color-tertiary)]"
                />
                <button
                  type="submit"
                  className="h-[26px] px-2 rounded-[5px] text-[10px] font-medium bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] text-[var(--t-font-color-primary)] transition-colors cursor-pointer shrink-0"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
