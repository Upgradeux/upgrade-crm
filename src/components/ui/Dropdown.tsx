'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';
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
  dropdownClassName = '',
  size = 'sm',
  disabled = false,
  leftIcon,
  renderTrigger,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={cn('relative w-full select-none', isOpen ? 'z-40' : 'z-auto', className)}>
      {/* Trigger Button */}
      {renderTrigger ? (
        <div onClick={() => !disabled && setIsOpen((prev) => !prev)}>
          {renderTrigger(selectedOption, isOpen)}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'w-full flex items-center justify-between gap-1.5 rounded-[5px] text-left transition-all cursor-pointer font-sans',
            'bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)]',
            'text-[var(--t-font-color-primary)] outline-none',
            isOpen && 'border-[var(--t-border-color-focus)] ring-1 ring-[var(--t-border-color-focus)]/20',
            disabled && 'opacity-50 cursor-not-allowed',
            isSmall ? 'h-[26px] px-2 text-[11.5px]' : 'h-[32px] px-2.5 text-[12.5px]',
            buttonClassName
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {leftIcon && <span className="text-[var(--t-font-color-tertiary)] shrink-0">{leftIcon}</span>}
            {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
            {selectedOption?.badge && <span className="shrink-0">{selectedOption.badge}</span>}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          <IconChevronDown
            size={isSmall ? 12 : 14}
            className={cn(
              'text-[var(--t-font-color-tertiary)] shrink-0 transition-transform duration-150',
              isOpen && 'rotate-180 text-[var(--t-font-color-primary)]'
            )}
          />
        </button>
      )}

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-[999] mt-1 min-w-[140px] w-full max-h-[240px] overflow-y-auto rounded-[6px]',
            'bg-[var(--t-background-primary)] border border-[var(--t-border-color-medium)] shadow-2xl p-1',
            'animate-scale-in text-[11.5px] font-sans',
            dropdownClassName
          )}
        >
          {normalizedOptions.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-2 rounded-[4px] text-left transition-colors cursor-pointer',
                  isSmall ? 'h-[24px] text-[11px]' : 'h-[28px] text-[12px]',
                  isSelected
                    ? 'bg-[var(--t-background-transparent-light)] text-[var(--t-font-color-primary)] font-medium'
                    : 'text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-lighter)]'
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  {option.badge && <span className="shrink-0">{option.badge}</span>}
                  <span className="truncate">{option.label}</span>
                </div>

                {isSelected && (
                  <IconCheck
                    size={isSmall ? 11 : 13}
                    className="text-[var(--t-font-color-primary)] shrink-0"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
