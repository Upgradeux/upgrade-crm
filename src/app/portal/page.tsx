'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Project } from '@/types/crm';
import { INITIAL_PROJECTS } from '@/lib/initialData';
import {
  IconRocket,
  IconCheck,
  IconClock,
  IconExternalLink,
  IconBrandGithub,
  IconBrandFigma,
  IconShieldCheck,
  IconCalendar,
  IconLock,
  IconSparkles,
  IconBrandWhatsapp,
  IconMail,
  IconChecklist,
  IconLink,
} from '@tabler/icons-react';
import { formatDate } from '@/lib/utils';
import { fetchProjectsFromSupabase } from '@/lib/supabase';

function ClientPortalContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get('key') || '';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortalProject() {
      if (!key) {
        setLoading(false);
        return;
      }

      try {
        const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        if (envUrl && envKey) {
          const remoteProjects = await fetchProjectsFromSupabase({ url: envUrl, anonKey: envKey, isConnected: true });
          if (remoteProjects) {
            const found = remoteProjects.find((p) => p.clientAccessKey === key);
            if (found) {
              setProject(found);
              setLoading(false);
              return;
            }
          }
        }

        const initialFound = INITIAL_PROJECTS.find((p) => p.clientAccessKey === key);
        if (initialFound) {
          setProject(initialFound);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Portal load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPortalProject();
  }, [key]);

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-[#f8f9fb] flex flex-col items-center justify-center gap-3 select-none text-[#1e293b]">
        <div className="w-[38px] h-[38px] rounded-[8px] bg-white border border-[#e2e4e9] flex items-center justify-center p-1.5 shadow-xs">
          <img src="/logo.png" alt="upgradeUX" className="w-full h-full object-contain" />
        </div>
        <div className="inline-block w-4 h-4 border-2 border-[#5d4ef7]/30 border-t-[#5d4ef7] rounded-full animate-spin" />
        <span className="text-[11.5px] font-mono text-[#64748b]">Verifying secure client access...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen w-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-4 text-[#1e293b] select-none">
        <div className="w-full max-w-[400px] bg-white border border-[#e2e4e9] rounded-[10px] p-6 text-center space-y-3.5 shadow-sm">
          <div className="w-[40px] h-[40px] rounded-[8px] bg-rose-50 border border-rose-100 text-rose-500 mx-auto flex items-center justify-center">
            <IconLock size={18} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-[#0f172a] tracking-tight">
              Secure Client Portal
            </h1>
            <p className="text-[12px] text-[#64748b] mt-1">
              Project link not found or access token has expired.
            </p>
          </div>
          <div className="p-3 rounded-[6px] bg-[#f8fafc] border border-[#e2e8f0] text-[11.5px] text-[#475569] leading-relaxed">
            Please contact <strong>upgradeUX</strong> at <a href="mailto:upgradeux.agency@gmail.com" className="text-[#5d4ef7] font-medium underline">upgradeux.agency@gmail.com</a>.
          </div>
        </div>
      </div>
    );
  }

  const completedCount = project.milestones.filter((m) => m.completed).length;

  return (
    <div className="min-h-screen w-screen bg-[#f8f9fb] text-[#1e293b] p-3.5 sm:p-6 overflow-y-auto">
      {/* Container */}
      <div className="max-w-[720px] w-full mx-auto space-y-3.5">
        {/* Top Navbar */}
        <div className="h-[44px] px-3.5 rounded-[8px] bg-white border border-[#e2e4e9] flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-[22px] h-[22px] rounded-[4px] bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center p-0.5 shrink-0">
              <img src="/logo.png" alt="upgradeUX" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium leading-tight">
              <span className="font-bold text-[#0f172a] tracking-tight">upgradeUX</span>
              <span className="text-[#cbd5e1]">/</span>
              <span className="text-[#64748b] truncate max-w-[200px]">{project.companyName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10.5px] font-medium flex items-center gap-1">
              <IconShieldCheck size={12} />
              <span>Verified Client Safe</span>
            </span>
          </div>
        </div>

        {/* Project Overview Main Card */}
        <div className="bg-white border border-[#e2e4e9] rounded-[10px] p-5 shadow-xs space-y-4">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-[#f1f5f9]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[17px] font-bold text-[#0f172a] tracking-tight">
                  {project.projectName}
                </h1>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] text-[11px] font-medium font-mono">
                  {project.serviceType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11.5px] text-[#64748b] mt-1 font-mono">
                <span>Kickoff: {formatDate(project.startDate)}</span>
                <span>•</span>
                <span>Target Delivery: {formatDate(project.targetDeliveryDate)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-[5px] bg-[#f8fafc] border border-[#e2e8f0] text-[11.5px] font-semibold text-[#334155]">
                {project.status}
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
                {project.progressPercent}% ({completedCount}/{project.milestones.length} Milestones)
              </span>
            </div>
            <div className="w-full h-[6px] bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${project.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Agency Announcement Note */}
          {project.clientNotes && (
            <div className="p-3 rounded-[6px] bg-[#fffbeb] border border-[#fef3c7] space-y-1">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-amber-700 uppercase tracking-wider">
                <IconSparkles size={13} />
                <span>Live Update from Engineering Team</span>
              </div>
              <p className="text-[12px] text-[#78350f] leading-relaxed">
                {project.clientNotes}
              </p>
            </div>
          )}

          {/* Milestones Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
                <IconChecklist size={13} />
                <span>Project Milestones Checklist</span>
              </div>
              <span className="text-[10.5px] text-[#94a3b8] font-mono">
                {completedCount} of {project.milestones.length} completed
              </span>
            </div>
            <div className="space-y-1.5">
              {project.milestones.map((m) => (
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
                    <span>Due {formatDate(m.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables / Production Links */}
          {(project.liveUrl || project.figmaUrl || project.repoUrl) && (
            <div className="space-y-2 pt-2 border-t border-[#f1f5f9]">
              <div className="text-[10.5px] font-semibold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
                <IconLink size={12} />
                <span>Deliverables & Resources</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl.startsWith('http') ? project.liveUrl : `https://${project.liveUrl}`}
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
                {project.figmaUrl && (
                  <a
                    href={project.figmaUrl.startsWith('http') ? project.figmaUrl : `https://${project.figmaUrl}`}
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
                {project.repoUrl && (
                  <a
                    href={project.repoUrl.startsWith('http') ? project.repoUrl : `https://${project.repoUrl}`}
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
              <div className="text-[12.5px] font-bold text-[#0f172a]">
                Have questions or need adjustments?
              </div>
              <div className="text-[11px] text-[#64748b] mt-0.5">
                Book a 15-minute review call or message us directly on WhatsApp.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://wa.me/918369672169"
                target="_blank"
                rel="noreferrer"
                className="h-[30px] px-2.5 rounded-[5px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <IconBrandWhatsapp size={13} />
                <span>WhatsApp</span>
              </a>

              <a
                href="https://cal.com/upgradeux"
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

        {/* Footer */}
        <div className="text-center text-[10.5px] font-mono text-[#94a3b8]">
          © {new Date().getFullYear()} upgradeUX Agency. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-screen bg-[#f8f9fb] flex items-center justify-center text-[#1e293b]">
          <div className="inline-block w-4 h-4 border-2 border-[#5d4ef7]/30 border-t-[#5d4ef7] rounded-full animate-spin" />
        </div>
      }
    >
      <ClientPortalContent />
    </Suspense>
  );
}
