import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { Event, Task, Announcement, Invite } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { TaskWidget } from '@/components/TaskWidget';
import { AnnouncementFeed } from '@/components/AnnouncementFeed';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Copy, Check, Plus, ExternalLink, ShieldCheck, KeyRound, Sparkles, Trash2, Link2, Clock, UserCheck } from 'lucide-react';

export function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { availableProfiles } = useAuth();

  const [event, setEvent] = useState<Event | undefined>(() =>
    eventId ? mockStorage.getEventById(eventId) : undefined
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    eventId ? mockStorage.getTasks(eventId) : []
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    eventId ? mockStorage.getAnnouncements(eventId) : []
  );
  const [invites, setInvites] = useState<Invite[]>(() =>
    eventId ? mockStorage.getInvites(eventId) : []
  );

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [selectedVolTarget, setSelectedVolTarget] = useState<'sarah' | 'custom'>('sarah');
  const [customVolName, setCustomVolName] = useState('');
  const [selectedDutyPreset, setSelectedDutyPreset] = useState('Hacker Check-in & Badge Desk');
  const [customDutyTitle, setCustomDutyTitle] = useState('');
  const [expiryDays, setExpiryDays] = useState('3');
  const [recentlyGeneratedUrl, setRecentlyGeneratedUrl] = useState<string | null>(null);

  const refreshData = () => {
    if (!eventId) return;
    setEvent(mockStorage.getEventById(eventId));
    setTasks(mockStorage.getTasks(eventId));
    setAnnouncements(mockStorage.getAnnouncements(eventId));
    setInvites(mockStorage.getInvites(eventId));
  };

  useEffect(() => {
    const unsub = mockStorage.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, [eventId]);

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-neutral-500">Event not found or has been soft-deleted.</p>
        <Link to="/organizer">
          <Button variant="outline" size="sm">Back to Organizer Console</Button>
        </Link>
      </div>
    );
  }

  const handleUpdateTaskStatus = (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    mockStorage.updateTaskStatus(taskId, status);
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'created_at'>) => {
    mockStorage.createTask(taskData);
  };

  const handlePostAnnouncement = (data: Omit<Announcement, 'id' | 'created_at'>) => {
    mockStorage.createAnnouncement(data);
  };

  const handleGenerateVolunteerLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    let volName = 'Sarah Chen';
    let volId: string | undefined = undefined;

    if (selectedVolTarget === 'sarah') {
      const sarah = availableProfiles.find((p) => p.full_name.includes('Sarah')) || availableProfiles[1];
      volName = sarah?.full_name || 'Sarah Chen';
      volId = sarah?.id;
    } else {
      volName = customVolName.trim() || 'Volunteer Staff';
      const created = mockStorage.getOrCreateVolunteerProfile(volName);
      volId = created.id;
    }

    const finalDuty = customDutyTitle.trim() || selectedDutyPreset;
    const token = `vol-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = new Date(Date.now() + 86400000 * parseInt(expiryDays, 10)).toISOString();

    mockStorage.createInvite({
      event_id: eventId,
      token,
      role_type: 'volunteer',
      role_title: finalDuty,
      volunteer_name: volName,
      volunteer_id: volId,
      expires_at: expiresAt,
    });

    const directUrl = `${window.location.origin}/volunteer/access/${token}`;
    setRecentlyGeneratedUrl(directUrl);
    setCopiedToken(token);
    navigator.clipboard.writeText(directUrl);
    setCustomVolName('');
    setCustomDutyTitle('');
    setIsCreatingInvite(false);
    refreshData();
  };

  const handleCopyDirectLink = (token: string) => {
    const url = `${window.location.origin}/volunteer/access/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleRevokeInvite = (inviteId: string, name?: string | null) => {
    if (window.confirm(`Revoke direct access link for ${name || 'this volunteer'}? They will no longer be able to use it to open the dashboard.`)) {
      mockStorage.revokeInvite(inviteId);
      refreshData();
    }
  };

  const analytics = mockStorage.getEventAnalytics(event.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Link to="/organizer" className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Organizer Console</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xs">
                {event.visibility}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                {event.name}
              </h1>
            </div>
            <p className="text-xs text-neutral-500">
              {event.venue} • {formatDate(event.starts_at)} — {formatDate(event.ends_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/organizer/hackathon?eventId=${event.id}`}>
              <Button size="sm" className="space-x-1.5">
                <span>Hackathon Ops & Judges</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
            <Link to={`/organizer/events/${event.id}/edit`}>
              <Button variant="outline" size="sm">
                Edit Event & Rounds
              </Button>
            </Link>
            <Link to={`/events/${event.id}`}>
              <Button variant="ghost" size="sm">
                Public View
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border border-slate-200 bg-white shadow-xs rounded-sm">
          <div className="text-xs text-neutral-500">Participants & Teams</div>
          <div className="text-xl font-bold text-neutral-900 mt-1">
            {analytics.participantCount} <span className="text-xs font-normal text-slate-500">builders ({analytics.teamCount} teams)</span>
          </div>
        </div>
        <div className="p-4 border border-slate-200 bg-white shadow-xs rounded-sm">
          <div className="text-xs text-neutral-500">Task Completion Rate</div>
          <div className="text-xl font-bold text-blue-600 mt-1">
            {analytics.taskCompletionRate}% <span className="text-xs font-normal text-slate-500">({analytics.completedTasks}/{analytics.totalTasks})</span>
          </div>
        </div>
        <div className="p-4 border border-slate-200 bg-white shadow-xs rounded-sm">
          <div className="text-xs text-neutral-500">Active Round</div>
          <div className="text-xl font-bold text-blue-700 mt-1 truncate">
            {event.rounds.find((r) => r.active)?.name || 'None Active'}
          </div>
        </div>
      </div>

      {/* Volunteer Direct Access Links Section */}
      <div id="volunteer-links" className="border border-slate-200 bg-white shadow-xs p-6 space-y-5 rounded-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Volunteer Direct Access Links</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Generate magic links for selected volunteers to directly open their dashboard and duty list with zero login friction.
            </p>
          </div>
          <Button
            size="sm"
            variant={isCreatingInvite ? 'outline' : 'primary'}
            onClick={() => setIsCreatingInvite(!isCreatingInvite)}
            className="space-x-1.5 shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isCreatingInvite ? 'Close Form' : '+ Generate Volunteer Link'}</span>
          </Button>
        </div>

        {/* Recently Generated Banner */}
        {recentlyGeneratedUrl && (
          <div className="p-4 bg-blue-50/70 border border-blue-200 space-y-2 rounded-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Direct Volunteer Magic Link Ready & Copied!</span>
              </div>
              <button
                onClick={() => setRecentlyGeneratedUrl(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                readOnly
                value={recentlyGeneratedUrl}
                className="flex-1 px-3 py-1.5 bg-white border border-blue-200 text-xs font-mono text-slate-800 focus:outline-none"
              />
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(recentlyGeneratedUrl);
                    setCopiedToken('recent');
                    setTimeout(() => setCopiedToken(null), 2500);
                  }}
                  className="space-x-1 shrink-0"
                >
                  {copiedToken === 'recent' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken === 'recent' ? 'Copied!' : 'Copy Link'}</span>
                </Button>
                <a
                  href={recentlyGeneratedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-medium border border-blue-300 text-blue-700 hover:bg-blue-100/50 inline-flex items-center gap-1 shrink-0 bg-white"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <p className="text-[11px] text-blue-700/80">
              Send this link via Slack, Discord, WhatsApp, or email. The volunteer can tap it on mobile to immediately access this event's duties.
            </p>
          </div>
        )}

        {/* Generator Form */}
        {isCreatingInvite && (
          <form onSubmit={handleGenerateVolunteerLink} className="p-5 bg-slate-50 border border-blue-100 space-y-4 rounded-xs">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Configure Volunteer Direct Pass
              </span>
              <p className="text-xs text-slate-500">
                Select a volunteer and assign their primary event zone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Volunteer Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Target Volunteer
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVolTarget('sarah')}
                    className={`flex-1 py-1.5 px-3 text-xs border text-left cursor-pointer transition-colors ${
                      selectedVolTarget === 'sarah'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Sarah Chen (Staff)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVolTarget('custom')}
                    className={`flex-1 py-1.5 px-3 text-xs border text-left cursor-pointer transition-colors ${
                      selectedVolTarget === 'custom'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    + Custom Volunteer
                  </button>
                </div>

                {selectedVolTarget === 'custom' && (
                  <Input
                    placeholder="Enter volunteer full name (e.g. Marcus Vance)"
                    value={customVolName}
                    onChange={(e) => setCustomVolName(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Expiry selection */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Link Validity / Expiration
                </label>
                <Select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  options={[
                    { value: '1', label: '24 Hours (Fast Shift Access)' },
                    { value: '3', label: '3 Days (Hackathon Weekend)' },
                    { value: '7', label: '7 Days (Full Event Week)' },
                    { value: '30', label: '30 Days (Extended Pass)' },
                  ]}
                />
              </div>
            </div>

            {/* Duty Preset Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">
                Assigned Shift Duty / Zone
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Hacker Check-in & Badge Desk',
                  'Stage Logistics & AV',
                  'Hardware Lab & Wi-Fi',
                  'Logistics & Food Desk',
                  'Judging Room Usher',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSelectedDutyPreset(preset);
                      setCustomDutyTitle('');
                    }}
                    className={`px-2.5 py-1 text-xs border cursor-pointer transition-colors ${
                      selectedDutyPreset === preset && !customDutyTitle
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Or type custom duty (e.g. Workshop Room Coordinator)"
                value={customDutyTitle}
                onChange={(e) => setCustomDutyTitle(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreatingInvite(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="space-x-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Generate Direct Magic Link</span>
              </Button>
            </div>
          </form>
        )}

        {/* Existing Volunteer Links List */}
        <div className="space-y-2">
          {invites.filter((i) => i.role_type === 'volunteer').length === 0 ? (
            <p className="text-xs text-neutral-500 py-3 text-center border border-dashed border-slate-200">
              No volunteer direct access links generated yet. Click "+ Generate Volunteer Link" to invite your staff.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100">
              {invites
                .filter((i) => i.role_type === 'volunteer')
                .map((inv) => {
                  const directUrl = `${window.location.origin}/volunteer/access/${inv.token}`;
                  const isCopied = copiedToken === inv.token;

                  return (
                    <div
                      key={inv.id}
                      className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-slate-900 text-sm">
                            {inv.volunteer_name || 'Volunteer Staff'}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xs">
                            {inv.role_title || 'General Duty'}
                          </span>
                          {inv.last_accessed_at ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 font-mono">
                              Used {formatDate(inv.last_accessed_at)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 border border-slate-200 font-mono">
                              Unclaimed
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-500 font-mono">
                          <span className="text-blue-700 font-medium truncate max-w-xs sm:max-w-md">
                            {directUrl}
                          </span>
                          <span>Expires: {formatDate(inv.expires_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 self-start md:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyDirectLink(inv.token)}
                          className="space-x-1"
                          title="Copy direct magic link"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-blue-600 font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </Button>
                        <a
                          href={`/volunteer/access/${inv.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 text-xs border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 inline-flex items-center gap-1 bg-white"
                          title="Test direct dashboard entry"
                        >
                          <span>Test</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleRevokeInvite(inv.id, inv.volunteer_name)}
                          className="p-1.5 border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 cursor-pointer transition-colors"
                          title="Revoke access link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Reusable Task Widget & Announcement Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TaskWidget
            eventId={event.id}
            tasks={tasks}
            onUpdateStatus={handleUpdateTaskStatus}
            onCreateTask={handleCreateTask}
            canCreate={true}
            readOnly={true}
            filterAssigneeType="volunteer"
            title="Volunteer Task Board"
          />
        </div>

        <div>
          <AnnouncementFeed
            eventId={event.id}
            announcements={announcements}
            canPost={true}
            onPostAnnouncement={handlePostAnnouncement}
            title="Event Announcements & Broadcasts"
          />
        </div>
      </div>
    </div>
  );
}
