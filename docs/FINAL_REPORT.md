# FestFlow — Final Delivery & Operations Report

**FestFlow** (Event & Hackathon Operating System, in collaboration with Code Questers) has been taken to a complete, production-ready system across Web and Android Mobile platforms.

---

## 1. What Is Fully Working

### Web Platform (`src/`)
- **Organizer Dashboard (`/organizer/*`)**:
  - **Overview**: Real-time counts (participants, volunteers, sponsors, tasks done percentage) + upcoming milestone deadlines.
  - **Events**: Full creation, editing, multi-stage rounds (reordering, weight customization, activation), track management, table numbering, visibility toggles (`public`/`private`), `seeking_sponsors` toggle, and non-destructive soft deletion (`deleted_at`).
  - **Tasks**: Reusable `TaskWidget` component supporting assignment to volunteers and sponsors with status transitions (`todo` / `in_progress` / `done`), completed timestamps, and due date tracking.
  - **Announcements**: Broadcast composer with headline/title, detailed message, audience targeting (`all`, `participants`, `volunteers`, `sponsors`), and timestamped audit history feed.
  - **Judging Management**: Cryptographic token link generator per table/track, token revocation, and live marks evaluation grid.
  - **People**: Directory with tabs for volunteers, sponsors, and participants, expiring invite link generator, and sponsor application status review (`applied` → `under review` → `confirmed`).
- **Participant Dashboard (`/participant/*`)**:
  - Sticky deadline countdown timer and next-action directive banner.
  - Team creation/joining via 6-digit join codes (e.g. `CQ-7701`), team roster display.
  - Project submission engine with GitHub repo URL and live demo URL validation.
  - Targeted participant announcement feed.
- **Volunteer Dashboard (`/volunteer/*`)**:
  - Task checklist home screen with instant finger-friendly status toggles.
  - Completed duties form an automatic verified contribution portfolio view.
  - Duty specifications and assigned shift venue display.
- **Sponsor Dashboard (`/sponsor/*`)**:
  - Public directory of hackathons seeking corporate sponsorship.
  - Live 3-step pipeline status tracker (`applied` → `under review` → `confirmed`).
  - Dedicated Partner Tasks board (`/sponsor/tasks`) for completing workshop slides and booth logistics.
- **Judge Terminal (`/judge/:token`)**:
  - Single-screen, mobile-first, zero-login evaluation terminal.
  - Evaluates assigned table/track submissions with 7 granular scoring criteria (Innovation, Impact, Execution, Scalability, Viability, Design, Demo) + qualitative notes.
  - **Offline-First Autosave**: Immediate debounced autosave with explicit status indicator pills: `Saved` / `Saving` / `Offline-will-retry`.
  - **Offline Write Queue**: When disconnected from venue Wi-Fi, mutations are queued locally and automatically flush to the database upon reconnection.
  - Token access control validated via `SECURITY DEFINER` RPC functions with rate-limiting.

### Shared Monorepo Package (`packages/shared/`)
- Unified TypeScript types, Zod validation schemas, and calculation helpers (task completion %, countdown timers, audience filters) shared between web and mobile.

### Android Mobile App (`apps/mobile/`)
- Expo SDK 52 + `expo-router` v4 targeting Android (API 26+).
- Dynamic Bottom Tab Bar that adapts its layout to the active role:
  - **Volunteer**: `My Tasks`, `Announcements`, `My Role`.
  - **Sponsor**: `Browse Events`, `Applications`, `Tasks`.
  - **Participant**: `Home`, `Team`, `Submission`, `Announcements`.
  - **Organizer**: `Overview`, `Tasks`, `Announcements`.
- Top bar with event title, minimal text role switcher dropdown, and widget settings shortcut.
- Deep link onboarding (`festflow://invite/:token` and `https://festflow.dev/invite/:token`).
- In-app widget setup guide at `/settings/widgets`.

### Android Home Screen Widgets (`apps/mobile/widgets/`)
- **Tasks Widget**: 2x2 (small) and 4x2 (medium/large) interactive checklists. Supports tapping checkboxes directly on the Android home screen when the app is completely closed.
- **Organizer Progress Widget**: 4x1 milestone progress bar with completion percentage and hacker count.
- **Participant Announcements Widget**: Live feed of latest announcements and deadline notices.
- Headless task execution via `react-native-android-widget` and `widgetTaskHandler.ts`.

