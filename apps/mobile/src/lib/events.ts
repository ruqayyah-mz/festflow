// "Which event am I looking at": the signed-in user's events, the active one, and its announcements.
import type { Announcement, Event, RoleType } from '@festflow/shared';
import { supabase } from './supabase';
import { MobileStorage } from './storage';

/** Re-reads the events I hold `role` in. Keeps the current event if still mine, else picks the soonest. */
export async function refreshMyEvents(role?: RoleType): Promise<Event[]> {
  if (!supabase) return MobileStorage.getEvents();
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  if (!uid) return [];
  const activeRole = role ?? (await MobileStorage.getActiveRole());

  const { data: roleRows, error } = await supabase
    .from('roles')
    .select('event_id')
    .eq('user_id', uid)
    .eq('role_type', activeRole);
  if (error) throw error;
  const ids = [...new Set((roleRows ?? []).map((r) => r.event_id as string))];

  let events: Event[] = [];
  if (ids.length) {
    const { data, error: evErr } = await supabase
      .from('events')
      .select('*')
      .in('id', ids)
      .is('deleted_at', null)
      .order('starts_at');
    if (evErr) throw evErr;
    events = (data ?? []) as Event[];
  }
  await MobileStorage.setEvents(events);

  const current = await MobileStorage.getEvent();
  const keep = current && events.find((e) => e.id === current.id);
  if (keep) await MobileStorage.setEvent(keep); // refresh name/venue edits
  else if (events[0]) await MobileStorage.setEvent(events[0]);
  return events;
}

/** Announcements for one event (RLS already limits them to my audience). Cached for offline. */
export async function syncAnnouncements(eventId: string): Promise<Announcement[]> {
  if (!supabase) {
    return (await MobileStorage.getAnnouncements()).filter((a) => a.event_id === eventId);
  }
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const list = (data ?? []) as Announcement[];
  // The cache holds every event's announcements (each widget can show a different event).
  const others = (await MobileStorage.getAnnouncements()).filter((x) => x.event_id !== eventId);
  await MobileStorage.setAnnouncements([...list, ...others]);
  return list;
}

/** Refreshes the announcement cache for all my events (widgets may each show a different one). */
export async function syncAllAnnouncements(): Promise<void> {
  for (const e of await MobileStorage.getEvents()) await syncAnnouncements(e.id);
}

/** Organizer posting from the phone. Live: Supabase insert (the DB trigger sends the push). */
export async function postAnnouncement(a: Omit<Announcement, 'id' | 'created_at'>): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('announcements').insert(a);
    if (error) throw error;
    return;
  }
  const list = await MobileStorage.getAnnouncements();
  await MobileStorage.setAnnouncements([
    { ...a, id: `anc-${Date.now()}`, created_at: new Date().toISOString() },
    ...list,
  ]);
}
