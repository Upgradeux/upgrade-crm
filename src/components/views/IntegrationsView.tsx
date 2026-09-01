'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import {
  IconApps,
  IconVideo,
  IconBrandWhatsapp,
  IconDatabase,
  IconBrandStripe,
  IconWebhook,
  IconMail,
  IconSearch,
  IconCheck,
  IconSettings,
  IconExternalLink,
  IconInfoCircle,
  IconSparkles,
  IconCopy,
  IconSend,
  IconRefresh,
} from '@tabler/icons-react';

interface IntegrationItem {
  id: string;
  name: string;
  category: 'Scheduling' | 'Communication' | 'Database' | 'Automation' | 'Billing';
  description: string;
  howToUse: string[];
  icon: React.ReactNode;
  status: 'Connected' | 'Ready to Connect' | 'Active';
}

export function IntegrationsView() {
  const {
    integrationsConfig,
    updateIntegrationsConfig,
    supabaseConfig,
    setSupabaseConfig,
    addLead,
    addToast,
  } = useCRM();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<IntegrationItem | null>(null);

  // Form states
  const [calCom, setCalCom] = useState(integrationsConfig.calComUsername || 'upgradeux');
  const [googleEmail, setGoogleEmail] = useState(integrationsConfig.googleCalendarEmail || 'meetings@upgradeux.com');
  const [whatsAppPhone, setWhatsAppPhone] = useState(integrationsConfig.whatsAppPhone || '+91 98765 43210');
  const [n8nUrl, setN8nUrl] = useState(integrationsConfig.n8nWebhookUrl || 'https://n8n.upgradeux.com/webhook/crm-lead-trigger');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const localWebhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/inbound-leads` : '/api/inbound-leads';

  const apps: IntegrationItem[] = [
    {
      id: 'calcom',
      name: 'Cal.com Live Scheduling',
      category: 'Scheduling',
      description: 'Embed live calendar scheduling and direct demo call booking into the CRM and Client Portal.',
      howToUse: [
        'Adds 1-click "Book Meeting" button to every lead drawer.',
        'Automatically syncs scheduled appointments into your pipeline as "Booked Meeting".',
        'Displays a "Schedule sync on Cal.com" button directly on your client-facing portal.',
      ],
      icon: (
        <div className="w-[28px] h-[28px] rounded-[6px] bg-black text-white border border-white/20 flex items-center justify-center font-bold text-[12px]">
          C
        </div>
      ),
      status: integrationsConfig.calComUsername ? 'Connected' : 'Ready to Connect',
    },
    {
      id: 'google-meet',
      name: 'Google Meet & Calendar (IST)',
      category: 'Scheduling',
      description: 'Auto-generate private Google Meet video conference rooms for discovery and review calls.',
      howToUse: [
        'Generates encrypted meet.google.com links whenever you book a demo.',
        'Saves the meeting link into the lead’s audit history in IST/Indian time.',
        'Enables 1-click video join directly from the lead drawer or project dashboard.',
      ],
      icon: (
        <div className="w-[28px] h-[28px] rounded-[6px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
          <IconVideo size={16} />
        </div>
      ),
      status: integrationsConfig.googleCalendarEmail ? 'Connected' : 'Ready to Connect',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Web & API (+91)',
      category: 'Communication',
      description: 'Instant WhatsApp click-to-chat jump to pitch local business owners with custom AI voice scripts.',
      howToUse: [
        'Click the WhatsApp icon on any lead to launch WhatsApp Web with a pre-filled pitch.',
        'Supports Indian (+91) and international numbers for instant outreach.',
        'Logs outreach timestamps automatically in the lead’s activity timeline.',
      ],
      icon: (
        <div className="w-[28px] h-[28px] rounded-[6px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
          <IconBrandWhatsapp size={16} />
        </div>
      ),
      status: 'Connected',
    },
    {
      id: 'supabase',
      name: 'Supabase PostgreSQL Cloud DB',
      category: 'Database',
      description: 'Real-time PostgreSQL cloud database with automated backups and multi-device team sync.',
      howToUse: [
        'Synchronizes leads and projects across all team members in real-time.',
        'Provides 1-click SQL migration scripts to create production tables with Row Level Security (RLS).',
        'Automatic cloud backup so your agency data is always protected.',
      ],
      icon: (
        <div className="w-[28px] h-[28px] rounded-[6px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
          <IconDatabase size={16} />
        </div>
      ),
      status: supabaseConfig.isConnected ? 'Connected' : 'Ready to Connect',
    },
    {
      id: 'n8n',
      name: 'n8n & Make.com Webhooks',
      category: 'Automation',
      description: 'Trigger autonomous AI voice agent deployments, automated follow-up sequences, and lead enrichment.',
      howToUse: [
        'When a deal moves to "Won", automatically triggers an n8n workflow to provision client credentials.',
        'Enrich Google Maps leads automatically with owner names, LinkedIn profiles, and verified emails.',
        'Connect Twilio and LiveKit agents directly to new client records.',
      ],
      icon: (
        <div className="w-[28px] h-[28px] rounded-[6px] bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
          <IconWebhook size={16} />
        </div>
      ),
      status: 'Connected',
    },
    {
      id: 'inbound-webhook',
      name: 'Website Inbound Leads API (/api/inbound-leads)',
      category: 'Automation',
      description: 'Live Next.js API endpoint to capture contact form submissions from your agency website.',
      howToUse: [
        'Send POST requests from your website contact form to /api/inbound-leads.',
        'Submissions are instantly validated and queued into your "Needs Outreach" view.',
        'Returns JSON confirmation with lead ID and audit timestamp.',
      ],
      icon: (
        <div className="w-[28px] h-[28px] rounded-[6px] bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center">
          <IconMail size={16} />
        </div>
      ),
      status: 'Active',
    },
    {
      id: 'stripe',
      name: 'Stripe & Razorpay Milestone Invoicing',
      category: 'Billing',
      description: 'Generate contract milestone invoice payment links directly for active client deliverables.',
      howToUse: [
        'Generate milestone deposit and final delivery payment links.',
        'Clients can pay directly from their upgradeUX Client Portal view.',
        'Auto-updates milestone completion when invoice payment is confirmed.',
      ],
      icon: (
        <div className="w-[28px] h-[28px] rounded-[6px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center">
          <IconBrandStripe size={16} />
        </div>
      ),
      status: 'Ready to Connect',
    },
  ];

  const filteredApps = apps.filter((app) => {
    const matchesCategory =
      categoryFilter === 'All' ||
      (categoryFilter === 'Connected' ? app.status === 'Connected' || app.status === 'Active' : app.category === categoryFilter);
    const matchesSearch =
      !search ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase()) ||
      app.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateIntegrationsConfig({
      calComUsername: calCom.trim(),
      googleCalendarEmail: googleEmail.trim(),
      whatsAppPhone: whatsAppPhone.trim(),
      n8nWebhookUrl: n8nUrl.trim(),
    });
    setSelectedApp(null);
    addToast('Integration settings saved successfully!', 'success');
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(localWebhookUrl);
    setCopiedWebhook(true);
    addToast('Live API Webhook endpoint copied!', 'info');
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleSendTestLead = async () => {
    setIsSendingTest(true);
    try {
      const res = await fetch('/api/inbound-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Zenith Labs India',
          contactName: 'Rohit Sharma',
          email: 'rohit@zenithlabs.in',
          phone: '+91 98200 11223',
          source: 'Website Inbound',
          serviceInterest: 'AI Voice Agent',
          dealValue: 250000,
          location: 'Bengaluru, India',
          notes: 'Interested in 24/7 AI Voice Receptionist for 5 clinic locations across India.',
        }),
      });

      if (res.ok) {
        addLead({
          companyName: 'Zenith Labs India',
          contactName: 'Rohit Sharma',
          email: 'rohit@zenithlabs.in',
          phone: '+91 98200 11223',
          websiteUrl: 'https://zenithlabs.in',
          source: 'Website Inbound',
          serviceInterest: 'AI Voice Agent',
          dealValue: 250000,
          location: 'Bengaluru, India',
          status: 'Not Contacted',
          outreachStage: 'Needs Outreach',
          leadOwner: 'Alex (Founder)',
          socials: {},
          initialNote: 'Captured via /api/inbound-leads endpoint. High intent for AI Voice Receptionist.',
        });
        addToast('Test Inbound Lead received & added to CRM!', 'success');
      } else {
        addToast('Webhook test returned non-200 status', 'warning');
      }
    } catch (e: any) {
      addToast(`Webhook test failed: ${e.message}`, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-y-auto bg-[var(--t-background-primary)] flex flex-col gap-2.5 select-none">
      {/* Twenty Style Toolbar */}
      <div className="h-[38px] px-2.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-[180px] sm:w-[220px]">
            <Input
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<IconSearch size={13} />}
              className="h-[26px] text-[12px] bg-[var(--t-background-primary)]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="hidden md:flex items-center gap-1">
            {['All', 'Connected', 'Scheduling', 'Communication', 'Automation', 'Database', 'Billing'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`h-[24px] px-2 rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[var(--t-btn-primary-bg)] text-[var(--t-btn-primary-text)] font-semibold shadow-2xs'
                    : 'text-[var(--t-font-color-secondary)] hover:text-[var(--t-font-color-primary)] hover:bg-[var(--t-background-transparent-light)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] font-mono text-[var(--t-font-color-tertiary)] shrink-0 hidden sm:inline">
          {apps.filter((a) => a.status === 'Connected' || a.status === 'Active').length} connected apps
        </div>
      </div>

      {/* Grid of App Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            onClick={() => setSelectedApp(app)}
            className="p-3.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] hover:border-[var(--t-border-color-medium)] transition-all cursor-pointer group flex flex-col justify-between gap-3 shadow-2xs"
          >
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {app.icon}
                  <div>
                    <h3 className="text-[12.5px] font-medium text-[var(--t-font-color-primary)] group-hover:underline">
                      {app.name}
                    </h3>
                    <span className="text-[10.5px] text-[var(--t-font-color-tertiary)]">
                      {app.category}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-[3px] font-mono ${
                    app.status === 'Connected' || app.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-[var(--t-background-transparent-light)] text-[var(--t-font-color-tertiary)] border border-[var(--t-border-color-light)]'
                  }`}
                >
                  {app.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11.5px] text-[var(--t-font-color-secondary)] leading-relaxed line-clamp-2">
                {app.description}
              </p>
            </div>

            {/* Card Footer: How to use trigger */}
            <div className="pt-2 border-t border-[var(--t-border-color-light)] flex items-center justify-between text-[11px]">
              <span className="text-[var(--t-font-color-tertiary)] group-hover:text-[var(--t-font-color-primary)] transition-colors flex items-center gap-1">
                <IconSparkles size={12} />
                <span>Feature Guide</span>
              </span>

              <Button
                variant="subtle"
                size="sm"
                className="h-[22px] px-2 text-[10.5px]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedApp(app);
                }}
              >
                Configure
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Detail & Configure Modal */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`${selectedApp.name}`}
          subtitle={`Configure connection and review how this feature integrates with upgradeUX`}
          maxWidth="max-w-[560px]"
        >
          <div className="space-y-3.5 text-[12px]">
            {/* Feature Usage Guide */}
            <div className="p-3 bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] space-y-2">
              <div className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <IconSparkles size={13} />
                How this feature works in upgradeUX
              </div>
              <ul className="space-y-1.5 text-[11.5px] text-[var(--t-font-color-primary)]">
                {selectedApp.howToUse.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <IconCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Live Interactive Action Shortcuts */}
            <div className="p-3 bg-[var(--t-background-secondary)] rounded-[6px] border border-[var(--t-border-color-light)] space-y-2">
              <div className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                Live App Actions & Tests
              </div>

              {selectedApp.id === 'calcom' && (
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-[var(--t-font-color-secondary)]">
                    Test live Cal.com booking page:
                  </span>
                  <a
                    href={`https://cal.com/${calCom}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] text-[var(--t-font-color-primary)] hover:underline font-medium"
                  >
                    <span>Open cal.com/{calCom}</span>
                    <IconExternalLink size={12} />
                  </a>
                </div>
              )}

              {selectedApp.id === 'google-meet' && (
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-[var(--t-font-color-secondary)]">
                    Launch new Google Meet video room:
                  </span>
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] text-[var(--t-font-color-primary)] hover:underline font-medium"
                  >
                    <span>meet.google.com/new</span>
                    <IconExternalLink size={12} />
                  </a>
                </div>
              )}

              {selectedApp.id === 'whatsapp' && (
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-[var(--t-font-color-secondary)]">
                    Test WhatsApp Web click-to-chat jump:
                  </span>
                  <a
                    href={`https://wa.me/919876543210?text=${encodeURIComponent('Hi from upgradeUX! We build custom AI Voice Receptionists for high volume local businesses.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] text-emerald-500 hover:underline font-medium"
                  >
                    <span>Launch WhatsApp Chat (+91)</span>
                    <IconBrandWhatsapp size={13} />
                  </a>
                </div>
              )}

              {selectedApp.id === 'inbound-webhook' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] text-[var(--t-font-color-secondary)]">
                      Simulate incoming website lead to /api/inbound-leads:
                    </span>
                    <Button
                      variant="subtle"
                      size="sm"
                      leftIcon={<IconSend size={12} />}
                      disabled={isSendingTest}
                      onClick={handleSendTestLead}
                    >
                      {isSendingTest ? 'Sending...' : 'Send Test Lead'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Configuration Form */}
            <form onSubmit={handleSaveConfig} className="space-y-3">
              {selectedApp.id === 'calcom' && (
                <div>
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Cal.com Username
                  </label>
                  <Input
                    value={calCom}
                    onChange={(e) => setCalCom(e.target.value)}
                    placeholder="upgradeux"
                    className="h-[28px] text-[12px]"
                  />
                </div>
              )}

              {selectedApp.id === 'google-meet' && (
                <div>
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Google Calendar Account Email
                  </label>
                  <Input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="meetings@upgradeux.com"
                    className="h-[28px] text-[12px]"
                  />
                </div>
              )}

              {selectedApp.id === 'whatsapp' && (
                <div>
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Agency WhatsApp Phone Number (+91)
                  </label>
                  <Input
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-[28px] text-[12px]"
                  />
                </div>
              )}

              {selectedApp.id === 'inbound-webhook' && (
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                    Live API Inbound Endpoint
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={localWebhookUrl}
                      className="flex-1 h-[28px] px-2 text-[11px] font-mono bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] rounded-[4px] text-[var(--t-font-color-primary)] outline-none select-all"
                    />
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      leftIcon={copiedWebhook ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      onClick={handleCopyWebhook}
                    >
                      {copiedWebhook ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
              )}

              {selectedApp.id === 'supabase' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                      Supabase Project URL
                    </label>
                    <Input
                      value={supabaseConfig.url}
                      onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                      placeholder="https://xyzcompany.supabase.co"
                      className="h-[28px] text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider block mb-1">
                      Supabase Anon / Public API Key
                    </label>
                    <Input
                      type="password"
                      value={supabaseConfig.anonKey}
                      onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="h-[28px] text-[12px]"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--t-border-color-light)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedApp(null)}
                >
                  Close
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Settings
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
