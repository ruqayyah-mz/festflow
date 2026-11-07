// Push dispatch for FestFlow.
// Called by the `trg_tasks_notify_assignee` database trigger (see migration 20261108000000) via pg_net,
// or by a Supabase Database Webhook for announcements. Requests must carry `x-webhook-secret`.
//
// Delivers to two kinds of devices stored in public.device_tokens:
//   provider = 'expo'    -> Expo Push Service (the Android app; Expo forwards to FCM)
//   provider = 'webpush' -> Web Push (browser notifications; on Android Chrome these appear as normal phone notifications)

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type Row = Record<string, unknown>;

export interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema?: string;
  record: Row | null;
  old_record: Row | null;
}

export interface Notice {
  userIds: string[];
  title: string;
  body: string;
  /** In-app deep link for the phone app */
  appUrl: string;
  /** Path for the web dashboard */
  webPath: string;
  data: Record<string, string>;
  /** Groups/replaces notifications for the same item */
  tag: string;
}

interface DeviceRow {
  id: string;
  user_id: string;
  fcm_token: string;
  provider: "expo" | "webpush";
  subscription: webpush.PushSubscription | null;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function env(name: string): string {
  return Deno.env.get(name) ?? "";
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Decide who to notify for a task change. Returns null when nothing should be sent. Pure; no I/O. */
export function taskNotice(payload: WebhookPayload, eventName?: string): Notice | null {
  if (payload.table !== "tasks" || !payload.record) return null;
  const task = payload.record;
  const assignee = task.assignee_id as string | null;
  if (!assignee) return null;

  const isNewAssignment =
    payload.type === "INSERT" ||
    (payload.type === "UPDATE" && payload.old_record?.assignee_id !== assignee);
  if (!isNewAssignment) return null;

  const id = String(task.id);
  const eventId = String(task.event_id);
  const due = task.due_at ? ` · due ${new Date(String(task.due_at)).toUTCString().slice(0, 22)} UTC` : "";
  return {
    userIds: [assignee],
    title: "New task assigned",
    body: `${String(task.title)}${eventName ? ` — ${eventName}` : ""}${due}`,
    appUrl: `festflow://task/${id}`,
    webPath: task.assignee_type === "sponsor" ? `/sponsor/tasks` : `/volunteer/events/${eventId}`,
    data: { type: "task", id, event_id: eventId, refreshWidget: "1" },
    tag: `task-${id}`,
  };
}

/** A volunteer task that just became open (created unassigned, or released). Pure; no I/O. */
export function isNewOpenTask(payload: WebhookPayload): boolean {
  const t = payload.record;
  if (payload.table !== "tasks" || !t || t.assignee_id || t.assignee_type !== "volunteer") return false;
  return payload.type === "INSERT" || (payload.type === "UPDATE" && !!payload.old_record?.assignee_id);
}

/** Notify the event's volunteers about an open task (minus whoever just released it). Pure; no I/O. */
export function openTaskNotice(payload: WebhookPayload, volunteerIds: string[], eventName?: string): Notice | null {
  if (!isNewOpenTask(payload)) return null;
  const task = payload.record!;
  const releasedBy = payload.old_record?.assignee_id as string | undefined;
  const userIds = volunteerIds.filter((id) => id !== releasedBy);
  if (!userIds.length) return null;
  const id = String(task.id);
  const eventId = String(task.event_id);
  return {
    userIds,
    title: eventName ? `Open task · ${eventName}` : "Open task",
    body: `${String(task.title)} — anyone can take it up`,
    appUrl: `festflow://task/${id}`,
    webPath: `/volunteer/events/${eventId}`,
    data: { type: "task", id, event_id: eventId, refreshWidget: "1" },
    tag: `task-${id}`,
  };
}

async function announcementNotice(db: SupabaseClient, payload: WebhookPayload): Promise<Notice | null> {
  if (payload.table !== "announcements" || payload.type !== "INSERT" || !payload.record) return null;
  const a = payload.record;
  const roleByAudience: Record<string, string | null> = {
    all: null,
    participants: "participant",
    volunteers: "volunteer",
    sponsors: "sponsor",
  };
  let q = db.from("roles").select("user_id").eq("event_id", a.event_id as string);
  const role = roleByAudience[String(a.audience)];
  if (role) q = q.eq("role_type", role);
  const { data, error } = await q;
  if (error) throw error;
  const userIds = [...new Set((data ?? []).map((r) => r.user_id as string))];
  if (!userIds.length) return null;
  const id = String(a.id);
  const { data: evt } = await db.from("events").select("name").eq("id", a.event_id as string).maybeSingle();
  const heading = String(a.title || "").trim();
  return {
    userIds,
    title: evt?.name ? `New announcement · ${evt.name}` : "New announcement",
    body: heading ? `${heading} — ${String(a.message)}` : String(a.message),
    appUrl: `festflow://announcement/${id}`,
    webPath: "/",
    data: { type: "announcement", id, event_id: String(a.event_id), refreshWidget: "1" },
    tag: `announcement-${id}`,
  };
}

/**
 * One visible notification per device, plus (for tasks) a data-only message. Android delivers data-only
 * messages to the app's background notification task even when the app is closed, which is what lets the
 * home-screen widget pull in the new task without the volunteer opening the app.
 */
export function expoMessages(devices: Pick<DeviceRow, "fcm_token">[], n: Notice) {
  const out: Array<{ deviceIndex: number; visible: boolean; message: Record<string, unknown> }> = [];
  devices.forEach((d, deviceIndex) => {
    out.push({
      deviceIndex,
      visible: true,
      message: {
        to: d.fcm_token,
        title: n.title,
        body: n.body,
        sound: "default",
        priority: "high",
        channelId: "tasks",
        data: { ...n.data, url: n.appUrl },
      },
    });
    if (n.data.refreshWidget) {
      out.push({
        deviceIndex,
        visible: false,
        message: { to: d.fcm_token, priority: "high", data: { type: "widget-refresh", id: n.data.id } },
      });
    }
  });
  return out;
}

async function sendExpo(db: SupabaseClient, devices: DeviceRow[], n: Notice) {
  if (!devices.length) return { sent: 0, removed: 0 };
  const planned = expoMessages(devices, n);

  let sent = 0;
  const dead = new Set<string>();
  for (let i = 0; i < planned.length; i += 100) {
    const batch = planned.slice(i, i + 100);
    const chunk = batch.map((p) => p.message);
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
    const accessToken = env("EXPO_ACCESS_TOKEN"); // only needed if "Enhanced push security" is on in Expo
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(EXPO_PUSH_URL, { method: "POST", headers, body: JSON.stringify(chunk) });
    const out = await res.json().catch(() => ({}));
    const tickets: Array<{ status: string; details?: { error?: string } }> = out?.data ?? [];
    tickets.forEach((t, j) => {
      const p = batch[j];
      if (t.status === "ok") {
        if (p.visible) sent++;
      } else if (t.details?.error === "DeviceNotRegistered") dead.add(devices[p.deviceIndex].id);
      else console.warn("Expo push error", JSON.stringify(t));
    });
    if (!res.ok) console.warn("Expo push HTTP", res.status, JSON.stringify(out));
  }
  if (dead.size) await db.from("device_tokens").delete().in("id", [...dead]);
  return { sent, removed: dead.size };
}

async function sendWebPush(db: SupabaseClient, devices: DeviceRow[], n: Notice) {
  const pub = env("VAPID_PUBLIC_KEY");
  const priv = env("VAPID_PRIVATE_KEY");
  if (!devices.length) return { sent: 0, removed: 0 };
  if (!pub || !priv) {
    console.warn("Web push skipped: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set");
    return { sent: 0, removed: 0 };
  }
  webpush.setVapidDetails(env("VAPID_SUBJECT") || "mailto:admin@festflow.dev", pub, priv);
  const siteUrl = env("SITE_URL").replace(/\/$/, "");
  const payload = JSON.stringify({
    title: n.title,
    body: n.body,
    url: `${siteUrl}${n.webPath}`,
    tag: n.tag,
    data: n.data,
  });

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    devices.map(async (d) => {
      if (!d.subscription) return;
      try {
        await webpush.sendNotification(d.subscription, payload, { TTL: 60 * 60 * 12, urgency: "high" });
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(d.id); // subscription expired / unsubscribed
        else console.warn("Web push error", code, String(err));
      }
    }),
  );
  if (dead.length) await db.from("device_tokens").delete().in("id", dead);
  return { sent, removed: dead.length };
}

export async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = env("WEBHOOK_SECRET");
  const got = req.headers.get("x-webhook-secret") ?? "";
  if (!expected || !timingSafeEqual(got, expected)) return json({ error: "Unauthorized" }, 401);

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Cheap check first so no DB connection is opened for irrelevant changes.
  if (payload.table === "tasks" && !taskNotice(payload) && !isNewOpenTask(payload)) return json({ skipped: true });
  if (payload.table !== "tasks" && payload.table !== "announcements") return json({ skipped: true });

