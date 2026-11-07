// Supabase Edge Function: push-notifications
// Triggered via Database Webhook when:
// 1. A new announcement is created (public.announcements INSERT)
// 2. A task is assigned or reassigned (public.tasks INSERT or UPDATE)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "announcements" | "tasks";
  schema: "public";
  record: any;
  old_record: any;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const payload: WebhookPayload = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let messages: any[] = [];

    if (payload.table === "announcements" && payload.type === "INSERT") {
      const announcement = payload.record;
      const eventId = announcement.event_id;
      const audience = announcement.audience; // 'all' | 'participants' | 'volunteers' | 'sponsors'

      // Find user IDs that match this audience
      let userQuery = supabase
        .from("roles")
        .select("user_id, role_type")
        .eq("event_id", eventId);

      if (audience === "participants") {
        userQuery = userQuery.eq("role_type", "participant");
      } else if (audience === "volunteers") {
        userQuery = userQuery.eq("role_type", "volunteer");
      } else if (audience === "sponsors") {
        userQuery = userQuery.eq("role_type", "sponsor");
      }

      const { data: roleRows, error: roleError } = await userQuery;
      if (roleError) throw roleError;

      const targetUserIds = Array.from(new Set(roleRows?.map((r) => r.user_id) || []));

      if (targetUserIds.length > 0) {
        // Query device tokens for these users
        const { data: tokens, error: tokenError } = await supabase
          .from("device_tokens")
          .select("fcm_token")
          .in("user_id", targetUserIds);

        if (tokenError) throw tokenError;

        if (tokens && tokens.length > 0) {
          messages = tokens.map((t) => ({
            to: t.fcm_token,
            sound: "default",
            title: announcement.title || "FestFlow Announcement",
            body: announcement.message,
            data: {
              type: "announcement",
              id: announcement.id,
              event_id: eventId,
              url: `festflow://announcement/${announcement.id}`,
            },
            priority: "high",
          }));
        }
      }
    } else if (payload.table === "tasks" && (payload.type === "INSERT" || (payload.type === "UPDATE" && payload.record.assignee_id !== payload.old_record?.assignee_id))) {
      const task = payload.record;
      if (task.assignee_id) {
        const { data: tokens, error: tokenError } = await supabase
          .from("device_tokens")
          .select("fcm_token")
          .eq("user_id", task.assignee_id);

        if (tokenError) throw tokenError;

        if (tokens && tokens.length > 0) {
          messages = tokens.map((t) => ({
            to: t.fcm_token,
            sound: "default",
            title: "New Task Assigned",
            body: task.title,
            data: {
              type: "task",
              id: task.id,
              event_id: task.event_id,
              url: `festflow://task/${task.id}`,
            },
            priority: "high",
          }));
        }
      }
    }

    if (messages.length > 0) {
      // Chunk notifications per Expo push guidelines (max 100 per request)
      const chunks = [];
      while (messages.length) {
        chunks.push(messages.splice(0, 100));
      }

      for (const chunk of chunks) {
        await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(chunk),
        });
      }
    }

    return new Response(JSON.stringify({ success: true, count: messages.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

