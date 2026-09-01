'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { IconAlertTriangle, IconTrash, IconInfoCircle } from '@tabler/icons-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-[420px]"
    >
      <div className="space-y-4 text-[12px]">
        <div className="flex items-start gap-3 p-3 rounded-[8px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)]">
          <div
            className={`w-[28px] h-[28px] rounded-[6px] flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : variant === 'warning'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}
          >
            {variant === 'danger' ? (
              <IconTrash size={14} />
            ) : variant === 'warning' ? (
              <IconAlertTriangle size={14} />
            ) : (
              <IconInfoCircle size={14} />
            )}
          </div>
          <p className="text-[12px] text-[var(--t-font-color-secondary)] leading-relaxed pt-0.5">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--t-border-color-light)]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
