# FestFlow — Event & Hackathon Operating System
> Minimalist Event Management SaaS Ecosystem.

FestFlow is a unified, minimalist event management SaaS ecosystem tailored for collegiate hackathons, developer fests, and technical symposia. It coordinates the primary organizer workflows with secondary sponsor and volunteer tracks, a participant audience layer, and frictionless link-based guest evaluation for judges.

---

## Strict Minimalist Design System
- **Generous Whitespace & Hierarchy**: Typography-first layouts powered by the **Inter** font family with a consistent 4/8px spacing grid.
- **Flat 1px Borders**: No decorative gradients, 3D shadows, or non-functional emojis/illustrations. Subtle 1px borders define structure.
- **Neutrals + Single Crisp Accent**: High-contrast dark neutrals (`#09090b` / `#18181b` / `#fafafa`) paired with a purposeful cobalt/emerald functional accent.
- **One-line Empty States with CTAs**: Every empty list (no tasks, no sponsors, no announcements, no events) displays a concise one-line message and a single primary action button—never a blank screen.
- **Loading Skeletons**: Smooth pulse skeleton layouts replace spinning icons across all data-fetching views.
- **Mobile-First Layouts**: The Volunteer task checklist and Judge marking pages are optimized for mobile phones during venue shifts and floor reviews.

---

## 5 Ecosystem Roles & Feature Highlights

### 1. Organizer (Primary Role)
- **Event Lifecycle**: Create public or private events with dates, physical venue/virtual links, and sponsorship recruitment settings.
- **Sponsor Offer Marketplace**: Browse sponsor offers by category (food, venue, technology, prizes, travel, media, or other), review available funding and expectations, and apply to support an event.
- **Soft-Delete Architecture**: Events are marked with `deleted_at` timestamps rather than destructive hard-deletions, preserving audit integrity.
- **Multi-Round Evaluation Engine**: Define stages (e.g. *Round 1: Idea Validation*, *Round 2: Prototype Demo*, *Round 3: Grand Stage Finals*) with customizable weights (%) and single-click round activations.
- **Reusable TaskWidget**: Assign task checklists to volunteers and sponsors with real-time status toggles (`todo` / `in_progress` / `done`), assignees, and due dates.
- **Broadcast Announcements**: Publish instant notifications targeting specific audiences (`all`, `participants`, `volunteers`, `sponsors`) with timestamped historical feeds.
- **Tokenized Judge Links**: Generate unique shareable token URLs per table or track (e.g. `CQ26-TABLE-14-16`) with zero account friction for external judges.
- **Operations Analytics**: Live tracking of registered builders, team counts, volunteer task completion rate, and sponsor pipeline status.

### 2. Participant (Audience Layer)
- **Team Formation & Join Codes**: Create a squad or join an existing team via 6-digit codes (e.g. `CQ-7701`).
- **Live Deadline Countdown**: Real-time ticker counting down hours, minutes, and seconds until the submission deadline.
- **Project Submission Engine**: Submit project details (title, architecture overview, GitHub repository URL, live demo URL) with inline validation (`submitted` / `not_submitted`).
- **Targeted Broadcasts**: View live hackathon announcements and schedule changes.

### 3. Volunteer (Staff Layer)
- **Tokenized Onboarding**: One-click onboarding via token links (e.g. `/invite/vol-cq26-lead`).
- **Assigned Role Display**: View your designated specialty (e.g. *Hacker Experience & Logistics Lead*).
- **Mobile Duty Checklist**: Portfolio-style task tracking with fast finger-friendly toggles between `To Do`, `In Progress`, and `Done`.
- **Live Portfolio Throughput Bar**: Dynamic progress bar calculating individual and team completion percentages.

### 4. Sponsor (Partner Layer)
- **Sponsor Offers**: Publish multiple categorized funding offers with organization details, available amount, currency, and expected event benefits; review and respond to organizer applications.
- **Public Sponsorship Directory**: Discover events actively seeking corporate sponsors.
- **Structured Application Pipeline**: Apply with company details, requested tier, offered perks (API credits, GPUs, hardware), and stage/booth requirements.
- **Progression Tracker**: Monitor status stages: `applied` → `under review` → `confirmed`.
- **Sponsor Task Board**: Complete sponsor deliverables (upload slide decks, booth hours).

### 5. Judges (Link-Based Guests, No Account)
- **Zero Friction**: Judges open a token link (e.g. `/judge/cq26-table-14-16`) without needing an account or login.
- **Venue Wi-Fi Resilient Autosave**: Every mark entry and critique note autosaves automatically with debouncing and visual indicators (`Autosaved`).
- **Rate-Limited Submissions**: Token authorization is the sole access control, reinforced by database-level RPC security.

