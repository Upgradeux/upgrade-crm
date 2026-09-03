'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { FollowUpChannel } from '@/types/crm';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  IconBrandWhatsapp,
  IconMail,
  IconBrandInstagram,
  IconBell,
  IconCalendar,
  IconClock,
  IconCheck,
  IconX,
} from '@tabler/icons-react';

export function ScheduleFollowUpModal() {
  const {
    followUpModalLead,
    setFollowUpModalLead,
    scheduleFollowUp,
  } = useCRM();

  const [channel, setChannel] = useState<FollowUpChannel>('whatsapp');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('09:00');
  const [note, setNote] = useState<string>('');

  // Default date to tomorrow at 09:00
  useEffect(() => {
    if (followUpModalLead) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setScheduledDate(`${yyyy}-${mm}-${dd}`);
      setScheduledTime('09:00');
      setNote('');

      // If lead has active follow up, pre-populate
      if (followUpModalLead.activeFollowUp) {
        setChannel(followUpModalLead.activeFollowUp.channel);
        try {
          const d = new Date(followUpModalLead.activeFollowUp.scheduledDate);
          setScheduledDate(d.toISOString().split('T')[0]);
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          setScheduledTime(`${hh}:${min}`);
        } catch {}
        if (followUpModalLead.activeFollowUp.note) {
          setNote(followUpModalLead.activeFollowUp.note);
        }
      } else {
        // Auto pick client channel based on available info
        if (followUpModalLead.phone) setChannel('whatsapp');
        else if (followUpModalLead.email) setChannel('email');
        else if (followUpModalLead.socials?.instagram) setChannel('instagram');
        else setChannel('whatsapp');
      }
    }
  }, [followUpModalLead]);

  if (!followUpModalLead) return null;

  const handlePreset = (daysFromNow: number, hour = 9) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setScheduledDate(`${yyyy}-${mm}-${dd}`);
    setScheduledTime(`${String(hour).padStart(2, '0')}:00`);
  };

  const handleNextMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
    d.setDate(diff);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setScheduledDate(`${yyyy}-${mm}-${dd}`);
    setScheduledTime('09:00');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) return;

    const fullIso = new Date(`${scheduledDate}T${scheduledTime || '09:00'}:00`).toISOString();
    scheduleFollowUp(followUpModalLead.id, channel, fullIso, note);
    setFollowUpModalLead(null);
  };

  const channels: Array<{
    id: FollowUpChannel;
    label: string;
    icon: React.ReactNode;
    colorClass: string;
    activeBorder: string;
    targetVal?: string;
  }> = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <IconBrandWhatsapp size={14} className="text-emerald-500" />,
      colorClass: 'text-emerald-400 bg-emerald-500/10',
      activeBorder: 'border-emerald-500/50 bg-emerald-500/10',
      targetVal: followUpModalLead.phone || followUpModalLead.alternatePhone || 'No phone set',
    },
    {
      id: 'email',
      label: 'Email',
      icon: <IconMail size={14} className="text-indigo-400" />,
      colorClass: 'text-indigo-400 bg-indigo-500/10',
      activeBorder: 'border-indigo-500/50 bg-indigo-500/10',
      targetVal: followUpModalLead.email || 'No email set',
    },
    {
      id: 'instagram',
      label: 'Instagram DM',
      icon: <IconBrandInstagram size={14} className="text-pink-400" />,
      colorClass: 'text-pink-400 bg-pink-500/10',
      activeBorder: 'border-pink-500/50 bg-pink-500/10',
      targetVal: followUpModalLead.socials?.instagram || 'No handle set',
    },
  ];

  return (
    <Modal
      isOpen={Boolean(followUpModalLead)}
      onClose={() => setFollowUpModalLead(null)}
      title="Schedule Follow-Up"
      subtitle={`Set follow-up reminder for ${followUpModalLead.companyName}`}
      maxWidth="max-w-[480px]"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 select-none">
        {/* Channel Selector */}
        <div>
          <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1.5">
            Follow-Up Channel
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {channels.map((c) => {
              const isSelected = channel === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannel(c.id)}
                  className={`p-2 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    isSelected
                      ? c.activeBorder + ' shadow-2xs font-semibold'
                      : 'bg-[var(--t-background-primary)] border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {c.icon}
                      <span className="text-[11px] text-[var(--t-font-color-primary)] font-medium">
                        {c.label}
                      </span>
                    </div>
                    {isSelected && <IconCheck size={12} className="text-[#5d4ef7] shrink-0" />}
                  </div>
                  <span className="text-[9.5px] font-mono text-[var(--t-font-color-tertiary)] truncate block">
                    {c.targetVal}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Timing Presets */}
        <div>
          <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
            Quick Timing Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { label: 'Tomorrow 9 AM', onClick: () => handlePreset(1, 9) },
              { label: 'In 2 Days', onClick: () => handlePreset(2, 9) },
              { label: 'In 3 Days', onClick: () => handlePreset(3, 9) },
              { label: 'Next Monday', onClick: handleNextMonday },
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={p.onClick}
                className="h-[24px] px-2 rounded-[4px] bg-[var(--t-background-primary)] hover:bg-[var(--t-background-secondary)] text-[10.5px] text-[var(--t-font-color-secondary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] transition-colors cursor-pointer text-center truncate"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date & Time Picker */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Date
            </label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              leftIcon={<IconCalendar size={13} className="text-[var(--t-font-color-tertiary)]" />}
              className="h-[28px] text-[11.5px] font-mono"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Time
            </label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              leftIcon={<IconClock size={13} className="text-[var(--t-font-color-tertiary)]" />}
              className="h-[28px] text-[11.5px] font-mono"
              required
            />
          </div>
        </div>

        {/* Note / Follow-up instructions */}
        <div>
          <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
            Follow-Up Note / Pitch Description <span className="text-[10px] text-[var(--t-font-color-tertiary)]">(Optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Ask if they reviewed the AI Voice Agent audio sample, or send revised proposal..."
            rows={2}
            className="w-full p-2 text-[11.5px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[6px] outline-none text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)] resize-none"
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--t-border-color-light)]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setFollowUpModalLead(null)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={<IconCheck size={13} />}
          >
            Schedule Follow-Up
          </Button>
        </div>
      </form>
    </Modal>
  );
}
