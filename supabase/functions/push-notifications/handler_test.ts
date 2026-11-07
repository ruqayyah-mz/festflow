import { deepStrictEqual as assertEquals } from "node:assert/strict";
import { expoMessages, handler, isNewOpenTask, openTaskNotice, taskNotice, type WebhookPayload } from "./handler.ts";

const task = {
  id: "t1",
  event_id: "e1",
  assignee_id: "u2",
  assignee_type: "volunteer",
  title: "Restock water",
  due_at: null,
};

Deno.test("new assignment produces a notice for the assignee", () => {
  const n = taskNotice({ type: "INSERT", table: "tasks", record: task, old_record: null }, "HackFest");
  assertEquals(n?.userIds, ["u2"]);
  assertEquals(n?.body, "Restock water — HackFest");
  assertEquals(n?.appUrl, "festflow://task/t1");
  assertEquals(n?.webPath, "/volunteer/events/e1");
  assertEquals(n?.data.refreshWidget, "1");
});

Deno.test("status-only update and unassigned tasks are skipped", () => {
  const p: WebhookPayload = { type: "UPDATE", table: "tasks", record: { ...task, status: "done" }, old_record: task };
  assertEquals(taskNotice(p), null);
  assertEquals(taskNotice({ type: "INSERT", table: "tasks", record: { ...task, assignee_id: null }, old_record: null }), null);
});

Deno.test("reassignment notifies the new assignee", () => {
  const p: WebhookPayload = { type: "UPDATE", table: "tasks", record: { ...task, assignee_id: "u9" }, old_record: task };
  assertEquals(taskNotice(p)?.userIds, ["u9"]);
});

Deno.test("task push = visible notification + silent widget refresh per device", () => {
  const n = taskNotice({ type: "INSERT", table: "tasks", record: task, old_record: null })!;
  const msgs = expoMessages([{ fcm_token: "ExponentPushToken[a]" }, { fcm_token: "ExponentPushToken[b]" }], n);
  assertEquals(msgs.length, 4);
  assertEquals(msgs.filter((m) => m.visible).length, 2);
  const silent = msgs.find((m) => !m.visible)!.message;
  assertEquals("title" in silent || "body" in silent, false);
  assertEquals((silent.data as Record<string, string>).type, "widget-refresh");
});

Deno.test("requests without the shared secret are rejected", async () => {
  Deno.env.set("WEBHOOK_SECRET", "s3cret");
  const body = JSON.stringify({ type: "INSERT", table: "tasks", record: task, old_record: null });
  const bad = await handler(new Request("http://x", { method: "POST", body, headers: { "x-webhook-secret": "nope" } }));
  assertEquals(bad.status, 401);
  const none = await handler(new Request("http://x", { method: "POST", body }));
  assertEquals(none.status, 401);
});

Deno.test("valid secret + irrelevant change returns skipped without touching the DB", async () => {
  Deno.env.set("WEBHOOK_SECRET", "s3cret");
  const body = JSON.stringify({ type: "UPDATE", table: "tasks", record: { ...task, status: "done" }, old_record: task });
  const res = await handler(new Request("http://x", { method: "POST", body, headers: { "x-webhook-secret": "s3cret" } }));
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { skipped: true });
});

Deno.test("open volunteer task notifies the event's volunteers, minus the one who released it", () => {
  const open = { ...task, assignee_id: null, assignee_type: "volunteer" };
  const created: WebhookPayload = { type: "INSERT", table: "tasks", record: open, old_record: null };
  assertEquals(openTaskNotice(created, ["v1", "v2"], "HackFest")?.userIds, ["v1", "v2"]);
  const released: WebhookPayload = { type: "UPDATE", table: "tasks", record: open, old_record: { ...open, assignee_id: "v1" } };
  assertEquals(openTaskNotice(released, ["v1", "v2"])?.userIds, ["v2"]);
  // edits to an already-open task, and sponsor tasks, stay quiet
  assertEquals(isNewOpenTask({ type: "UPDATE", table: "tasks", record: open, old_record: open }), false);
  assertEquals(isNewOpenTask({ ...created, record: { ...open, assignee_type: "sponsor" } }), false);
});
