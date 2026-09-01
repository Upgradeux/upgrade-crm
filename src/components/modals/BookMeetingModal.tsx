'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import {
  IconCalendarEvent,
  IconVideo,
  IconClock,
  IconMail,
  IconBrandGoogle,
  IconSparkles,
  IconRefresh,
} from '@tabler/icons-react';
import { formatDate } from '@/lib/utils';

export function BookMeetingModal() {
  const {
    meetingModalLead,
    setMeetingModalLead,
    updateLead,
    addNote,
    agencyName,
    timezone,
    integrationsConfig,
    addToast,
  } = useCRM();

  const [dateTime, setDateTime] = useState('');
  const [meetLink, setMeetLink] = useState(integrationsConfig.defaultGoogleMeetUrl || 'https://meet.google.com/new');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [sendEmailInvite, setSendEmailInvite] = useState(true);
  const [openGcalTab, setOpenGcalTab] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const durationOptions = [
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '60 min' },
  ];

  const getGoogleCalendarTemplateUrl = () => {
    if (!dateTime || !meetingModalLead) return '';
    try {
      const start = new Date(dateTime);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
      const dates = `${formatGCalDate(start)}/${formatGCalDate(end)}`;
      const title = encodeURIComponent(`Discovery Call: ${meetingModalLead.companyName} x ${agencyName}`);
      const details = encodeURIComponent(
        `Meeting with ${meetingModalLead.contactName || meetingModalLead.companyName} and ${agencyName}.\n\nClient Email: ${meetingModalLead.email || 'N/A'}\nService: ${meetingModalLead.serviceInterest || 'General'}\nMeeting Link: ${meetLink}`
      );
      const add = encodeURIComponent(meetingModalLead.email || '');
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&add=${add}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (meetingModalLead) {
      // Default to tomorrow at 3:00 PM if not specified
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedDefault = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
      
      setDateTime(formattedDefault);
      if (integrationsConfig.defaultGoogleMeetUrl) {
        setMeetLink(integrationsConfig.defaultGoogleMeetUrl);
      }
    }
  }, [meetingModalLead, integrationsConfig.defaultGoogleMeetUrl]);

  if (!meetingModalLead) return null;

  const handleBookMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime) {
      addToast('Please select a valid date and time for the meeting', 'warning');
      return;
    }

    setIsBooking(true);

    try {
      const startDate = new Date(dateTime);
      const [datePart, timePart] = dateTime.split('T');

      // Call serverless Calendar API
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: meetingModalLead.companyName,
          contactName: meetingModalLead.contactName,
          email: meetingModalLead.email,
          date: datePart,
          time: timePart || '15:00',
          serviceInterest: meetingModalLead.serviceInterest,
          agencyName,
          meetUrl: meetLink.trim(),
        }),
      });

      const data = await res.json();
      const finalMeetLink = meetLink.trim() || data.meetUrl;

      if (openGcalTab && data.googleCalendarWebUrl) {
        window.open(data.googleCalendarWebUrl, '_blank');
      }

      const isoDate = startDate.toISOString();
      const now = new Date().toISOString();
      const formattedReadableDate = formatDate(isoDate, timezone);
      const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Automatically send meeting invitation email to client
      if (sendEmailInvite && meetingModalLead.email) {
        const clientName = meetingModalLead.contactName || meetingModalLead.companyName;
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: meetingModalLead.email,
              subject: `Confirmed: Intro Demo & Discovery Call with upgradeUX`,
              text: `Hi ${clientName},\n\nYour discovery demo call with upgradeUX has been confirmed!\n\n📅 Date & Time: ${formattedReadableDate} at ${formattedTime} (${timezone})\n⏱️ Duration: ${durationMinutes} minutes\n🎥 Join Google Meet: ${finalMeetLink}\n\nYou can click the Google Meet link above to join the meeting directly when it starts.\n\nWe look forward to meeting with you!\n\nBest regards,\n${agencyName} Team\nupgradeux.agency@gmail.com`,
              fromName: agencyName,
              replyTo: 'upgradeux.agency@gmail.com',
            }),
          });
        } catch {
          // Logged gracefully
        }
      }

      updateLead(meetingModalLead.id, {
        bookedMeetingDate: isoDate,
        googleMeetLink: finalMeetLink,
        status: 'Booked Call',
        outreachStage: 'Contacted',
        lastContactedAt: now,
      });

      addNote(
        meetingModalLead.id,
        `Scheduled Google Meet for ${formattedReadableDate} (${formattedTime}) with link: ${finalMeetLink}${sendEmailInvite && meetingModalLead.email ? ` (Invited ${meetingModalLead.email})` : ''}`,
        'meeting'
      );

      if (sendEmailInvite && meetingModalLead.email) {
        addToast(`Meeting booked & invite sent to ${meetingModalLead.email}!`, 'success');
      } else {
        addToast(`Meeting booked! Google Meet link: ${finalMeetLink}`, 'success');
      }
      setMeetingModalLead(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to schedule meeting', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(meetingModalLead)}
      onClose={() => setMeetingModalLead(null)}
      title="Book Confirmed Meeting"
      subtitle={`Auto-generate Google Meet link & invite ${meetingModalLead.companyName}`}
      maxWidth="max-w-[430px]"
    >
      <form onSubmit={handleBookMeeting} className="space-y-2.5 text-[11.5px]">
        {/* Compact Recipient Inline Strip */}
        <div className="px-2.5 py-1.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-medium text-[var(--t-font-color-primary)] truncate">
              {meetingModalLead.contactName || meetingModalLead.companyName}
            </span>
            <span className="text-[var(--t-font-color-tertiary)]">•</span>
            <span className="font-mono text-[var(--t-font-color-tertiary)] truncate text-[10.5px]">
              {meetingModalLead.email || 'No email'}
            </span>
          </div>

          <span className="text-[9.5px] px-1.5 py-0.5 rounded-[3px] bg-emerald-500/10 text-emerald-400 font-mono shrink-0">
            Meet
          </span>
        </div>

        {/* Date & Time Picker */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-7 space-y-0.5">
            <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
              Meeting Time ({timezone.split('/')[1] || timezone.split(' ')[0]})
            </label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full h-[26px] px-2 text-[11px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[4px] outline-none text-[var(--t-font-color-primary)] font-mono"
            />
          </div>

          <div className="col-span-5 space-y-0.5">
            <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
              Duration
            </label>
            <Dropdown
              value={String(durationMinutes)}
              onChange={(val) => setDurationMinutes(Number(val))}
              options={durationOptions}
              size="sm"
              buttonClassName="h-[26px] text-[11px] bg-[var(--t-background-secondary)]"
            />
          </div>
        </div>

        {/* Auto-Generated Google Meet Link */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
              Google Meet Room Link
            </label>
            <a
              href={getGoogleCalendarTemplateUrl() || 'https://calendar.google.com'}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <IconBrandGoogle size={11} />
              <span>Launch Google Calendar & Meet</span>
            </a>
          </div>

          <div className="relative">
            <input
              required
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/... or https://meet.google.com/new"
              className="w-full h-[26px] pl-6 pr-2 text-[11px] font-mono bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[4px] outline-none text-[var(--t-font-color-primary)]"
            />
            <IconVideo size={12} className="absolute left-2 top-2 text-emerald-500 pointer-events-none" />
          </div>
          <span className="text-[9.5px] text-[var(--t-font-color-tertiary)] block">
            Tip: Set your permanent Google Meet link once in Settings → Integrations.
          </span>
        </div>

        {/* Toggles & Options */}
        <div className="space-y-1.5 pt-1">
          <label className="flex items-center gap-1.5 text-[10.5px] text-[var(--t-font-color-primary)] font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmailInvite}
              onChange={(e) => setSendEmailInvite(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[var(--t-background-primary)] border-[var(--t-border-color-medium)] accent-[#5d4ef7]"
            />
            <span>
              Send email invite with Google Meet link to{' '}
              <strong className="text-indigo-400 font-mono">{meetingModalLead.email || 'client'}</strong>
            </span>
          </label>

          <label className="flex items-center gap-1.5 text-[10.5px] text-[var(--t-font-color-secondary)] cursor-pointer">
            <input
              type="checkbox"
              checked={openGcalTab}
              onChange={(e) => setOpenGcalTab(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-[var(--t-background-primary)] border-[var(--t-border-color-medium)] accent-[#5d4ef7]"
            />
            <span>Also open Google Calendar event in new tab</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[var(--t-border-color-light)]">
          <button
            type="button"
            onClick={() => setMeetingModalLead(null)}
            className="h-[26px] px-2.5 rounded-[4px] text-[11px] font-medium text-[var(--t-font-color-secondary)] hover:bg-[var(--t-background-secondary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBooking}
            className="h-[26px] px-3 rounded-[4px] bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] hover:opacity-90 disabled:opacity-50 text-[11px] font-medium flex items-center gap-1.5 transition-opacity cursor-pointer shadow-2xs"
          >
            <IconCalendarEvent size={12} />
            <span>{isBooking ? 'Booking...' : 'Book Meeting'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
