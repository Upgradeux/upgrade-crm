'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', leftIcon, rightIcon, type = 'text', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-[8px] flex items-center pointer-events-none text-[var(--t-font-color-tertiary)] shrink-0">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full h-[32px] px-[8px] text-[13px] text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)] bg-[var(--t-background-transparent-lighter)] border border-[var(--t-border-color-medium)] rounded-[8px] outline-none transition-all duration-100 focus:border-[#5d4ef7] focus:bg-[var(--t-background-primary)] disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon ? 'pl-[28px]' : '',
            rightIcon ? 'pr-[28px]' : '',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-[8px] flex items-center text-[var(--t-font-color-tertiary)] shrink-0">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'w-full h-[28px] pl-2.5 pr-7 text-[12px] text-[var(--t-font-color-primary)] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] rounded-[5px] outline-none transition-all cursor-pointer focus:border-[var(--t-border-color-focus)] appearance-none font-sans disabled:opacity-50',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--t-font-color-tertiary)]">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
