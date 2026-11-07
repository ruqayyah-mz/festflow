import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const { switchUser, availableProfiles } = useAuth();
  const publicEvents = mockStorage.getPublicEvents();

  const handlePersonaSelect = (profileId: string, role: 'organizer' | 'volunteer' | 'sponsor' | 'participant') => {
    switchUser(profileId, role);
    navigate(`/${role}`);
  };

  return (
    <div className="space-y-16 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 border border-blue-200 bg-blue-50/80 text-xs font-mono text-blue-800 shadow-2xs">
          <span className="font-semibold">All-In-One Fest Platform</span>
          <span className="text-blue-300">|</span>
          <span className="font-bold text-blue-700">FestFlow 1.0</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-950 leading-[1.1]">
          The minimalist event ecosystem for hackathons & campus fests.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          One unified coordination engine for organizers, sponsors, volunteers, participants, and judges. 
          Generous whitespace, flat architecture, crisp blue and white design.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/login">
            <Button size="lg" className="space-x-2">
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/events">
            <Button variant="outline" size="lg">
              Browse Public Events
            </Button>
          </Link>
        </div>

        {/* Live Role Switcher quick test box */}
        <div className="pt-6 border-t border-slate-200 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
            Instant Persona Sandbox (Switch role to test full experience):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handlePersonaSelect(availableProfiles[0].id, 'organizer')}
              className="px-3 py-2 text-xs font-medium border border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 bg-white text-left transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-bold text-blue-700">Organizer</div>
              <div className="text-[11px] text-slate-500">Alex Rivera</div>
            </button>
            <button
              onClick={() => handlePersonaSelect(availableProfiles[1].id, 'volunteer')}
              className="px-3 py-2 text-xs font-medium border border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 bg-white text-left transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-bold text-blue-700">Volunteer</div>
              <div className="text-[11px] text-slate-500">Sarah Chen</div>
            </button>
            <button
              onClick={() => handlePersonaSelect(availableProfiles[2].id, 'sponsor')}
              className="px-3 py-2 text-xs font-medium border border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 bg-white text-left transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-bold text-blue-700">Sponsor</div>
              <div className="text-[11px] text-slate-500">Elena Rostova</div>
            </button>
            <button
              onClick={() => handlePersonaSelect(availableProfiles[3].id, 'participant')}
              className="px-3 py-2 text-xs font-medium border border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 bg-white text-left transition-colors cursor-pointer shadow-2xs"
            >
              <div className="font-bold text-blue-700">Participant</div>
              <div className="text-[11px] text-slate-500">David Kim</div>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Hackathon Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="border border-blue-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs uppercase tracking-widest font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 border border-blue-100">
                ● Live Hackathon in Progress
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                National Builder HackFest 2026
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Grand Innovation Arena • 36-hour multi-track builder sprint
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/events/evt-cq-2026">
                <Button variant="outline" size="sm">
                  View Event Details
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-3.5 border border-slate-100 bg-slate-50/60">
              <div className="text-xs text-slate-500">Registered Teams</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">3 Teams</div>
            </div>
            <div className="p-3.5 border border-slate-100 bg-slate-50/60">
              <div className="text-xs text-slate-500">Active Round</div>
              <div className="text-xl font-bold text-blue-700 mt-0.5">Round 2</div>
            </div>
            <div className="p-3.5 border border-slate-100 bg-slate-50/60">
              <div className="text-xs text-slate-500">Submissions</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">2 Submitted</div>
            </div>
            <div className="p-3.5 border border-slate-100 bg-slate-50/60">
              <div className="text-xs text-slate-500">Task Completion</div>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">40%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Roles System Grid */}
      <section className="max-w-5xl mx-auto px-4 space-y-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            Ecosystem Architecture
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Built specifically to solve the friction points of modern collegiate and developer hackathons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-200 p-6 bg-white space-y-3 shadow-2xs hover:border-blue-400 transition-colors">
            <div className="text-xs font-mono font-bold uppercase text-blue-600">01. Organizer</div>
            <h4 className="text-base font-bold text-slate-900">
              Command & Control
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create and manage rounds, generate table & track tokens for judges, broadcast timestamped announcements, and soft-delete events.
            </p>
          </div>

          <div className="border border-slate-200 p-6 bg-white space-y-3 shadow-2xs hover:border-blue-400 transition-colors">
            <div className="text-xs font-mono font-bold uppercase text-blue-600">02. Judges (No Account)</div>
            <h4 className="text-base font-bold text-slate-900">
              Frictionless Marking
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Judges simply click their assigned table link. Instant autosave on every keystroke guarantees marks survive venue Wi-Fi drops.
            </p>
          </div>

          <div className="border border-slate-200 p-6 bg-white space-y-3 shadow-2xs hover:border-blue-400 transition-colors">
            <div className="text-xs font-mono font-bold uppercase text-blue-600">03. Volunteers</div>
            <h4 className="text-base font-bold text-slate-900">
              Task Worklists
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              One-click onboarding via token links. Portfolio-style task tracking with fast todo/in-progress/done mobile toggles.
            </p>
          </div>

          <div className="border border-slate-200 p-6 bg-white space-y-3 shadow-2xs hover:border-blue-400 transition-colors">
            <div className="text-xs font-mono font-bold uppercase text-blue-600">04. Participants</div>
            <h4 className="text-base font-bold text-slate-900">
              Team & Submissions
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Join teams with 6-digit codes. Live deadline countdown, public announcements, and real-time submission status.
            </p>
          </div>

          <div className="border border-slate-200 p-6 bg-white space-y-3 shadow-2xs hover:border-blue-400 transition-colors">
            <div className="text-xs font-mono font-bold uppercase text-blue-600">05. Sponsors</div>
            <h4 className="text-base font-bold text-slate-900">
              Partnership Pipeline
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Browse public events seeking partners. Submit applications and track review status: applied → under review → confirmed.
            </p>
          </div>

          <div className="border border-slate-200 p-6 bg-white space-y-3 shadow-2xs hover:border-blue-400 transition-colors">
            <div className="text-xs font-mono font-bold uppercase text-blue-600">06. Security & RLS</div>
            <h4 className="text-base font-bold text-slate-900">
              Postgres + Supabase
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict Row Level Security, route-level role guards, rate-limited RPC judge endpoints, and soft-delete protections.
            </p>
          </div>
        </div>
      </section>

      {/* Public Events Directory */}
      <section className="max-w-5xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Public Events Directory
            </h3>
            <p className="text-xs text-slate-500">
              Events actively accepting participants or seeking corporate sponsors
            </p>
          </div>
          <Link to="/events" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All ({publicEvents.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {publicEvents.map((evt) => (
            <div
              key={evt.id}
              className="border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-4 shadow-xs hover:border-blue-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    {formatDate(evt.starts_at)}
                  </span>
                  {evt.seeking_sponsors && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-200 text-blue-700 bg-blue-50">
                      Seeking Sponsors
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {evt.name}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {evt.description}
                </p>
                <div className="text-xs text-slate-500">
                  Venue: <span className="text-slate-800 font-medium">{evt.venue}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-mono">
                  {evt.rounds.length} Rounds • {evt.tracks.length} Tracks
                </div>
                <Link to={`/events/${evt.id}`}>
                  <Button variant="outline" size="sm">
                    View Event
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
