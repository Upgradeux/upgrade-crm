export type LeadStatus =
  | 'Leads'
  | 'Not Contacted'
  | 'Contacted'
  | 'Booked Meeting'
  | 'Booked Call'
  | 'Proposal Sent'
  | 'In Processing / Proposal'
  | 'Lost'
  | 'Won';

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
  | 'AI Automation'
  | 'Google Business Profile'
  | 'Meta Ads'
  | 'AI Chatbot'
  | 'Workflow / n8n Automation'
  | 'Monthly Retainer'
  | 'Lead Generation';

export type ProjectStatus =
  | 'Discovery'
  | 'Design & Specs'
  | 'In Build'
  | 'Testing & QA'
  | 'Live / Deployed';

export type UserRole =
  | 'Founder'
  | 'Co-Founder'
  | 'Cold Caller'
  | 'Developer'
  | 'Admin (Full Access)'
  | 'Closer / Sales Lead'
  | 'Cold Caller / Outreach Specialist'
  | 'Project Manager';

export type ActivityStatusPreset =
  | 'Calling Clients'
  | 'Messaging Clients'
  | 'In Meeting'
  | 'Finding Leads'
  | 'Working on Social Media'
  | 'In Dev Mode'
  | 'In Design Mode'
  | 'Sleeping'
  | 'Eating'
  | 'Available / Online'
  | 'Custom';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  avatarColor: string;
  avatarUrl?: string;
  phone?: string;
  calComLink?: string;
  joinedAt: string;
  lastActiveAt?: string;
  activityStatus?: string;
  activityIcon?: string;
  statusNote?: string;
}

export interface TeamPresenceRecord {
  memberId: string;
  memberName: string;
  memberEmail?: string;
  role?: string;
  avatarColor?: string;
  avatarUrl?: string;
  lastActiveAt: string;
  activityStatus: string;
  activityIcon?: string;
  statusNote?: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  type?: 'note' | 'call' | 'email' | 'meeting' | 'system' | 'task';
  callOutcome?: CallOutcome;
  isPinned?: boolean;
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

export type FollowUpChannel = 'whatsapp' | 'email' | 'instagram' | 'reminder';

export interface FollowUpItem {
  id: string;
  channel: FollowUpChannel;
  scheduledDate: string;
  note?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
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
  services?: ServiceType[];
  rating?: number;
  reviewCount?: number;
  alternatePhone?: string;
  industry?: string;
  industrySpaceId?: string;
  leadOwner: string;
  notes: Note[];
  lastContactedAt?: string;
  nextFollowUpDate?: string;
  activeFollowUp?: FollowUpItem;
  followUps?: FollowUpItem[];
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

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskCategory =
  | 'Outreach & Calls'
  | 'Proposal & Sales'
  | 'Client Work'
  | 'Internal / Admin'
  | 'Self Reminder';

export interface CRMTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueDate?: string;
  dueTime?: string;
  assignedTo: string;
  leadId?: string;
  leadName?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteCategory =
  | 'General'
  | 'Sales Pitch & Scripts'
  | 'Client Meeting'
  | 'Strategy & Ideas'
  | 'Standard SOP';

export interface CRMNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  isPinned: boolean;
  color?: string;
  leadId?: string;
  leadName?: string;
  createdAt: string;
  updatedAt: string;
}

export type CRMView =
  | 'pipeline'
  | 'needs-outreach'
  | 'contacted'
  | 'follow-ups'
  | 'tasks-notes'
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
