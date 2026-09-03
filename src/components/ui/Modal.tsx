'use client';

import React, { useEffect } from 'react';
import { IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  overflowVisible?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-[540px]',
  overflowVisible = false,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full max-w-[95vw] bg-[var(--t-background-primary)] border border-[var(--t-border-color-medium)] rounded-[12px] shadow-2xl z-10 animate-fade-in max-h-[92dvh] flex flex-col',
          overflowVisible ? 'overflow-visible' : 'overflow-hidden',
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--t-border-color-light)]">
          <div>
            <h3 className="text-[14px] font-semibold text-[var(--t-font-color-primary)]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-[var(--t-font-color-secondary)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-[24px] h-[24px] flex items-center justify-center rounded-[4px] text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer"
          >
            <IconX size={15} />
          </button>
        </div>

        {/* Body */}
        <div className={cn('p-4 max-h-[calc(90vh-110px)]', overflowVisible ? 'overflow-visible' : 'overflow-y-auto')}>
          {children}
        </div>
      </div>
    </div>
  );
}
