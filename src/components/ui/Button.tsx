'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'icon-sm' | 'icon-md';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'secondary',
      size = 'md',
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    // Sizing matching Twenty: md = 32px height, sm = 24px height
    const sizeClasses = {
      md: 'h-[32px] px-[10px] text-[12.5px] rounded-[6px] gap-[5px]',
      sm: 'h-[24px] px-[7px] text-[11px] rounded-[4px] gap-[4px]',
      'icon-md': 'h-[32px] w-[32px] p-0 rounded-[6px] justify-center items-center',
      'icon-sm': 'h-[24px] w-[24px] p-0 rounded-[4px] justify-center items-center',
    }[size];

    // Variants matching Twenty CRM: Neutral-50 / Neutral-900 Primary
    const variantStyles: Record<string, string> = {
      primary:
        'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] hover:opacity-90 active:opacity-95 font-medium border-0 shadow-xs',
      secondary:
        'bg-transparent text-[var(--t-font-color-primary)] border border-[var(--t-border-color-medium)] hover:bg-[var(--t-background-transparent-light)] active:bg-[var(--t-background-transparent-medium)] font-medium',
      ghost:
        'bg-transparent text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] active:bg-[var(--t-background-transparent-medium)] border-0 font-medium',
      subtle:
        'bg-[var(--t-background-transparent-light)] text-[var(--t-font-color-primary)] border border-[var(--t-border-color-light)] hover:bg-[var(--t-background-transparent-medium)] font-medium',
      danger:
        'bg-[var(--t-color-danger-subtle)] text-[var(--t-color-danger)] border border-[var(--t-color-danger)]/30 hover:bg-[var(--t-color-danger)] hover:text-white font-medium',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-sans select-none cursor-pointer outline-none whitespace-nowrap transition-all duration-100 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed',
          sizeClasses,
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {leftIcon && <span className="flex items-center shrink-0">{leftIcon}</span>}
        {children && <span className="truncate">{children}</span>}
        {rightIcon && <span className="flex items-center shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
