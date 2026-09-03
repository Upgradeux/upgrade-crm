'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Project, ProjectStatus } from '@/types/crm';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dropdown } from '../ui/Dropdown';
import {
  IconRocket,
  IconBrandGithub,
  IconBrandFigma,
  IconExternalLink,
  IconPlus,
  IconTrash,
  IconCheck,
  IconEye,
  IconCopy,
  IconX,
  IconSearch,
  IconCalendar,
  IconSparkles,
  IconChevronDown,
} from '@tabler/icons-react';
import { formatCurrency, formatDate, matchProjectSearch } from '@/lib/utils';

export function ProjectsView() {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    projectsLayout,
    setProjectsLayout,
    activeSpaceId,
    currency,
    timezone,
    addToast,
    confirmAction,
    setIsNewProjectModalOpen,
    setCurrentView,
  } = useCRM();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProjectDrawerId, setActiveProjectDrawerId] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');
  const [statusDropdownOpenId, setStatusDropdownOpenId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesSearch = matchProjectSearch(p, searchQuery);
    return matchesStatus && matchesSearch;
  });

  const totalContractBudget = projects.reduce((acc, curr) => acc + (curr.budget || 0), 0);
  const activeBuilds = projects.filter((p) => p.status !== 'Live / Deployed').length;

  const activeDrawerProject = projects.find((p) => p.id === activeProjectDrawerId) || null;

  const handleAddMilestoneToActive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectDrawerId || !newMilestoneTitle.trim()) return;

    addMilestone(
      activeProjectDrawerId,
      newMilestoneTitle.trim(),
      newMilestoneDueDate || new Date().toISOString().split('T')[0]
    );
    setNewMilestoneTitle('');
    setNewMilestoneDueDate('');
  };

  const handleCopyClientLink = (project: Project) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal?key=${project.clientAccessKey}`;
    navigator.clipboard.writeText(url);
    addToast(`Secure Client Portal link copied for ${project.companyName}`, 'success');
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-hidden bg-[var(--t-background-primary)] flex flex-col gap-2">
      {/* Twenty Style Filter & Search Toolbar */}
      <div className="p-2 sm:px-2.5 sm:py-1.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
          {/* Quick Search */}
          <div className="w-full sm:w-[220px]">
            <Input
              placeholder="Filter deliverables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<IconSearch size={13} />}
              className="h-[26px] text-[12px] bg-[var(--t-background-primary)] w-full"
            />
          </div>

          {/* Minimalist Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0">
            {['All', 'In Build', 'Design & Specs', 'Testing & QA', 'Live / Deployed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`h-[24px] px-2 rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] font-semibold shadow-2xs'
                    : 'text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline Summary & Quick Create */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-[11px] text-[var(--t-font-color-tertiary)] font-mono">
            {activeBuilds} active •{' '}
            <span className="text-[var(--t-font-color-primary)] font-semibold">
              {formatCurrency(totalContractBudget, currency)}
            </span>
          </span>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<IconPlus size={13} />}
            onClick={() => setIsNewProjectModalOpen(true)}
            className="h-[26px] text-[11px]"
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Twenty CRM High-Density Master Spreadsheet Table */}
      <div className="flex-1 overflow-auto border border-[var(--t-border-color-light)] rounded-[6px] bg-[var(--t-background-primary)]">
        <table className="w-full text-left text-[12px] border-collapse min-w-[840px]">
          <thead className="bg-[var(--t-background-secondary)] sticky top-0 z-10 border-b border-[var(--t-border-color-light)] text-[var(--t-font-color-tertiary)] text-[10.5px] font-medium uppercase tracking-wider">
            <tr>
              <th className="py-2 px-3 font-medium min-w-[200px]">Deliverable Project</th>
              <th className="py-2 px-3 font-medium min-w-[140px] whitespace-nowrap">Client</th>
              <th className="py-2 px-3 font-medium w-[120px] whitespace-nowrap">Status</th>
              <th className="py-2 px-3 font-medium w-[150px]">Progress</th>
              <th className="py-2 px-3 font-medium w-[90px] whitespace-nowrap">Milestones</th>
              <th className="py-2 px-3 font-medium text-right w-[100px] whitespace-nowrap">Budget</th>
              <th className="py-2 px-3 font-medium w-[90px] whitespace-nowrap">Target Date</th>
              <th className="py-2 px-3 font-medium text-center w-[90px]">Links</th>
              <th className="py-2 px-3 font-medium text-right w-[120px] whitespace-nowrap">Client Portal</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]">
            {filteredProjects.map((proj) => {
              const completedCount = proj.milestones.filter((m) => m.completed).length;

              return (
                <tr
                  key={proj.id}
                  onClick={() => setActiveProjectDrawerId(proj.id)}
                  className="hover:bg-[var(--t-background-transparent-light)] transition-colors cursor-pointer group h-[38px] align-middle"
                >
                  {/* Project Name & Service Tag */}
                  <td className="py-1.5 px-3 font-normal text-[var(--t-font-color-primary)]">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[190px]">
                        {proj.projectName}
                      </span>
                      <Badge variant="service" size="sm">
                        {proj.serviceType}
                      </Badge>
                    </div>
                  </td>

                  {/* Client Company (Single Line, No Wrap) */}
                  <td className="py-1.5 px-3 font-normal text-[var(--t-font-color-primary)] whitespace-nowrap">
                    {proj.companyName}
                  </td>

                  {/* Clean Twenty Status Badge (Click to Change Status) */}
                  <td className="py-1.5 px-3 relative" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          setStatusDropdownOpenId(
                            statusDropdownOpenId === proj.id ? null : proj.id
                          )
                        }
                        className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <Badge value={proj.status} size="sm" />
                        <IconChevronDown size={11} className="text-[var(--t-font-color-tertiary)]" />
                      </button>

                      {statusDropdownOpenId === proj.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setStatusDropdownOpenId(null)}
                          />
                          <div className="absolute left-0 top-6 z-40 w-[140px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] rounded-[6px] shadow-lg py-1 text-[11px] animate-fade-in">
                            {['Discovery', 'Design & Specs', 'In Build', 'Testing & QA', 'Live / Deployed'].map(
                              (s) => (
                                <button
                                  key={s}
                                  onClick={() => {
                                    updateProject(proj.id, { status: s as ProjectStatus });
                                    setStatusDropdownOpenId(null);
                                  }}
                                  className="w-full px-2.5 py-1 text-left hover:bg-[var(--t-background-transparent-light)] text-[var(--t-font-color-primary)] flex items-center justify-between"
                                >
                                  <span>{s}</span>
                                  {proj.status === s && <IconCheck size={12} className="text-emerald-500" />}
                                </button>
                              )
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Sprint Progress Gauge */}
                  <td className="py-1.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-[4px] bg-[var(--t-background-quaternary)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            proj.progressPercent >= 100 ? 'bg-emerald-500' : 'bg-[var(--t-font-color-primary)]'
                          }`}
                          style={{ width: `${proj.progressPercent}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-[var(--t-font-color-primary)] w-[30px] text-right">
                        {proj.progressPercent}%
                      </span>
                    </div>
                  </td>

                  {/* Milestones Count */}
                  <td className="py-1.5 px-3 font-mono text-[11px] whitespace-nowrap">
                    <span className="text-[var(--t-font-color-primary)]">
                      {completedCount}
                    </span>
                    <span className="text-[var(--t-font-color-tertiary)]">
                      /{proj.milestones.length}
                    </span>
                  </td>

                  {/* Budget */}
                  <td className="py-1.5 px-3 font-mono text-[12px] text-[var(--t-font-color-primary)] text-right whitespace-nowrap">
                    {formatCurrency(proj.budget, currency)}
                  </td>

                  {/* Target Date */}
                  <td className="py-1.5 px-3 text-[11px] text-[var(--t-font-color-tertiary)] font-mono whitespace-nowrap">
                    {formatDate(proj.targetDeliveryDate, timezone)}
                  </td>

                  {/* Workspaces Jump Icons */}
                  <td className="py-1.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5 text-[var(--t-font-color-tertiary)]">
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-400 transition-colors"
                          title="Live Demo"
                        >
                          <IconExternalLink size={13} />
                        </a>
                      )}
                      {proj.figmaUrl && (
                        <a
                          href={proj.figmaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-purple-400 transition-colors"
                          title="Figma Specs"
                        >
                          <IconBrandFigma size={13} />
                        </a>
                      )}
                      {proj.repoUrl && (
                        <a
                          href={proj.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-[var(--t-font-color-primary)] transition-colors"
                          title="GitHub Repo"
                        >
                          <IconBrandGithub size={13} />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Client Portal Link Actions */}
                  <td className="py-1.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="subtle"
                        size="sm"
                        leftIcon={<IconEye size={11} />}
                        onClick={() => setCurrentView('client-portal-preview')}
                        title="View Client Portal"
                      >
                        Portal
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopyClientLink(proj)}
                        title="Copy Client Shareable Link"
                      >
                        <IconCopy size={12} />
                      </Button>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        className="p-1 text-[var(--t-font-color-tertiary)] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Project"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredProjects.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-[var(--t-font-color-tertiary)]">
                  No deliverables found matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-Over Deliverable Milestones Manager Drawer */}
      {activeDrawerProject && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={() => setActiveProjectDrawerId(null)}
          />

          <div className="relative w-full max-w-[540px] h-full bg-[var(--t-background-primary)] border-l border-[var(--t-border-color-medium)] shadow-2xl flex flex-col z-10 animate-slide-right overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[var(--t-border-color-light)] bg-[var(--t-background-secondary)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-[26px] h-[26px] rounded-[5px] bg-[var(--t-background-quaternary)] flex items-center justify-center text-[var(--t-font-color-primary)] shrink-0">
                  <IconRocket size={14} />
                </div>
                <div>
                  <h3 className="text-[13.5px] font-bold text-[var(--t-font-color-primary)]">
                    {activeDrawerProject.projectName}
                  </h3>
                  <p className="text-[11px] text-[var(--t-font-color-tertiary)]">
                    Client: {activeDrawerProject.companyName} • Budget: {formatCurrency(activeDrawerProject.budget, currency)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={<IconCopy size={12} />}
                  onClick={() => handleCopyClientLink(activeDrawerProject)}
                >
                  Share Link
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    confirmAction({
                      title: 'Delete Project Deliverable',
                      message: `Are you sure you want to delete "${activeDrawerProject.projectName}" for ${activeDrawerProject.companyName}?`,
                      confirmText: 'Delete Project',
                      variant: 'danger',
                      onConfirm: () => {
                        deleteProject(activeDrawerProject.id);
                        setActiveProjectDrawerId(null);
                      },
                    });
                  }}
                  title="Delete Project"
                >
                  <IconTrash size={13} className="text-rose-500" />
                </Button>
                <button
                  onClick={() => setActiveProjectDrawerId(null)}
                  className="w-[24px] h-[24px] rounded-[4px] flex items-center justify-center text-[var(--t-font-color-tertiary)] hover:text-[var(--t-font-color-primary)] p-1 cursor-pointer"
                >
                  <IconX size={15} />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-[12px]">
              {/* Status & Progress Slider */}
              <div className="p-3 bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Build Status
                  </label>
                  <Dropdown
                    value={activeDrawerProject.status}
                    onChange={(val) =>
                      updateProject(activeDrawerProject.id, {
                        status: val as ProjectStatus,
                      })
                    }
                    options={[
                      { value: 'Discovery', label: 'Discovery' },
                      { value: 'Design & Specs', label: 'Design & Specs' },
                      { value: 'In Build', label: 'In Build' },
                      { value: 'Testing & QA', label: 'Testing & QA' },
                      { value: 'Live / Deployed', label: 'Live / Deployed' },
                    ]}
                    size="sm"
                    buttonClassName="h-[28px] text-[11.5px] bg-[var(--t-background-primary)]"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Sprint Progress ({activeDrawerProject.progressPercent}%)
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeDrawerProject.progressPercent}
                      onChange={(e) =>
                        updateProject(activeDrawerProject.id, {
                          progressPercent: Number(e.target.value),
                        })
                      }
                      className="flex-1 accent-[var(--t-font-color-primary)] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Client Note */}
              <div className="p-3 bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] space-y-1">
                <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider flex items-center gap-1">
                  <IconSparkles size={13} />
                  Live Message Displayed on Client Portal
                </label>
                <textarea
                  rows={2}
                  value={activeDrawerProject.clientNotes || ''}
                  onChange={(e) =>
                    updateProject(activeDrawerProject.id, { clientNotes: e.target.value })
                  }
                  placeholder="Notes visible to client on their portal (e.g. Wireframes approved, testing API integrations...)"
                  className="w-full bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] rounded-[4px] p-2 text-[12px] text-[var(--t-font-color-primary)] outline-none focus:border-[var(--t-border-color-focus)] resize-none"
                />
              </div>

              {/* Milestones Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                    Milestones ({activeDrawerProject.milestones.length})
                  </span>
                  <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
                    Check off items to auto-update %
                  </span>
                </div>

                <div className="space-y-1">
                  {activeDrawerProject.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleMilestone(activeDrawerProject.id, m.id)}
                      className="h-[34px] px-2.5 rounded-[4px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-[16px] h-[16px] rounded-[3px] flex items-center justify-center shrink-0 ${
                            m.completed
                              ? 'bg-emerald-500 text-white'
                              : 'border border-[var(--t-border-color-strong)] bg-transparent'
                          }`}
                        >
                          {m.completed && <IconCheck size={11} stroke={3} />}
                        </div>
                        <span
                          className={`truncate text-[11.5px] ${
                            m.completed
                              ? 'line-through text-[var(--t-font-color-tertiary)]'
                              : 'font-medium text-[var(--t-font-color-primary)]'
                          }`}
                        >
                          {m.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-[var(--t-font-color-tertiary)]">
                          {formatDate(m.dueDate)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMilestone(activeDrawerProject.id, m.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[var(--t-font-color-tertiary)] hover:text-rose-500 p-0.5"
                        >
                          <IconTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Milestone Form */}
                <form
                  onSubmit={handleAddMilestoneToActive}
                  className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--t-border-color-light)]"
                >
                  <input
                    type="text"
                    required
                    placeholder="Add milestone checkpoint..."
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="flex-1 h-[28px] px-2 text-[11.5px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] rounded-[4px] outline-none"
                  />
                  <input
                    type="date"
                    value={newMilestoneDueDate}
                    onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                    className="h-[28px] px-1 text-[11px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] rounded-[4px] outline-none"
                  />
                  <Button type="submit" variant="primary" size="sm">
                    Add
                  </Button>
                </form>
              </div>

              {/* Artifacts URLs */}
              <div className="p-3 bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] space-y-2">
                <div className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                  Deliverable URLs
                </div>
                <div className="space-y-1.5">
                  <Input
                    placeholder="Live Preview / Demo URL"
                    value={activeDrawerProject.liveUrl || ''}
                    onChange={(e) =>
                      updateProject(activeDrawerProject.id, { liveUrl: e.target.value })
                    }
                    leftIcon={<IconExternalLink size={13} />}
                    className="h-[28px] text-[11px]"
                  />
                  <Input
                    placeholder="Figma Specs URL"
                    value={activeDrawerProject.figmaUrl || ''}
                    onChange={(e) =>
                      updateProject(activeDrawerProject.id, { figmaUrl: e.target.value })
                    }
                    leftIcon={<IconBrandFigma size={13} />}
                    className="h-[28px] text-[11px]"
                  />
                  <Input
                    placeholder="GitHub Repo URL"
                    value={activeDrawerProject.repoUrl || ''}
                    onChange={(e) =>
                      updateProject(activeDrawerProject.id, { repoUrl: e.target.value })
                    }
                    leftIcon={<IconBrandGithub size={13} />}
                    className="h-[28px] text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
