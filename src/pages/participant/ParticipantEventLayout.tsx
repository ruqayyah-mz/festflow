import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { getEventCategory } from '@/pages/organizer/OrganizerOverviewPage';
import { ArrowLeft, Lock } from 'lucide-react';

const SECTION_TITLES: Record<string, string> = {
  '': 'Overview',
  submission: 'Submission',
  announcements: 'Announcements',
};

// Participant event workspace shell: guard + breadcrumb. Navigation lives in the sidebar (ParticipantLayout).
export function ParticipantEventLayout() {
  const { eventId } = useParams<{ eventId: string }>();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const event = eventId ? mockStorage.getEventById(eventId) : undefined;
  const registered = !!event && !!user && mockStorage.isParticipantIn(event.id, user.id);

  if (!event || !registered) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-3">
        <p className="text-sm text-slate-600">{event ? "You're not registered for this event." : 'Event not found.'}</p>
        <Link to={event ? '/participant' : '/participant/my-events'} className="text-xs text-blue-600 font-semibold">
          {event ? '← Explore Events to register' : '← Back to My Events'}
        </Link>
      </div>
    );
  }

  const section = SECTION_TITLES[pathname.split(`/participant/events/${event.id}`)[1]?.replace(/^\//, '') ?? ''] ?? '';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <Link to="/participant/my-events" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          My Events
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

      {getEventCategory(event) === 'past' && (
        <div className="p-3 text-xs border border-slate-300 bg-slate-100 text-slate-700 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          This event has concluded. Your team and submission are kept here as a record.
        </div>
      )}

      <Outlet />
    </div>
  );
}
