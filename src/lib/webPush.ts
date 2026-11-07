// Browser (Web Push) notifications for task assignments.
// The subscription is stored in public.device_tokens (provider = 'webpush'); the
// push-notifications edge function sends to it with the VAPID private key.
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export type PushSupport =
  | 'supported'
  | 'unsupported' // browser has no Push API
  | 'ios-needs-install' // iPhone/iPad: only works after "Add to Home Screen"
  | 'not-configured'; // VITE_VAPID_PUBLIC_KEY / Supabase missing

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function getPushSupport(): PushSupport {
  if (!VAPID_PUBLIC_KEY || !supabase) return 'not-configured';
  const hasApi = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (isIOS() && !isStandalone()) return 'ios-needs-install';
  return hasApi ? 'supported' : 'unsupported';
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  return navigator.serviceWorker.register('/sw.js');
}

/** Already subscribed on this browser (and permission still granted)? */
export async function isPushEnabled(): Promise<boolean> {
  if (getPushSupport() !== 'supported' || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.getRegistration('/');
  return Boolean(await reg?.pushManager.getSubscription());
}

async function saveSubscription(userId: string, sub: PushSubscription) {
  const { error } = await supabase!.from('device_tokens').upsert(
    {
      user_id: userId,
      fcm_token: sub.endpoint,
      provider: 'webpush',
      platform: 'web',
      subscription: sub.toJSON(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,fcm_token' }
  );
  if (error) throw new Error(error.message);
}

/** Must be called from a click handler (browsers require a user gesture for the permission prompt). */
export async function enablePush(userId: string): Promise<void> {
  const support = getPushSupport();
  if (support !== 'supported') throw new Error(`Push not available: ${support}`);

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notifications were blocked. Allow them in your browser settings.');

  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  await saveSubscription(userId, sub);
}

export async function disablePush(userId: string): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await supabase?.from('device_tokens').delete().match({ user_id: userId, fcm_token: sub.endpoint });
  await sub.unsubscribe();
}

/** Re-save an existing subscription (endpoints can rotate) after sign-in. */
export async function refreshPushSubscription(userId: string): Promise<void> {
  if (!(await isPushEnabled())) return;
  const reg = await registration();
  const sub = await reg.pushManager.getSubscription();
  if (sub) await saveSubscription(userId, sub).catch(() => undefined);
}
