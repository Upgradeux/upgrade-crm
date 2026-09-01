export type LeadStatus =
  | 'Not Contacted'
  | 'Contacted'
  | 'Booked Call'
  | 'In Processing / Proposal'
  | 'Won'
  | 'Lost';

export type OutreachStage =
  | 'Needs Outreach'
  | 'Contacted'
  | 'Follow-Up Needed'
  | 'Closed';

export type LeadSource =
  | 'Google Maps'
  | 'Instagram'
  | 'LinkedIn'
  | 'Cold Email'
  | 'Website Inbound'
  | 'Referral'
  | 'Other';

export type CallOutcome =
  | 'Not Called'
  | 'Left Voicemail'
  | 'Spoke with Gatekeeper'
  | 'Spoke with Decision Maker'
  | 'Callback Scheduled'
  | 'Wrong Number';

export type ServiceType =
  | 'Web Development'
  | 'AI Voice Agent'
  | 'Workflow / n8n Automation'
  | 'AI Chatbot'
  | 'Monthly Retainer';

export type ProjectStatus =
  | 'Discovery'
  | 'Design & Specs'
  | 'In Build'
  | 'Testing & QA'
  | 'Live / Deployed';

export type UserRole =
  | 'Admin (Full Access)'
  | 'Closer / Sales Lead'
  | 'Cold Caller / Outreach Specialist'
  | 'Project Manager'
  | 'Developer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarColor: string;
  phone?: string;
  calComLink?: string;
  joinedAt: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  type?: 'note' | 'call' | 'email' | 'meeting' | 'system';
  callOutcome?: CallOutcome;
}

export interface SocialLinks {
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  maps?: string;
  facebook?: string;
  youtube?: string;
  github?: string;
  other?: string;
}

export interface IndustrySpace {
  id: string;
  name: string;
  slug: string;
  color?: string;
  isDefault?: boolean;
}

export interface Lead {
  id: string;
  companyName: string;
  contactName?: string;
  websiteUrl: string;
  location: string;
  phone: string;
  email: string;
  source: LeadSource;
  callOutcome?: CallOutcome;
  socials: SocialLinks;
  mapsUrl?: string;
  status: LeadStatus;
  outreachStage: OutreachStage;
  dealValue: number;
  serviceInterest: ServiceType;
  industry?: string;
  industrySpaceId?: string;
  leadOwner: string;
  notes: Note[];
  lastContactedAt?: string;
  nextFollowUpDate?: string;
  bookedMeetingDate?: string;
  googleMeetLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  deliverableLink?: string;
}

export interface Project {
  id: string;
  companyId: string;
  companyName: string;
  projectName: string;
  serviceType: ServiceType;
  industry?: string;
  industrySpaceId?: string;
  status: ProjectStatus;
  progressPercent: number;
  milestones: Milestone[];
  budget: number;
  startDate: string;
  targetDeliveryDate: string;
  repoUrl?: string;
  figmaUrl?: string;
  liveUrl?: string;
  clientAccessKey?: string;
  clientNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InboundSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  interests: string[];
  message: string;
  budget?: string;
  deadline?: string;
  source: 'Website Contact Form' | 'Cal.com Booking' | 'API';
  status: 'new' | 'converted' | 'dismissed';
  convertedLeadId?: string;
  createdAt: string;
}

export type CRMView =
  | 'pipeline'
  | 'needs-outreach'
  | 'contacted'
  | 'all-leads'
  | 'inbound-leads'
  | 'projects'
  | 'client-portal-preview'
  | 'team'
  | 'settings'
  | 'analytics';

export interface FilterState {
  searchQuery: string;
  status: LeadStatus | 'All';
  outreachStage: OutreachStage | 'All';
  serviceType: ServiceType | 'All';
  source: LeadSource | 'All';
  assignedTo: string | 'All';
  location: string;
  minDealValue: number;
  maxDealValue: number;
  sortBy: 'createdAt' | 'dealValue' | 'companyName' | 'lastContactedAt' | 'progressPercent';
  sortOrder: 'asc' | 'desc';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

export interface AppIntegration {
  id: string;
  name: string;
  category: 'Scheduling' | 'Communication' | 'Database' | 'Automation' | 'Billing' | 'Lead Sourcing';
  description: string;
  howToUse: string;
  iconName: string;
  isConnected: boolean;
  config: Record<string, string>;
  docsUrl?: string;
}

export interface IntegrationsConfig {
  calComUsername: string;
  googleMeetEnabled: boolean;
  defaultGoogleMeetUrl?: string;
  googleCalendarEmail: string;
  emailSyncAddress: string;
  whatsAppPhone?: string;
  whatsAppApiKey?: string;
  n8nWebhookUrl?: string;
  stripePublishableKey?: string;
  webhookInboundUrl: string;
}
