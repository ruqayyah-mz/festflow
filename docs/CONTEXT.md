# FestFlow - System Architecture & Context

**FestFlow** is an event and hackathon operating system developed in collaboration with Code Questers. It unifies the entire event lifecycle into a single platform serving five key roles: Organizer, Volunteer, Sponsor, Participant, and Judge.

---

## 1. Technical Stack

- **Web Frontend**: React 19, TypeScript 6, Vite 8, React Router v7, Tailwind CSS v4, Lucide React icons.
- **Data Management**: TanStack Query v5, Zod 4, React Hook Form.
- **Backend / Database**: Supabase (PostgreSQL 15+), Row Level Security (RLS) on all tables, PL/pgSQL stored procedures / RPCs, Realtime channels, Supabase Edge Functions for Push notifications.
- **Mobile App**: Expo SDK (React Native), TypeScript, `expo-router` v4, Android-only target, Expo Application Services (EAS Build for standalone APKs), `expo-notifications` for FCM push, `react-native-android-widget` for interactive Android home screen widgets.
- **Storage / Mock Mode**: Hybrid mode with `isLiveSupabaseConfigured` flag and `mockStorage` (localStorage) fallback for offline/demo operation.

---

## 2. Directory Structure

```text
festflow/
├── docs/                      # Architectural & progress documentation
│   ├── CONTEXT.md             # System audit, architecture & design principles
│   ├── DECISIONS.md           # Record of architectural & technical decisions
│   ├── PROGRESS.md            # Execution log & verification steps
│   └── FINAL_REPORT.md        # Final handoff report & manual setup guide
├── supabase/
│   ├── migrations/            # Additive PostgreSQL migrations & RLS policies
│   ├── functions/             # Supabase Edge Functions (e.g. push-notifications)
│   └── seed.sql               # Demo data for testing every role
├── apps/
│   └── mobile/                # Android Expo React Native application
│       ├── app/               # expo-router directory ((tabs), etc.)
│       ├── widgets/           # Android home screen widget definitions
│       └── app.json / eas.json
├── packages/
│   └── shared/                # Shared TypeScript models, schemas, validators
├── src/                       # Web application (desktop-first & responsive)
│   ├── components/            # Shared UI primitives and layouts
│   ├── hooks/                 # Auth & state hooks
│   ├── lib/                   # Supabase client, mockStorage, validators
│   ├── pages/                 # Role-isolated route trees
│   └── types/                 # TypeScript interfaces
```

---

## 3. Strict Design System Rules

FestFlow strictly adheres to a minimalist, utility-first design language across Web, Mobile, and Android Widgets:
1. **Palette**: Generous whitespace, one primary accent (`blue-700` / `#1d4ed8`), slate neutrals (`slate-50` to `slate-900`), crisp `1px` borders (`border-slate-200`), and subtle shadows (`shadow-2xs` / `shadow-xs`). Light mode default with full dark mode support.
2. **Typography**: Single clean sans font family, font-mono for badges, table tags, join codes, and timestamps.
3. **Restraint**: Strictly NO decorative icons, floating gradients, or celebratory illustrations. Flat, crisp, utilitarian UI.
4. **Spacing**: Strict 4px / 8px spacing cadence (`p-2`, `p-4`, `p-6`, `gap-3`, `gap-4`).
5. **Information Density & Nav**:
   - One primary action per screen.
   - Maximum 3 navigation levels deep.
   - Every empty state contains exactly one descriptive line and one action CTA (never blank).
   - Skeleton loaders used during async loading states (no spinning wheels).

---

## 4. Role Isolation & Access Control Architecture

Each role has an isolated dashboard with its own dedicated layout, navigation, and state:
- **Organizer** (`/organizer/*`):
  - Sidebar: Overview, Events, Tasks, Announcements, Judging, People.
  - Multi-round configuration, track & table assignments, tokenized judge link generation, volunteer/sponsor task delegation, sponsor application review.
- **Participant** (`/participant/*`):
  - Sidebar: My Events, Team, Submission, Announcements.
  - Next-action banner, submission deadline countdown, join code team formation, GitHub/Demo submission.
- **Volunteer** (`/volunteer/*`):
  - Sidebar: My Tasks, Announcements, My Role.
  - Task toggle (todo / in_progress / done), contribution portfolio, role duty specifications.
- **Sponsor** (`/sponsor/*`):
  - Sidebar: Browse Events, My Applications, Tasks.
  - Discovery of public events seeking sponsors, application pipeline tracker (applied → under_review → confirmed), sponsor deliverables checklist.
- **Judge Terminal** (`/judge/:token`):
  - Zero-login, single-purpose, mobile-optimized evaluation portal.
  - Scoped strictly to the judge's assigned table or track.
  - Offline-first scoring with autosave status indicators (`Saved` / `Saving` / `Offline-will-retry`).

---

## 5. Security & Row Level Security (RLS) Baseline

- All tables have RLS enabled with strict policies.
- Private events and team submissions are strictly isolated to event members.
- Organizer access is scoped to events where `organizer_id = auth.uid()`.
- Volunteers and sponsors can only modify tasks assigned to their user ID.
- Judge links are cryptographically random tokens validated via `SECURITY DEFINER` RPC functions with rate-limiting.

