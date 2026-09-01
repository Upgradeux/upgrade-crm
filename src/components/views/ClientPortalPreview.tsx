'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Project } from '@/types/crm';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import {
  IconRocket,
  IconCheck,
  IconClock,
  IconExternalLink,
  IconBrandGithub,
  IconBrandFigma,
  IconCopy,
  IconShieldCheck,
  IconCalendar,
  IconLock,
  IconArrowUpRight,
  IconVideo,
  IconChevronRight,
} from '@tabler/icons-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export function ClientPortalPreview() {
  const { projects, agencyName, currency, timezone, integrationsConfig, addToast } = useCRM();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ''
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleCopyClientLink = () => {
    if (!selectedProject) return;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal?project=${selectedProject.id}&key=${selectedProject.clientAccessKey || 'secure-client'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    addToast('Client secure portal link copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!selectedProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--t-font-color-tertiary)]">
        No active deliverables found.
      </div>
    );
  }

  const completedMilestones = selectedProject.milestones.filter((m) => m.completed).length;

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-4 overflow-y-auto bg-[var(--t-background-tertiary)] flex flex-col gap-3 select-none">
      {/* Top Administrative Toolbar */}
      <div className="h-[42px] px-3 rounded-[8px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <IconShieldCheck size={15} className="text-emerald-500 shrink-0" />
          <span className="text-[12px] font-medium text-[var(--t-font-color-primary)]">
            Client Portal Simulation
          </span>
          <span className="text-[10px] text-[var(--t-font-color-tertiary)] hidden sm:inline">
            • Read-Only Client Safe View
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-[190px]">
            <Dropdown
              value={selectedProject.id}
              onChange={setSelectedProjectId}
              options={projects.map((p) => ({
                value: p.id,
                label: p.companyName,
              }))}
              size="sm"
              buttonClassName="h-[28px] text-[11px]"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={copiedLink ? <IconCheck size={12} /> : <IconCopy size={12} />}
            onClick={handleCopyClientLink}
          >
            {copiedLink ? 'Copied' : 'Copy Client Link'}
          </Button>
        </div>
      </div>

      {/* Compact, Minimalist Twenty-Styled Client Portal Card */}
      <div className="max-w-[800px] w-full mx-auto bg-[var(--t-background-primary)] border border-[var(--t-border-color-medium)] rounded-[10px] shadow-sm overflow-hidden flex flex-col my-1">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-[var(--t-border-color-light)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-[28px] h-[28px] rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] flex items-center justify-center p-1 shrink-0">
              <img
                src="/logo.png"
                alt={agencyName}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-[13px] font-bold text-[var(--t-font-color-primary)]">
                  {agencyName}
                </span>
                <span className="text-[11px] text-[var(--t-font-color-tertiary)]">
                  / {selectedProject.companyName}
                </span>
              </div>
              <div className="text-[10.5px] text-[var(--t-font-color-tertiary)]">
                Client Workspace & Deliverables
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge value={selectedProject.status} size="sm" />
            <div className="flex items-center gap-1 text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
              <IconLock size={11} className="text-emerald-500" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-[12px]">
          {/* Project Title & Progress Row */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--t-border-color-light)]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-[var(--t-font-color-primary)]">
                  {selectedProject.projectName}
                </h2>
                <Badge variant="service" size="sm">
                  {selectedProject.serviceType}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[var(--t-font-color-tertiary)] mt-1 font-mono">
                <span>Target Launch: {formatDate(selectedProject.targetDeliveryDate, timezone)}</span>
                <span>•</span>
                <span>Kickoff: {formatDate(selectedProject.startDate, timezone)}</span>
              </div>
            </div>

            {/* Progress Gauge */}
            <div className="flex flex-col items-end shrink-0">
              <div className="font-mono text-[18px] font-bold text-[var(--t-font-color-primary)]">
                {selectedProject.progressPercent}%
              </div>
              <div className="text-[10px] text-[var(--t-font-color-tertiary)] font-mono">
                {completedMilestones}/{selectedProject.milestones.length} milestones
              </div>
            </div>
          </div>

          {/* Slim Progress Line */}
          <div className="w-full h-[4px] bg-[var(--t-background-quaternary)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                selectedProject.progressPercent >= 100 ? 'bg-emerald-500' : 'bg-[var(--t-font-color-primary)]'
              }`}
              style={{ width: `${selectedProject.progressPercent}%` }}
            />
          </div>

          {/* Workspaces & Deliverable Links (Compact 28px Pills) */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {selectedProject.liveUrl && (
              <a
                href={selectedProject.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="h-[28px] px-2.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] hover:border-[var(--t-border-color-strong)] text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <IconExternalLink size={13} className="text-emerald-500" />
                <span>Live Staging Demo</span>
              </a>
            )}

            {selectedProject.figmaUrl && (
              <a
                href={selectedProject.figmaUrl}
                target="_blank"
                rel="noreferrer"
                className="h-[28px] px-2.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] hover:border-[var(--t-border-color-strong)] text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <IconBrandFigma size={13} className="text-purple-400" />
                <span>Figma UI/UX Specs</span>
              </a>
            )}

            {selectedProject.repoUrl && (
              <a
                href={selectedProject.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="h-[28px] px-2.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] hover:border-[var(--t-border-color-strong)] text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <IconBrandGithub size={13} />
                <span>Source Repository</span>
              </a>
            )}
          </div>

          {/* Agency Update Broadcast */}
          {selectedProject.clientNotes && (
            <div className="p-3 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] text-[11.5px] leading-relaxed flex items-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--t-font-color-tertiary)] shrink-0 mt-0.5">
                Note:
              </span>
              <span className="text-[var(--t-font-color-secondary)]">
                {selectedProject.clientNotes}
              </span>
            </div>
          )}

          {/* Sprint Checkpoints & Milestones List */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--t-font-color-tertiary)] pb-1">
              Sprint Milestones & Checkpoints
            </div>

            <div className="space-y-1">
              {selectedProject.milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className={`h-[34px] px-3 rounded-[6px] border flex items-center justify-between text-[11.5px] transition-colors ${
                    m.completed
                      ? 'bg-[var(--t-background-secondary)] border-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]'
                      : 'bg-[var(--t-background-primary)] border-[var(--t-border-color-light)] text-[var(--t-font-color-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-[16px] h-[16px] rounded-[3px] flex items-center justify-center shrink-0 ${
                        m.completed
                          ? 'bg-emerald-500 text-white'
                          : 'border border-[var(--t-border-color-strong)] text-[var(--t-font-color-tertiary)] text-[9px] font-mono'
                      }`}
                    >
                      {m.completed ? <IconCheck size={11} stroke={3} /> : idx + 1}
                    </div>
                    <span className={`truncate ${m.completed ? 'line-through opacity-75' : 'font-medium'}`}>
                      {m.title}
                    </span>
                  </div>

                  <div className="font-mono text-[10.5px] text-[var(--t-font-color-tertiary)] shrink-0">
                    {m.completed ? 'Completed' : formatDate(m.dueDate)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Contact & Meeting Button */}
          <div className="pt-3 border-t border-[var(--t-border-color-light)] flex items-center justify-between flex-wrap gap-2 text-[11px]">
            <div className="text-[var(--t-font-color-tertiary)]">
              Questions? Engineering Lead: <strong className="text-[var(--t-font-color-secondary)]">alex@upgradeux.com</strong>
            </div>

            <a
              href={`https://cal.com/${integrationsConfig.calComUsername || 'upgradeux'}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[var(--t-font-color-primary)] hover:underline font-medium"
            >
              <span>Schedule sync on Cal.com</span>
              <IconChevronRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
