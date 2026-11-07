import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Bell, X } from 'lucide-react';

// In-app notifications for the signed-in user, shown as a dismissible strip under the top bar.
// Re-renders come from the parent layout's mockStorage subscription.
export function NotificationBanner({ userId }: { userId: string | undefined }) {
  const notices = userId ? mockStorage.getNotifications(userId) : [];
  if (notices.length === 0) return null;

  return (
    <div className="border-b border-blue-200 bg-blue-50/90 px-4 py-2 text-xs" role="status">
      <div className="max-w-7xl mx-auto space-y-1">
        {notices.slice(0, 3).map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-blue-950 min-w-0">
              <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {n.link ? (
                <Link to={n.link} onClick={() => mockStorage.dismissNotification(n.id)} className="hover:underline truncate">
                  {n.message}
                </Link>
              ) : (
                <span className="truncate">{n.message}</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => mockStorage.dismissNotification(n.id)}
              aria-label="Dismiss notification"
              className="text-blue-500 hover:text-blue-800 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {notices.length > 3 && (
          <button
            type="button"
            onClick={() => notices.forEach((n) => mockStorage.dismissNotification(n.id))}
            className="text-blue-700 hover:underline cursor-pointer"
          >
            +{notices.length - 3} more · dismiss all
          </button>
        )}
      </div>
    </div>
  );
}
