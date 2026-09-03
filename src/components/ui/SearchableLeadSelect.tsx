'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useCRM } from '@/lib/store';
import { matchLeadSearch } from '@/lib/utils';
import { IconSearch, IconBuilding, IconX, IconChevronDown, IconCheck } from '@tabler/icons-react';

interface SearchableLeadSelectProps {
  value: string; // leadId or ''
  onChange: (leadId: string) => void;
  label?: string;
  placeholder?: string;
}

export function SearchableLeadSelect({
  value,
  onChange,
  label = 'Link to Lead / Client',
  placeholder = 'Select a lead (optional)...',
}: SearchableLeadSelectProps) {
  const { leads } = useCRM();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 300 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedLead = useMemo(() => leads.find((l) => l.id === value), [leads, value]);

  // Filter leads based on query
  const filteredLeads = useMemo(() => {
    if (!query.trim()) return leads;
    return leads.filter((l) => matchLeadSearch(l, query));
  }, [leads, query]);

  // Calculate position when opening or scrolling
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverHeight = 260;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < popoverHeight && rect.top > popoverHeight;

      setDropdownPos({
        top: showAbove ? rect.top - popoverHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 280),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();

      const handleScroll = (e: Event) => {
        // Only update if scrolling outside popover
        if (popoverRef.current && popoverRef.current.contains(e.target as Node)) return;
        updatePosition();
      };

      const handleResize = () => updatePosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative w-full">
      {label && (
        <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
          {label} <span className="text-[10px] text-[var(--t-font-color-tertiary)]">(Optional)</span>
        </label>
      )}

      {/* Trigger Control */}
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="w-full h-[30px] px-2.5 rounded-[4px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] focus:border-[var(--t-border-color-focus)] flex items-center justify-between text-[11.5px] text-left transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <IconBuilding size={13} className="text-[var(--t-font-color-tertiary)] shrink-0" />
          {selectedLead ? (
            <span className="text-[var(--t-font-color-primary)] font-medium truncate">
              {selectedLead.companyName}{' '}
              <span className="text-[10px] text-[var(--t-font-color-tertiary)] font-mono font-normal">
                ({selectedLead.serviceInterest || 'Web Dev'})
              </span>
            </span>
          ) : (
            <span className="text-[var(--t-font-color-tertiary)]">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedLead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 rounded text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] cursor-pointer"
              title="Clear selection"
            >
              <IconX size={12} />
            </button>
          )}
          <IconChevronDown
            size={13}
            className={`text-[var(--t-font-color-tertiary)] transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Portal Dropdown Menu rendered outside any card/modal overflow */}
      {isOpen &&
        mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              zIndex: 99999,
            }}
            className="rounded-[8px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] shadow-2xl overflow-hidden flex flex-col max-h-[260px] animate-fade-in backdrop-blur-md"
          >
            {/* Search Header */}
            <div className="p-1.5 border-b border-[var(--t-border-color-light)] bg-[var(--t-background-primary)] shrink-0 flex items-center gap-1.5">
              <IconSearch size={12} className="text-[var(--t-font-color-tertiary)] shrink-0 ml-1" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by company, contact, phone, location..."
                className="w-full bg-transparent border-none outline-none text-[11px] text-[var(--t-font-color-primary)] placeholder-[var(--t-font-color-tertiary)]"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] p-0.5 cursor-pointer"
                >
                  <IconX size={11} />
                </button>
              )}
            </div>

            {/* List of Leads */}
            <div className="overflow-y-auto flex-1 p-1 divide-y divide-[var(--t-border-color-light)]/40">
              {/* Option: None / General */}
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className={`w-full px-2 py-1.5 rounded-[4px] text-left text-[11px] flex items-center justify-between hover:bg-[var(--t-background-primary)] transition-colors cursor-pointer ${
                  !value ? 'bg-[#5d4ef7]/10 text-[#5d4ef7] font-medium' : 'text-[var(--t-font-color-secondary)]'
                }`}
              >
                <span>None (Internal / General Task)</span>
                {!value && <IconCheck size={12} className="text-[#5d4ef7]" />}
              </button>

              {filteredLeads.map((lead) => {
                const isSelected = lead.id === value;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      onChange(lead.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-2 py-1.5 rounded-[4px] text-left text-[11px] flex items-center justify-between hover:bg-[var(--t-background-primary)] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#5d4ef7]/10 text-[#5d4ef7] font-medium'
                        : 'text-[var(--t-font-color-primary)]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-medium truncate leading-tight">{lead.companyName}</span>
                      <span className="text-[9.5px] text-[var(--t-font-color-tertiary)] truncate flex items-center gap-1">
                        <span>{lead.serviceInterest || 'Web Dev'}</span>
                        {lead.contactName && <span>• {lead.contactName}</span>}
                        {lead.phone && <span className="font-mono">• {lead.phone}</span>}
                        {lead.location && <span>• {lead.location}</span>}
                      </span>
                    </div>
                    {isSelected && <IconCheck size={12} className="text-[#5d4ef7] shrink-0" />}
                  </button>
                );
              })}

              {filteredLeads.length === 0 && (
                <div className="p-3 text-center text-[11px] text-[var(--t-font-color-tertiary)]">
                  No leads matching &quot;{query}&quot;
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
