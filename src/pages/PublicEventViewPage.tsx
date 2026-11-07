import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { EventFormatBadges } from '@/components/event/EventFormatBadges';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';

export function PublicEventViewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { switchUser, availableProfiles } = useAuth();
  const event = eventId ? mockStorage.getEventById(eventId) : undefined;

  const handleRegisterParticipant = () => {
    const participantProfile =
      availableProfiles.find((p) => p.id.includes('participant')) ||
      availableProfiles[3] ||
      availableProfiles[0];
    switchUser(participantProfile.id, 'participant');
    navigate('/participant');
  };

  const handleSponsorEvent = () => {
    const sponsorProfile =
      availableProfiles.find((p) => p.id.includes('sponsor')) ||
      availableProfiles[2] ||
      availableProfiles[0];
    switchUser(sponsorProfile.id, 'sponsor');
    navigate('/sponsor');
  };

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-slate-500">Event not found or has been soft-deleted.</p>
        <Link to="/events">
          <Button variant="outline" size="sm">Back to Events Directory</Button>
        </Link>
      </div>
    );
  }

  const activeRound = event.rounds.find((r) => r.active);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <Link to="/events" className="text-xs text-slate-500 hover:text-blue-600 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Events Directory</span>
      </Link>

      <div className="border border-slate-200 bg-white p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">
                {event.visibility} Event
              </span>
              <EventFormatBadges event={event} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {event.name}
            </h1>
            <p className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-600" /> <span className="text-slate-800">{event.venue}</span></span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-600" /> <span>{formatDate(event.starts_at)} — {formatDate(event.ends_at)}</span></span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
            <Button size="sm" onClick={handleRegisterParticipant}>
              Register / Submit Project
            </Button>
            {event.seeking_sponsors && (
              <Button variant="outline" size="sm" onClick={handleSponsorEvent}>
                Sponsor This Event
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-xs uppercase font-bold text-blue-800 tracking-wider">
            About This Event
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </div>

        {/* Tracks */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs uppercase font-bold text-blue-800 tracking-wider">
            Competition Tracks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {event.tracks.map((track) => (
              <div
                key={track}
                className="p-3.5 border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-800"
              >
                • {track}
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation Rounds */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs uppercase font-bold text-blue-800 tracking-wider">
            Evaluation Stages & Rounds
          </h2>
          <div className="divide-y divide-slate-100 border border-slate-200">
            {event.rounds.map((round) => (
              <div key={round.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900">{round.name}</span>
                  {round.active && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 border border-blue-200 text-blue-700 bg-blue-50">
                      Currently In Progress
                    </span>
                  )}
                </div>
                <span className="font-mono text-slate-500">Weight: {round.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
