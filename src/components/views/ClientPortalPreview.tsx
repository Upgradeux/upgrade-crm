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
  IconSparkles,
  IconBrandWhatsapp,
  IconChecklist,
  IconLink,
} from '@tabler/icons-react';
import { formatDate } from '@/lib/utils';

export function ClientPortalPreview() {
  const { projects, agencyName, agencyEmail, timezone, integrationsConfig, addToast } = useCRM();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ''
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleCopyClientLink = () => {
    if (!selectedProject) return;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal?key=${selectedProject.clientAccessKey}`;
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
    <div className="flex-1 h-[calc(100vh-48px)] p-3 sm:p-5 overflow-y-auto bg-[var(--t-background-primary)] flex flex-col gap-3">
      {/* Top Administrative Toolbar */}
      <div className="h-[40px] px-3 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between gap-3 shrink-0 max-w-[760px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <IconShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[11.5px] font-medium text-[var(--t-font-color-primary)]">
            Client Portal Live Simulation
          </span>
          <span className="text-[10px] text-[var(--t-font-color-tertiary)] hidden sm:inline">
            • Exact view your client sees at <code className="font-mono text-indigo-400">/portal?key=...</code>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-[180px]">
            <Dropdown
              value={selectedProject.id}
              onChange={setSelectedProjectId}
              options={projects.map((p) => ({
                value: p.id,
                label: p.companyName,
              }))}
              size="sm"
              buttonClassName="h-[26px] text-[11px] bg-[var(--t-background-primary)]"
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={copiedLink ? <IconCheck size={11} /> : <IconCopy size={11} />}
            onClick={handleCopyClientLink}
          >
            {copiedLink ? 'Copied' : 'Copy Share Link'}
          </Button>
        </div>
      </div>

      {/* Clean, Crisp Light Twenty-Style Client Portal Card */}
      <div className="max-w-[760px] w-full mx-auto bg-white text-[#0f172a] border border-[#e2e4e9] rounded-[10px] shadow-xs overflow-hidden flex flex-col my-1">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-[5px] bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center p-1 shrink-0">
              <img
                src="/logo.png"
                alt={agencyName}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-[13px] font-bold text-[#0f172a]">
                  {agencyName}
                </span>
                <span className="text-[#cbd5e1]">/</span>
                <span className="text-[#64748b] text-[11.5px] font-medium">
                  {selectedProject.companyName}
                </span>
              </div>
              <div className="text-[10px] text-[#94a3b8]">
                Client Workspace & Live Deliverables
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10.5px] font-mono flex items-center gap-1">
              <IconShieldCheck size={12} />
              <span>Verified Safe</span>
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-[12px]">
          {/* Project Title & Progress Row */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[17px] font-bold text-[#0f172a] tracking-tight">
                  {selectedProject.projectName}
                </h2>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] text-[10.5px] font-medium font-mono">
                  {selectedProject.serviceType}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#64748b] mt-1 font-mono">
                <span>Target Launch: {formatDate(selectedProject.targetDeliveryDate, timezone)}</span>
                <span>•</span>
                <span>Kickoff: {formatDate(selectedProject.startDate, timezone)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-[5px] bg-[#f8fafc] border border-[#e2e8f0] text-[11.5px] font-semibold text-[#334155]">
                {selectedProject.status}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 p-3 rounded-[6px] bg-[#f8fafc] border border-[#e2e8f0]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#475569] uppercase tracking-wider text-[10px]">
                Sprint Completion Progress
              </span>
              <span className="font-mono text-emerald-600 font-bold text-[11.5px]">
                {selectedProject.progressPercent}% ({completedMilestones}/{selectedProject.milestones.length} Milestones)
              </span>
            </div>
            <div className="w-full h-[6px] bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${selectedProject.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Live Engineering Update */}
          {selectedProject.clientNotes && (
            <div className="p-3 rounded-[6px] bg-[#fffbeb] border border-[#fef3c7] space-y-1">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-amber-700 uppercase tracking-wider">
                <IconSparkles size={13} />
                <span>Live Update from Engineering Team</span>
              </div>
              <p className="text-[12px] text-[#78350f] leading-relaxed">
                {selectedProject.clientNotes}
              </p>
            </div>
          )}

          {/* Milestones Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
                <IconChecklist size={13} />
                <span>Project Milestones & Checkpoints</span>
              </div>
              <span className="text-[10.5px] text-[#94a3b8] font-mono">
                {completedMilestones} of {selectedProject.milestones.length} completed
              </span>
            </div>

            <div className="space-y-1.5">
              {selectedProject.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-[6px] border flex items-center justify-between text-[12px] transition-colors ${
                    m.completed
                      ? 'bg-emerald-50/50 border-emerald-200 text-[#065f46]'
                      : 'bg-white border-[#e2e4e9] text-[#334155]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-[17px] h-[17px] rounded-[4px] flex items-center justify-center shrink-0 ${
                        m.completed
                          ? 'bg-emerald-500 text-white font-bold'
                          : 'border border-[#cbd5e1] bg-[#f8fafc]'
                      }`}
                    >
                      {m.completed && <IconCheck size={11} stroke={3} />}
                    </div>
                    <span className={m.completed ? 'line-through text-[#047857] font-medium' : 'text-[#0f172a] font-medium'}>
                      {m.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748b]">
                    <IconClock size={11} />
                    <span>Due {formatDate(m.dueDate, timezone)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables / Production Links */}
          {(selectedProject.liveUrl || selectedProject.figmaUrl || selectedProject.repoUrl) && (
            <div className="space-y-2 pt-2 border-t border-[#f1f5f9]">
              <div className="text-[10.5px] font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
                <IconLink size={12} />
                <span>Deliverables & Resources</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedProject.liveUrl && (
                  <a
                    href={selectedProject.liveUrl.startsWith('http') ? selectedProject.liveUrl : `https://${selectedProject.liveUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-[6px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-between text-[11.5px] text-[#0f172a] font-medium transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <IconRocket size={13} className="text-emerald-500" />
                      <span>Live Preview</span>
                    </div>
                    <IconExternalLink size={11} className="text-[#94a3b8]" />
                  </a>
                )}
                {selectedProject.figmaUrl && (
                  <a
                    href={selectedProject.figmaUrl.startsWith('http') ? selectedProject.figmaUrl : `https://${selectedProject.figmaUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-[6px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-between text-[11.5px] text-[#0f172a] font-medium transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <IconBrandFigma size={13} className="text-rose-500" />
                      <span>Figma Specs</span>
                    </div>
                    <IconExternalLink size={11} className="text-[#94a3b8]" />
                  </a>
                )}
                {selectedProject.repoUrl && (
                  <a
                    href={selectedProject.repoUrl.startsWith('http') ? selectedProject.repoUrl : `https://${selectedProject.repoUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-[6px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-between text-[11.5px] text-[#0f172a] font-medium transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <IconBrandGithub size={13} className="text-[#334155]" />
                      <span>Source Repo</span>
                    </div>
                    <IconExternalLink size={11} className="text-[#94a3b8]" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Agency Support & Schedule Sync */}
          <div className="p-3.5 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <div className="text-[12px] font-bold text-[#0f172a]">
                Questions? Direct Support: <span className="font-mono text-[#5d4ef7] font-semibold">{agencyEmail}</span>
              </div>
              <div className="text-[11px] text-[#64748b] mt-0.5">
                Book a 15-minute review call or message us directly on WhatsApp.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://wa.me/${(integrationsConfig.whatsAppPhone || '918369672169').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="h-[30px] px-2.5 rounded-[5px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <IconBrandWhatsapp size={13} />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://cal.com/${integrationsConfig.calComUsername || 'upgradeux'}`}
                target="_blank"
                rel="noreferrer"
                className="h-[30px] px-3 rounded-[5px] bg-[#5d4ef7] hover:bg-[#4d3ef0] text-white text-[11.5px] font-medium flex items-center gap-1.5 shadow-xs transition-all"
              >
                <IconCalendar size={13} />
                <span>Book Review Call</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
