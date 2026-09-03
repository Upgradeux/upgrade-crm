'use client';

import React from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
}

export interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: (DropdownOption | string)[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  renderTrigger?: (selectedOption: DropdownOption | undefined, isOpen: boolean) => React.ReactNode;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  size = 'sm',
  disabled = false,
  leftIcon,
}: DropdownProps) {
  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const isSmall = size === 'sm';

  return (
    <div className={cn('relative inline-flex items-center w-full select-none', className)}>
      {leftIcon && (
        <span className="absolute left-2 text-[var(--t-font-color-tertiary)] pointer-events-none z-10">
          {leftIcon}
        </span>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-[5px] transition-all cursor-pointer font-sans appearance-none outline-none truncate',
          'bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)]',
          'text-[var(--t-font-color-primary)] focus:border-[var(--t-border-color-focus)] focus:ring-1 focus:ring-[var(--t-border-color-focus)]/20',
          disabled && 'opacity-50 cursor-not-allowed',
          leftIcon ? (isSmall ? 'pl-6 pr-6' : 'pl-7 pr-7') : (isSmall ? 'pl-2 pr-6' : 'pl-2.5 pr-7'),
          isSmall ? 'h-[26px] text-[11.5px]' : 'h-[32px] text-[12.5px]',
          buttonClassName
        )}
      >
        {placeholder && !value && (
          <option value="" disabled className="bg-[var(--t-background-secondary)] text-[var(--t-font-color-tertiary)]">
            {placeholder}
          </option>
        )}
        {normalizedOptions.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] py-1.5 text-[12px]"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <IconChevronDown
        size={isSmall ? 12 : 14}
        className="absolute right-2 text-[var(--t-font-color-tertiary)] pointer-events-none shrink-0"
      />
    </div>
  );
}
