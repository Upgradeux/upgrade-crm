'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { IconBrandInstagram, IconSend, IconCopy, IconExternalLink } from '@tabler/icons-react';

export function InstagramDMModal() {
  const {
    instagramDMLeadModal,
    setInstagramDMLeadModal,
    updateLead,
    addNote,
    agencyName,
    addToast,
  } = useCRM();

  const [message, setMessage] = useState('');
  const [handle, setHandle] = useState('');

  useEffect(() => {
    if (instagramDMLeadModal) {
      const recipient = instagramDMLeadModal.contactName || instagramDMLeadModal.companyName;
      const sender = instagramDMLeadModal.leadOwner || agencyName;
      const service = instagramDMLeadModal.serviceInterest || 'AI automation and web solutions';

      // Clean handle
      const rawInsta = instagramDMLeadModal.socials?.instagram || '';
      let clean = rawInsta.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '').replace(/^@/, '');
      setHandle(clean);

      setMessage(
        `Hey ${recipient}! 👋\n\nCame across ${instagramDMLeadModal.companyName} on Instagram and love what you're building.\n\nWe build custom ${service} for brands in your space to streamline customer bookings and automate lead capture.\n\nWould you be open to checking out a 60-second Loom demo tailored for ${instagramDMLeadModal.companyName}?`
      );
    }
  }, [instagramDMLeadModal, agencyName]);

  if (!instagramDMLeadModal) return null;

  const handleSendInstagramDM = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanHandle = handle.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
    
    if (!cleanHandle) {
      addToast('Please enter an Instagram handle to message', 'warning');
      return;
    }

    // Copy message to clipboard for easy pasting in Instagram DM
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message);
    }

    // Open Instagram Direct Message link
    // ig.me/m/username opens the direct conversation on both Web and Mobile app
    const dmUrl = `https://ig.me/m/${cleanHandle}`;
    window.open(dmUrl, '_blank');

    const now = new Date().toISOString();
    addNote(
      instagramDMLeadModal.id,
      `Instagram DM sent to @${cleanHandle}: "${message.substring(0, 90)}${message.length > 90 ? '...' : ''}"`,
      'note'
    );

    updateLead(instagramDMLeadModal.id, {
      lastContactedAt: now,
      status: instagramDMLeadModal.status === 'Not Contacted' ? 'Contacted' : instagramDMLeadModal.status,
      outreachStage: 'Contacted',
      socials: {
        ...instagramDMLeadModal.socials,
        instagram: `https://instagram.com/${cleanHandle}`,
      },
    });

    addToast(`Pitch copied! Opening Instagram DM for @${cleanHandle}`, 'success');
    setInstagramDMLeadModal(null);
  };

  return (
    <Modal
      isOpen={Boolean(instagramDMLeadModal)}
      onClose={() => setInstagramDMLeadModal(null)}
      title="Send Instagram Direct Message"
      subtitle={`Outreach message for ${instagramDMLeadModal.companyName}`}
      maxWidth="max-w-[430px]"
    >
      <form onSubmit={handleSendInstagramDM} className="space-y-2.5 text-[11.5px]">
        {/* Recipient Strip */}
        <div className="px-2.5 py-1.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
            <span className="font-medium text-[var(--t-font-color-primary)] truncate">
              {instagramDMLeadModal.contactName || instagramDMLeadModal.companyName}
            </span>
            <span className="text-[var(--t-font-color-tertiary)]">•</span>
            <span className="font-mono text-pink-500 truncate text-[10.5px]">
              {handle ? `@${handle.replace(/^@/, '')}` : 'No handle set'}
            </span>
          </div>

          <span className="text-[9.5px] px-1.5 py-0.5 rounded-[3px] bg-pink-500/10 text-pink-500 font-mono shrink-0">
            Instagram DM
          </span>
        </div>

        {/* Handle Input (if needed to adjust or add) */}
        <div className="space-y-0.5">
          <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
            Instagram Username / Handle
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--t-font-color-tertiary)] font-mono text-[11px]">
              @
            </span>
            <input
              type="text"
              required
              value={handle.replace(/^@/, '')}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="brandusername"
              className="w-full h-[26px] pl-6 pr-2 text-[11.5px] font-mono bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[4px] outline-none text-[var(--t-font-color-primary)] font-sans"
            />
          </div>
        </div>

        {/* Message Editor */}
        <div className="space-y-0.5">
          <label className="text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block">
            Instagram Outreach Pitch
          </label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your Instagram outreach pitch..."
            className="w-full p-2 text-[11.5px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] focus:border-[var(--t-border-color-focus)] rounded-[4px] outline-none text-[var(--t-font-color-primary)] resize-none leading-relaxed font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[var(--t-border-color-light)]">
          <button
            type="button"
            onClick={() => setInstagramDMLeadModal(null)}
            className="h-[26px] px-2.5 rounded-[4px] text-[11px] font-medium text-[var(--t-font-color-secondary)] hover:bg-[var(--t-background-secondary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-[26px] px-3 rounded-[4px] bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <IconBrandInstagram size={13} />
            <span>Copy & Open DM</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
