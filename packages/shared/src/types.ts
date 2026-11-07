export type RoleType = 'organizer' | 'volunteer' | 'sponsor' | 'participant';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Round {
  id: string;
  name: string;
  weight: number;
  active: boolean;
}

export type EventCategory =
  | 'hackathon'
  | 'competition'
  | 'workshop'
  | 'conference'
  | 'meetup'
  | 'cultural'
  | 'sports'
  | 'fun'
  | 'other';

export interface Event {
  id: string;
  organizer_id: string;
  name: string;
  description: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  visibility: 'public' | 'private';
  rounds: Round[];
  tracks: string[];
  seeking_sponsors: boolean;
  volunteer_policy?: 'my_team' | 'open';
  volunteer_form?: VolunteerFormQuestion[];
  participation_type?: 'solo' | 'team';
  team_size_min?: number;
  team_size_max?: number;
  location_mode?: 'online' | 'offline'; // online: `venue` holds the meeting/platform link or name
  category?: EventCategory;
  criteria?: JudgingCriterion[]; // organizer-defined judging rubric (missing = DEFAULT_CRITERIA)
  // Registration windows. A deadline is optional; `*_closed` lets the organizer close early (e.g. space is full).
  participant_registration_deadline?: string | null;
  participant_registration_closed?: boolean;
  volunteer_application_deadline?: string | null;
  volunteer_applications_closed?: boolean;
  created_at: string;
  deleted_at?: string | null;
}

export interface Role {
  id: string;
  user_id: string;
  event_id: string;
  role_type: RoleType;
  role_title?: string | null;
  created_at: string;
}

export interface Invite {
  id: string;
  event_id: string;
  token: string;
  role_type: 'volunteer' | 'participant' | 'sponsor';
  role_title?: string | null;
  volunteer_name?: string | null;
  volunteer_id?: string | null;
  last_accessed_at?: string | null;
  created_at: string;
  expires_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  profile?: Profile;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  join_code: string;
  table_number?: string | null;
  track?: string;
  created_at: string;
  members?: Profile[];
  submission?: Submission | null;
  // Approval: 'forming' (not applied yet) → 'pending' → 'accepted' | 'rejected'. Missing = accepted (pre-approval data).
  status?: 'forming' | 'pending' | 'accepted' | 'rejected';
  applied_at?: string | null;
  // Lead can advertise the team to registered participants who have no team yet.
  open_to_join?: boolean;
  looking_for?: string;
}

export interface Submission {
  id: string;
  team_id: string;
  event_id: string;
  title: string;
  description: string;
  repo_url: string; // may be '' — not every project has a public repo
  demo_url?: string; // hosted website
  youtube_url?: string;
  images?: string[]; // compressed data URLs (demo storage); a real backend would store files in object storage
  tags?: string[];
  technologies?: string[];
  additional_info?: string;
  status: 'not_submitted' | 'submitted';
  submitted_at: string;
  team_name?: string;
  table_number?: string;
  track?: string;
}

export interface Task {
  id: string;
  event_id: string;
  assignee_id?: string | null;
  assignee_name?: string;
  assignee_type: 'volunteer' | 'sponsor';
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  due_at?: string | null;
  completed_at?: string | null;
  // Set when the organizer confirms a volunteer's "done"; cleared if the task is reopened.
  verified_at?: string | null;
  // Set when a volunteer picks up an open ("General") task themselves; lets them release it again.
  claimed_at?: string | null;
  created_at: string;
  updated_at?: string;
  // Joined from events.name when tasks are loaded from Supabase (mobile widget / app)
  event_name?: string;
}

export interface Announcement {
  id: string;
  event_id: string;
  audience: 'all' | 'participants' | 'volunteers' | 'sponsors';
  title: string;
  message: string;
  created_at: string;
}

export interface JudgeLink {
  id: string;
  event_id: string;
  token: string;
  table_assignment?: string | null;
  track_assignment?: string | null;
  judge_name: string;
  created_at: string;
}

// Scores keyed by JudgingCriterion.id.
export type MarkCriteria = Record<string, number>;

export interface JudgingCriterion {
  id: string;
  label: string;
  max: number; // points available; an event's criteria always total 100
}

export interface Mark {
  id: string;
  judge_link_id: string;
  submission_id: string;
  round: string;
  score: number;
  criteria?: MarkCriteria;
  max_score?: number; // total points available when this mark was saved (missing on legacy marks = 70)
  notes?: string;
  updated_at: string;
}

export interface SponsorshipApplicationData {
  company_name: string;
  tier: string;
  contact_email: string;
  perks_offered: string;
  requirements: string;
}

export interface SponsorshipApplication {
  id: string;
  event_id: string;
  sponsor_id: string;
  sponsor_name?: string;
  status: 'applied' | 'under_review' | 'confirmed';
  form_data: SponsorshipApplicationData;
  created_at: string;
}

export type SponsorCategory =
  | 'food'
  | 'venue'
  | 'technology'
  | 'prizes'
  | 'travel'
  | 'media'
  | 'other';

export const SPONSOR_CATEGORY_LABELS: Record<SponsorCategory, string> = {
  food: 'Food',
  venue: 'Venue',
  technology: 'Technology',
  prizes: 'Prizes',
  travel: 'Travel',
  media: 'Media',
  other: 'Other',
};

export interface SponsorOffer {
  id: string;
  sponsor_id: string;
  company_name: string;
  contact_email: string;
  description: string;
  category: SponsorCategory;
  amount: number;
  currency: string;
  expectations: string;
  status: 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface OrganizerSponsorshipApplication {
  id: string;
  offer_id: string;
  event_id: string;
  organizer_id: string;
  organizer_name: string;
  contact_email: string;
  requested_amount: number;
  message: string;
  status: 'applied' | 'under_review' | 'accepted' | 'declined';
  created_at: string;
}

export interface VolunteerFormQuestion {
  id: string;
  label: string;
  type: 'short' | 'paragraph' | 'choice';
  options?: string[];
  required: boolean;
}

export interface VolunteerApplication {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  role_title?: string;
  // Labels are snapshotted so answers stay readable if the organizer edits the form later.
  answers?: { question: string; answer: string }[];
  // 'expired' = still pending when the event started (decisions lock at start).
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
}

// Self-written volunteer profile (account-level, not per event). Shown to organizers they apply to or work for.
export interface VolunteerDetails {
  user_id: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  preferred_roles?: string[];
  languages?: string[];
  availability?: string;
  city?: string;
  contact?: string;
  linkedin_url?: string;
  prior_experience?: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  message: string;
  link?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  event_id: string;
  target_id: string;
  target_type: 'volunteer' | 'participant' | 'team';
  target_name: string;
  detail?: string;
  marked_at: string;
  marked_by?: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  fcm_token: string;
  platform: 'android' | 'ios' | 'web';
  created_at: string;
  updated_at: string;
}