  try {
    const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });

    let notice: Notice | null;
    if (payload.table === "tasks") {
      const eventId = payload.record!.event_id as string;
      const { data: evt } = await db.from("events").select("name").eq("id", eventId).maybeSingle();
      notice = taskNotice(payload, evt?.name as string | undefined);
      if (!notice && isNewOpenTask(payload)) {
        const { data: vols, error: vErr } = await db
          .from("roles").select("user_id").eq("event_id", eventId).eq("role_type", "volunteer");
        if (vErr) throw vErr;
        notice = openTaskNotice(payload, (vols ?? []).map((r) => r.user_id as string), evt?.name as string | undefined);
      }
    } else {
      notice = await announcementNotice(db, payload);
    }
    if (!notice) return json({ skipped: true });

    const { data: devices, error } = await db
      .from("device_tokens")
      .select("id, user_id, fcm_token, provider, subscription")
      .in("user_id", notice.userIds);
    if (error) throw error;

    const rows = (devices ?? []) as DeviceRow[];
    const [expo, web] = await Promise.all([
      sendExpo(db, rows.filter((d) => d.provider === "expo"), notice),
      sendWebPush(db, rows.filter((d) => d.provider === "webpush"), notice),
    ]);
    return json({ ok: true, expo, web });
  } catch (err) {
    console.error("push-notifications failed", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
}
