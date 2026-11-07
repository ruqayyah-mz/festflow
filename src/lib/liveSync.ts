// Bridges the existing localStorage-backed UI (mockStorage) to Supabase for the volunteer task loop.
//
// When VITE_SUPABASE_URL/KEY are set, after sign-in we:
//   1. pull profiles, events, roles and tasks the user is allowed to see (RLS) into mockStorage,
//   2. forward every task change made in the UI to Supabase (insert / RPCs),
//   3. subscribe to Realtime so a tick on a volunteer's phone widget shows up here without refreshing.
// Everything else (judging, sponsors, teams...) is still local-only for now.

import type { RealtimeChannel, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { mockStorage, type TaskBackend } from './mockStorage';
import type { Announcement, Event, Profile, Role, RoleType, Task, VolunteerApplication } from '@/types';

export const SYNC_ERROR_EVENT = 'festflow:sync-error';

function reportError(action: string, err: unknown) {
  const message = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
  console.error(`[liveSync] ${action} failed:`, err);
  window.dispatchEvent(new CustomEvent(SYNC_ERROR_EVENT, { detail: `${action} failed: ${message}` }));
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

async function fetchTasks(profiles?: Profile[]): Promise<Task[]> {
  const { data, error } = await db().from('tasks').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const names = new Map((profiles ?? mockStorage.getProfiles()).map((p) => [p.id, p.full_name]));
  return (data ?? []).map((t) => ({
    ...(t as Task),
    assignee_name: t.assignee_id ? names.get(t.assignee_id) : 'General Volunteer Staff',
  }));
}

export async function pullTasks() {
  mockStorage.applyLiveTasks(await fetchTasks());
}

export async function pullSnapshot(): Promise<{ roles: Role[] }> {
  const [profilesRes, eventsRes, rolesRes, announcementsRes, appsRes] = await Promise.all([
    db().from('profiles').select('id, full_name, avatar_url, created_at'),
    db().from('events').select('*').is('deleted_at', null).order('starts_at'),
    db().from('roles').select('*'),
    db().from('announcements').select('*').order('created_at', { ascending: false }),
    db().from('volunteer_applications').select('*').order('created_at', { ascending: false }),
  ]);
  for (const r of [profilesRes, eventsRes, rolesRes, announcementsRes, appsRes]) if (r.error) throw r.error;

  const profiles = (profilesRes.data ?? []) as Profile[];
  const roles = (rolesRes.data ?? []) as Role[];
  const tasks = await fetchTasks(profiles);
  mockStorage.applyLiveSnapshot({
    profiles,
    events: (eventsRes.data ?? []) as Event[],
    roles,
    tasks,
    announcements: (announcementsRes.data ?? []) as Announcement[],
    volunteerApplications: (appsRes.data ?? []) as VolunteerApplication[],
  });
  return { roles };
}

// Only real columns (supabase/migrations/*); the Event type also carries UI-only fields.
const EVENT_COLUMNS = [
  'id', 'organizer_id', 'name', 'description', 'venue', 'starts_at', 'ends_at', 'visibility', 'rounds', 'tracks',
  'seeking_sponsors', 'volunteer_policy', 'volunteer_form', 'participation_type', 'team_size_min', 'team_size_max',
  'location_mode', 'category', 'criteria', 'participant_registration_deadline', 'participant_registration_closed',
  'volunteer_application_deadline', 'volunteer_applications_closed', 'deleted_at',
] as const;
const eventRow = (evt: Event) =>
  Object.fromEntries(EVENT_COLUMNS.filter((k) => evt[k] !== undefined).map((k) => [k, evt[k]]));

const backend: TaskBackend = {
  createTask(task) {
    return db()
      .from('tasks')
      .insert({
        id: task.id,
        event_id: task.event_id,
        assignee_id: task.assignee_id ?? null,
        assignee_type: task.assignee_type,
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        due_at: task.due_at ?? null,
      })
      .then(({ error }) => error && (reportError('Saving task', error), pullTasks()));
  },
  updateTaskStatus(taskId, status) {
    db()
      .rpc('set_task_status', { p_task_id: taskId, p_status: status })
      .then(({ error }) => error && (reportError('Updating task', error), pullTasks()));
  },
  claimTask(taskId) {
    db()
      .rpc('claim_task', { p_task_id: taskId })
      .then(({ error }) => error && (reportError('Taking up task', error), pullTasks()));
  },
  releaseTask(taskId) {
    db()
      .rpc('release_task', { p_task_id: taskId })
      .then(({ error }) => error && (reportError('Releasing task', error), pullTasks()));
  },
  verifyTask(taskId) {
    db()
      .from('tasks')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', taskId)
      .then(({ error }) => error && (reportError('Verifying task', error), pullTasks()));
  },
  createAnnouncement(a) {
    return db()
      .from('announcements')
      .insert({ id: a.id, event_id: a.event_id, audience: a.audience, title: a.title ?? '', message: a.message })
      .then(({ error }) => error && reportError('Posting announcement', error));
  },
  saveEvent(evt, isNew) {
    const row = eventRow(evt);
    return (isNew
      ? db().from('events').insert(row).then(async ({ error }) => {
          if (error) return error;
          // Organizer role, like the local createEvent; needed so the event lists under "my events".
          return (await db().from('roles').insert({ user_id: evt.organizer_id, event_id: evt.id, role_type: 'organizer', role_title: 'Lead Organizer' })).error;
        })
      : db().from('events').update(row).eq('id', evt.id).then(({ error }) => error)
    ).then((error) => error && (reportError('Saving event', error), pullSnapshot().catch(() => undefined)));
  },
  submitVolunteerApplication(app) {
    return db()
      .auth.getSession()
      .then(({ data }) =>
        db().from('volunteer_applications').insert({
          id: app.id,
          event_id: app.event_id,
          user_id: app.user_id,
          user_name: app.user_name,
          user_email: data.session?.user.email ?? app.user_email ?? null,
          role_title: app.role_title ?? null,
          answers: app.answers ?? [],
        })
      )
      .then(({ error }) => error && (reportError('Applying to volunteer', error), pullSnapshot().catch(() => undefined)));
  },
  decideVolunteerApplication(appId, status) {
    db()
      .rpc('decide_volunteer_application', { p_app_id: appId, p_status: status })
      .then(({ error }) => {
        if (error) reportError('Deciding application', error);
        pullSnapshot().catch(() => undefined); // pick up the server-created volunteer role (or roll back)
      });
  },
  deleteTask(taskId) {
    db()
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .then(({ error }) => error && (reportError('Deleting task', error), pullTasks()));
  },
};

// Writes that reference an event run one after another, so a new event's insert lands before the
// welcome announcement / first task / application that point at it (else RLS rejects them).
let writeChain: Promise<unknown> = Promise.resolve();
for (const key of ['saveEvent', 'createTask', 'createAnnouncement', 'submitVolunteerApplication'] as const) {
  const write = backend[key] as (...args: unknown[]) => unknown;
  (backend[key] as (...args: unknown[]) => void) = (...args) => {
    writeChain = writeChain.then(() => write(...args)).catch(() => undefined);
  };
}

let channel: RealtimeChannel | null = null;
let pullTimer: ReturnType<typeof setTimeout> | undefined;
let snapshotTimer: ReturnType<typeof setTimeout> | undefined;

function startRealtime() {
  stopRealtime();
  channel = db()
    .channel('tasks-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      // Coalesce bursts (e.g. several ticks in a row) into one refetch.
      clearTimeout(pullTimer);
      pullTimer = setTimeout(() => pullTasks().catch((e) => reportError('Refreshing tasks', e)), 300);
    });
  // Applications, approvals (roles), events and announcements: one full refetch per burst, so a volunteer
  // sees "accepted" and an organizer sees a new application without reloading.
  for (const table of ['volunteer_applications', 'roles', 'events', 'announcements']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      clearTimeout(snapshotTimer);
      snapshotTimer = setTimeout(() => pullSnapshot().catch((e) => reportError('Refreshing', e)), 400);
    });
  }
  channel.subscribe();
}

function stopRealtime() {
  if (channel) supabase?.removeChannel(channel);
  channel = null;
}

const ROLE_PRIORITY: RoleType[] = ['organizer', 'volunteer', 'sponsor', 'participant'];

/** Call after sign-in or when a stored session is restored. Returns the user's roles. */
export async function startLiveSession(user: User, preferredRole?: RoleType): Promise<RoleType[]> {
  const { roles } = await pullSnapshot();
  const mine = [...new Set(roles.filter((r) => r.user_id === user.id).map((r) => r.role_type))];
  const profile =
    mockStorage.getProfiles().find((p) => p.id === user.id) ??
    ({ id: user.id, full_name: user.email ?? 'Account' } as Profile);
  const role =
    preferredRole && mine.includes(preferredRole)
      ? preferredRole
      : ROLE_PRIORITY.find((r) => mine.includes(r)) ?? 'volunteer';

  mockStorage.setTaskBackend(backend);
  mockStorage.setLiveUser(profile, role);
  startRealtime();
  return mine.length ? mine : ['volunteer'];
}

export function stopLiveSession() {
  stopRealtime();
  mockStorage.setTaskBackend(null);
}