---

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router 7
- **Data & State**: TanStack Query + Supabase JS Client
- **Forms & Validation**: React Hook Form + Zod
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, RPC Functions, Realtime)
- **Hosting**: Vercel

---

## Database Architecture & Row Level Security (PostgreSQL)

The full SQL schema and RLS policies are located in `supabase/migrations/20261023000000_initial_schema.sql` and `supabase/seed.sql`.

### Core Tables:
1. `profiles`: `id (uuid, fk auth.users)`, `full_name`, `avatar_url`, `created_at`
2. `events`: `id`, `organizer_id`, `name`, `description`, `venue`, `starts_at`, `ends_at`, `visibility` (public/private), `rounds` (jsonb), `tracks` (jsonb), `seeking_sponsors`, `deleted_at`
3. `roles`: `id`, `user_id`, `event_id`, `role_type` (organizer/volunteer/sponsor/participant), `role_title`
4. `invites`: `id`, `event_id`, `token`, `role_type`, `role_title`, `expires_at`
5. `teams`: `id`, `event_id`, `name`, `join_code`, `table_number`, `track`
6. `team_members`: `id`, `team_id`, `user_id`
7. `submissions`: `id`, `team_id`, `event_id`, `title`, `description`, `repo_url`, `demo_url`, `status`, `submitted_at`
8. `tasks`: `id`, `event_id`, `assignee_id`, `assignee_type` (volunteer/sponsor), `title`, `description`, `status` (todo/in_progress/done), `due_at`
9. `announcements`: `id`, `event_id`, `audience` (all/participants/volunteers/sponsors), `message`, `created_at`
10. `judge_links`: `id`, `event_id`, `token`, `table_assignment`, `track_assignment`, `judge_name`
11. `marks`: `id`, `judge_link_id`, `submission_id`, `round`, `score`, `criteria`, `notes`, `updated_at`
12. `sponsorship_applications`: `id`, `event_id`, `sponsor_id`, `status` (applied/under_review/confirmed), `form_data`

### Stored Procedures / RPCs:
- `public.verify_judge_token(p_token)`: Verifies judge token validity and returns event/table scope without exposing organizer data.
- `public.save_judge_mark(...)`: Atomic upsert for judge marks with token validation.

---

## Setup & Running Locally

### Prerequisites
- Node.js 18+ (tested on Node 24)
- npm 10+
- EAS CLI: `npm install -g eas-cli` (for building mobile APKs)

### Web Application Setup
```bash
# 1. Install root dependencies
npm install

# 2. Configure environment variables
# Copy .env.example to .env and insert your live Supabase credentials, or leave blank to run in mock localStorage mode
cp .env.example .env

# 3. Start development server
npm run dev

# 4. Build for production (verified with zero errors)
npm run build
```

### Mobile Application Setup (`apps/mobile`)
```bash
# 1. Navigate to mobile directory
cd apps/mobile

# 2. Install dependencies
npm install

# 3. Add your Firebase google-services.json
# Place your real google-services.json from the Firebase Console (Android App: dev.festflow.app)
# into apps/mobile/google-services.json

# 4. Start local Expo development server
npx expo start
```

---

## Android Build & Distribution (EAS Build)

### 1. Build an Installable Android APK (Preview Profile)
To generate an installable `.apk` file for testing directly on physical Android phones without Google Play:
```bash
cd apps/mobile
eas login
eas build --platform android --profile preview
```
This builds with `buildType: "apk"` configured in `apps/mobile/eas.json`. When the build completes, EAS provides a direct download link and QR code for the `.apk`.

### 2. How to Install and Share the APK
1. **Download**: Download the `.apk` on your Android device (Android 8.0+ / API 26+).
2. **Enable Unknown Apps**: When opening the file, Android prompts: *"For your security, your phone is not allowed to install unknown apps from this source"*.
   - Tap **Settings** in the prompt.
   - Toggle **Allow from this source** ON.
   - Return and tap **Install**.
3. **Open FestFlow**: Sign in as Organizer, Volunteer, Sponsor, or Participant.

### 3. Build Production AAB (Google Play Store)
```bash
eas build --platform android --profile production
```
Outputs an Android App Bundle (`.aab`) configured for the Google Play Console.

