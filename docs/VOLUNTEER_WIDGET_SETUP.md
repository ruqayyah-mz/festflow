# Volunteer task widget + assignment notifications

What this adds, end to end:

1. **Organizer assigns a task** (web) → row in `public.tasks`.
2. **Database trigger** `trg_tasks_notify_assignee` → calls the `push-notifications` edge function.
3. The function sends to every device the volunteer has registered:
   - **Phone app** → Expo push (visible "New task assigned" + a silent message that refreshes the widget)
   - **Browser** → Web Push (on Android Chrome this shows up as a normal phone notification, tab closed or not)
4. **Home-screen widget** ("FestFlow: My Tasks") lists the volunteer's tasks with a tick box each. Tapping a box
   marks it done **without opening the app** (calls `set_task_status`). Offline taps are queued and sent later.
5. **Web dashboards update live** through Supabase Realtime. The organizer sees the tick appear without refreshing.

Scope today: **tasks only** are stored in Supabase. In live mode, events, roles, profiles and tasks are *loaded* from
Supabase. Other writes in the web app (creating events, teams, judging, sponsors…) still stay in the browser only.
Use the seeded event (or create events directly in Supabase) until those parts are migrated.

---

## 1. Supabase

1. **SQL editor:** run these files in order:
   1. `supabase/migrations/20261023000000_initial_schema.sql`
   2. `supabase/migrations/20261106000000_schema_updates.sql`
   3. `supabase/migrations/20261108000000_volunteer_task_loop.sql` ← new
   4. `supabase/seed.sql` (optional demo data; creates 4 login accounts, password `festflow-demo`:
      `organizer@`, `volunteer@`, `sponsor@`, `participant@festflow.dev`)

   If the 3rd file prints *"pg_net could not be enabled"*, enable **pg_net** under Database → Extensions and run it again.

2. **Pick a webhook secret** (any long random string, e.g. `openssl rand -hex 32`) and store two Vault secrets
   (SQL editor):
   ```sql
   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1', 'festflow_functions_url');
   select vault.create_secret('<your-webhook-secret>', 'festflow_webhook_secret');
   ```
   Until these exist, tasks still save fine; only the notification is skipped (you'll see a NOTICE).

3. **Do not** create a Database Webhook for `public.tasks` in the dashboard (older docs said to). The trigger
   replaces it, and having both sends every notification twice.

## 2. Edge function

```bash
npx web-push generate-vapid-keys          # once; prints a public + private key for browser push

npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase secrets set \
  WEBHOOK_SECRET=<your-webhook-secret> \
  VAPID_PUBLIC_KEY=<public key> \
  VAPID_PRIVATE_KEY=<private key> \
  VAPID_SUBJECT=mailto:<you@yourdomain> \
  SITE_URL=https://<your-vercel-domain>
npx supabase functions deploy push-notifications --no-verify-jwt
```

`--no-verify-jwt` is intentional: the function is called by the database, and checks `x-webhook-secret` itself.
(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to edge functions automatically.)

Optional: `EXPO_ACCESS_TOKEN` if you turn on "Enhanced push security" in your Expo account.

Tests (no Supabase needed):
```bash
cd supabase/functions/push-notifications && deno test --allow-env --allow-read handler_test.ts
```

## 3. Web app (Vercel)

Environment variables:
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_USE_MOCK_DATA=false
VITE_VAPID_PUBLIC_KEY=<public key from step 2>
```
With these set, the login page switches from the demo persona picker to real email/password sign-in.
Volunteers see a **"Turn on notifications"** card on their task page. Browser push needs HTTPS
(Vercel is fine; `localhost` also works for testing).

iPhone: browser push only works after **Share → Add to Home Screen** (iOS 16.4+). The card tells the user this.

## 4. Android app

From `apps/mobile`:

1. `npm install`. A `package-lock.json` is now committed, so everyone gets the same versions.
   (Without it, npm was pulling React Navigation releases that don't work with Expo SDK 52.)
2. `npx eas login` then `npx eas init`. This writes the real `extra.eas.projectId` into `app.json`
   (the current value is a placeholder, and push tokens can't be issued without it).
3. **Firebase:** create an Android app with package `dev.festflow.app`, download `google-services.json` and
   replace the placeholder in `apps/mobile/`. In Firebase → Project settings → Service accounts, generate a private
   key, then upload it with `npx eas credentials` → Android → *Google Service Account Key for Push Notifications (FCM V1)*.
4. Put your Supabase URL + anon key in `eas.json` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
   for the `preview` and `production` profiles.
5. Build: `npx eas build --platform android --profile preview` → install the APK.
6. Sign in as the volunteer, allow notifications, then long-press the home screen → Widgets → FestFlow →
   **FestFlow: My Tasks**.

Widget or native changes always need a **new APK**. `eas update` (OTA) only ships JavaScript.

## 5. End-to-end check

| Step | Expected |
|---|---|
| Web: sign in as `organizer@festflow.dev`, assign a task to Sarah Chen | Task saved |
| Phone (volunteer signed in, app closed) | "New task assigned" notification; widget shows the task within seconds |
| Browser (volunteer, notifications on) | Same notification from the browser |
| Tap the widget's tick box | Box ticks instantly; footer goes *Saving… → Synced hh:mm* |
| Organizer's web dashboard | Task flips to Done without a refresh |
| Airplane mode, tick another box | Footer says *Offline · will sync*; turns into Synced after reconnecting / opening the app |

## Notes and limits

- Android caps widget periodic refresh at 30 minutes. New tasks show up faster because the push wakes the widget,
  and also whenever the app is opened.
- Some phones (Xiaomi/MIUI, Oppo/ColorOS, some Samsung modes) block background work for sideloaded apps. If widget taps
  or the silent refresh lag, allow **Autostart / unrestricted battery** for FestFlow.
- Ticked tasks stay on the widget (greyed, checked) for 12 hours so a mis-tap can be undone, like a notes checklist.
- Volunteers can only change the **status** of tasks assigned to them (enforced in the database by
  `set_task_status`). They can no longer edit a task's title or due date directly.

## Pre-existing problems fixed along the way

- **Mobile app couldn't bundle:** JSX in `.ts` files; Metro `disableHierarchicalLookup` broke resolution; missing
  `expo-asset` and `react-native-svg`; no lockfile, so incompatible React Navigation versions got installed.
- Widget handler was registered inside a screen (so it didn't run with the app closed) and showed demo/all users' tasks.
- Push used raw FCM tokens with Expo's push service (never delivered), and nothing triggered the function.
- `supabase.realtime.reconnect()` doesn't exist, so the app crashed every time it returned to the foreground.
- **RLS infinite recursion** between `events` and `roles` policies. Every signed-in query touching events/tasks failed.
- `seed.sql`: invalid UUIDs (`k0000000-…`), a task row missing its `event_id`, and profiles inserted without auth users.
- Organizer progress widget used `%` widths, which Android widgets don't support.
