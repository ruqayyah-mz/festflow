import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Announcement } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';

export function ParticipantAnnouncementsPage() {
  const { eventId = '' } = useParams<{ eventId: string }>();
  const load = () => mockStorage.getAnnouncements(eventId, 'participants');
  const [announcements, setAnnouncements] = useState<Announcement[]>(load);

  useEffect(() => {
    setAnnouncements(load());
    return mockStorage.subscribe(() => setAnnouncements(load()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Announcements</h1>
      {announcements.length === 0 ? (
        <EmptyState message="No announcements have been published for participants yet." />
      ) : (
        <div className="border border-slate-200 bg-white p-6 shadow-2xs divide-y divide-slate-100">
          {announcements.map((item) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-emerald-200 bg-emerald-50 text-emerald-700">
                  {item.audience === 'all' ? 'All Attendees' : 'Participants'}
                </span>
                <span className="text-xs font-mono text-slate-400">{formatDate(item.created_at)}</span>
              </div>
              {item.title && <h3 className="text-sm font-bold text-slate-900 pt-0.5">{item.title}</h3>}
              <p className="text-xs text-slate-700 leading-relaxed">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