### 4. Shipping Updates: EAS Update vs New APK
- **JavaScript / UI / Flow Updates**: Run `eas update --branch preview` to deploy instant over-the-air (OTA) updates directly to installed apps without reinstalling the APK.
- **Native / Plugin Changes**: If modifying Android widgets (`react-native-android-widget`), permissions, or native modules, run `eas build --platform android --profile preview` to generate a fresh APK.

---

## Web Deployment (Vercel)
FestFlow is preconfigured with `vercel.json` for seamless deployment:
1. Connect your repository to Vercel.
2. In Project Settings -> Environment Variables, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `VITE_USE_MOCK_DATA`: Set to `false` for live database or `true` for demo mode.
3. Build Command: `npm run build`
4. Output Directory: `dist`

---

## Testing Every Role via Seed Script & Demo Data

The database seed (`supabase/seed.sql`) and local storage mock provide ready-to-test credentials for every dashboard:
- **Organizer**: Alex Rivera (`organizer@festflow.dev` / select *Organizer* card) -> lands on `/organizer`
- **Volunteer**: Sarah Chen (`volunteer@festflow.dev` / select *Volunteer* card) -> lands on `/volunteer`
- **Sponsor**: Elena Rostova (`sponsor@festflow.dev` / select *Sponsor* card) -> lands on `/sponsor`
- **Participant**: David Kim (`participant@festflow.dev` / select *Participant* card) -> lands on `/participant`
- **Judge Terminal**: Open `/judge/judge-table-14-15` or `/judge/judge-all-tracks` (no account required, supports offline autosave with queueing and retry).


# 3. Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Instant Persona Sandbox Mode

FestFlow includes a full-fidelity built-in sandbox with pre-seeded data so you can test all 5 roles end-to-end immediately without connecting external services:
- **Role Switcher in Header**: Select **Organizer**, **Volunteer**, **Sponsor**, or **Participant** to switch views in real-time.
- **Judge Portal Quick Access**: Direct link to `/judge/cq26-table-14-16` to test mark autosave.
- **Reset Demo Button**: Resets local state back to the original seed data at any time.

---

## Supabase Deployment & Connection

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run:
   - `supabase/migrations/20261023000000_initial_schema.sql` (Schema, RLS, Indexes, RPCs)
   - `supabase/seed.sql` (Initial demo data)
3. Copy your project URL and Anon Key from **Project Settings → API**.
4. In your `.env` file (or Vercel environment variables):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_USE_MOCK_DATA=false
   ```

---

## Vercel Deployment

1. Push your repository to GitHub or GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Add the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
7. Client-side routing is automatically handled via `vercel.json`.

---

## Project Directory Layout
```
festflow/
├── src/
│   ├── components/
│   │   ├── ui/               # Button, Input, Textarea, Select, Skeleton
│   │   ├── EmptyState.tsx    # Strict 1-line message + single CTA empty states
│   │   ├── TaskWidget.tsx    # Reusable task widget for volunteers & sponsors
│   │   ├── AnnouncementFeed.tsx # Broadcast feed with audience filtering
│   │   └── Navbar.tsx        # Minimal navigation with persona switcher
│   ├── hooks/
│   │   └── useAuth.tsx       # Auth provider & persona switching
│   ├── lib/
│   │   ├── guards.tsx        # Route-level role guards
│   │   ├── mockData.ts       # Initial demo seed data
│   │   ├── mockStorage.ts    # Reactive storage & CRUD engine
│   │   ├── supabase.ts       # Supabase client wrapper
│   │   ├── utils.ts          # Helpers, classnames, countdown calculation
│   │   └── validators.ts     # Zod schemas for all forms
│   ├── pages/
│   │   ├── LandingPage.tsx   # Typography-first hero & ecosystem overview
│   │   ├── PublicEventsPage.tsx
│   │   ├── PublicEventViewPage.tsx
│   │   ├── auth/LoginPage.tsx
│   │   ├── organizer/        # Dashboard, CreateEvent, EditEvent, Hackathon Ops, Analytics
│   │   ├── participant/      # Participant Hub & Team Management (Join code CQ-7701)
│   │   ├── volunteer/        # Duty worklist & Token onboarding
│   │   ├── sponsor/          # Sponsor browse, Application form & Pipeline tracking
│   │   └── judge/            # Token-based marking terminal with autosave
│   ├── types/index.ts        # Complete TypeScript interfaces
│   ├── App.tsx               # Route architecture & providers
│   ├── index.css             # Tailwind v4 minimalist design system
│   └── main.tsx
├── supabase/
│   ├── migrations/20261023000000_initial_schema.sql
│   └── seed.sql
├── vercel.json
├── .env.example
└── README.md
```
