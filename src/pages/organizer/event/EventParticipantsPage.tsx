import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { SubmissionShowcase } from '@/components/SubmissionShowcase';
import { Event, Team, Submission, AttendanceRecord } from '@/types';
import { EventHeaderBanner } from './EventHeaderBanner';
import { RegistrationToggle } from '@/components/event/RegistrationFields';
import { TeamApplications } from '@/components/event/TeamApplications';
import { getEventCategory } from '../OrganizerOverviewPage';
import { QRAttendanceModal, AttendanceCandidate } from '@/components/attendance/QRAttendanceModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Search,
  Edit3,
  Check,
  X,
  ListFilter,
} from 'lucide-react';

export function EventParticipantsPage() {
  const { eventId } = useParams<{ eventId: string }>();

  // Subtabs: 'all participants' | 'tables & submissions'
  const [subtab, setSubtab] = useState<'all participants' | 'tables & submissions'>('all participants');

  const [event, setEvent] = useState<Event | undefined>(() =>
    eventId ? mockStorage.getEventById(eventId) : undefined
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'needs_table' | 'assigned' | 'submitted' | 'not_submitted'>('all');

  // QR Attendance Modal State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Table Inline Editing State
  const [editingTableTeamId, setEditingTableTeamId] = useState<string | null>(null);
  const [editingTableValue, setEditingTableValue] = useState<string>('');

  // Notification feedback
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = () => {
    if (!eventId) return;
    setEvent(mockStorage.getEventById(eventId));
    setTeams(mockStorage.getAcceptedTeams(eventId)); // roster, check-in and tables: accepted only
    setSubmissions(mockStorage.getSubmissions(eventId));
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

  // Count total participants
  let totalParticipants = 0;
  teams.forEach((t) => {
    totalParticipants += t.members ? t.members.length : 1;
  });

  // Prepare Candidates for QR Scanner Modal
  const qrCandidates: AttendanceCandidate[] = teams.map((team) => {
    const isAttended = attendance.some((a) => a.target_id === team.id);
    const memberNames = team.members ? team.members.map((m) => m.full_name).join(', ') : '1 member';
    return {
      id: team.id,
      name: team.name,
      detail: `${team.table_number || 'No Table'} • ${memberNames}`,
      tokenOrCode: team.join_code,
      isAttended,
    };
  });

  // Handlers
  const handleToggleAttendance = (team: Team) => {
    const isMarked = mockStorage.isAttendanceMarked(event.id, team.id);
    if (isMarked) {
      mockStorage.unmarkAttendance(event.id, team.id);
      showNotification(`Attendance unmarked for ${team.name}.`);
    } else {
      const currentUser = mockStorage.getCurrentUser();
      mockStorage.markAttendance({
        event_id: event.id,
        target_id: team.id,
        target_type: 'team',
        target_name: team.name,
        detail: `${team.table_number || 'Unassigned Table'} • ${team.members?.length || 1} members`,
        marked_by: currentUser.full_name,
      });
      showNotification(`Attendance recorded for ${team.name}.`);
    }
  };

  const handleSaveTableNumber = (teamId: string) => {
    mockStorage.updateTeamTable(teamId, editingTableValue);
    setEditingTableTeamId(null);
    setEditingTableValue('');
    showNotification('Table assignment updated.');
  };

  // Filtered Teams
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.table_number && team.table_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (team.track && team.track.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (team.members &&
        team.members.some((m) => m.full_name.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (tableFilter === 'needs_table') return !team.table_number;
    if (tableFilter === 'assigned') return Boolean(team.table_number);
    if (tableFilter === 'submitted') return team.submission?.status === 'submitted';
    if (tableFilter === 'not_submitted') return team.submission?.status !== 'submitted';
    return true;
  });

  const attendedTeamsCount = teams.filter((t) =>
    attendance.some((a) => a.target_id === t.id)
  ).length;

  const isPast = getEventCategory(event) === 'past';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <EventHeaderBanner event={event} subtitle="Participants" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Participant registration</span>
        <RegistrationToggle event={event} kind="participants" />
      </div>

      <TeamApplications event={event} />

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

      {/* Subtabs Bar */}
      <div className="border-b border-slate-200 bg-white px-2">
        <nav className="flex space-x-2">
          <button
            onClick={() => setSubtab('all participants')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              subtab === 'all participants'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>all participants</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {totalParticipants}
            </span>
          </button>

          <button
            onClick={() => setSubtab('tables & submissions')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              subtab === 'tables & submissions'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>tables & submissions</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {teams.length} teams
            </span>
          </button>
        </nav>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: ALL PARTICIPANTS */}
      {/* ========================================================= */}
      {subtab === 'all participants' && (
        <div className="space-y-6">
          {/* Header Bar with QR Attendance Button & Search */}
          <div className="border border-slate-200 bg-white p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Participants & Teams Roster
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {attendedTeamsCount} / {teams.length} Teams Checked In
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalParticipants} total registered builders across {teams.length} hacker teams
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Search team name, participant member, track or table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs bg-white"
            />
          </div>

          {/* Teams & Participants List */}
          <div className="border border-slate-200 bg-white shadow-2xs divide-y divide-slate-100">
            {filteredTeams.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No participants or teams found matching your query.
              </div>
            ) : (
              filteredTeams.map((team) => {
                const isAttended = attendance.some((a) => a.target_id === team.id);
                return (
                  <div
                    key={team.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-sm text-slate-900">{team.name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200">
                          Code: {team.join_code}
                        </span>
                        {team.table_number && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200">
                            {team.table_number}
                          </span>
                        )}
                        {team.track && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200">
                            {team.track}
                          </span>
                        )}
                      </div>

                      {/* Team Members */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] text-slate-400 font-medium">Members:</span>
                        {team.members && team.members.length > 0 ? (
                          team.members.map((m, idx) => (
                            <span
                              key={m.id || idx}
                              className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {m.full_name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">1 member</span>
                        )}
                      </div>
                    </div>

                    {/* Attendance status on the side */}
                    <div className="flex items-center space-x-3 shrink-0">
                      {isAttended ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ATTENDANCE MARKED</span>
                          </span>
                          {!isPast && (
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(team)}
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
                              onClick={() => handleToggleAttendance(team)}
                              className="text-xs"
                            >
                              Mark Present
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: TABLES & SUBMISSIONS */}
      {/* ========================================================= */}
      {subtab === 'tables & submissions' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Table Assignment & Project Submissions
                </h3>
                <p className="text-xs text-slate-500">
                  Assign tables to teams and monitor code repository & demo submissions
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-500">
                  Assigned Tables:{' '}
                  <strong className="text-slate-900">
                    {teams.filter((t) => t.table_number).length}/{teams.length}
                  </strong>
                </span>
                <span>•</span>
                <span className="text-slate-500">
                  Submissions:{' '}
                  <strong className="text-purple-700">
                    {submissions.filter((s) => s.status === 'submitted').length}/{teams.length}
                  </strong>
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <ListFilter className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {(
                [
                  { id: 'all', label: 'All Teams' },
                  { id: 'needs_table', label: 'Needs Table' },
                  { id: 'assigned', label: 'Table Assigned' },
                  { id: 'submitted', label: 'Submitted Project' },
                  { id: 'not_submitted', label: 'Pending Submission' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTableFilter(f.id)}
                  className={`px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer border ${
                    tableFilter === f.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Teams Table Assignment & Submissions Card List */}
          <div className="space-y-3">
            {filteredTeams.length === 0 ? (
              <EmptyState message="No teams match the selected filter." />
            ) : (
              filteredTeams.map((team) => {
                const sub = team.submission || submissions.find((s) => s.team_id === team.id);
                const isEditing = editingTableTeamId === team.id;

                return (
                  <div
                    key={team.id}
                    className="border border-slate-200 bg-white p-5 shadow-2xs space-y-3"
                  >
                    {/* Team Header & Table Inline Assignment */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{team.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200">
                            Code: {team.join_code}
                          </span>
                          {team.track && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200">
                              {team.track}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {team.members?.length || 1} members:{' '}
                          {team.members?.map((m) => m.full_name).join(', ') || 'David Kim'}
                        </div>
                      </div>

                      {/* Inline Table Assignment Tool */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-500 uppercase">Table:</span>
                        {isEditing ? (
                          <div className="flex items-center space-x-1.5">
                            <Input
                              value={editingTableValue}
                              onChange={(e) => setEditingTableValue(e.target.value)}
                              placeholder="e.g. Table 14"
                              className="w-28 text-xs py-1 h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleSaveTableNumber(team.id)}
                              className="text-xs h-8 px-2"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTableTeamId(null)}
                              className="text-xs h-8 px-2"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`font-mono text-xs px-2 py-1 font-bold border ${
                                team.table_number
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {team.table_number || 'Unassigned'}
                            </span>
                            <button
                              type="button"
                              hidden={isPast}
                              onClick={() => {
                                setEditingTableTeamId(team.id);
                                setEditingTableValue(team.table_number || '');
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Assign or edit table number"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submission Details */}
                    {sub && sub.status === 'submitted' ? (
                      <div className="bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{sub.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold uppercase">
                              Submitted ✓
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {sub.description}
                        </p>

                        <div className="pt-2 border-t border-slate-200/60">
                          <SubmissionShowcase submission={sub} />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 text-xs text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 flex items-center justify-between">
                        <span>Project not submitted yet. Awaiting hackathon submission.</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 uppercase">
                          Pending
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
        targetType="team"
        candidates={qrCandidates}
        onAttendanceMarked={(name) => {
          showNotification(`Attendance marked for ${name}.`);
          refreshData();
        }}
      />
    </div>
  );
}
