import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { formatDate } from '@/lib/utils';
import { getEventCategory } from '@/pages/organizer/OrganizerOverviewPage';
import { ArrowLeft, Calendar, MapPin, ShieldCheck, Lock } from 'lucide-react';

const SECTION_TITLES: Record<string, string> = {
  '': 'My Tasks',
  announcements: 'Announcements',
  profile: 'My Profile',
};

// Volunteer event workspace: the sidebar (VolunteerLayout) carries the navigation; this renders the event header.
export function VolunteerEventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const event = eventId ? mockStorage.getEventById(eventId) : undefined;
  const myRole = mockStorage
    .getRoles(eventId)
    .find((r) => r.user_id === user?.id && r.role_type === 'volunteer');

  if (!event || !myRole) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-3">
        <p className="text-sm text-slate-600">
          {event ? "You're not an accepted volunteer for this event." : 'Event not found.'}
        </p>
        <Link to="/volunteer/my-events" className="text-xs text-blue-600 font-semibold">
          ← Back to My Events
        </Link>
      </div>
    );
  }

  const status = getEventCategory(event);
  const section = SECTION_TITLES[pathname.split(`/volunteer/events/${event.id}`)[1]?.replace(/^\//, '') ?? ''] ?? '';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <Link
          to="/volunteer/my-events"
          className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Events</span>
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-slate-800 truncate max-w-sm">{event.name}</span>
        {section && (
          <>
            <span className="text-slate-300">/</span>
            <span className="font-mono uppercase text-slate-500 font-medium">{section}</span>
          </>
        )}
      </div>

      {status === 'past' && (
        <div className="p-3 text-xs border border-slate-300 bg-slate-100 text-slate-700 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>This event has concluded. Your tasks and attendance are kept here as a record.</span>
        </div>
      )}

      {/* Event header */}
      <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {status === 'ongoing' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Now</span>
            </span>
          )}
          {status === 'upcoming' && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">
              <Calendar className="w-3 h-3" />
              <span>Upcoming</span>
            </span>
          )}
          {status === 'past' && (
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-slate-300 bg-slate-100 text-slate-700">
              Concluded
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700">
            <ShieldCheck className="w-3 h-3" />
            <span>{myRole.role_title || 'General Volunteer'}</span>
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{event.name}</h1>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed mt-1">{event.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {formatDate(event.starts_at)} → {formatDate(event.ends_at)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{event.venue}</span>
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
