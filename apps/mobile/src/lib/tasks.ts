// Single source of truth for "my tasks" on the phone. Used by the Tasks tab, the home-screen widget
// (headless, app may be closed) and the background push handler.
//
// Live mode (EXPO_PUBLIC_SUPABASE_URL set): reads tasks assigned to the signed-in user from Supabase,
// caches them in AsyncStorage so the widget can render instantly, and writes status changes through the
// `set_task_status` RPC. If the phone is offline the change is queued and replayed later.
// Demo mode: everything stays in AsyncStorage (the original behaviour).

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Task } from '@festflow/shared';
import { supabase } from './supabase';
import { MobileStorage, PendingTaskOp, TaskStatus } from './storage';

const NETWORK_TIMEOUT_MS = 8000;

export class TaskSyncError extends Error {}

function withTimeout<T>(p: PromiseLike<T>, ms = NETWORK_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Network request timed out')), ms);
    Promise.resolve(p).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/** Postgres/PostgREST errors carry a code; fetch failures and timeouts don't. */
function isServerRejection(err: unknown): err is { code: string; message: string } {
  return typeof err === 'object' && err !== null && typeof (err as { code?: unknown }).code === 'string' &&
    (err as { code: string }).code.length > 0;
}

export async function getCurrentUserId(): Promise<string | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  }
  return (await MobileStorage.getUser())?.id ?? null;
}

function applyOps(tasks: Task[], ops: PendingTaskOp[]): Task[] {
  if (!ops.length) return tasks;
  const byId = new Map(ops.map((o) => [o.taskId, o]));
  return tasks.map((t) => {
    const op = byId.get(t.id);
    if (!op) return t;
    return {
      ...t,
      status: op.status,
      completed_at: op.status === 'done' ? t.completed_at ?? new Date(op.at).toISOString() : null,
    };
  });
}

async function enqueue(taskId: string, status: TaskStatus) {
  const ops = (await MobileStorage.getPendingTaskOps()).filter((o) => o.taskId !== taskId);
  ops.push({ taskId, status, at: Date.now() });
  await MobileStorage.setPendingTaskOps(ops);
}

async function dequeue(taskId: string) {
  const ops = await MobileStorage.getPendingTaskOps();
  const next = ops.filter((o) => o.taskId !== taskId);
  if (next.length !== ops.length) await MobileStorage.setPendingTaskOps(next);
}

/** Replays queued offline ticks. Stops at the first network failure; drops ops the server rejects. */
export async function flushPendingTaskOps(): Promise<void> {
  if (!supabase) return;
  const ops = await MobileStorage.getPendingTaskOps();
  for (const op of ops) {
    try {
      const { error } = await withTimeout(
        supabase.rpc('set_task_status', { p_task_id: op.taskId, p_status: op.status })
      );
      if (error && !isServerRejection(error)) return; // still offline
      await dequeue(op.taskId);
      if (error) console.warn('Queued task update rejected by server:', error.message);
    } catch {
      return; // still offline
    }
  }
}

/** My tasks only (the widget must never show other volunteers' tasks). Cached cards come first in the demo. */
export async function getCachedMyTasks(): Promise<Task[]> {
  const tasks = await MobileStorage.getTasks();
  if (supabase) return tasks; // live cache is already scoped to me
  const me = await getCurrentUserId();
  return me ? tasks.filter((t) => t.assignee_id === me) : tasks;
}

