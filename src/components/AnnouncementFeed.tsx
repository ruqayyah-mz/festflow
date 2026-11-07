import React, { useState } from 'react';
import { Announcement } from '@/types';
import { Button } from './ui/Button';
import { Textarea, Select } from './ui/Input';
import { EmptyState } from './EmptyState';
import { formatTimeRelative, formatDate } from '@/lib/utils';
import { Plus, Radio } from 'lucide-react';

interface AnnouncementFeedProps {
  eventId: string;
  announcements: Announcement[];
  canPost?: boolean;
  onPostAnnouncement?: (data: Omit<Announcement, 'id' | 'created_at'>) => void;
  title?: string;
  currentAudienceFilter?: 'all' | 'participants' | 'volunteers' | 'sponsors';
}

export function AnnouncementFeed({
  eventId,
  announcements,
  canPost = false,
  onPostAnnouncement,
  title = 'Live Broadcasts & Announcements',
  currentAudienceFilter,
}: AnnouncementFeedProps) {
  const [isPosting, setIsPosting] = useState(false);
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'participants' | 'volunteers' | 'sponsors'>('all');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Message content cannot be blank');
      return;
    }
    if (!onPostAnnouncement) return;

    onPostAnnouncement({
      event_id: eventId,
      audience,
      title: headline.trim() || 'Organizer Broadcast',
      message: message.trim(),
    });

    setHeadline('');
    setMessage('');
    setError('');
    setIsPosting(false);
  };

  const getAudienceBadge = (aud: Announcement['audience']) => {
    switch (aud) {
      case 'participants':
        return (
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 border border-blue-200 text-blue-700 bg-blue-50">
            Participants
          </span>
        );
      case 'volunteers':
        return (
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 border border-sky-200 text-sky-800 bg-sky-50">
            Volunteers
          </span>
        );
      case 'sponsors':
        return (
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 border border-indigo-200 text-indigo-700 bg-indigo-50">
            Sponsors
          </span>
        );
      case 'all':
      default:
        return (
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 border border-slate-200 text-slate-700 bg-slate-100">
            Everyone
          </span>
        );
    }
  };

  return (
    <div className="border border-slate-200 bg-white shadow-xs">
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
        </div>
        {canPost && (
          <Button size="sm" onClick={() => setIsPosting(true)} className="space-x-1">
            <Plus className="w-3.5 h-3.5" />
            <span>Post Update</span>
          </Button>
        )}
      </div>

      {isPosting && (
        <form onSubmit={handleSubmit} className="p-4 bg-blue-50/40 border-b border-blue-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Draft Broadcast Message
            </span>
            <button
              type="button"
              onClick={() => setIsPosting(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <Textarea
            placeholder="Type your event announcement here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            error={error}
            rows={3}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="w-full sm:w-56">
              <Select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                options={[
                  { value: 'all', label: 'Audience: All Attendees' },
                  { value: 'participants', label: 'Audience: Hackers / Participants' },
                  { value: 'volunteers', label: 'Audience: Volunteers Only' },
                ]}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPosting(false)}>
                Discard
              </Button>
              <Button type="submit" size="sm">
                Publish Broadcast
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Announcements List */}
      <div className="divide-y divide-slate-100">
        {announcements.length === 0 ? (
          <div className="p-6">
            <EmptyState
              message="No announcements posted for this event yet."
              actionLabel={canPost ? 'Post First Update' : undefined}
              onAction={canPost ? () => setIsPosting(true) : undefined}
            />
          </div>
        ) : (
          announcements.map((anc) => (
            <div key={anc.id} className="p-4 sm:p-5 hover:bg-blue-50/20 transition-colors space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {getAudienceBadge(anc.audience)}
                  <span className="text-slate-500 font-mono text-[11px]">
                    {formatDate(anc.created_at)}
                  </span>
                </div>
                <span className="text-slate-400 text-xs">
                  {formatTimeRelative(anc.created_at)}
                </span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {anc.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
