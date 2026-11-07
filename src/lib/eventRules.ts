import { Event, EventCategory, Round } from '@/types';

export const TEAM_SIZE_LIMIT = 10;

// Events created before these settings existed are treated as offline team events of 1–5.
export function getParticipation(event: Pick<Event, 'participation_type' | 'team_size_min' | 'team_size_max'>) {
  const type = event.participation_type ?? 'team';
  if (type === 'solo') return { type, min: 1, max: 1 } as const;
  return { type, min: event.team_size_min ?? 1, max: event.team_size_max ?? 5 } as const;
}

export function getLocationMode(event: Pick<Event, 'location_mode'>): 'online' | 'offline' {
  return event.location_mode ?? 'offline';
}

export type RegistrationKind = 'participants' | 'volunteers';

// Without a deadline, both participant registration and volunteer applications close when the event starts.
function naturalCap(event: Pick<Event, 'starts_at' | 'ends_at'>, _kind: RegistrationKind) {
  return event.starts_at;
}

export function getRegistrationStatus(
  event: Event,
  kind: RegistrationKind,
  now = Date.now()
): { open: boolean; reason: string; closesAt: string } {
  const closed = kind === 'participants' ? event.participant_registration_closed : event.volunteer_applications_closed;
  const deadline = kind === 'participants' ? event.participant_registration_deadline : event.volunteer_application_deadline;
  const cap = naturalCap(event, kind);
  const closesAt = deadline && new Date(deadline) < new Date(cap) ? deadline : cap;
  const noun = kind === 'participants' ? 'Registration' : 'Volunteer applications';
  if (closed) return { open: false, reason: `${noun} closed by the organizer`, closesAt };
  if (new Date(closesAt).getTime() <= now) {
    const why = closesAt === deadline ? 'deadline passed' : 'event has started';
    return { open: false, reason: `${noun} closed (${why})`, closesAt };
  }
  return { open: true, reason: `${noun} open`, closesAt };
}

export function validateRegistrationDeadlines(event: Partial<Event> & Pick<Event, 'starts_at' | 'ends_at'>): string | null {
  const p = event.participant_registration_deadline;
  if (p && new Date(p) > new Date(event.starts_at)) return 'The participant registration deadline must be before the event starts.';
  const v = event.volunteer_application_deadline;
  if (v && new Date(v) > new Date(event.starts_at)) return 'The volunteer application deadline must be before the event starts.';
  return null;
}

// Returns a human-readable problem, or null when the rounds are valid.
export function validateRounds(rounds: Round[]): string | null {
  if (rounds.length === 0) return 'Add at least one evaluation round.';
  if (rounds.some((r) => !r.name.trim())) return 'Every evaluation round needs a name.';
  if (rounds.some((r) => !Number.isInteger(r.weight) || r.weight <= 0)) return 'Every round weight must be a whole number above 0%.';
  const total = rounds.reduce((sum, r) => sum + r.weight, 0);
  if (total !== 100) return `Round weights must add up to exactly 100% (currently ${total}%).`;
  return null;
}

export function validateTeamSize(min: number, max: number): string | null {
  if (!Number.isInteger(min) || !Number.isInteger(max)) return 'Team sizes must be whole numbers.';
  if (min < 1) return 'Minimum team size must be at least 1.';
  if (max < 2) return 'Maximum team size must be at least 2 (use Solo for individual events).';
  if (max > TEAM_SIZE_LIMIT) return `Maximum team size can be at most ${TEAM_SIZE_LIMIT}.`;
  if (min > max) return 'Minimum team size cannot be larger than the maximum.';
  return null;
}

export const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'competition', label: 'Competition' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'conference', label: 'Conference / Talk' },
  { value: 'meetup', label: 'Meetup / Networking' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'fun', label: 'Fun / Social' },
  { value: 'other', label: 'Other' },
];

export const getCategory = (event: Pick<Event, 'category'>): EventCategory => event.category ?? 'other';
export const categoryLabel = (c: EventCategory) => EVENT_CATEGORIES.find((x) => x.value === c)?.label ?? 'Other';
