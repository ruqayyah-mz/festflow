import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Event, Announcement } from '@/types';
import { EventHeaderBanner } from './EventHeaderBanner';
import { getEventCategory } from '../OrganizerOverviewPage';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import {
  Megaphone,
  CheckCircle2,
  Send,
  ListFilter,
} from 'lucide-react';

export function EventAnnouncementsPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<Event | undefined>(() =>
    eventId ? mockStorage.getEventById(eventId) : undefined
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementAudience, setAnnouncementAudience] = useState<
    'all' | 'participants' | 'volunteers' | 'sponsors'
  >('all');
  const [filterAudience, setFilterAudience] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = () => {
    if (!eventId) return;
    setEvent(mockStorage.getEventById(eventId));
    setAnnouncements(mockStorage.getAnnouncements(eventId));
  };

  useEffect(() => {
    refreshData();
    const unsub = mockStorage.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, [eventId]);

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <Link to="/organizer" className="text-xs text-blue-600 font-semibold">
          ← Return to All Events
        </Link>
      </div>
    );
  }

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim() || !eventId) return;

    mockStorage.createAnnouncement({
      event_id: eventId,
      audience: announcementAudience,
      title: `Broadcast to ${announcementAudience.toUpperCase()}`,
      message: announcementMsg.trim(),
    });

    setAnnouncementMsg('');
    showNotification(`Announcement successfully broadcasted to ${announcementAudience}.`);
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (filterAudience === 'all') return true;
    return a.audience === filterAudience;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <EventHeaderBanner event={event} subtitle="Announcements" />

      {notification && (
        <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-2xs">
          <span className="font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{notification}</span>
          </span>
          <button
            onClick={() => setNotification(null)}
            className="font-mono text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
          >
            ×
          </button>
        </div>
      )}

      {/* Broadcast Composer — hidden once the event has concluded */}
      {getEventCategory(event) !== 'past' && (
      <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600" />
              <span>Broadcast Announcement</span>
            </h3>
            <p className="text-xs text-slate-500">
              Instantly push updates and emergency alerts to specific attendee dashboards
            </p>
          </div>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-mono text-slate-600 uppercase font-semibold">
              Target Audience
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: 'All Attendees & Staff' },
                  { id: 'participants', label: 'Participants (Teams)' },
                  { id: 'volunteers', label: 'Volunteers Only' },
                  { id: 'sponsors', label: 'Sponsors Only' },
                ] as const
              ).map((aud) => (
                <button
                  key={aud.id}
                  type="button"
                  onClick={() => setAnnouncementAudience(aud.id)}
                  className={`px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer border ${
                    announcementAudience === aud.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {aud.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-mono text-slate-600 uppercase font-semibold">
              Announcement Message *
            </label>
            <Textarea
              placeholder="e.g. Lunch is now being served in Hall B! Hacking deadline extended by 30 mins..."
              value={announcementMsg}
              onChange={(e) => setAnnouncementMsg(e.target.value)}
              rows={3}
              required
              className="text-xs bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400 font-mono">
              Push notifications will be triggered across active attendee devices.
            </span>
            <Button type="submit" variant="primary" size="sm" className="space-x-1.5 text-xs font-bold">
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Now</span>
            </Button>
          </div>
        </form>
      </div>
      )}

      {/* Broadcast History Feed */}
      <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Broadcast Feed History</h3>
            <p className="text-xs text-slate-500">
              Chronological log of alerts sent during this hackathon
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 text-xs">
            <ListFilter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {(['all', 'participants', 'volunteers', 'sponsors'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterAudience(filter)}
                className={`px-2 py-0.5 text-xs font-mono capitalize transition-colors cursor-pointer border ${
                  filterAudience === filter
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <EmptyState message="No broadcast announcements sent for this audience filter yet." />
        ) : (
          <div className="space-y-3">
            {filteredAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 border ${
                        ann.audience === 'all'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : ann.audience === 'participants'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : ann.audience === 'volunteers'
                          ? 'border-purple-200 bg-purple-50 text-purple-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      To: {ann.audience}
                    </span>
                    <span className="font-bold text-slate-900">{ann.title}</span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {formatDate(ann.created_at)}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed text-xs pl-0.5">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
