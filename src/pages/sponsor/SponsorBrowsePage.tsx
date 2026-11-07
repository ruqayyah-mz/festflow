import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { ArrowRight, MapPin, Calendar } from 'lucide-react';

export function SponsorBrowsePage() {
  const events = mockStorage.getPublicEvents();
  const [filterSeekingOnly, setFilterSeekingOnly] = useState(true);

  const filtered = filterSeekingOnly
    ? events.filter((e) => e.seeking_sponsors)
    : events;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Browse Sponsorship Opportunities
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect with collegiate hackathons, conferences, and student engineering symposiums.
          </p>
        </div>

        <Link to="/sponsor/applications">
          <Button variant="outline" size="sm" className="space-x-1.5 font-medium">
            <span>View My Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Filter check */}
      <div className="flex items-center space-x-2 text-xs">
        <label className="flex items-center space-x-2 cursor-pointer text-slate-700 font-medium">
          <input
            type="checkbox"
            checked={filterSeekingOnly}
            onChange={(e) => setFilterSeekingOnly(e.target.checked)}
            className="h-4 w-4 rounded-none border-slate-300 accent-blue-600"
          />
          <span>Show only events actively seeking corporate sponsors</span>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message="No sponsorship opportunities found matching the filter."
          actionLabel="Show All Events"
          onAction={() => setFilterSeekingOnly(false)}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((evt) => {
            return (
              <div
                key={evt.id}
                className="border border-slate-200 bg-white p-6 shadow-2xs hover:border-blue-300 transition-colors space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">
                        {evt.seeking_sponsors ? 'Open for Partners' : 'Partnership Closed'}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">
                        {evt.name}
                      </h2>
                    </div>

                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{evt.venue}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{formatDate(evt.starts_at)} — {formatDate(evt.ends_at)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {mockStorage.isEventConcluded(evt.id) ? (
                      <span className="text-xs font-mono text-slate-500 border border-slate-200 bg-slate-50 px-3 py-1.5">
                        Event Concluded
                      </span>
                    ) : (
                      <Link to={`/sponsor/apply/${evt.id}`}>
                        <Button size="sm" className="space-x-1.5 font-medium">
                          <span>Apply to Sponsor</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Sponsorship Tiers Preview */}
                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-medium">Standard Tiers:</span>
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px]">
                      Platinum ($10k)
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px]">
                      Gold ($5k)
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px]">
                      Silver ($2.5k)
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    Includes booth space, talent scouting, and keynote workshop slots
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
