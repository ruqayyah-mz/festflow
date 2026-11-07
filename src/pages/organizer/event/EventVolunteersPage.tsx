import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { getEventCategory } from '../OrganizerOverviewPage';
import { Event, Task, Role, Invite, VolunteerApplication, AttendanceRecord } from '@/types';
import { EventHeaderBanner } from './EventHeaderBanner';
import { RegistrationToggle } from '@/components/event/RegistrationFields';
import { VolunteerProfileSummary } from '@/components/volunteer/VolunteerProfileSummary';
import { QRAttendanceModal, AttendanceCandidate } from '@/components/attendance/QRAttendanceModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  UserCheck,
  UserX,
  Link2,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  ListFilter,
  Calendar,
  X,
} from 'lucide-react';

export function EventVolunteersPage() {
  const { eventId } = useParams<{ eventId: string }>();

  // Subtabs: 'all volunteers' | 'tasks'
  const [subtab, setSubtab] = useState<'all volunteers' | 'tasks'>('all volunteers');

  const [event, setEvent] = useState<Event | undefined>(() =>
    eventId ? mockStorage.getEventById(eventId) : undefined
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [volunteerApps, setVolunteerApps] = useState<VolunteerApplication[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // QR Attendance Modal State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Task Assigning State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');

  // Private Link Generating State
  const [isAddingInvite, setIsAddingInvite] = useState(false);
  const [inviteRoleTitle, setInviteRoleTitle] = useState('Logistics & Hacker Experience');
  const [inviteeName, setInviteeName] = useState('');

  // Feedback notifications
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = () => {
    if (!eventId) return;
    setEvent(mockStorage.getEventById(eventId));
    setTasks(mockStorage.getTasks(eventId));
    setRoles(mockStorage.getRoles(eventId));
    setInvites(mockStorage.getInvites(eventId));
    setVolunteerApps(mockStorage.getVolunteerApplications(eventId));
    setAttendance(mockStorage.getAttendance(eventId));
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

  const now = Date.now();
  const hasEventStarted = now >= new Date(event.starts_at).getTime();
  const isPast = getEventCategory(event) === 'past';

  // Consolidate Volunteer Profiles
  const volunteerRoles = roles.filter((r) => r.role_type === 'volunteer');
  const profiles = mockStorage.getProfiles();

  const confirmedVolunteers = volunteerRoles.map((vr) => {
    const prof = profiles.find((p) => p.id === vr.user_id);
    const attRecord = attendance.find((a) => a.target_id === vr.user_id);
    const assignedTasks = tasks.filter((t) => t.assignee_id === vr.user_id);
    return {
      userId: vr.user_id,
      name: prof?.full_name || `Volunteer (${vr.user_id})`,
      title: vr.role_title || 'General Volunteer Staff',
      tasksCount: assignedTasks.length,
      tasksDone: assignedTasks.filter((t) => t.status === 'done').length,
      isAttended: Boolean(attRecord),
      attendedAt: attRecord?.marked_at,
    };
  });

  // Prepare Candidates for QR Scanner Modal
  const qrCandidates: AttendanceCandidate[] = confirmedVolunteers.map((v) => ({
    id: v.userId,
    name: v.name,
    detail: `${v.title} • ${v.tasksCount} Tasks`,
    tokenOrCode: `vol-${v.userId.substring(0, 8)}`,
    isAttended: v.isAttended,
  }));

  // Handlers
  const handleToggleAttendance = (volunteerId: string, volunteerName: string, title: string) => {
    const isMarked = mockStorage.isAttendanceMarked(event.id, volunteerId);
    if (isMarked) {
      mockStorage.unmarkAttendance(event.id, volunteerId);
      showNotification(`Attendance unmarked for ${volunteerName}.`);
    } else {
      const currentUser = mockStorage.getCurrentUser();
      mockStorage.markAttendance({
        event_id: event.id,
        target_id: volunteerId,
        target_type: 'volunteer',
        target_name: volunteerName,
        detail: title,
        marked_by: currentUser.full_name,
      });
      showNotification(`Attendance recorded for ${volunteerName}.`);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !eventId) return;

    const assignee = confirmedVolunteers.find((v) => v.userId === taskAssigneeId);

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
    showNotification('Volunteer task assigned successfully.');
  };

  const handleGenerateInviteLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const token = `vol-${Math.random().toString(36).substring(2, 7)}-${eventId.substring(4, 8)}`;
    mockStorage.createInvite({
      event_id: eventId,
      role_type: 'volunteer',
      role_title: inviteRoleTitle.trim() || 'Logistics & Hacker Experience',
      volunteer_name: inviteeName.trim() || undefined,
      token,
      expires_at: new Date(Date.now() + 86400000 * 14).toISOString(),
    });

    setInviteeName('');
    setIsAddingInvite(false);
    showNotification('Private volunteer invite token minted.');
  };

  const handleVolunteerAppAction = (appId: string, status: 'accepted' | 'rejected') => {
    if (hasEventStarted) {
      showNotification('Event has already started. Applications are locked and cannot be changed.');
      return;
    }
    try {
      mockStorage.updateVolunteerApplicationStatus(appId, status);
      showNotification(`Volunteer application ${status}.`);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not update the application.');
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    if (taskFilterStatus === 'all') return true;
    return task.status === taskFilterStatus;
  });

  // A concluded event's work is by definition finished.
  const completedTasks = isPast ? tasks.length : tasks.filter((t) => t.status === 'done').length;
  const taskPct = isPast ? 100 : tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const attendedCount = confirmedVolunteers.filter((v) => v.isAttended).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <EventHeaderBanner event={event} subtitle="Volunteers" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {event.volunteer_policy === 'open' ? 'Volunteer applications' : 'Volunteer invite links'}
        </span>
        <RegistrationToggle event={event} kind="volunteers" />
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

      {/* Subtabs Bar (all lowercase as requested) */}
      <div className="border-b border-slate-200 bg-white px-2">
        <nav className="flex space-x-2">
          <button
            onClick={() => setSubtab('all volunteers')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              subtab === 'all volunteers'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>all volunteers</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {confirmedVolunteers.length}
            </span>
          </button>

          <button
            onClick={() => setSubtab('tasks')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              subtab === 'tasks'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>tasks</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {tasks.length}
            </span>
          </button>
        </nav>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: ALL VOLUNTEERS */}
      {/* ========================================================= */}
      {subtab === 'all volunteers' && (
        <div className="space-y-6">
          {/* Top Control Bar with QR Scanner & Onboarding Policy */}
          <div className="border border-slate-200 bg-white p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Volunteer Roster & Attendance</h3>
                <span className="text-xs font-mono px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {attendedCount} / {confirmedVolunteers.length} Present
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Onboarding Mode:{' '}
                <span className="font-semibold text-slate-700">
                  {event.volunteer_policy === 'open'
                    ? 'Open to Volunteers (Public Applications)'
                    : 'My Team (Private Direct Links)'}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Scan QR for Attendance Button */}
              <Button
                variant="primary"
                size="sm"
                disabled={isPast}
                onClick={() => setIsQRModalOpen(true)}
                className="space-x-1.5 text-xs shadow-2xs font-bold"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QR for Attendance</span>
              </Button>

              {event.volunteer_policy === 'my_team' && !isPast ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingInvite(true)}
                  className="space-x-1.5 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mint Volunteer Token</span>
                </Button>
              ) : null}
            </div>
          </div>

          {/* If Event Volunteer Policy is 'open': Volunteer Applications Section with Start-Lock */}
          {event.volunteer_policy === 'open' && (
            <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Volunteer Applications Pipeline</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Incoming applications submitted by volunteers on their dashboard
                  </p>
                </div>

                {hasEventStarted ? (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-semibold">Event Started: Applications Closed (Locked)</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-semibold">
                    Pre-Event Window: Accepting/Rejecting Enabled
                  </span>
                )}
              </div>

              {volunteerApps.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 italic text-center bg-slate-50 border border-dashed border-slate-200">
                  No volunteer applications received yet for this event.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {volunteerApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{app.user_name}</span>
                          <span
                            className={`text-[10px] font-mono uppercase px-1.5 py-0.2 border ${
                              app.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : app.status === 'rejected'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Role: <span className="text-slate-700 font-medium">{app.role_title}</span> •
                          Applied: {formatDate(app.created_at)}
                        </div>
                        {app.answers
                          ?.filter((a) => a.answer)
                          .map((a) => (
                            <div key={a.question} className="text-[11px] text-slate-600">
                              <span className="text-slate-500">{a.question}:</span> {a.answer}
                            </div>
                          ))}
                        <div className="pt-1 border-t border-slate-200/70 mt-1">
                          <VolunteerProfileSummary userId={app.user_id} />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {app.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={hasEventStarted}
                              onClick={() => handleVolunteerAppAction(app.id, 'accepted')}
                              className="text-xs space-x-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              title={hasEventStarted ? 'Cannot accept after event starts' : undefined}
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Accept</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={hasEventStarted}
                              onClick={() => handleVolunteerAppAction(app.id, 'rejected')}
                              className="text-xs space-x-1 text-red-700 border-red-300 hover:bg-red-50"
                              title={hasEventStarted ? 'Cannot reject after event starts' : undefined}
                            >
                              <UserX className="w-3.5 h-3.5 text-red-600" />
                              <span>Reject</span>
                            </Button>
                          </>
                        )}
                        {app.status !== 'pending' && (
                          <span className="text-[11px] font-mono text-slate-400">
                            {app.status === 'expired' ? 'No decision before start (closed)' : 'Decision Recorded'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* If Event Volunteer Policy is 'my_team': Private Links Showcase */}
          {event.volunteer_policy === 'my_team' && (
            <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Private Team Direct Tokens</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Only individuals with these direct tokens can join as volunteers
                </span>
              </div>

              {invites.filter((i) => i.role_type === 'volunteer').length === 0 ? (
                <div className="p-3 text-xs text-slate-500 italic bg-slate-50 border border-dashed border-slate-200">
                  No private tokens issued yet. Click "Mint Volunteer Token" above.
                </div>
              ) : (
                <div className="space-y-2">
                  {invites
                    .filter((i) => i.role_type === 'volunteer')
                    .map((inv) => {
                      const inviteUrl = `${window.location.origin}/volunteer/access/${inv.token}`;
                      return (
                        <div
                          key={inv.id}
                          className="p-3 border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">
                              {inv.volunteer_name || inv.role_title || 'Volunteer Invite'}
                            </span>
                            <span className="text-[11px] text-slate-500 block font-mono">
                              Role: {inv.role_title} • Token: {inv.token}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyLink(inviteUrl, inv.id)}
                              className="text-xs space-x-1"
                            >
                              {copiedId === inv.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Copy Invite Link</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Roster of Confirmed Volunteers with Attendance Check on the Side */}
          <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                All Volunteers Roster ({confirmedVolunteers.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Attendance marked in real time or via QR scanner
              </span>
            </div>

            {confirmedVolunteers.length === 0 ? (
              <EmptyState
                message="No confirmed volunteers yet. Onboard staff or approve applications."
                actionLabel={event.volunteer_policy === 'my_team' && !isPast ? 'Mint Token' : undefined}
                onAction={
                  event.volunteer_policy === 'my_team' && !isPast ? () => setIsAddingInvite(true) : undefined
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {confirmedVolunteers.map((vol) => (
                  <div
                    key={vol.userId}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{vol.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ID: {vol.userId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Role: {vol.title}</span>
                        <span>•</span>
                        <span>
                          {vol.tasksCount} Tasks ({vol.tasksDone} done)
                        </span>
                      </div>
                      <details className="text-[11px]">
                        <summary className="text-blue-600 cursor-pointer">About this volunteer</summary>
                        <div className="pt-1"><VolunteerProfileSummary userId={vol.userId} /></div>
                      </details>
                    </div>

                    {/* Attendance status on the side */}
                    <div className="flex items-center space-x-3 shrink-0">
                      {vol.isAttended ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ATTENDANCE MARKED</span>
                          </span>
                          {!isPast && (
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleAttendance(vol.userId, vol.name, vol.title)
                              }
                              className="text-[10px] text-slate-400 hover:text-red-600 underline cursor-pointer"
                            >
                              Unmark
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>NOT MARKED</span>
                          </span>
                          {!isPast && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleToggleAttendance(vol.userId, vol.name, vol.title)
                              }
                              className="text-xs"
                            >
                              Mark Present
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: TASKS */}
      {/* ========================================================= */}
      {subtab === 'tasks' && (
        <div className="space-y-6">
          {/* Tasks Control Bar */}
          <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Volunteer Task Assignments & Checklist</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Assign tasks prior to the event or dynamically during the hackathon
                </p>
              </div>

              <Button
                size="sm"
                variant="primary"
                disabled={isPast}
                onClick={() => setIsAddingTask(true)}
                className="space-x-1.5 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Assign New Task</span>
              </Button>
            </div>

            {/* Task completion progress bar */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                <span className="text-slate-600">
                  Overall Completion: <strong className="text-slate-900">{taskPct}%</strong>
                </span>
                <span className="text-slate-500">
                  {completedTasks} of {tasks.length} tasks completed
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${taskPct}%` }}
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2 pt-1 text-xs">
              <ListFilter className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {(['all', 'todo', 'in_progress', 'done'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTaskFilterStatus(filter)}
                  className={`px-2.5 py-1 text-xs font-mono capitalize transition-colors cursor-pointer border ${
                    taskFilterStatus === filter
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Add Task Inline Form */}
          {isAddingTask && (
            <div className="border border-blue-200 bg-blue-50/40 p-5 shadow-2xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Assign Task to Volunteer Staff
                </h4>
                <button
                  onClick={() => setIsAddingTask(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                      Task Title *
                    </label>
                    <Input
                      placeholder="e.g. Stage AV setup, Hacker registration desk..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      required
                      className="text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                      Assign To
                    </label>
                    <select
                      value={taskAssigneeId}
                      onChange={(e) => setTaskAssigneeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">General Volunteer Staff (Unassigned)</option>
                      {confirmedVolunteers.map((vol) => (
                        <option key={vol.userId} value={vol.userId}>
                          {vol.name} ({vol.title})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                      Due Date & Time (Optional)
                    </label>
                    <Input
                      type="datetime-local"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                      Instructions / Notes
                    </label>
                    <Input
                      placeholder="Brief instructions or location details..."
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingTask(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="text-xs">
                    Assign Task
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Task Checklist Items */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <EmptyState
                message="No tasks match the selected filter."
                actionLabel="+ Assign Task"
                onAction={isPast ? undefined : () => setIsAddingTask(true)}
              />
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors shadow-2xs ${
                    task.status === 'done' ? 'border-slate-200 bg-slate-50/60' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-bold text-sm ${
                          task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-600">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono pt-1">
                      <span>Assignee: <strong className="text-slate-700">{task.assignee_name || 'Unassigned'}</strong></span>
                      {task.due_at && (
                        <span>• Due: {new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>

                  {/* Status is reported by the volunteer; the organizer only verifies */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {task.status === 'done' &&
                      (task.verified_at ? (
                        <span className="px-2 py-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        !isPast && (
                          <button
                            type="button"
                            onClick={() => {
                              mockStorage.verifyTask(task.id);
                              showNotification(`Verified "${task.title}".`);
                            }}
                            className="px-2 py-1 text-[11px] font-mono font-bold text-emerald-700 bg-white border border-emerald-400 hover:bg-emerald-50 cursor-pointer"
                          >
                            Verify
                          </button>
                        )
                      ))}
                    <span
                      className={`px-2 py-1 text-[11px] font-mono capitalize border font-bold ${
                        task.status === 'done'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : task.status === 'in_progress'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title="Updated by the volunteer"
                    >
                      {!task.assignee_id ? 'open — unclaimed' : task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mint Volunteer Token Dialog */}
      {isAddingInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Mint Private Volunteer Access Token
              </h4>
              <button
                onClick={() => setIsAddingInvite(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateInviteLink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                  Volunteer Name (Optional)
                </label>
                <Input
                  placeholder="e.g. Sarah Chen"
                  value={inviteeName}
                  onChange={(e) => setInviteeName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                  Role Title *
                </label>
                <Input
                  placeholder="e.g. Logistics & Hacker Experience Lead"
                  value={inviteRoleTitle}
                  onChange={(e) => setInviteRoleTitle(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingInvite(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  Generate Token
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Attendance Scanner Modal */}
      <QRAttendanceModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          refreshData();
        }}
        eventId={event.id}
        eventName={event.name}
        targetType="volunteer"
        candidates={qrCandidates}
        onAttendanceMarked={(name) => {
          showNotification(`Attendance recorded for ${name}.`);
          refreshData();
        }}
      />
    </div>
  );
}
