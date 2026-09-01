'use client';

import React from 'react';
import { useCRM } from '@/lib/store';
import { IconCheck, IconInfoCircle, IconAlertTriangle, IconAlertCircle, IconX } from '@tabler/icons-react';

export function ToastContainer() {
  const { toasts, removeToast } = useCRM();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[360px] w-full">
      {toasts.map((toast) => {
        let icon = <IconInfoCircle size={15} className="text-sky-500 shrink-0" />;
        let borderColor = 'border-[var(--t-border-color-medium)]';

        if (toast.type === 'success') {
          icon = <IconCheck size={15} className="text-emerald-500 shrink-0" />;
          borderColor = 'border-emerald-500/30';
        } else if (toast.type === 'warning') {
          icon = <IconAlertTriangle size={15} className="text-amber-500 shrink-0" />;
          borderColor = 'border-amber-500/30';
        } else if (toast.type === 'error') {
          icon = <IconAlertCircle size={15} className="text-rose-500 shrink-0" />;
          borderColor = 'border-rose-500/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 px-3 py-2.5 bg-[var(--t-background-secondary)] border ${borderColor} rounded-[8px] shadow-lg animate-fade-in text-[12px] text-[var(--t-font-color-primary)]`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {icon}
              <span className="truncate leading-tight font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] p-0.5 rounded-[4px] hover:bg-[var(--t-background-transparent-light)] transition-colors shrink-0"
            >
              <IconX size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
