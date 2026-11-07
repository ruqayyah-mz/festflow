# FestFlow - Architecture & Implementation Decisions

This document logs key architectural and technical decisions made to deliver the complete FestFlow platform in a single continuous run.

---

### DEC-001: Monorepo Structure without Breaking Existing Web App
- **Context**: The web application was originally at the repository root (`src/`, `package.json`, `vite.config.ts`). The prompt mandates an Android Expo app placed at `apps/mobile` and sharing types/schemas via a shared package, advising to only move the web app into `apps/web` if low risk, otherwise leave it in place.
- **Decision**: Keep the existing web application in place at root to prevent broken paths, Vite configurations, or Vercel deployment setups. Create `packages/shared/` containing shared TypeScript interfaces, Zod schemas, and query helpers, and create `apps/mobile/` containing the Expo React Native app. Web imports shared types seamlessly while retaining full backward compatibility.

### DEC-002: Additive Supabase Database Migrations
- **Context**: Schema requires `tasks.completed_at`, `announcements.title`, and a `device_tokens` table for FCM push notifications. The prompt specifies additive migrations only with no data loss or drops.
- **Decision**: Created `supabase/migrations/20261106000000_schema_updates.sql`. Added columns `completed_at` to `tasks`, `title` to `announcements` (with default fallback to preserve existing data), created `device_tokens` table with RLS, and added RPC functions for token validation and push notification triggers.

### DEC-003: Offline Autosave & Queueing in Judge Terminal
- **Context**: The Judge page requires autosave on every score change with visible `Saved` / `Saving` / `Offline-will-retry` indicators, token validation via RPC or edge function, and offline retry queueing.
- **Decision**: Enhanced `JudgeMarkingPage.tsx` to maintain an offline write queue in `localStorage`. If offline, mutations are queued and marked `Offline-will-retry`. When the browser detects an `online` event or visibility change, the queue automatically flushes to Supabase RPC / mock storage, updating the indicator to `Saved`.

### DEC-004: Interactive Android Home Screen Widgets
- **Context**: Android home screen widgets are a core feature. Volunteer + Sponsor widgets require interactive checkboxes directly from the home screen when the app is closed, with optimistic UI and headless task updates.
- **Decision**: Configured `react-native-android-widget` with dedicated widget preview components and an Android Glance/AppWidget native module bridge. Handled headless background actions updating task status in SQLite/AsyncStorage and dispatching Supabase mutations, updating `tasks.status` and `completed_at` so web organizers observe updates immediately via Supabase Realtime.

### DEC-005: FCM Push Notification Architecture via Edge Functions
- **Context**: Push notifications must trigger on announcement post or task assignment and deep-link to the target item.
- **Decision**: Defined a Supabase Database Webhook invoking the `push-notifications` Edge Function. The function retrieves relevant `device_tokens` filtered by `event_id` and role audience, then dispatches FCM / Expo push notifications with deep links (`festflow://announcement/:id` or `festflow://task/:id`).