/** Pulls fresh tasks from Supabase (after replaying offline ticks) and updates the cache. */
export async function syncMyTasks(): Promise<Task[]> {
  if (!supabase) return getCachedMyTasks();

  const uid = await getCurrentUserId();
  if (!uid) {
    await MobileStorage.setTasks([]);
    return [];
  }

  await flushPendingTaskOps();

  const { data, error } = await withTimeout(
    supabase
      .from('tasks')
      .select('*, events(name)')
      .eq('assignee_id', uid)
      .order('due_at', { ascending: true, nullsFirst: false })
  );
  if (error) throw new TaskSyncError(error.message);

  const fresh: Task[] = (data ?? []).map((row: Record<string, unknown>) => {
    const { events, ...task } = row as unknown as Task & { events?: { name?: string } | null };
    return { ...task, event_name: events?.name ?? undefined };
  });
  // Keep any still-queued offline ticks visible so a sync doesn't "undo" them on screen.
  const merged = applyOps(fresh, await MobileStorage.getPendingTaskOps());
  await MobileStorage.setTasks(merged);
  await MobileStorage.setTasksSyncedAt(Date.now());
  return merged;
}

export interface SetStatusResult {
  tasks: Task[];
  /** true when the phone was offline and the change will be sent later */
  queued: boolean;
}

/**
 * Optimistically updates the cache, then writes to Supabase. Network problems queue the change;
 * a server rejection (e.g. task reassigned) restores server truth and throws.
 */
export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<SetStatusResult> {
  const optimistic = await MobileStorage.updateTaskStatus(taskId, status);
  if (!supabase) return { tasks: optimistic, queued: false };

  try {
    const { error } = await withTimeout(
      supabase.rpc('set_task_status', { p_task_id: taskId, p_status: status })
    );
    if (!error) {
      await dequeue(taskId);
      return { tasks: optimistic, queued: false };
    }
    if (!isServerRejection(error)) {
      await enqueue(taskId, status);
      return { tasks: optimistic, queued: true };
    }
    await dequeue(taskId);
    await syncMyTasks().catch(() => undefined);
    throw new TaskSyncError(error.message);
  } catch (err) {
    if (err instanceof TaskSyncError) throw err;
    await enqueue(taskId, status);
    return { tasks: optimistic, queued: true };
  }
}

/** Live updates while the app is open (organizer assigns / edits a task). */
export function subscribeToMyTasks(userId: string, onChange: () => void): () => void {
  if (!supabase) return () => undefined;
  const channel: RealtimeChannel = supabase
    .channel(`my-tasks-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `assignee_id=eq.${userId}` }, () =>
      onChange()
    )
    .subscribe();
  return () => {
    supabase?.removeChannel(channel);
  };
}

/** Unassigned volunteer tasks of one event that I could take up (RLS: event volunteers only). */
export async function fetchOpenTasks(eventId: string): Promise<Task[]> {
  if (!supabase) return [];
  const { data, error } = await withTimeout(
    supabase
      .from('tasks')
      .select('*')
      .eq('event_id', eventId)
      .is('assignee_id', null)
      .eq('assignee_type', 'volunteer')
      .order('due_at', { ascending: true, nullsFirst: false })
  );
  if (error) throw new TaskSyncError(error.message);
  return (data ?? []) as Task[];
}

/** Take up / hand back an open task. Online only: two volunteers could race for the same task. */
async function claimOrRelease(fn: 'claim_task' | 'release_task', taskId: string): Promise<Task[]> {
  if (!supabase) throw new TaskSyncError('Needs a live connection');
  const { error } = await withTimeout(supabase.rpc(fn, { p_task_id: taskId }));
  if (error) throw new TaskSyncError(error.message);
  return syncMyTasks();
}

export const claimTask = (taskId: string) => claimOrRelease('claim_task', taskId);
export const releaseTask = (taskId: string) => claimOrRelease('release_task', taskId);

/** Live changes to any task of one event I can see (open tasks appearing / being taken up). */
export function subscribeToEventTasks(eventId: string, onChange: () => void): () => void {
  if (!supabase) return () => undefined;
  const channel: RealtimeChannel = supabase
    .channel(`event-tasks-${eventId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `event_id=eq.${eventId}` }, () =>
      onChange()
    )
    .subscribe();
  return () => {
    supabase?.removeChannel(channel);
  };
}
