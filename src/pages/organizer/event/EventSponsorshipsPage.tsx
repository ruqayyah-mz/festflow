import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Event, SponsorshipApplication } from '@/types';
import { EventHeaderBanner } from './EventHeaderBanner';
import { getEventCategory } from '../OrganizerOverviewPage';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import {
  Sparkles,
  CheckCircle2,
  Mail,
} from 'lucide-react';

export function EventSponsorshipsPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<Event | undefined>(() =>
    eventId ? mockStorage.getEventById(eventId) : undefined
  );
  const [sponsorApps, setSponsorApps] = useState<SponsorshipApplication[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = () => {
    if (!eventId) return;
    setEvent(mockStorage.getEventById(eventId));
    setSponsorApps(mockStorage.getSponsorshipApplications(eventId));
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

  const handleStatusChange = (
    appId: string,
    newStatus: 'applied' | 'under_review' | 'confirmed'
  ) => {
    mockStorage.updateSponsorshipStatus(appId, newStatus);
    showNotification(`Sponsorship status updated to ${newStatus.replace('_', ' ')}.`);
  };

  const confirmedCount = sponsorApps.filter((a) => a.status === 'confirmed').length;
  const underReviewCount = sponsorApps.filter((a) => a.status === 'under_review').length;
  const appliedCount = sponsorApps.filter((a) => a.status === 'applied').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <EventHeaderBanner event={event} subtitle="Sponsorships" />

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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
            Total Inquiries
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{sponsorApps.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Corporate partners</div>
        </div>

        <div className="border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-emerald-600 font-semibold block">
            Confirmed Partners
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{confirmedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Contract finalized</div>
        </div>

        <div className="border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-blue-600 font-semibold block">
            Under Review
          </span>
          <div className="text-2xl font-bold text-blue-700 mt-1">{underReviewCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Negotiating perks</div>
        </div>

        <div className="border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-amber-600 font-semibold block">
            Pending Applied
          </span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{appliedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Awaiting initial check</div>
        </div>
      </div>

      {/* Applications Pipeline */}
      <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Sponsor Applications Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500">
              Manage incoming proposals from enterprise partners and companies
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {event.seeking_sponsors ? 'Seeking Sponsors: Active' : 'Seeking Sponsors: Closed'}
          </span>
        </div>

        {sponsorApps.length === 0 ? (
          <EmptyState message="No sponsorship applications submitted yet for this event." />
        ) : (
          <div className="space-y-3">
            {sponsorApps.map((app) => (
              <div
                key={app.id}
                className="p-4 border border-slate-200 bg-slate-50/50 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">
                        {app.form_data.company_name}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                        {app.form_data.tier}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{app.form_data.contact_email}</span>
                      <span>•</span>
                      <span>Applied {formatDate(app.created_at)}</span>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {(['applied', 'under_review', 'confirmed'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(app.id, status)}
                        disabled={getEventCategory(event) === 'past'}
                        className={`px-2.5 py-1 text-[11px] font-mono capitalize transition-colors cursor-pointer border disabled:cursor-not-allowed disabled:opacity-60 ${
                          app.status === status
                            ? status === 'confirmed'
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                              : status === 'under_review'
                              ? 'bg-blue-600 text-white border-blue-600 font-bold'
                              : 'bg-slate-700 text-white border-slate-700 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 border border-slate-200">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-1">
                      Perks Offered to Hackers:
                    </span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {app.form_data.perks_offered}
                    </p>
                  </div>

                  <div className="bg-white p-3 border border-slate-200">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-1">
                      Partner Requirements:
                    </span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {app.form_data.requirements}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Tiers Blueprint */}
      <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Sponsorship Packages & Tiers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-purple-200 bg-purple-50/30 p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-700">
              Tier 01 • Platinum
            </span>
            <div className="text-lg font-bold text-slate-900">$10,000</div>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Keynote opening ceremony slot (15 min)</li>
              <li>Large physical recruitment booth in main hall</li>
              <li>Exclusive branded challenge track & prize</li>
              <li>Direct access to hacker resumes & GitHub links</li>
            </ul>
          </div>

          <div className="border border-blue-200 bg-blue-50/30 p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-700">
              Tier 02 • Gold
            </span>
            <div className="text-lg font-bold text-slate-900">$5,000</div>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>45-minute technical workshop session</li>
              <li>Branded booth in hallway exhibition</li>
              <li>Swag distribution in hacker registration kits</li>
            </ul>
          </div>

          <div className="border border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-700">
              Tier 03 • Silver
            </span>
            <div className="text-lg font-bold text-slate-900">$2,500</div>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Logo on website, lanyards, and banners</li>
              <li>Mentorship & judge seat during demo day</li>
              <li>Shared table in sponsor lounge</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
