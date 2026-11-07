import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { disablePush, enablePush, getPushSupport, isPushEnabled, refreshPushSubscription } from '@/lib/webPush';

/** One-line card on the volunteer task page: "Get notified when a task is assigned to you". */
export function PushNotificationsCard() {
  const { user, isLiveSupabase } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const support = getPushSupport();

  useEffect(() => {
    if (!user) return;
    isPushEnabled().then((on) => {
      setEnabled(on);
      if (on) refreshPushSubscription(user.id);
    });
  }, [user]);

  if (!isLiveSupabase || !user || support === 'not-configured' || enabled === null) return null;

  if (support === 'unsupported') return null;

  if (support === 'ios-needs-install') {
    return (
      <div className="border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        To get task notifications on iPhone, tap <span className="font-semibold">Share → Add to Home Screen</span>,
        then open FestFlow from your home screen.
      </div>
    );
  }

  const blocked = typeof Notification !== 'undefined' && Notification.permission === 'denied';

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (enabled) {
        await disablePush(user.id);
        setEnabled(false);
      } else {
        await enablePush(user.id);
        setEnabled(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change notification settings');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-slate-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="text-xs">
        <div className="font-semibold text-slate-900">
          {enabled ? 'Task notifications are on for this browser' : 'Get notified when a task is assigned to you'}
        </div>
        <div className="text-slate-500">
          {blocked
            ? 'Notifications are blocked. Allow them for this site in your browser settings.'
            : 'Works on your phone too: on Android Chrome they show up like app notifications.'}
        </div>
        {error && <div className="text-red-700 mt-1">{error}</div>}
      </div>
      {!blocked && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`shrink-0 px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-60 ${
            enabled
              ? 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
              : 'text-white bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {busy ? 'Working…' : enabled ? 'Turn off' : 'Turn on notifications'}
        </button>
      )}
    </div>
  );
}
