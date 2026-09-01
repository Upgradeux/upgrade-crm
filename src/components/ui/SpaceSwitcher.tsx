'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import {
  IconBuildingSkyscraper,
  IconChevronDown,
  IconPlus,
  IconCheck,
  IconWorld,
  IconTrash,
  IconPencil,
  IconBriefcase,
  IconHeartbeat,
  IconShoppingBag,
  IconTool,
  IconCpu,
} from '@tabler/icons-react';

export function SpaceSwitcher() {
  const {
    spaces,
    activeSpaceId,
    activeSpace,
    setActiveSpaceId,
    deleteIndustrySpace,
    setEditingSpace,
    setIsCreateSpaceModalOpen,
    confirmAction,
    allLeads,
  } = useCRM();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getSpaceIcon = (slug: string, color?: string) => {
    if (slug === 'all') return <IconWorld size={14} className="text-[#5d4ef7]" />;
    if (slug.includes('estate')) return <IconBuildingSkyscraper size={14} style={{ color: color || '#10b981' }} />;
    if (slug.includes('health') || slug.includes('med')) return <IconHeartbeat size={14} style={{ color: color || '#06b6d4' }} />;
    if (slug.includes('commerce') || slug.includes('d2c')) return <IconShoppingBag size={14} style={{ color: color || '#f59e0b' }} />;
    if (slug.includes('local') || slug.includes('service')) return <IconTool size={14} style={{ color: color || '#f43f5e' }} />;
    if (slug.includes('saas') || slug.includes('tech')) return <IconCpu size={14} style={{ color: color || '#a855f7' }} />;
    return <IconBriefcase size={14} style={{ color: color || '#3b82f6' }} />;
  };

  const getLeadCountForSpace = (spaceId: string) => {
    if (spaceId === 'all') return allLeads.length;
    const space = spaces.find((s) => s.id === spaceId);
    return allLeads.filter((l) => {
      if (l.industrySpaceId === spaceId) return true;
      if (l.industry && space?.name && l.industry.toLowerCase().includes(space.name.toLowerCase().split(' ')[0])) {
        return true;
      }
      return false;
    }).length;
  };

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-auto'}`} ref={dropdownRef}>
      {/* Trigger Button (Twenty Style) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-[30px] px-2.5 rounded-[6px] bg-[var(--t-background-secondary)] hover:bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] flex items-center gap-2 text-[12px] text-[var(--t-font-color-primary)] font-medium transition-colors cursor-pointer select-none shadow-2xs group"
        title="Switch Industry Space"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="shrink-0">{getSpaceIcon(activeSpace.slug, activeSpace.color)}</span>
          <span className="truncate max-w-[140px] sm:max-w-[180px]">
            {activeSpace.name}
          </span>
          <span className="px-1.5 py-0.2 rounded-[3px] bg-[var(--t-background-quaternary)] font-mono text-[10px] text-[var(--t-font-color-secondary)]">
            {getLeadCountForSpace(activeSpaceId)}
          </span>
        </div>

        <IconChevronDown
          size={12}
          className={`text-[var(--t-font-color-tertiary)] group-hover:text-[var(--t-font-color-primary)] transition-transform shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown (High z-index) */}
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-[270px] p-1 rounded-[6px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-medium)] shadow-xl z-[999] animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider flex items-center justify-between">
            <span>Industry Workspaces</span>
            <span className="font-mono text-[9px] text-[var(--t-font-color-quaternary)]">Hover to Edit</span>
          </div>

          <div className="max-h-[260px] overflow-y-auto space-y-0.5">
            {spaces.map((space) => {
              const isSelected = activeSpaceId === space.id;
              const count = getLeadCountForSpace(space.id);

              return (
                <div
                  key={space.id}
                  onClick={() => {
                    setActiveSpaceId(space.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-2 py-1.5 rounded-[4px] flex items-center justify-between text-[11.5px] cursor-pointer transition-colors group ${
                    isSelected
                      ? 'bg-[var(--t-background-secondary)] text-[var(--t-font-color-primary)] font-medium'
                      : 'text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="shrink-0">{getSpaceIcon(space.slug, space.color)}</span>
                    <span className="truncate">{space.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10.5px] text-[var(--t-font-color-tertiary)] group-hover:hidden">
                      {count}
                    </span>

                    {/* Edit Space Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        setEditingSpace(space);
                      }}
                      className="hidden group-hover:flex p-1 rounded text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-medium)] transition-all cursor-pointer"
                      title={`Edit "${space.name}"`}
                    >
                      <IconPencil size={11} />
                    </button>

                    {isSelected && (
                      <IconCheck size={13} className="text-[#5d4ef7] shrink-0" />
                    )}

                    {!space.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmAction({
                            title: 'Delete Industry Space',
                            message: `Are you sure you want to delete "${space.name}"? Leads in this space will be moved to the General workspace.`,
                            confirmText: 'Delete Space',
                            variant: 'danger',
                            onConfirm: () => deleteIndustrySpace(space.id),
                          });
                        }}
                        className="hidden group-hover:flex p-1 rounded text-[var(--t-font-color-tertiary)] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete space"
                      >
                        <IconTrash size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create New Space Action */}
          <div className="pt-1 border-t border-[var(--t-border-color-light)]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCreateSpaceModalOpen(true);
              }}
              className="w-full px-2 py-1.5 rounded-[4px] flex items-center gap-2 text-[11.5px] font-medium text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer"
            >
              <IconPlus size={13} className="text-[#5d4ef7]" />
              <span>Create New Industry Space</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
