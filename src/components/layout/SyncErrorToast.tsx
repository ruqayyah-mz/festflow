import { useEffect, useState } from 'react';
import { SYNC_ERROR_EVENT } from '@/lib/liveSync';

/** Surfaces failed writes to Supabase (e.g. a task update rejected by the server). */
export function SyncErrorToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onError = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 6000);
    };
    window.addEventListener(SYNC_ERROR_EVENT, onError);
    return () => {
      window.removeEventListener(SYNC_ERROR_EVENT, onError);
      clearTimeout(timer);
    };
  }, []);

  if (!message) return null;
  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 max-w-sm border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 shadow-md"
    >
      {message}
      <button type="button" onClick={() => setMessage(null)} className="ml-3 underline cursor-pointer">
        Dismiss
      </button>
    </div>
  );
}
