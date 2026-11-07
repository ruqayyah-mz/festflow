import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { EventFormatBadges } from '@/components/event/EventFormatBadges';
import { downloadEventReport } from '@/lib/eventReport';
import { Event } from '@/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  ArrowRight,
  Globe,
  Lock,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Briefcase,
  Award,
  Layers,
  Edit3,
  Download,
} from 'lucide-react';

export type EventStatusCategory = 'ongoing' | 'upcoming' | 'past';

export function getEventCategory(event: { starts_at: string; ends_at: string }): EventStatusCategory {
  const now = Date.now();
  const start = new Date(event.starts_at).getTime();
  const end = new Date(event.ends_at).getTime();

  if (now > end) return 'past';
  if (now < start) return 'upcoming';
  return 'ongoing';
}

export function OrganizerOverviewPage() {
  const [events, setEvents] = useState<Event[]>(() => mockStorage.getEvents());
  const [activeCategory, setActiveCategory] = useState<EventStatusCategory>('ongoing');

  const refresh = () => {
    setEvents(mockStorage.getEvents());
  };

  useEffect(() => {
    const unsub = mockStorage.subscribe(() => {
      refresh();
    });
    return () => unsub();
  }, []);

  const ongoingEvents = events.filter((e) => getEventCategory(e) === 'ongoing');
  const upcomingEvents = events.filter((e) => getEventCategory(e) === 'upcoming');
  const pastEvents = events.filter((e) => getEventCategory(e) === 'past');

  const currentList =
    activeCategory === 'ongoing'
      ? ongoingEvents
      : activeCategory === 'upcoming'
      ? upcomingEvents
      : pastEvents;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Title and Create Event Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Organizer Overview
            </h1>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-bold rounded-xs">
              Portfolio
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your collegiate hackathons, developer symposiums, and builder operations.
          </p>
        </div>

        <div>
          <Link to="/organizer/events/new">
            <Button size="sm" className="space-x-1.5 font-medium shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Portfolio High-Level Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Total Organized
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{events.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all seasons</div>
        </div>

        <div
          onClick={() => setActiveCategory('ongoing')}
          className={`border p-4 shadow-2xs cursor-pointer transition-colors ${
            activeCategory === 'ongoing'
              ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-300'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
              Ongoing
            </span>
            {ongoingEvents.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {ongoingEvents.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Live hackathons now</div>
        </div>

        <div
          onClick={() => setActiveCategory('upcoming')}
          className={`border p-4 shadow-2xs cursor-pointer transition-colors ${
            activeCategory === 'upcoming'
              ? 'border-blue-300 bg-blue-50/40 ring-1 ring-blue-300'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Upcoming
          </span>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {upcomingEvents.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Scheduled on calendar</div>
        </div>

        <div
          onClick={() => setActiveCategory('past')}
          className={`border p-4 shadow-2xs cursor-pointer transition-colors ${
            activeCategory === 'past'
              ? 'border-slate-400 bg-slate-100 ring-1 ring-slate-400'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
            Past
          </span>
          <div className="text-2xl font-bold text-slate-700 mt-1">{pastEvents.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Concluded events</div>
        </div>
      </div>

      {/* 3 Subtabs: Ongoing, Upcoming, Past */}
      <div className="space-y-4">
        <div className="flex items-center border-b border-slate-200 space-x-1">
          <button
            onClick={() => setActiveCategory('ongoing')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeCategory === 'ongoing'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>Ongoing Events</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeCategory === 'ongoing'
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {ongoingEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('upcoming')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeCategory === 'upcoming'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>Upcoming Events</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeCategory === 'upcoming'
                  ? 'bg-blue-200 text-blue-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {upcomingEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('past')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
              activeCategory === 'past'
                ? 'border-slate-700 text-slate-900 bg-slate-100'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>Past Events</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeCategory === 'past'
                  ? 'bg-slate-300 text-slate-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {pastEvents.length}
            </span>
          </button>
        </div>

        {/* Event List */}
        {currentList.length === 0 ? (
          <div className="border border-slate-200 bg-white p-8">
            <EmptyState
              message={
                activeCategory === 'ongoing'
                  ? 'No ongoing events currently in progress.'
                  : activeCategory === 'upcoming'
                  ? 'No upcoming events scheduled right now.'
                  : 'No past events archived in your portfolio.'
              }
              actionLabel="Create New Event"
              onAction={() => {
                window.location.href = '/organizer/events/new';
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((evt) => {
              const activeRound = evt.rounds?.find((r) => r.active);
              const teams = mockStorage.getAcceptedTeams(evt.id);
              let totalParticipants = 0;
              teams.forEach((t) => {
                totalParticipants += t.members ? t.members.length : 1;
              });

              const roles = mockStorage.getRoles(evt.id);
              const volunteersCount = roles.filter((r) => r.role_type === 'volunteer').length;
              const sponsorApps = mockStorage.getSponsorshipApplications(evt.id);
              const tasks = mockStorage.getTasks(evt.id);
              // A concluded event's work is by definition finished.
              const completedTasks =
                getEventCategory(evt) === 'past' ? tasks.length : tasks.filter((t) => t.status === 'done').length;
              const taskPct =
                getEventCategory(evt) === 'past' ? 100 : tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
              const submissions = mockStorage.getSubmissions(evt.id);
              const submittedCount = submissions.filter((s) => s.status === 'submitted').length;

              const statusCategory = getEventCategory(evt);

              return (
                <div
                  key={evt.id}
                  className="border border-slate-200 bg-white p-6 shadow-2xs hover:border-blue-400 transition-all space-y-5"
                >
                  {/* Top Row: Badges, Title, Dates */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 max-w-2xl">
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
                        <EventFormatBadges event={evt} />

                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 border inline-flex items-center gap-1 ${
                            evt.visibility === 'public'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-slate-100 text-slate-700'
                          }`}
                        >
                          {evt.visibility === 'public' ? (
                            <Globe className="w-3 h-3" />
                          ) : (
                            <Lock className="w-3 h-3" />
                          )}
                          <span>{evt.visibility}</span>
                        </span>

                        {activeRound && (
                          <span className="text-[10px] font-mono px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700 font-semibold inline-flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>{activeRound.name}</span>
                          </span>
                        )}
                      </div>

                      <Link to={`/organizer/events/${evt.id}`} className="block group">
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {evt.name}
                        </h2>
                      </Link>

                      <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 flex sm:flex-col items-end gap-2">
                      <Link to={`/organizer/events/${evt.id}`}>
                        <Button size="sm" className="space-x-1.5 font-medium whitespace-nowrap">
                          <span>Open Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      {statusCategory === 'past' ? (
                        <button
                          type="button"
                          onClick={() => downloadEventReport(evt.id)}
                          className="text-[11px] text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 font-medium transition-colors cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Report</span>
                        </button>
                      ) : (
                        <Link
                          to={`/organizer/events/${evt.id}/edit`}
                          className="text-[11px] text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 font-medium transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Details</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Metadata: Dates & Venue */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {formatDate(evt.starts_at)} → {formatDate(evt.ends_at)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-xs">{evt.venue}</span>
                    </div>

                    {evt.tracks && evt.tracks.length > 0 && (
                      <div className="flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{evt.tracks.length} Tracks</span>
                      </div>
                    )}
                  </div>

                  {/* 4 Mini Stat Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Participants
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {totalParticipants}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        in {teams.length} teams
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Volunteers
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {volunteersCount}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Assigned staff</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Submissions
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {submittedCount}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Projects turned in</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Tasks Progress
                      </span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="font-bold text-blue-700 text-sm">{taskPct}%</span>
                        <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${taskPct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {completedTasks}/{tasks.length} done
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
