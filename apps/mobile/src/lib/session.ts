import type { RoleType } from '@festflow/shared';
import { refreshMyEvents } from './events';
import { supabase } from './supabase';
import { MobileStorage } from './storage';
import { registerForPushNotificationsAsync, unregisterPushNotificationAsync } from './notifications';
import { syncMyTasks } from './tasks';
import { refreshAllWidgets } from '../../widgets/widgetManager';
import { router } from 'expo-router';

// '/(tabs)' is only a route group (no index screen), so always land on the active role's first tab.
export const ROLE_HOME = {
  volunteer: '/(tabs)/events',
  sponsor: '/(tabs)/browse',
  participant: '/(tabs)/home',
  organizer: '/(tabs)/overview',
} as const satisfies Record<RoleType, string>;

export async function goHome() {
  router.replace(ROLE_HOME[await MobileStorage.getActiveRole()] ?? ROLE_HOME.volunteer);
}

const ROLE_PRIORITY: RoleType[] = ['volunteer', 'sponsor', 'participant', 'organizer'];

/** Real Supabase email/password sign-in. Returns the role the app should open with. */
export async function signInWithEmail(email: string, password: string): Promise<RoleType> {
  if (!supabase) throw new Error('Supabase is not configured for this build');

  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) throw new Error(error?.message ?? 'Sign-in failed');
  const userId = data.user.id;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url').eq('id', userId).maybeSingle(),
    supabase.from('roles').select('role_type').eq('user_id', userId),
  ]);

  const roles = [...new Set((roleRows ?? []).map((r) => r.role_type as RoleType))];
  const active = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? 'volunteer';

  await MobileStorage.setUser({
    id: userId,
    full_name: (profile?.full_name as string | undefined) ?? data.user.email ?? 'Volunteer',
    avatar_url: (profile?.avatar_url as string | undefined) ?? undefined,
  });
  await MobileStorage.setUserRoles(roles.length ? roles : ['volunteer']);
  await MobileStorage.setActiveRole(active);
  await refreshMyEvents(active).catch(() => undefined);

  await finishSignIn(userId);
  return active;
}

/** Shared by real sign-in and the demo persona picker. */
export async function finishSignIn(userId: string) {
  await registerForPushNotificationsAsync(userId);
  await syncMyTasks().catch(() => undefined);
  await refreshAllWidgets();
}

export async function signOut() {
  const user = await MobileStorage.getUser();
  if (user) await unregisterPushNotificationAsync(user.id).catch(() => undefined);
  if (supabase) await supabase.auth.signOut().catch(() => undefined);
  await MobileStorage.clearSession();
  await refreshAllWidgets(); // widget switches to "Sign in" instead of showing the old user's tasks
}

/** In live mode the Supabase session is the source of truth; in demo mode the stored persona is. */
export async function hasSession(): Promise<boolean> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session) && Boolean(await MobileStorage.getUser());
  }
  return Boolean(await MobileStorage.getUser());
}
