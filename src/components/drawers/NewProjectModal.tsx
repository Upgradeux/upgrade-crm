'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { ServiceType, ProjectStatus } from '@/types/crm';
import { IconRocket, IconBuilding, IconCurrencyDollar, IconCalendar, IconBrandGithub, IconBrandFigma } from '@tabler/icons-react';
import { generateUUID } from '@/lib/utils';

export function NewProjectModal() {
  const {
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    addProject,
    leads,
    spaces,
    activeSpaceId,
  } = useCRM();

  const [selectedSpaceId, setSelectedSpaceId] = useState(
    activeSpaceId !== 'all' ? activeSpaceId : 'real-estate'
  );
  const [companyName, setCompanyName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Web Development');
  const [budget, setBudget] = useState(15000);
  const [status, setStatus] = useState<ProjectStatus>('In Build');
  const [progressPercent, setProgressPercent] = useState(25);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');

  React.useEffect(() => {
    if (isNewProjectModalOpen && activeSpaceId !== 'all') {
      setSelectedSpaceId(activeSpaceId);
    }
  }, [isNewProjectModalOpen, activeSpaceId]);

  const spaceOptions = spaces
    .filter((s) => s.id !== 'all')
    .map((s) => ({
      value: s.id,
      label: s.name,
    }));

  const serviceOptions = [
    { value: 'Web Development', label: 'Web Development' },
    { value: 'AI Voice Agent', label: 'AI Voice Agent' },
    { value: 'AI Automation', label: 'AI Automation' },
    { value: 'Google Business Profile', label: 'Google Business Profile' },
    { value: 'Meta Ads', label: 'Meta Ads' },
    { value: 'AI Chatbot', label: 'AI Chatbot' },
    { value: 'Workflow / n8n Automation', label: 'Workflow Automation' },
    { value: 'Monthly Retainer', label: 'Monthly Retainer' },
    { value: 'Lead Generation', label: 'Lead Generation' },
  ];

  const statusOptions = [
    { value: 'Discovery', label: 'Discovery' },
    { value: 'Design & Specs', label: 'Design & Specs' },
    { value: 'In Build', label: 'In Build' },
    { value: 'Testing & QA', label: 'Testing & QA' },
    { value: 'Live / Deployed', label: 'Live / Deployed' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !companyName.trim()) return;

    const matchedSpace = spaces.find((s) => s.id === selectedSpaceId);

    addProject({
      companyId: generateUUID(),
      companyName: companyName.trim(),
      projectName: projectName.trim(),
      serviceType,
      industrySpaceId: selectedSpaceId,
      industry: matchedSpace?.name || 'Real Estate & Properties',
      status,
      progressPercent: Number(progressPercent) || 0,
      budget: Number(budget) || 0,
      startDate: new Date().toISOString(),
      targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate).toISOString() : new Date().toISOString(),
      repoUrl: repoUrl.trim() || undefined,
      figmaUrl: figmaUrl.trim() || undefined,
      liveUrl: liveUrl.trim() || undefined,
      milestones: [
        { id: generateUUID(), title: 'Scope & Architecture Sign-Off', completed: true, dueDate: '2026-09-05' },
        { id: generateUUID(), title: 'Development & API Integrations', completed: false, dueDate: '2026-09-18' },
        { id: generateUUID(), title: 'Client QA & Sandbox Verification', completed: false, dueDate: '2026-09-25' },
        { id: generateUUID(), title: 'Production Handover & Training', completed: false, dueDate: targetDeliveryDate || '2026-09-30' },
      ],
    });

    setIsNewProjectModalOpen(false);
    setCompanyName('');
    setProjectName('');
    setRepoUrl('');
    setFigmaUrl('');
    setLiveUrl('');
  };

  return (
    <Modal
      isOpen={isNewProjectModalOpen}
      onClose={() => setIsNewProjectModalOpen(false)}
      title="Create New Agency Deliverable"
      subtitle="Track build milestones, client links, and delivery target"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-[12px]">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Client / Company Name <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              leftIcon={<IconBuilding size={14} />}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Deliverable Project Title <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. AI Receptionist Bot"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              leftIcon={<IconRocket size={14} />}
            />
          </div>
        </div>

        {/* Industry Space & Service Type */}
        <div className="grid grid-cols-2 gap-3 p-2.5 rounded-[8px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)]">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Industry Space / Niche
            </label>
            <Dropdown
              value={selectedSpaceId}
              onChange={setSelectedSpaceId}
              options={spaceOptions}
              size="sm"
              buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Service Type
            </label>
            <Dropdown
              value={serviceType}
              onChange={(val) => setServiceType(val as ServiceType)}
              options={serviceOptions}
              size="sm"
              buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Project Budget
            </label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              leftIcon={<IconCurrencyDollar size={14} />}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Current Build Status
            </label>
            <Dropdown
              value={status}
              onChange={(val) => setStatus(val as ProjectStatus)}
              options={statusOptions}
              size="sm"
              buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              GitHub Repo Link (Optional)
            </label>
            <Input
              placeholder="https://github.com/..."
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              leftIcon={<IconBrandGithub size={14} />}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Figma Board URL (Optional)
            </label>
            <Input
              placeholder="https://figma.com/..."
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              leftIcon={<IconBrandFigma size={14} />}
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
            Target Delivery Date
          </label>
          <Input
            type="date"
            value={targetDeliveryDate}
            onChange={(e) => setTargetDeliveryDate(e.target.value)}
            leftIcon={<IconCalendar size={14} />}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--t-border-color-light)]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setIsNewProjectModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            Save Deliverable Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
