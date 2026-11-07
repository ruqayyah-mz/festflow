import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { getEventCategory } from '../OrganizerOverviewPage';
import { Event, Team, Submission, Task, Role, SponsorshipApplication, VolunteerApplication } from '@/types';
import { EventHeaderBanner } from './EventHeaderBanner';
import {
  Users,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  UserCheck,
  Megaphone,
} from 'lucide-react';

export function EventOverviewPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<Event | undefined>(() =>
    eventId ? mockStorage.getEventById(eventId) : undefined
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sponsorApps, setSponsorApps] = useState<SponsorshipApplication[]>([]);
  const [volunteerApps, setVolunteerApps] = useState<VolunteerApplication[]>([]);

  const refreshData = () => {
    if (!eventId) return;
    setEvent(mockStorage.getEventById(eventId));
    setTeams(mockStorage.getAcceptedTeams(eventId));
    setSubmissions(mockStorage.getSubmissions(eventId));
    setTasks(mockStorage.getTasks(eventId));
    setRoles(mockStorage.getRoles(eventId));
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

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested event could not be located or has been archived.
        </p>
        <Link
          to="/organizer"
          className="inline-block px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xs hover:bg-blue-700"
        >
          ← Return to All Events
        </Link>
      </div>
    );
  }

  // Calculate Metrics
  let totalParticipants = 0;
  teams.forEach((t) => {
    totalParticipants += t.members ? t.members.length : 1;
  });

  const volunteerRoles = roles.filter((r) => r.role_type === 'volunteer');
  // A concluded event's work is by definition finished.
  const isPast = getEventCategory(event) === 'past';
  const completedTasks = isPast ? tasks.length : tasks.filter((t) => t.status === 'done').length;
  const taskPct = isPast ? 100 : tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const submittedCount = submissions.filter((s) => s.status === 'submitted').length;
  const confirmedSponsors = sponsorApps.filter((s) => s.status === 'confirmed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <EventHeaderBanner event={event} subtitle="Overview" />

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Link
          to={`/organizer/events/${event.id}/participants`}
          className="border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-400 transition-colors group"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Participants
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
            {totalParticipants}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{teams.length} teams registered</div>
        </Link>

        <Link
          to={`/organizer/events/${event.id}/volunteers`}
          className="border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-400 transition-colors group"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Volunteers
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
            {volunteerRoles.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {event.volunteer_policy === 'open'
              ? `${volunteerApps.filter((a) => a.status === 'pending').length} pending applications`
              : 'Private team link'}
          </div>
        </Link>

        <Link
          to={`/organizer/events/${event.id}/sponsorships`}
          className="border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-400 transition-colors group"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Sponsors
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
            {sponsorApps.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {confirmedSponsors} confirmed partners
          </div>
        </Link>

        <Link
          to={`/organizer/events/${event.id}/volunteers`}
          className="border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-400 transition-colors group"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Volunteer Tasks
          </span>
          <div className="text-2xl font-bold text-blue-700 mt-1">{taskPct}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {completedTasks} of {tasks.length} tasks done
          </div>
        </Link>

        <Link
          to={`/organizer/events/${event.id}/participants`}
          className="border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-400 transition-colors group"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Submissions
          </span>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {submittedCount}/{teams.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Projects submitted</div>
        </Link>
      </div>

      {/* Two-column layout: Evaluation Rounds + Quick Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Evaluation Rounds & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evaluation Rounds */}
          <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Evaluation Rounds & Judging Rubrics</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Weighted scoring stages configured for this hackathon
                </p>
              </div>
              <Link
                to={`/organizer/events/${event.id}/judging`}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
              >
                <span>Manage Judging</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {event.rounds && event.rounds.length > 0 ? (
                event.rounds.map((round, idx) => (
                  <div
                    key={round.id || idx}
                    className={`p-3.5 border flex items-center justify-between text-xs transition-colors ${
                      round.active
                        ? 'border-purple-300 bg-purple-50/50 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-slate-400">0{idx + 1}.</span>
                        <span className="font-bold text-slate-900">{round.name}</span>
                        {round.active && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-purple-600 text-white font-bold">
                            Active Stage
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500 block">WEIGHT</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {round.weight}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic p-3">No evaluation rounds defined.</div>
              )}
            </div>
          </div>

          {/* Tracks & Challenge Themes */}
          <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Event Tracks & Focus Areas</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {event.tracks && event.tracks.length > 0 ? (
                event.tracks.map((track, i) => (
                  <div
                    key={i}
                    className="p-3 border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800">{track}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {teams.filter((t) => t.track === track).length} teams
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic p-3">General Open Track</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Direct Workspace Hubs */}
        <div className="space-y-4">
          <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Event Management Hubs
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use the left sidebar or quick shortcuts below to navigate this event's operations:
            </p>

            <div className="space-y-2 pt-1">
              <Link
                to={`/organizer/events/${event.id}/volunteers`}
                className="p-3 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white flex items-center justify-between text-xs transition-colors group block"
              >
                <div className="flex items-center space-x-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-600">
                      VOLUNTEERS
                    </div>
                    <div className="text-[11px] text-slate-500">
                      All volunteers roster, QR attendance & task assignment
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                to={`/organizer/events/${event.id}/participants`}
                className="p-3 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white flex items-center justify-between text-xs transition-colors group block"
              >
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-600">
                      PARTICIPANTS
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Roster, QR attendance, table assignments & project submissions
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                to={`/organizer/events/${event.id}/judging`}
                className="p-3 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white flex items-center justify-between text-xs transition-colors group block"
              >
                <div className="flex items-center space-x-2.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-600">
                      JUDGING
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Guest judge links (no login), rubric scores & rounds
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                to={`/organizer/events/${event.id}/sponsorships`}
                className="p-3 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white flex items-center justify-between text-xs transition-colors group block"
              >
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-600">
                      SPONSORSHIPS
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Sponsor tiers, incoming applications & perk fulfillment
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </Link>

              <Link
                to={`/organizer/events/${event.id}/announcements`}
                className="p-3 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white flex items-center justify-between text-xs transition-colors group block"
              >
                <div className="flex items-center space-x-2.5">
                  <Megaphone className="w-4 h-4 text-rose-600" />
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-blue-600">
                      ANNOUNCEMENTS
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Live broadcast messages to attendees & staff
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