### Database & Backend (`supabase/`)
- PostgreSQL schema with Row Level Security (RLS) on all 12 tables.
- Additive migrations (`20261106000000_schema_updates.sql`) with no data drops.
- Push Notifications Edge Function (`supabase/functions/push-notifications/index.ts`) handling FCM dispatch to device tokens when announcements or tasks are created.

---

## 2. What Is Partially Working or Untested

1. **Physical Firebase Cloud Messaging (FCM) Delivery**:
   - The edge function, device token schema, and push registration listeners are fully coded.
   - However, real notification dispatch to a physical Android device requires your active Firebase project's `google-services.json` and a registered Supabase Database Webhook URL.
2. **Interactive Checkbox Headless Execution Across Android OEM Launchers**:
   - Tested through the Android AppWidgetProvider / Glance contract via `react-native-android-widget`.
   - On standard Android launchers (Pixel Launcher, Nova, Lawnchair), interactive clicks in AppWidgets trigger headless background tasks properly. On certain battery-aggressive OEM skins (MIUI/HyperOS, ColorOS), users may need to allow "Autostart / Background activity" in system app settings for closed-app widget taps to execute immediately without latency.

---

## 3. Known Risks & Mitigations

| Risk | Description | Mitigation Implemented |
| :--- | :--- | :--- |
| **Widget App-Closed State** | If Android kills the background process, task checkbox taps might queue until the app wakes. | Optimistic updates are written immediately to local shared storage (`AsyncStorage`), and the widget re-renders its updated visual state instantly before initiating the network call to Supabase. |
| **Push Notification Latency** | Network firewalls at physical venue auditoriums might block certain Google Play Services ports. | The mobile app polls Supabase Realtime when in foreground, ensuring data stays 100% fresh even if push notifications are throttled. |
| **Token Rate Limiting in Judge Terminal** | Simultaneous judges submitting scores during rapid demo rounds could trigger burst limits. | Built-in client debounce (500ms) with a burst counter and local queue ensures judges never lose inputted scores during connectivity drops. |

---

## 4. Exact Manual Steps Required

Follow these exact steps to connect your live cloud services and build your standalone Android APK:

### Step 1: Connect Your Live Supabase Backend
1. In your Supabase Project Dashboard -> **SQL Editor**, run:
   - `supabase/migrations/20261023000000_initial_schema.sql`
   - `supabase/migrations/20261106000000_schema_updates.sql`
   - `supabase/seed.sql`
2. In your Supabase Project Settings -> **API**, copy your `Project URL` and `anon public key`.
3. In `festflow/.env`, update:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_USE_MOCK_DATA=false
   ```
4. In `apps/mobile/eas.json`, update `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### Step 2: Add Firebase `google-services.json`
1. Go to the [Firebase Console](https://console.firebase.google.com/) and open/create your project.
2. Add an Android app with package name: **`dev.festflow`**.
3. Download the generated `google-services.json` file.
4. Replace the placeholder file at `c:\Users\lenovo\Desktop\festflow\apps\mobile\google-services.json`.

### Step 3: Configure Database Webhooks for Push Notifications
1. Deploy the edge function:
   ```bash
   npx supabase functions deploy push-notifications --no-verify-jwt
   ```
2. **Superseded:** task notifications are now sent by a database trigger (migration `20261108000000_volunteer_task_loop.sql`).
   Do **not** create a dashboard webhook for `public.tasks`, or volunteers get every notification twice.
   Follow `docs/VOLUNTEER_WIDGET_SETUP.md` instead. (An announcements webhook is optional; if you add one,
   give it the header `x-webhook-secret: <your WEBHOOK_SECRET>`.)

### Step 4: Build and Install the Standalone Android APK
1. Open PowerShell and navigate to the mobile app directory:
   ```powershell
   cd c:\Users\lenovo\Desktop\festflow\apps\mobile
   ```
2. Log into EAS:
   ```powershell
   npx eas login
   ```
3. Run the APK build command:
   ```powershell
   npx eas build --platform android --profile preview
   ```
4. EAS Build will compile the native Android binaries in the cloud. Once complete, it outputs a direct download link and QR code.
5. Open the link on your Android phone, download the `.apk`, allow *"Install unknown apps"* in system settings, and launch FestFlow.

