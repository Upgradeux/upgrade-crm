'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Lead, LeadStatus } from '@/types/crm';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

const COLUMNS: Array<{ status: LeadStatus; label: string; dotColor: string }> = [
  { status: 'Not Contacted', label: 'Not Contacted', dotColor: 'bg-amber-500' },
  { status: 'Contacted', label: 'Contacted', dotColor: 'bg-sky-500' },
  { status: 'Booked Call', label: 'Booked Meeting', dotColor: 'bg-blue-500' },
  { status: 'In Processing / Proposal', label: 'Proposal Sent', dotColor: 'bg-purple-500' },
  { status: 'Won', label: 'Won', dotColor: 'bg-emerald-500' },
  { status: 'Lost', label: 'Lost', dotColor: 'bg-rose-500' },
];

export function PipelineView() {
  const {
    leads,
    moveLeadStatus,
    openLeadDrawer,
    activeSpaceId,
    currency,
    timezone,
  } = useCRM();

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedLeadId(id);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: string) => {
    e.preventDefault();
    setDragOverCol(colStatus);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedLeadId) return;

    moveLeadStatus(draggedLeadId, targetStatus);
    setDraggedLeadId(null);
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-x-auto overflow-y-hidden bg-[var(--t-background-tertiary)] flex gap-2.5 select-none">
      {COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => l.status === col.status);
        const columnTotal = columnLeads.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);
        const isTarget = dragOverCol === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`w-[270px] shrink-0 h-full flex flex-col rounded-[6px] bg-[var(--t-background-primary)] border transition-colors ${
              isTarget
                ? 'border-[var(--t-border-color-focus)] bg-[var(--t-background-transparent-lighter)]'
                : 'border-[var(--t-border-color-light)]'
            }`}
          >
            {/* Column Header */}
            <div className="p-2.5 border-b border-[var(--t-border-color-light)] flex items-center justify-between shrink-0 bg-[var(--t-background-secondary)]">
              <div className="flex items-center gap-1.5">
                <span className={`w-[6px] h-[6px] rounded-full ${col.dotColor}`} />
                <span className="text-[11.5px] font-medium text-[var(--t-font-color-primary)]">
                  {col.label}
                </span>
                <span className="px-1.5 py-0.2 rounded-[3px] bg-[var(--t-background-transparent-medium)] text-[10px] font-mono text-[var(--t-font-color-secondary)]">
                  {columnLeads.length}
                </span>
              </div>

              <span className="text-[10.5px] font-mono text-[var(--t-font-color-tertiary)]">
                {formatCurrency(columnTotal, currency)}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 p-2 overflow-y-auto space-y-2">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                  onClick={() => openLeadDrawer(lead.id)}
                  className="p-2.5 rounded-[5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] transition-all cursor-pointer group space-y-1.5 shadow-2xs"
                >
                  {/* Card Title & Value */}
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[12.5px] font-medium text-[var(--t-font-color-primary)] truncate">
                        {lead.companyName}
                      </span>
                    </div>

                    <span className="font-mono text-[11px] text-[var(--t-font-color-primary)] shrink-0">
                      {formatCurrency(lead.dealValue, currency)}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge value={lead.source || 'Google Maps'} size="sm" />
                    <Badge variant="service" size="sm">
                      {lead.serviceInterest}
                    </Badge>
                    {activeSpaceId === 'all' && lead.industry && (
                      <span className="px-1.5 py-0.2 rounded-[3px] bg-indigo-500/10 text-indigo-400 font-mono text-[9.5px] border border-indigo-500/20 truncate max-w-[110px]">
                        {lead.industry.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-1 border-t border-[var(--t-border-color-light)] flex items-center justify-between text-[10.5px] text-[var(--t-font-color-tertiary)]">
                    <span className="truncate max-w-[120px]">
                      {lead.contactName || lead.location}
                    </span>
                    <span className="font-mono">{formatDate(lead.createdAt, timezone)}</span>
                  </div>
                </div>
              ))}

              {columnLeads.length === 0 && (
                <div className="h-[60px] border border-dashed border-[var(--t-border-color-light)] rounded-[4px] flex items-center justify-center text-[10.5px] text-[var(--t-font-color-tertiary)]">
                  Drop leads here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
