import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Announcement } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { Send, Clock, ArrowRight } from 'lucide-react';

export function OrganizerAnnouncementsPage() {
  const events = mockStorage.getEvents();
  const activeEvent = events[0];

  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    activeEvent ? mockStorage.getAnnouncements(activeEvent.id) : []
  );

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'participants' | 'volunteers' | 'sponsors'>('all');
  const [statusMsg, setStatusMsg] = useState('');

  const refresh = () => {
    if (!activeEvent) return;
    setAnnouncements(mockStorage.getAnnouncements(activeEvent.id));
  };

  useEffect(() => {
    refresh();
    const unsub = mockStorage.subscribe(() => {
      refresh();
    });
    return () => unsub();
  }, [activeEvent?.id]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !activeEvent) return;

    mockStorage.createAnnouncement({
      event_id: activeEvent.id,
      audience,
      title: title.trim(),
      message: message.trim(),
    });

    setTitle('');
    setMessage('');
    setStatusMsg('Announcement broadcasted successfully to all target subscribers!');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  if (!activeEvent) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Announcements</h1>
          <p className="text-xs text-slate-500 mt-1">Broadcast updates to teams, volunteers, and partners.</p>
        </div>
        <EmptyState
          message="No active events found. Create an event to publish broadcasts."
          actionLabel="Create Event"
          onAction={() => {
            window.location.href = '/organizer/events/new';
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Announcements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Compose and broadcast alerts to <strong className="text-slate-800">{activeEvent.name}</strong> attendees.
          </p>
        </div>

        <Link
          to={`/organizer/events/${activeEvent.id}?tab=announcements`}
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xs"
        >
          <span>Open in Event Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {statusMsg && (
        <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800">
          {statusMsg}
        </div>
      )}

      {/* Compose Announcement Box */}
      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Compose Broadcast
        </h2>

        <form onSubmit={handlePublish} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Select
                label="Target Audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
              >
                <option value="all">Broadcast to All</option>
                <option value="participants">Participants Only</option>
                <option value="volunteers">Volunteers Only</option>
                <option value="sponsors">Sponsors Only</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Headline / Title"
                placeholder="e.g. Round 2 Review Schedule, Dinner is Served..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Textarea
              label="Announcement Details"
              rows={3}
              placeholder="Keynote starting in 10 mins, food delivery ready in Hall B, judging round opening..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" className="space-x-1.5 font-medium">
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Announcement</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Timestamped History */}
      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Timestamped Broadcast History
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {announcements.length} broadcasts
          </span>
        </div>

        {announcements.length === 0 ? (
          <EmptyState
            message="No announcements have been published yet for this event."
            actionLabel="Write First Broadcast"
            onAction={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((item) => (
              <div key={item.id} className="py-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 border ${
                      item.audience === 'all'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : item.audience === 'participants'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : item.audience === 'volunteers'
                        ? 'border-purple-200 bg-purple-50 text-purple-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    Audience: {item.audience}
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
    </div>
  );
}

