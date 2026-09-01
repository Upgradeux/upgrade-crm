'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconMail, IconSend, IconUser, IconBuilding } from '@tabler/icons-react';

export function EmailComposerModal() {
  const {
    emailComposerLeadModal,
    setEmailComposerLeadModal,
    updateLead,
    addNote,
    agencyName,
    agencyEmail,
    addToast,
  } = useCRM();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (emailComposerLeadModal) {
      const recipient = emailComposerLeadModal.contactName || emailComposerLeadModal.companyName;
      const sender = emailComposerLeadModal.leadOwner || agencyName;
      const service = emailComposerLeadModal.serviceInterest || 'AI & web development automation';

      setSubject(`Following up: ${service} for ${emailComposerLeadModal.companyName}`);
      setBody(
        `Hi ${recipient},\n\nI wanted to follow up on our recent discussion regarding custom ${service} for ${emailComposerLeadModal.companyName}.\n\nWe help businesses automate client intake, customer calls, and backend workflows with custom AI voice and web systems.\n\nWould you be open to a quick 15-minute intro demo this week?\n\nBest regards,\n${sender}\n${agencyName}\n${agencyEmail}`
      );
    }
  }, [emailComposerLeadModal, agencyName, agencyEmail]);

  if (!emailComposerLeadModal) return null;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailComposerLeadModal.email) {
      addToast('Lead has no valid email address recorded', 'warning');
      return;
    }

    setIsSending(true);

    try {
      // Call serverless Next.js email API route
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailComposerLeadModal.email,
          subject,
          text: body,
          fromName: agencyName,
          replyTo: agencyEmail,
        }),
      });

      const data = await res.json();

      const now = new Date().toISOString();
      addNote(
        emailComposerLeadModal.id,
        `Sent Email [Subject: ${subject}]: "${body.substring(0, 100)}${body.length > 100 ? '...' : ''}"`,
        'email'
      );

      updateLead(emailComposerLeadModal.id, {
        lastContactedAt: now,
        status: emailComposerLeadModal.status === 'Not Contacted' ? 'Contacted' : emailComposerLeadModal.status,
        outreachStage: 'Contacted',
      });

      if (data.provider === 'resend') {
        addToast(`Email delivered via Resend to ${emailComposerLeadModal.email}`, 'success');
      } else {
        addToast(`Email logged & dispatched to ${emailComposerLeadModal.email}`, 'success');
      }

      setEmailComposerLeadModal(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to dispatch email', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(emailComposerLeadModal)}
      onClose={() => setEmailComposerLeadModal(null)}
      title="Send Direct Email"
      subtitle={`Send email from your inbox to ${emailComposerLeadModal.companyName}`}
      maxWidth="max-w-[440px]"
    >
      <form onSubmit={handleSendEmail} className="space-y-2.5 text-[11.5px]">
        {/* Compact Recipient Inline Strip */}
        <div className="px-2.5 py-1.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <span className="font-medium text-[var(--t-font-color-primary)] truncate">
              {emailComposerLeadModal.contactName || emailComposerLeadModal.companyName}
            </span>
            <span className="text-[var(--t-font-color-tertiary)]">•</span>
            <span className="font-mono text-[var(--t-font-color-tertiary)] truncate text-[10.5px]">
              {emailComposerLeadModal.email || 'No email address'}
            </span>
          </div>

          <span className="text-[9.5px] px-1.5 py-0.5 rounded-[3px] bg-blue-500/10 text-blue-400 font-mono shrink-0">
            Inbox
          </span>
        </div>

        {/* Subject Input */}
        <div className="space-y-0.5">
          <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
            Subject Line
          </label>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email Subject..."
            className="w-full h-[26px] px-2 text-[11.5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[4px] outline-none text-[var(--t-font-color-primary)] font-medium"
          />
        </div>

        {/* Message Editor */}
        <div className="space-y-0.5">
          <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
            Message Body
          </label>
          <textarea
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your email message..."
            className="w-full p-2 text-[11.5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[4px] outline-none text-[var(--t-font-color-primary)] resize-none leading-relaxed font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[var(--t-border-color-light)]">
          <button
            type="button"
            onClick={() => setEmailComposerLeadModal(null)}
            className="h-[26px] px-2.5 rounded-[4px] text-[11px] font-medium text-[var(--t-font-color-secondary)] hover:bg-[var(--t-background-secondary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSending}
            className="h-[26px] px-3 rounded-[4px] bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] hover:opacity-90 disabled:opacity-50 text-[11px] font-medium flex items-center gap-1.5 transition-opacity cursor-pointer shadow-2xs"
          >
            <IconSend size={12} />
            <span>{isSending ? 'Dispatching...' : 'Send Email'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
