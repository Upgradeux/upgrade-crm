'use client';

import React from 'react';
import { CRMProvider, useCRM } from '@/lib/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { ToastContainer } from '@/components/ui/ToastContainer';

// Views
import { PipelineView } from '@/components/views/PipelineView';
import { NeedsOutreachView } from '@/components/views/NeedsOutreachView';
import { ContactedView } from '@/components/views/ContactedView';
import { AllLeadsView } from '@/components/views/AllLeadsView';
import { InboundSubmissionsView } from '@/components/views/InboundSubmissionsView';
import { ProjectsView } from '@/components/views/ProjectsView';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { ClientPortalPreview } from '@/components/views/ClientPortalPreview';
import { TeamView } from '@/components/views/TeamView';
import { IntegrationsView } from '@/components/views/IntegrationsView';
import { SettingsView } from '@/components/views/SettingsView';

// Drawers & Modals
import { LeadDetailDrawer } from '@/components/drawers/LeadDetailDrawer';
import { NewLeadModal } from '@/components/drawers/NewLeadModal';
import { WonDealModal } from '@/components/drawers/WonDealModal';
import { ImportCsvModal } from '@/components/drawers/ImportCsvModal';
import { NewProjectModal } from '@/components/drawers/NewProjectModal';
import { WhatsAppModal } from '@/components/modals/WhatsAppModal';
import { InstagramDMModal } from '@/components/modals/InstagramDMModal';
import { EmailComposerModal } from '@/components/modals/EmailComposerModal';
import { BookMeetingModal } from '@/components/modals/BookMeetingModal';
import { CreateSpaceModal } from '@/components/modals/CreateSpaceModal';
import { EditSpaceModal } from '@/components/modals/EditSpaceModal';

function CRMContent() {
  const { currentView } = useCRM();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--t-background-primary)] text-[var(--t-font-color-primary)] font-sans">
      {/* Twenty Style Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Universal Top Navigation */}
        <TopNav />

        {/* Dynamic Viewport */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {currentView === 'pipeline' && <PipelineView />}
          {currentView === 'inbound-leads' && <InboundSubmissionsView />}
          {currentView === 'needs-outreach' && <NeedsOutreachView />}
          {currentView === 'contacted' && <ContactedView />}
          {currentView === 'all-leads' && <AllLeadsView />}
          {currentView === 'projects' && <ProjectsView />}
          {currentView === 'client-portal-preview' && <ClientPortalPreview />}
          {currentView === 'team' && <TeamView />}
          {currentView === 'integrations' && <IntegrationsView />}
          {currentView === 'analytics' && <AnalyticsView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Slide-overs & Modals */}
      <LeadDetailDrawer />
      <NewLeadModal />
      <WonDealModal />
      <ImportCsvModal />
      <NewProjectModal />
      <WhatsAppModal />
      <InstagramDMModal />
      <EmailComposerModal />
      <BookMeetingModal />
      <CreateSpaceModal />
      <EditSpaceModal />
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}

export default function Page() {
  return (
    <CRMProvider>
      <CRMContent />
    </CRMProvider>
  );
}
