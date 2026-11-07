import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { getEventCategory } from '../OrganizerOverviewPage';
import { EventFormatBadges } from '@/components/event/EventFormatBadges';
import { downloadEventReport } from '@/lib/eventReport';
import {
  Calendar,
  MapPin,
  Globe,
  Lock,
  Layers,
  Award,
  Users,
  Link2,
  Edit3,
  ExternalLink,
  ArrowLeft,
  Download,
} from 'lucide-react';

interface EventHeaderBannerProps {
  event: Event;
  subtitle?: string;
}

export function EventHeaderBanner({ event, subtitle }: EventHeaderBannerProps) {
  const statusCategory = getEventCategory(event);
  const activeRound = event.rounds?.find((r) => r.active);

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
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
          {subtitle && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono uppercase text-slate-500 font-medium">
                {subtitle}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {statusCategory === 'past' ? (
            <Button size="sm" className="space-x-1.5 text-xs" onClick={() => downloadEventReport(event.id)}>
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </Button>
          ) : (
            <Link to={`/organizer/events/${event.id}/edit`}>
              <Button size="sm" variant="outline" className="space-x-1.5 text-xs">
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Event</span>
              </Button>
            </Link>
          )}
          <Link to={`/events/${event.id}`} target="_blank">
            <Button size="sm" variant="outline" className="space-x-1.5 text-xs">
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Public Page</span>
            </Button>
          </Link>
        </div>
      </div>

      {statusCategory === 'past' && (
        <div className="p-3 text-xs border border-slate-300 bg-slate-100 text-slate-700 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>This event has concluded. Everything here is read-only — download the report for a full record.</span>
        </div>
      )}

      {/* Main Event Title Banner */}
      <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
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

          <EventFormatBadges event={event} />

          {activeRound && (
            <span className="text-[10px] font-mono px-2 py-0.5 border border-purple-200 bg-purple-50 text-purple-700 font-semibold inline-flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>Active: {activeRound.name}</span>
            </span>
          )}
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{event.name}</h1>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed mt-1">{event.description}</p>
        </div>

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

          {event.tracks && event.tracks.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{event.tracks.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

