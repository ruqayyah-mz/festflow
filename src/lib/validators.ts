import { z } from 'zod';

export const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  venue: z.string().min(2, 'Venue location or platform is required'),
  starts_at: z.string().min(1, 'Start date is required'),
  ends_at: z.string().min(1, 'End date is required'),
  visibility: z.enum(['public', 'private']),
  seeking_sponsors: z.boolean(),
  tracks: z.array(z.string()).min(1, 'At least one track is required'),
});

export type EventFormData = z.infer<typeof eventSchema>;

const optionalUrl = (msg: string) => z.string().url(msg).optional().or(z.literal(''));

export const submissionSchema = z.object({
  title: z.string().min(3, 'Project name must be at least 3 characters').max(120),
  description: z.string().min(20, 'Please describe the project (at least 20 characters)'),
  repo_url: optionalUrl('Must be a valid repository URL (e.g. https://github.com/...)'),
  demo_url: optionalUrl('Must be a valid website URL (e.g. https://...)'),
  youtube_url: optionalUrl('Must be a valid YouTube URL').refine(
    (v) => !v || /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(v),
    'Must be a youtube.com or youtu.be link'
  ),
  tags: z.array(z.string()).min(1, 'Add at least one tag').max(10),
  technologies: z.array(z.string()).max(30),
  additional_info: z.string().max(2000).optional().or(z.literal('')),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;

export const teamCreateSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50),
  track: z.string().min(1, 'Please select a track'),
});

export type TeamCreateFormData = z.infer<typeof teamCreateSchema>;

export const teamJoinSchema = z.object({
  join_code: z.string().min(4, 'Join code must be at least 4 characters').toUpperCase(),
});

export type TeamJoinFormData = z.infer<typeof teamJoinSchema>;

export const taskSchema = z.object({
  title: z.string().min(3, 'Task title is required').max(120),
  description: z.string().max(500).optional().default(''),
  assignee_type: z.enum(['volunteer', 'sponsor']),
  assignee_id: z.string().optional().nullable(),
  due_at: z.string().optional().nullable(),
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const announcementSchema = z.object({
  message: z.string().min(5, 'Announcement message must be at least 5 characters').max(1000),
  audience: z.enum(['all', 'participants', 'volunteers', 'sponsors']),
});

export type AnnouncementFormData = z.infer<typeof announcementSchema>;

export const sponsorApplicationSchema = z.object({
  company_name: z.string().min(2, 'Company / Organization name is required'),
  tier: z.string().min(1, 'Please select a sponsorship tier'),
  contact_email: z.string().email('Please enter a valid work email'),
  perks_offered: z.string().min(10, 'Describe the benefits, credits, or swag offered to participants'),
  requirements: z.string().min(5, 'State your requirements (e.g., booth space, speaking slot)'),
});

export type SponsorApplicationFormData = z.infer<typeof sponsorApplicationSchema>;

export const judgeMarkSchema = z.object({
  score: z.number().min(0, 'Score cannot be less than 0').max(100, 'Score cannot exceed 100'),
  notes: z.string().max(1000).optional(),
  round: z.string().min(1, 'Round is required'),
});

export type JudgeMarkFormData = z.infer<typeof judgeMarkSchema>;
