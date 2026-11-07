import { z } from 'zod';

export const roundSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Round name is required'),
  weight: z.number().min(0).max(100),
  active: z.boolean(),
});

export const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  venue: z.string().min(3, 'Venue is required'),
  starts_at: z.string().min(1, 'Start time is required'),
  ends_at: z.string().min(1, 'End time is required'),
  visibility: z.enum(['public', 'private']),
  seeking_sponsors: z.boolean().default(true),
  rounds: z.array(roundSchema).min(1, 'At least one round required'),
  tracks: z.array(z.string()).min(1, 'At least one track required'),
});

export const taskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().default(''),
  assignee_id: z.string().nullable().optional(),
  assignee_type: z.enum(['volunteer', 'sponsor']),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  due_at: z.string().nullable().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(2, 'Headline must be at least 2 characters'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  audience: z.enum(['all', 'participants', 'volunteers', 'sponsors']),
});

export const teamJoinSchema = z.object({
  join_code: z.string().min(4, 'Join code must be at least 4 characters').toUpperCase(),
});

export const teamCreateSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  track: z.string().min(1, 'Track is required'),
});

export const submissionSchema = z.object({
  title: z.string().min(3, 'Project title is required'),
  description: z.string().min(10, 'Project description is required'),
  repo_url: z.string().url('Must be a valid repository URL'),
  demo_url: z.string().url('Must be a valid demo URL').optional().or(z.literal('')),
});

export const sponsorshipApplicationSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  tier: z.string().min(1, 'Sponsorship tier is required'),
  contact_email: z.string().email('Valid work email required'),
  perks_offered: z.string().min(10, 'Details of perks or API credits offered'),
  requirements: z.string().default(''),
});
