import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Announcement } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';

export function VolunteerAnnouncementsPage() {
  const { eventId = '' } = useParams<{ eventId: string }>();
  const load = () => mockStorage.getAnnouncements(eventId, 'volunteers');
  const [announcements, setAnnouncements] = useState<Announcement[]>(load);

  useEffect(() => {
    setAnnouncements(load());
    return mockStorage.subscribe(() => setAnnouncements(load()));
  }, [eventId]);

  return (
    <div className="space-y-6">
      {announcements.length === 0 ? (
        <EmptyState
          message="No volunteer announcements published yet for this event."
          actionLabel="View Tasks"
          onAction={() => {
            window.location.href = `/volunteer/events/${eventId}`;
          }}
        />
      ) : (
        <div className="border border-slate-200 bg-white p-6 shadow-2xs divide-y divide-slate-100">
          {announcements.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700">
                  {item.audience === 'all' ? 'All Staff' : 'Volunteer Staff Only'}
                </span>

                <span className="text-xs font-mono text-slate-400">
                  {formatDate(item.created_at)}
                </span>
              </div>

              {item.title && (
                <h3 className="text-sm font-bold text-slate-900 pt-0.5">
                  {item.title}
                </h3>
              )}

              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

