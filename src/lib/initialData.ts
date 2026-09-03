import { Lead, Project, CRMTask, CRMNote } from '@/types/crm';

export const INITIAL_LEADS: Lead[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_TASKS: CRMTask[] = [
  {
    id: 'task-1',
    title: 'Review cold call scripts & audio demo for AI Voice Agent',
    description: 'Prepare talking points for inbound business inquiries and local salon leads.',
    priority: 'high',
    status: 'in_progress',
    category: 'Sales Pitch & Scripts' as any,
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    assignedTo: 'Alex (Founder)',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Audit Google Maps extracted leads for missing websites',
    description: 'Identify prospects with zero websites to pitch Web Development package.',
    priority: 'medium',
    status: 'todo',
    category: 'Outreach & Calls',
    dueDate: new Date(Date.now() + 172800000).toISOString(),
    assignedTo: 'Alex (Founder)',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Setup automated Google Meet video links for bookings',
    description: 'Ensure permanent room link https://meet.google.com/oic-saem-syo is attached to booked calls.',
    priority: 'low',
    status: 'done',
    category: 'Internal / Admin',
    completed: true,
    completedAt: new Date().toISOString(),
    assignedTo: 'Alex (Founder)',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_NOTES: CRMNote[] = [
  {
    id: 'note-1',
    title: 'AI Voice Agent Cold Outreach Pitch (Tested & High Converting)',
    content: `Hi [Name], I noticed your business gets high search volume on Google Maps. We build AI Voice receptionists that answer 100% of missed customer calls, book appointments directly, and never miss a revenue opportunity. Would you be open to hearing a 30-second audio demo?`,
    category: 'Sales Pitch & Scripts',
    isPinned: true,
    color: 'indigo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: 'Website Development Pitch for Businesses with No Website',
    content: `Hi [Name], found your listing on Google Maps. Notice you don't have an official modern website yet — competitors nearby are capturing online inquiries. We build fast, mobile-friendly landing pages that rank high on Google and convert visitors into calls.`,
    category: 'Sales Pitch & Scripts',
    isPinned: true,
    color: 'emerald',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
