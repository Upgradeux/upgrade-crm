'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { IconBrandWhatsapp, IconSend, IconPhone, IconUser, IconBuilding } from '@tabler/icons-react';

export function WhatsAppModal() {
  const {
    whatsAppLeadModal,
    setWhatsAppLeadModal,
    updateLead,
    addNote,
    agencyName,
    addToast,
  } = useCRM();

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (whatsAppLeadModal) {
      const recipient = whatsAppLeadModal.contactName || whatsAppLeadModal.companyName;
      const sender = whatsAppLeadModal.leadOwner || agencyName;
      const service = whatsAppLeadModal.serviceInterest || 'AI automation and web solutions';

      setMessage(
        `Hi ${recipient},\n\nThis is ${sender} from ${agencyName}. Following up regarding custom ${service} for ${whatsAppLeadModal.companyName}.\n\nWould you have 10 minutes this week for a quick walkthrough?`
      );
    }
  }, [whatsAppLeadModal, agencyName]);

  if (!whatsAppLeadModal) return null;

  const cleanPhone = whatsAppLeadModal.phone
    ? whatsAppLeadModal.phone.replace(/[^\d+]/g, '').replace(/^0+/, '')
    : '';

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanPhone) {
      addToast('Lead has no valid phone number recorded', 'warning');
      return;
    }

    const formattedNumber = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone;
    const url = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp in new tab
    window.open(url, '_blank');

    const now = new Date().toISOString();
    addNote(
      whatsAppLeadModal.id,
      `WhatsApp message sent: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
      'note'
    );

    updateLead(whatsAppLeadModal.id, {
      lastContactedAt: now,
      status: whatsAppLeadModal.status === 'Not Contacted' ? 'Contacted' : whatsAppLeadModal.status,
      outreachStage: 'Contacted',
    });

    addToast(`WhatsApp conversation launched for ${whatsAppLeadModal.companyName}`, 'success');
    setWhatsAppLeadModal(null);
  };

  return (
    <Modal
      isOpen={Boolean(whatsAppLeadModal)}
      onClose={() => setWhatsAppLeadModal(null)}
      title="Send WhatsApp Follow-Up"
      subtitle={`Compose message for ${whatsAppLeadModal.companyName}`}
      maxWidth="max-w-[430px]"
    >
      <form onSubmit={handleSendWhatsApp} className="space-y-2.5 text-[11.5px]">
        {/* Compact Recipient Inline Strip */}
        <div className="px-2.5 py-1.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-medium text-[var(--t-font-color-primary)] truncate">
              {whatsAppLeadModal.contactName || whatsAppLeadModal.companyName}
            </span>
            <span className="text-[var(--t-font-color-tertiary)]">•</span>
            <span className="font-mono text-[var(--t-font-color-tertiary)] truncate text-[10.5px]">
              {whatsAppLeadModal.phone || 'No phone number'}
            </span>
          </div>

          <span className="text-[9.5px] px-1.5 py-0.5 rounded-[3px] bg-emerald-500/10 text-emerald-400 font-mono shrink-0">
            WhatsApp
          </span>
        </div>

        {/* Message Editor */}
        <div className="space-y-0.5">
          <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
            Follow-Up Message
          </label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your WhatsApp follow-up message..."
            className="w-full p-2 text-[11.5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[4px] outline-none text-[var(--t-font-color-primary)] resize-none leading-relaxed font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[var(--t-border-color-light)]">
          <button
            type="button"
            onClick={() => setWhatsAppLeadModal(null)}
            className="h-[26px] px-2.5 rounded-[4px] text-[11px] font-medium text-[var(--t-font-color-secondary)] hover:bg-[var(--t-background-secondary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-[26px] px-3 rounded-[4px] bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] hover:opacity-90 text-[11px] font-medium flex items-center gap-1.5 transition-opacity cursor-pointer shadow-2xs"
          >
            <IconBrandWhatsapp size={12} />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
