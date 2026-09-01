'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import { ServiceType, ProjectStatus } from '@/types/crm';
import { IconSparkles, IconRocket, IconCurrencyDollar, IconCalendar, IconChecklist } from '@tabler/icons-react';
import { formatCurrency, generateUUID } from '@/lib/utils';

export function WonDealModal() {
  const { isWonModalOpen, setIsWonModalOpen, wonLeadForModal, addProject, setCurrentView } = useCRM();

  const [projectName, setProjectName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('AI Voice Agent');
  const [budget, setBudget] = useState(10000);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('In Build');

  const serviceOptions = [
    { value: 'AI Voice Agent', label: 'AI Voice Agent' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Workflow / n8n Automation', label: 'Workflow Automation' },
    { value: 'AI Chatbot', label: 'AI Chatbot' },
    { value: 'Monthly Retainer', label: 'Monthly Retainer' },
  ];

  const statusOptions = [
    { value: 'Discovery', label: 'Discovery' },
    { value: 'Design & Specs', label: 'Design & Specs' },
    { value: 'In Build', label: 'In Build' },
    { value: 'Testing & QA', label: 'Testing & QA' },
  ];

  useEffect(() => {
    if (wonLeadForModal) {
      setProjectName(`${wonLeadForModal.companyName} — ${wonLeadForModal.serviceInterest || 'Build'}`);
      setServiceType(wonLeadForModal.serviceInterest || 'AI Voice Agent');
      setBudget(wonLeadForModal.dealValue || 10000);

      // Default target date: 30 days from now
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setTargetDeliveryDate(d.toISOString().split('T')[0]);
    }
  }, [wonLeadForModal]);

  if (!wonLeadForModal) return null;

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate standard default milestones based on service type
    let defaultMilestones = [
      { id: generateUUID(), title: 'Architecture Specs & Client Sign-off', completed: true, dueDate: '2026-09-07' },
      { id: generateUUID(), title: 'Core Pipeline Implementation', completed: false, dueDate: '2026-09-18' },
      { id: generateUUID(), title: 'Client QA & Sandbox Testing', completed: false, dueDate: '2026-09-25' },
      { id: generateUUID(), title: 'Production DNS & Live Deployment', completed: false, dueDate: targetDeliveryDate },
    ];

    addProject({
      companyId: wonLeadForModal.id,
      companyName: wonLeadForModal.companyName,
      projectName: projectName.trim(),
      serviceType,
      status,
      progressPercent: 25,
      budget: Number(budget) || 0,
      startDate: new Date().toISOString(),
      targetDeliveryDate: targetDeliveryDate ? new Date(targetDeliveryDate).toISOString() : new Date().toISOString(),
      milestones: defaultMilestones,
    });

    setIsWonModalOpen(false);
    setCurrentView('projects');
  };

  return (
    <Modal
      isOpen={isWonModalOpen}
      onClose={() => setIsWonModalOpen(false)}
      title="Deal Won: Create Active Deliverable Project"
      subtitle={`Auto-seed sprint deliverable, roadmap milestones, and client access key for ${wonLeadForModal?.companyName}`}
      maxWidth="max-w-[580px]"
    >
      <form onSubmit={handleCreateProject} className="space-y-3.5 text-[12px]">
        <div className="p-3 bg-[#5d4ef7]/10 border border-[#5d4ef7]/30 rounded-[8px] flex items-center gap-3">
          <div className="w-[32px] h-[32px] rounded-full bg-[#5d4ef7] text-white flex items-center justify-center shrink-0">
            <IconSparkles size={18} />
          </div>
          <div>
            <div className="font-semibold text-[var(--t-font-color-primary)]">
              Congratulations! {wonLeadForModal.companyName} is officially a Won Client!
            </div>
            <div className="text-[11px] text-[var(--t-font-color-secondary)]">
              Convert this {formatCurrency(wonLeadForModal.dealValue)} deal into an active production deliverable.
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
            Project Deliverable Title
          </label>
          <Input
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            leftIcon={<IconRocket size={14} />}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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

          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Contract Budget ($)
            </label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              leftIcon={<IconCurrencyDollar size={14} />}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)] block mb-1">
              Initial Build Status
            </label>
            <Dropdown
              value={status}
              onChange={(val) => setStatus(val as ProjectStatus)}
              options={statusOptions}
              size="sm"
              buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
            />
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
        </div>

        <div className="p-2.5 bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] text-[11px] text-[var(--t-font-color-secondary)] flex items-center gap-2">
          <IconChecklist size={16} className="text-[#5d4ef7] shrink-0" />
          <span>Pre-seeds standard agency milestone checkpoints (Discovery, Build, Testing, Handover).</span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--t-border-color-light)]">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setIsWonModalOpen(false)}
          >
            Skip Project Creation
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<IconRocket size={14} />}
          >
            Create Active Project & Track
          </Button>
        </div>
      </form>
    </Modal>
  );
}
