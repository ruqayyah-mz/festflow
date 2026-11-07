import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import {
  Event,
  Team,
  Submission,
  Task,
  Announcement,
  JudgeLink,
  Role,
  SponsorshipApplication,
  Invite,
  Mark,
  VolunteerApplication,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { getEventCategory } from './OrganizerOverviewPage';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Globe,
  Lock,
  Layers,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Trash2,
  Search,
  MessageSquare,
  FileCode,
  Tag,
  Link2,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react';

export function OrganizerEventWorkspacePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab & Subtab from URL
  const activeTab = searchParams.get('tab') || 'overview';
  const activeSubtab = searchParams.get('subtab') || 'judging';

  const setTab = (tab: string, subtab?: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    if (subtab) {
      params.set('subtab', subtab);
    } else if (tab !== 'people') {
      params.delete('subtab');
    }
    setSearchParams(params);
  };

  const setSubtab = (subtab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'people');
    params.set('subtab', subtab);
    setSearchParams(params);
  };

  const [event, setEvent] = useState<Event | undefined>(() =>
    eventId ? mockStorage.getEventById(eventId) : undefined
  );

  // Event Data State
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [judgeLinks, setJudgeLinks] = useState<JudgeLink[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [sponsorApps, setSponsorApps] = useState<SponsorshipApplication[]>([]);
  const [volunteerApps, setVolunteerApps] = useState<VolunteerApplication[]>([]);

  // Task Assigning State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');

  // Announcement Composer State
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementAudience, setAnnouncementAudience] = useState<
    'all' | 'participants' | 'volunteers' | 'sponsors'
  >('all');
  const [announcementFilter, setAnnouncementFilter] = useState<string>('all');

  // Volunteer Invite Generator State
  const [isAddingVolunteerInvite, setIsAddingVolunteerInvite] = useState(false);
  const [volRoleTitle, setVolRoleTitle] = useState('Logistics & Hacker Experience');
  const [volInviteeName, setVolInviteeName] = useState('');

  // Judge Link Generator State
  const [isAddingJudge, setIsAddingJudge] = useState(false);
  const [judgeName, setJudgeName] = useState('');
  const [judgeTableAssignment, setJudgeTableAssignment] = useState('Table 14 - 16');
  const [judgeTrackAssignment, setJudgeTrackAssignment] = useState('All Tracks');

  // Table Assignment State (inline editing)
  const [editingTableTeamId, setEditingTableTeamId] = useState<string | null>(null);
  const [editingTableValue, setEditingTableValue] = useState<string>('');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<
    'all' | 'needs_table' | 'assigned' | 'submitted' | 'not_submitted'
  >('all');

  // Clipboard feedback & toast
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = () => {
    if (!eventId) return;
    const evt = mockStorage.getEventById(eventId);
    setEvent(evt);
    setTeams(mockStorage.getTeams(eventId));
    setSubmissions(mockStorage.getSubmissions(eventId));
    setTasks(mockStorage.getTasks(eventId));
    setAnnouncements(mockStorage.getAnnouncements(eventId));
    setRoles(mockStorage.getRoles(eventId));
    setInvites(mockStorage.getInvites(eventId));
    setJudgeLinks(mockStorage.getJudgeLinks(eventId));
    setMarks(mockStorage.getMarks());
    setSponsorApps(mockStorage.getSponsorshipApplications(eventId));
    setVolunteerApps(mockStorage.getVolunteerApplications(eventId));
  };

  useEffect(() => {
    refreshData();
    const unsub = mockStorage.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, [eventId]);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested event could not be located or has been archived.
        </p>
        <Link to="/organizer">
          <Button variant="outline" size="sm">
            ← Return to All Events
          </Button>
        </Link>
      </div>
    );
  }

  const now = Date.now();
  const hasEventStarted = now >= new Date(event.starts_at).getTime();
  const statusCategory = getEventCategory(event);

  const volunteerRoles = roles.filter((r) => r.role_type === 'volunteer');
  const volunteerProfiles = volunteerRoles.map((vr) => {
    const prof = mockStorage.getProfiles().find((p) => p.id === vr.user_id);
    return {
      userId: vr.user_id,
      name: prof?.full_name || `Volunteer (${vr.user_id})`,
      title: vr.role_title || 'General Volunteer',
    };
  });

  // Calculate stats
  let totalParticipants = 0;
  teams.forEach((t) => {
    totalParticipants += t.members ? t.members.length : 1;
  });

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const taskPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const submittedCount = submissions.filter((s) => s.status === 'submitted').length;
  const activeRound = event.rounds?.find((r) => r.active);

  // Handlers
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !eventId) return;

    const assignee = volunteerProfiles.find((v) => v.userId === taskAssigneeId);

    mockStorage.createTask({
      event_id: eventId,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      assignee_type: 'volunteer',
      assignee_id: taskAssigneeId || null,
      assignee_name: assignee ? assignee.name : 'General Volunteer Staff',
      due_at: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      status: 'todo',
    });

    setTaskTitle('');
    setTaskDescription('');
    setTaskAssigneeId('');
    setTaskDueDate('');
    setIsAddingTask(false);
    showNotification('Task assigned successfully.');
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim() || !eventId) return;

    mockStorage.createAnnouncement({
      event_id: eventId,
      audience: announcementAudience,
      title: `Broadcast to ${announcementAudience}`,
      message: announcementMsg.trim(),
    });

    setAnnouncementMsg('');
    showNotification('Announcement broadcasted to attendees.');
  };

  const handleGenerateVolunteerInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const token = `vol-${Math.random().toString(36).substring(2, 7)}-${eventId.substring(4, 8)}`;
    mockStorage.createInvite({
      event_id: eventId,
      role_type: 'volunteer',
      role_title: volRoleTitle.trim() || 'Logistics & Hacker Experience',
      volunteer_name: volInviteeName.trim() || undefined,
      token,
      expires_at: new Date(Date.now() + 86400000 * 14).toISOString(),
    });

    setVolInviteeName('');
    setIsAddingVolunteerInvite(false);
    showNotification('Volunteer onboarding invite link generated.');
  };

  const handleGenerateJudgeLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeName.trim() || !eventId) return;

    const newLink = mockStorage.createJudgeLink({
      event_id: eventId,
      judge_name: judgeName.trim(),
      table_assignment: judgeTableAssignment.trim(),
      track_assignment: judgeTrackAssignment.trim(),
    });

    setJudgeName('');
    setIsAddingJudge(false);
    showNotification(`Judge credential generated for ${newLink.judge_name}.`);
  };

  const handleSaveTableNumber = (teamId: string) => {
    mockStorage.updateTeamTable(teamId, editingTableValue);
    setEditingTableTeamId(null);
    setEditingTableValue('');
    showNotification('Table assignment updated.');
  };

  const handleSponsorStatusChange = (
    appId: string,
    newStatus: 'applied' | 'under_review' | 'confirmed'
  ) => {
    mockStorage.updateSponsorshipStatus(appId, newStatus);
    showNotification(`Sponsorship status marked as ${newStatus.replace('_', ' ')}.`);
  };

  const handleVolunteerAppAction = (appId: string, status: 'accepted' | 'rejected') => {
    if (hasEventStarted) {
      showNotification('Event has already started. Applications can no longer be accepted or rejected.');
      return;
    }
    mockStorage.updateVolunteerApplicationStatus(appId, status);
    showNotification(`Volunteer application ${status}.`);
  };

  // Filtered teams list
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
      (team.table_number && team.table_number.toLowerCase().includes(tableSearchQuery.toLowerCase())) ||
      (team.members &&
        team.members.some((m) => m.full_name.toLowerCase().includes(tableSearchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (tableFilter === 'needs_table') return !team.table_number;
    if (tableFilter === 'assigned') return Boolean(team.table_number);
    if (tableFilter === 'submitted') return team.submission?.status === 'submitted';
    if (tableFilter === 'not_submitted') return team.submission?.status !== 'submitted';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-2">
          <Link
            to="/organizer"
            className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Events</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-800 truncate max-w-sm">
            {event.name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={`/organizer/events/${event.id}/edit`}>
            <Button size="sm" variant="outline" className="space-x-1.5 text-xs">
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Event</span>
            </Button>
          </Link>
          <Link to={`/events/${event.id}`} target="_blank">
            <Button size="sm" variant="outline" className="space-x-1.5 text-xs">
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Public Page</span>
            </Button>
          </Link>
        </div>
      </div>

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

      {/* Event Header Banner */}
      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {statusCategory === 'ongoing' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Now</span>
            </span>
          )}
          {statusCategory === 'upcoming' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">
              <Calendar className="w-3 h-3" />
              <span>Upcoming</span>
            </span>
          )}
          {statusCategory === 'past' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-slate-300 bg-slate-100 text-slate-700">
              <span>Concluded</span>
            </span>
          )}

          <span
            className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 border inline-flex items-center gap-1 ${
              event.visibility === 'public'
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
          >
            {event.visibility === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            <span>{event.visibility}</span>
          </span>

          <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1">
            {event.volunteer_policy === 'open' ? (
              <>
                <Users className="w-3 h-3 text-emerald-600" />
                <span>Open to Volunteers</span>
              </>
            ) : (
              <>
                <Link2 className="w-3 h-3 text-blue-600" />
                <span>My Team (Private Link)</span>
              </>
            )}
          </span>

          {activeRound && (
            <span className="text-[10px] font-mono px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700 font-semibold inline-flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>Active: {activeRound.name}</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{event.name}</h1>

        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{event.description}</p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {formatDate(event.starts_at)} → {formatDate(event.ends_at)}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{event.venue}</span>
          </div>

          {event.tracks && (
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{event.tracks.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs in Exact Requested Order: overview, volunteers, people, announcements */}
      <div className="border-b border-slate-200 bg-white px-2">
        <nav className="flex space-x-2">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setTab('volunteers')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'volunteers'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Volunteers</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {tasks.length + volunteerApps.filter((a) => a.status === 'pending').length}
            </span>
          </button>

          <button
            onClick={() => setTab('people', activeSubtab)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'people'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>People</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {teams.length + sponsorApps.length + judgeLinks.length}
            </span>
          </button>

          <button
            onClick={() => setTab('announcements')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'announcements'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Announcements</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {announcements.length}
            </span>
          </button>
        </nav>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW (Summary of all operations - No duplicate shortcuts) */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* High-level Metric Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                Participants
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalParticipants}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across {teams.length} teams</div>
            </div>

            <div className="border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                Volunteers
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{volunteerRoles.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {event.volunteer_policy === 'open'
                  ? `${volunteerApps.filter((a) => a.status === 'pending').length} pending applicants`
                  : 'Private team link active'}
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                Sponsors
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{sponsorApps.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {sponsorApps.filter((a) => a.status === 'confirmed').length} confirmed partners
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                Volunteer Tasks
              </span>
              <div className="text-2xl font-bold text-blue-700 mt-1">{taskPct}%</div>
              <div className="w-full bg-slate-100 h-1 mt-1.5">
                <div className="bg-blue-600 h-1 transition-all" style={{ width: `${taskPct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {completedTasks} of {tasks.length} done
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                Submissions
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{submittedCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                of {teams.length} teams submitted
              </div>
            </div>
          </div>

          {/* Event Blueprint & Operational Status */}
          <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Event Operational Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">
                    Schedule & Dates:
                  </span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    Starts: {formatDate(event.starts_at)}
                  </p>
                  <p className="text-slate-800 font-medium">Ends: {formatDate(event.ends_at)}</p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">
                    Venue / Location:
                  </span>
                  <p className="text-slate-800 mt-0.5">{event.venue}</p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">
                    Volunteer Onboarding Policy:
                  </span>
                  <p className="text-slate-800 mt-0.5">
                    {event.volunteer_policy === 'open'
                      ? 'Open to Volunteers — Public applications enabled on volunteer dashboard'
                      : 'My Team — Private direct link only'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">
                    Evaluation Rounds ({event.rounds?.length || 0}):
                  </span>
                  <div className="space-y-1 mt-1">
                    {event.rounds?.map((r) => (
                      <div
                        key={r.id}
                        className={`p-2 border rounded-xs flex items-center justify-between ${
                          r.active ? 'border-blue-300 bg-blue-50/50 font-semibold' : 'border-slate-100'
                        }`}
                      >
                        <span className="text-slate-800">{r.name}</span>
                        <span className="font-mono text-slate-600">
                          {r.weight}% weight {r.active && '• Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">
                    Tracks ({event.tracks?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {event.tracks?.map((tr) => (
                      <span
                        key={tr}
                        className="px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-700 font-mono text-[11px]"
                      >
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: VOLUNTEERS (Task Assigning & Accept/Reject Logic)   */}
      {/* ========================================================= */}
      {activeTab === 'volunteers' && (
        <div className="space-y-6">
          {/* Volunteer Onboarding & Accept/Reject Section */}
          {event.volunteer_policy === 'open' ? (
            <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Volunteer Applications ({volunteerApps.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This event is open to volunteers. Review student and staff applications below.
                  </p>
                </div>

                {hasEventStarted ? (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Event Started — Applications Closed</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Applications Open (Pre-Event)
                  </span>
                )}
              </div>

              {hasEventStarted && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    The event has begun! Accepting and rejecting volunteers is locked. Task assignment
                    and volunteer coordination remain active below.
                  </span>
                </div>
              )}

              {volunteerApps.length === 0 ? (
                <EmptyState message="No volunteer applications received yet. Volunteers can apply from their dashboard." />
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100">
                  {volunteerApps.map((vapp) => (
                    <div
                      key={vapp.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{vapp.user_name}</span>
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.2 border font-bold ${
                              vapp.status === 'accepted'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : vapp.status === 'rejected'
                                ? 'border-red-300 bg-red-50 text-red-800'
                                : 'border-amber-300 bg-amber-50 text-amber-800'
                            }`}
                          >
                            {vapp.status}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Requested Role: <strong className="text-blue-700">{vapp.role_title}</strong> •{' '}
                          {vapp.user_email}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Applied {formatDate(vapp.created_at)}
                        </span>
                      </div>

                      {/* Accept / Reject Buttons (Active only prior to event start) */}
                      {!hasEventStarted && vapp.status === 'pending' && (
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleVolunteerAppAction(vapp.id, 'accepted')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleVolunteerAppAction(vapp.id, 'rejected')}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {!hasEventStarted && vapp.status !== 'pending' && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          Decision Recorded
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-blue-600" />
                    <span>My Team Private Volunteer Link</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This event is restricted to your team. Only those with this private link can volunteer.
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingVolunteerInvite(!isAddingVolunteerInvite)}
                  className="space-x-1.5 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingVolunteerInvite ? 'Cancel' : 'Generate New Link'}</span>
                </Button>
              </div>

              {isAddingVolunteerInvite && (
                <form
                  onSubmit={handleGenerateVolunteerInvite}
                  className="p-4 bg-blue-50/40 border border-blue-200 rounded-xs space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Volunteer Role Title *"
                      value={volRoleTitle}
                      onChange={(e) => setVolRoleTitle(e.target.value)}
                      placeholder="e.g. Lead Logistics Coordinator"
                      required
                    />
                    <Input
                      label="Volunteer Name (Optional)"
                      value={volInviteeName}
                      onChange={(e) => setVolInviteeName(e.target.value)}
                      placeholder="e.g. Sarah Chen"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingVolunteerInvite(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      Generate Private Link
                    </Button>
                  </div>
                </form>
              )}

              {/* Issued Volunteer Links */}
              <div className="divide-y divide-slate-100 border border-slate-100">
                {invites
                  .filter((i) => i.role_type === 'volunteer')
                  .map((inv) => {
                    const fullUrl = `${window.location.origin}/invite/${inv.token}`;
                    return (
                      <div
                        key={inv.id}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200">
                              {inv.token}
                            </span>
                            <span className="font-semibold text-slate-900">{inv.role_title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Expires {formatDate(inv.expires_at)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopyLink(fullUrl, inv.token)}
                          className="px-2.5 py-1 border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          {copiedToken === inv.token ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy Invite Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Volunteer Task Assignments (Available Prior to Event and Live) */}
          <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Volunteer Task Assignments</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tasks can be assigned prior to the event as well as during live operations.
                </p>
              </div>

              <Button
                size="sm"
                variant={isAddingTask ? 'outline' : 'primary'}
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="space-x-1.5 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingTask ? 'Cancel' : 'Assign New Task'}</span>
              </Button>
            </div>

            {/* Task Assigning Form */}
            {isAddingTask && (
              <form
                onSubmit={handleCreateTask}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xs space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Task Title *"
                    placeholder="e.g. Stage AV soundcheck & mic handoff"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                  />

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Assign to Volunteer
                    </label>
                    <select
                      value={taskAssigneeId}
                      onChange={(e) => setTaskAssigneeId(e.target.value)}
                      className="w-full text-xs border border-slate-200 bg-white px-3 py-2 rounded-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">General Volunteer Team</option>
                      {volunteerProfiles.map((v) => (
                        <option key={v.userId} value={v.userId}>
                          {v.name} ({v.title})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Due Date & Time (Optional)"
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />

                  <Input
                    label="Instructions / Location (Optional)"
                    placeholder="e.g. Innovation Hall Stage Left"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingTask(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Assign Task
                  </Button>
                </div>
              </form>
            )}

            {/* Tasks Board & Status Filter */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-800">Tasks ({tasks.length})</span>
                  <span className="text-xs text-slate-400 font-mono">• {taskPct}% Completed</span>
                </div>

                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-slate-500 mr-1">Status:</span>
                  {['all', 'todo', 'in_progress', 'done'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setTaskFilterStatus(st)}
                      className={`px-2 py-0.5 capitalize text-xs font-medium rounded-xs cursor-pointer ${
                        taskFilterStatus === st
                          ? 'bg-blue-100 text-blue-800 font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {tasks.length === 0 ? (
                <EmptyState
                  message="No volunteer duties assigned yet."
                  actionLabel="Assign First Task"
                  onAction={() => setIsAddingTask(true)}
                />
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100">
                  {tasks
                    .filter((t) => taskFilterStatus === 'all' || t.status === taskFilterStatus)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.2 font-bold border ${
                                t.status === 'done'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : t.status === 'in_progress'
                                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                                  : 'border-slate-300 bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.status.replace('_', ' ')}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900">{t.title}</h3>
                          </div>
                          {t.description && (
                            <p className="text-[11px] text-slate-600">{t.description}</p>
                          )}
                          <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                            <span>Assignee: {t.assignee_name || 'General Staff'}</span>
                            {t.due_at && <span>Due: {formatDate(t.due_at)}</span>}
                          </div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <select
                            value={t.status}
                            onChange={(e: any) => {
                              mockStorage.updateTaskStatus(t.id, e.target.value);
                              showNotification(`Task status updated to ${e.target.value}.`);
                            }}
                            className="text-xs border border-slate-200 bg-white px-2 py-1 rounded-xs font-medium cursor-pointer"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>

                          <button
                            onClick={() => {
                              mockStorage.deleteTask(t.id);
                              showNotification('Task deleted.');
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Volunteer Staff Roster */}
          <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Active Volunteer Staff ({volunteerRoles.length})
            </h2>

            {volunteerRoles.length === 0 ? (
              <p className="text-xs text-slate-500">No volunteers have checked in yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100">
                {volunteerRoles.map((vr) => {
                  const profile = mockStorage.getProfiles().find((p) => p.id === vr.user_id);
                  return (
                    <div key={vr.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">
                          {profile?.full_name || `Volunteer User (${vr.user_id})`}
                        </span>
                        <span className="text-slate-500 block text-[11px]">
                          Role: <strong className="text-blue-700">{vr.role_title || 'General'}</strong>
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Joined {formatDate(vr.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PEOPLE (Judging, Sponsorships, Participants)      */}
      {/* ========================================================= */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          {/* People 3 Subtabs Header */}
          <div className="flex border-b border-slate-200 space-x-1">
            <button
              onClick={() => setSubtab('judging')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeSubtab === 'judging'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Judging ({judgeLinks.length} Judges)
            </button>

            <button
              onClick={() => setSubtab('sponsorships')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeSubtab === 'sponsorships'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Sponsorships ({sponsorApps.length} Partners)
            </button>

            <button
              onClick={() => setSubtab('participants')}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeSubtab === 'participants'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Participants ({teams.length} Teams • Tables & Submissions)
            </button>
          </div>

          {/* Subtab 3A: Judging */}
          {activeSubtab === 'judging' && (
            <div className="space-y-6">
              <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Guest Judge Links (No Account Needed)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Generate frictionless shareable URLs with automated table and track rubrics.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={isAddingJudge ? 'outline' : 'primary'}
                    onClick={() => setIsAddingJudge(!isAddingJudge)}
                    className="space-x-1.5 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingJudge ? 'Cancel' : 'Issue Judge Link'}</span>
                  </Button>
                </div>

                {isAddingJudge && (
                  <form
                    onSubmit={handleGenerateJudgeLink}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xs space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Judge Full Name *"
                        placeholder="e.g. Elena Vance, VP Engineering"
                        value={judgeName}
                        onChange={(e) => setJudgeName(e.target.value)}
                        required
                      />

                      <Input
                        label="Table Assignment *"
                        placeholder="e.g. Table 14 - 16 or All Tables"
                        value={judgeTableAssignment}
                        onChange={(e) => setJudgeTableAssignment(e.target.value)}
                        required
                      />

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700">Track Scope</label>
                        <select
                          value={judgeTrackAssignment}
                          onChange={(e) => setJudgeTrackAssignment(e.target.value)}
                          className="w-full text-xs border border-slate-200 bg-white px-3 py-2 rounded-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="All Tracks">All Tracks</option>
                          {event.tracks?.map((tr) => (
                            <option key={tr} value={tr}>
                              {tr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingJudge(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm">
                        Generate Judge URL
                      </Button>
                    </div>
                  </form>
                )}

                {/* Issued Judge Links list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Issued Judge Credentials ({judgeLinks.length})
                  </h3>

                  {judgeLinks.length === 0 ? (
                    <EmptyState
                      message="No guest judge links generated yet."
                      actionLabel="Generate Judge Link"
                      onAction={() => setIsAddingJudge(true)}
                    />
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100">
                      {judgeLinks.map((jl) => {
                        const fullUrl = `${window.location.origin}/judge/${jl.token}`;
                        return (
                          <div
                            key={jl.id}
                            className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900">{jl.judge_name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200">
                                  {jl.table_assignment}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-50 text-slate-600 border border-slate-200">
                                  {jl.track_assignment}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 block">
                                Token: {jl.token}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={() => handleCopyLink(fullUrl, jl.token)}
                                className="px-2.5 py-1 border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                {copiedToken === jl.token ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>

                              <Link
                                to={`/judge/${jl.token}`}
                                target="_blank"
                                className="px-2.5 py-1 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                              >
                                <span>Open Portal</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Live Submitted Marks & Scores */}
              <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Live Judge Scores & Feedback ({marks.length})
                  </h2>
                </div>

                {marks.length === 0 ? (
                  <EmptyState message="No scores submitted by judges yet." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-100">
                      <thead className="bg-slate-50 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-3">Team / Submission</th>
                          <th className="p-3">Round</th>
                          <th className="p-3">Score</th>
                          <th className="p-3">Criteria Breakdown</th>
                          <th className="p-3">Critique Notes</th>
                          <th className="p-3">Evaluated At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {marks.map((m) => {
                          const sub = submissions.find((s) => s.id === m.submission_id);
                          return (
                            <tr key={m.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-900">
                                {sub?.team_name || sub?.title || m.submission_id}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-blue-700 font-bold">
                                {m.round}
                              </td>
                              <td className="p-3 font-mono text-sm font-bold text-emerald-700">
                                {m.score}/100
                              </td>
                              <td className="p-3 text-[11px] text-slate-600">
                                {m.criteria ? (
                                  <div className="space-x-2 font-mono text-[10px]">
                                    <span>Imp: {m.criteria.impact}</span>
                                    <span>Exec: {m.criteria.execution}</span>
                                    <span>Des: {m.criteria.design}</span>
                                  </div>
                                ) : (
                                  'Overall Score'
                                )}
                              </td>
                              <td className="p-3 text-[11px] text-slate-600 max-w-xs truncate">
                                {m.notes || '—'}
                              </td>
                              <td className="p-3 text-[11px] font-mono text-slate-400">
                                {formatDate(m.updated_at)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtab 3B: Sponsorships */}
          {activeSubtab === 'sponsorships' && (
            <div className="space-y-6">
              <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Sponsor Applications & Pipeline ({sponsorApps.length})
                  </h2>
                </div>

                {sponsorApps.length === 0 ? (
                  <EmptyState message="No corporate sponsor applications received for this event." />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {sponsorApps.map((sa) => (
                      <div key={sa.id} className="py-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-bold text-slate-900">{sa.sponsor_name}</h3>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-bold">
                                {sa.form_data?.tier} Tier
                              </span>
                              <span
                                className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold ${
                                  sa.status === 'confirmed'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                    : sa.status === 'under_review'
                                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                                    : 'border-blue-200 bg-blue-50 text-blue-700'
                                }`}
                              >
                                {sa.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Contact:{' '}
                              <strong className="text-slate-700">
                                {sa.form_data?.contact_email}
                              </strong>
                            </p>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="text-xs text-slate-500 font-medium">Status:</span>
                            <select
                              value={sa.status}
                              onChange={(e: any) =>
                                handleSponsorStatusChange(sa.id, e.target.value)
                              }
                              className="text-xs border border-slate-200 bg-white px-2.5 py-1 font-medium rounded-xs cursor-pointer focus:outline-none focus:border-blue-600"
                            >
                              <option value="applied">Applied</option>
                              <option value="under_review">Under Review</option>
                              <option value="confirmed">Confirmed</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3 border border-slate-100 rounded-xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">
                              Perks & Swag Offered:
                            </span>
                            <p className="text-slate-800 mt-0.5">
                              {sa.form_data?.perks_offered || 'None specified'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">
                              Booth & Speaking Requirements:
                            </span>
                            <p className="text-slate-800 mt-0.5">
                              {sa.form_data?.requirements || 'Standard sponsor booth'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtab 3C: Participants (Table Assignments & Submissions) */}
          {activeSubtab === 'participants' && (
            <div className="space-y-6">
              <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Participant Teams, Table Assignments & Submissions
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assign tables to hacker squads & review project repository submissions.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {teams.length} Teams Registered
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                      {submittedCount} Submissions
                    </span>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search team name, table, hacker..."
                      value={tableSearchQuery}
                      onChange={(e) => setTableSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-900 rounded-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="flex items-center space-x-1 text-xs">
                    <span className="text-slate-500 mr-1">Filter:</span>
                    {[
                      { key: 'all', label: 'All Teams' },
                      { key: 'needs_table', label: 'Needs Table' },
                      { key: 'assigned', label: 'Table Assigned' },
                      { key: 'submitted', label: 'Submitted' },
                      { key: 'not_submitted', label: 'Draft' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setTableFilter(f.key as any)}
                        className={`px-2.5 py-1 rounded-xs font-medium cursor-pointer ${
                          tableFilter === f.key
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teams List */}
                {filteredTeams.length === 0 ? (
                  <EmptyState message="No participant teams match the selected filter." />
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100">
                    {filteredTeams.map((team) => {
                      const isEditingThisTable = editingTableTeamId === team.id;
                      const sub = team.submission;

                      return (
                        <div
                          key={team.id}
                          className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Row 1: Team Name, Join Code, Track, Table Assignment */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-sm font-bold text-slate-900">{team.name}</h3>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                                  Join Code: {team.join_code}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                  {team.track || 'General'}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500">
                                Squad ({team.members?.length || 1}):{' '}
                                <span className="text-slate-700 font-medium">
                                  {team.members?.map((m) => m.full_name).join(', ') || 'Solo Hacker'}
                                </span>
                              </p>
                            </div>

                            {/* Table Assignment Feature */}
                            <div className="shrink-0 flex items-center space-x-2">
                              {isEditingThisTable ? (
                                <div className="flex items-center space-x-1.5 bg-blue-50/60 p-1.5 border border-blue-200 rounded-xs">
                                  <input
                                    type="text"
                                    value={editingTableValue}
                                    placeholder="e.g. Table 14"
                                    onChange={(e) => setEditingTableValue(e.target.value)}
                                    className="w-28 text-xs font-mono px-2 py-1 border border-slate-300 bg-white rounded-xs focus:outline-none focus:border-blue-600"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveTableNumber(team.id);
                                      if (e.key === 'Escape') setEditingTableTeamId(null);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSaveTableNumber(team.id)}
                                    className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer rounded-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingTableTeamId(null)}
                                    className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  {team.table_number ? (
                                    <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                                      <Tag className="w-3 h-3 text-blue-600" />
                                      <span>{team.table_number}</span>
                                    </span>
                                  ) : (
                                    <span className="text-xs font-mono font-bold px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200">
                                      No Table Assigned
                                    </span>
                                  )}

                                  <button
                                    onClick={() => {
                                      setEditingTableTeamId(team.id);
                                      setEditingTableValue(team.table_number || '');
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{team.table_number ? 'Change Table' : 'Assign Table'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Submissions of each team */}
                          <div className="bg-slate-50/80 p-3 border border-slate-200/80 rounded-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                                <FileCode className="w-3 h-3 text-slate-400" />
                                <span>Project Submission:</span>
                              </span>

                              {sub && sub.status === 'submitted' ? (
                                <span className="text-[10px] font-mono uppercase px-2 py-0.2 border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold">
                                  ✓ Submitted ({formatDate(sub.submitted_at)})
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono uppercase px-2 py-0.2 border border-slate-200 bg-slate-100 text-slate-600 font-bold">
                                  Not Submitted (Draft)
                                </span>
                              )}
                            </div>

                            {sub && sub.status === 'submitted' ? (
                              <div className="space-y-1.5 pt-1">
                                <h4 className="text-xs font-bold text-slate-900">{sub.title}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{sub.description}</p>
                                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                                  {sub.repo_url && (
                                    <a
                                      href={sub.repo_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-700 hover:underline font-mono inline-flex items-center gap-1"
                                    >
                                      <span>Repo URL ↗</span>
                                    </a>
                                  )}
                                  {sub.demo_url && (
                                    <a
                                      href={sub.demo_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-700 hover:underline font-mono inline-flex items-center gap-1"
                                    >
                                      <span>Live Demo ↗</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                Team has formed but has not yet submitted project links.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ANNOUNCEMENTS (Event Broadcast Feed)               */}
      {/* ========================================================= */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Broadcast Announcement
            </h2>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <Textarea
                label="Announcement Message *"
                placeholder="e.g. Mentor hours begin at 2:00 PM at Table 12. Submit repos before 6:00 PM..."
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                rows={3}
                required
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-medium text-slate-700">Target Audience:</label>
                  <select
                    value={announcementAudience}
                    onChange={(e: any) => setAnnouncementAudience(e.target.value)}
                    className="text-xs border border-slate-200 bg-white px-2.5 py-1.5 rounded-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="all">All Attendees & Staff</option>
                    <option value="participants">Participants & Hackers Only</option>
                    <option value="volunteers">Volunteers & Staff Only</option>
                    <option value="sponsors">Corporate Sponsors Only</option>
                  </select>
                </div>

                <Button type="submit" size="sm" className="space-x-1.5 font-medium">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Publish Broadcast</span>
                </Button>
              </div>
            </form>
          </div>

          <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Historical Broadcasts ({announcements.length})
              </h2>

              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-500 mr-1">Filter:</span>
                {['all', 'participants', 'volunteers', 'sponsors'].map((aud) => (
                  <button
                    key={aud}
                    onClick={() => setAnnouncementFilter(aud)}
                    className={`px-2 py-1 capitalize font-medium rounded-xs cursor-pointer ${
                      announcementFilter === aud
                        ? 'bg-blue-100 text-blue-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {aud}
                  </button>
                ))}
              </div>
            </div>

            {announcements.length === 0 ? (
              <EmptyState message="No broadcast announcements recorded for this event yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {announcements
                  .filter((a) => announcementFilter === 'all' || a.audience === announcementFilter)
                  .map((anc) => (
                    <div key={anc.id} className="py-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-bold">
                          {anc.audience}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {formatDate(anc.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 leading-relaxed">{anc.message}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
