'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LeadStatus, OutreachStage, ServiceType, ProjectStatus, LeadSource, CallOutcome } from '@/types/crm';
import {
  IconMapPin,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconMail,
} from '@tabler/icons-react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'status' | 'stage' | 'service' | 'project' | 'source' | 'call' | 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  value?: LeadStatus | OutreachStage | ServiceType | ProjectStatus | LeadSource | CallOutcome | string;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  value,
  size = 'md',
  className = '',
  dot = true,
}: BadgeProps) {
  const displayVal = children || value;

  // Twenty CRM Subtle Neutral Grayscale & Semantic Dot Colors
  let bg = 'bg-[var(--t-background-transparent-light)]';
  let text = 'text-[var(--t-font-color-secondary)]';
  let border = 'border-[var(--t-border-color-light)]';
  let dotColor = 'bg-[var(--t-font-color-tertiary)]';
  let customIcon: React.ReactNode = null;

  // Sources
  if (value === 'Google Maps') {
    bg = 'bg-emerald-500/10 dark:bg-emerald-500/15';
    text = 'text-emerald-700 dark:text-emerald-400';
    border = 'border-emerald-500/20';
    dotColor = 'bg-emerald-500';
    customIcon = <IconMapPin size={11} className="shrink-0 text-emerald-500" />;
  } else if (value === 'Instagram') {
    bg = 'bg-pink-500/10 dark:bg-pink-500/15';
    text = 'text-pink-700 dark:text-pink-400';
    border = 'border-pink-500/20';
    dotColor = 'bg-pink-500';
    customIcon = <IconBrandInstagram size={11} className="shrink-0 text-pink-500" />;
  } else if (value === 'LinkedIn') {
    bg = 'bg-sky-500/10 dark:bg-sky-500/15';
    text = 'text-sky-700 dark:text-sky-400';
    border = 'border-sky-500/20';
    dotColor = 'bg-sky-500';
    customIcon = <IconBrandLinkedin size={11} className="shrink-0 text-sky-500" />;
  } else if (value === 'Cold Email' || value === 'Website Inbound') {
    bg = 'bg-purple-500/10 dark:bg-purple-500/15';
    text = 'text-purple-700 dark:text-purple-400';
    border = 'border-purple-500/20';
    dotColor = 'bg-purple-500';
    customIcon = <IconMail size={11} className="shrink-0 text-purple-500" />;
  }

  // Lead & Project Statuses
  else if (value === 'Leads') {
    bg = 'bg-indigo-500/10 dark:bg-indigo-500/15';
    text = 'text-indigo-700 dark:text-indigo-400';
    border = 'border-indigo-500/20';
    dotColor = 'bg-indigo-500';
  } else if (value === 'Not Contacted' || value === 'Needs Outreach' || value === 'Discovery') {
    bg = 'bg-amber-500/10 dark:bg-amber-500/15';
    text = 'text-amber-700 dark:text-amber-400';
    border = 'border-amber-500/20';
    dotColor = 'bg-amber-500';
  } else if (value === 'Contacted') {
    bg = 'bg-sky-500/10 dark:bg-sky-500/15';
    text = 'text-sky-700 dark:text-sky-400';
    border = 'border-sky-500/20';
    dotColor = 'bg-sky-500';
  } else if (value === 'Booked Meeting' || value === 'Booked Call' || value === 'In Build' || value === 'Follow-Up Needed') {
    bg = 'bg-blue-500/10 dark:bg-blue-500/15';
    text = 'text-blue-700 dark:text-blue-400';
    border = 'border-blue-500/20';
    dotColor = 'bg-blue-500';
  } else if (value === 'Proposal Sent' || value === 'In Processing / Proposal' || value === 'Design & Specs') {
    bg = 'bg-purple-500/10 dark:bg-purple-500/15';
    text = 'text-purple-700 dark:text-purple-400';
    border = 'border-purple-500/20';
    dotColor = 'bg-purple-500';
  } else if (value === 'Won' || value === 'Live / Deployed' || value === 'Closed') {
    bg = 'bg-emerald-500/10 dark:bg-emerald-500/15';
    text = 'text-emerald-700 dark:text-emerald-400';
    border = 'border-emerald-500/20';
    dotColor = 'bg-emerald-500';
  } else if (value === 'Testing & QA') {
    bg = 'bg-teal-500/10 dark:bg-teal-500/15';
    text = 'text-teal-700 dark:text-teal-400';
    border = 'border-teal-500/20';
    dotColor = 'bg-teal-500';
  } else if (value === 'Lost') {
    bg = 'bg-rose-500/10 dark:bg-rose-500/15';
    text = 'text-rose-700 dark:text-rose-400';
    border = 'border-rose-500/20';
    dotColor = 'bg-rose-500';
  } else if (variant === 'service') {
    bg = 'bg-[var(--t-background-transparent-light)]';
    text = 'text-[var(--t-font-color-secondary)]';
    border = 'border-[var(--t-border-color-light)]';
    dotColor = 'bg-[var(--t-font-color-tertiary)]';
  }

  const sizeStyle = size === 'sm' ? 'h-[18px] text-[10.5px] px-[5px]' : 'h-[20px] text-[11px] px-[6px]';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-[4px] rounded-[4px] border font-normal whitespace-nowrap select-none',
        sizeStyle,
        bg,
        text,
        border,
        className
      )}
    >
      {customIcon ? customIcon : dot ? <span className={cn('w-[5px] h-[5px] rounded-full shrink-0', dotColor)} /> : null}
      <span className="truncate">{displayVal}</span>
    </span>
  );
}
