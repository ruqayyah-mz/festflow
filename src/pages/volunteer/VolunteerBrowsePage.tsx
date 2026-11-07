import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { EventFormatBadges } from '@/components/event/EventFormatBadges';
import { JoinByInviteLink } from '@/components/volunteer/JoinByInviteLink';
import { Event } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { getVolunteerForm, ROLE_QUESTION_ID } from '@/lib/volunteerForm';
import { getRegistrationStatus } from '@/lib/eventRules';
import { CategoryFilter, CategoryFilterValue, filterByCategory } from '@/components/event/CategoryFilter';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { ArrowRight, MapPin, Calendar, Users } from 'lucide-react';

export function VolunteerBrowsePage() {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  const [openFormFor, setOpenFormFor] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);

  // Only public, open-recruitment events that haven't started — organizers lock decisions once an event starts.
  const allEvents: Event[] = mockStorage
    .getPublicEvents()
    .filter((e) => e.volunteer_policy === 'open' && new Date(e.starts_at).getTime() > Date.now());
  const [category, setCategory] = useState<CategoryFilterValue>('all');
  const events = filterByCategory(allEvents, category);

  const myApps = user
    ? mockStorage
        .getVolunteerApplications()
        .filter((a) => a.user_id === user.id)
        .map((app) => ({ app, event: mockStorage.getEventById(app.event_id) }))
    : [];

  const handleSubmit = (e: React.FormEvent, evt: Event) => {
    e.preventDefault();
    const form = getVolunteerForm(evt);
    // Validate ourselves (form is noValidate) so a missing answer is shown in the page, not a tiny browser tooltip.
    const missing = form.filter((q) => q.required && !(answers[q.id] || '').trim()).map((q) => q.label);
    if (missing.length) {
      setFormError(`Please answer: ${missing.join(', ')}`);
      return;
    }
    try {
      mockStorage.submitVolunteerApplication(
        evt.id,
        answers[ROLE_QUESTION_ID] || 'General Volunteer',
        form.map((q) => ({ question: q.label, answer: (answers[q.id] || '').trim() }))
      );
      setOpenFormFor(null);
      setAnswers({});
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit your application.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Volunteer Opportunities</h1>
          <p className="text-xs text-slate-500 mt-1">
            Events recruiting volunteers. Apply, and once the organizer accepts you it shows up in My Events.
          </p>
        </div>
        <Link to="/volunteer/my-events">
          <Button variant="outline" size="sm" className="space-x-1.5 font-medium">
            <span>View My Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      <JoinByInviteLink />

      <CategoryFilter events={allEvents} value={category} onChange={setCategory} />

      {events.length === 0 ? (
        <EmptyState
          message={allEvents.length ? 'No events of this type are recruiting right now.' : 'No events are recruiting volunteers right now.'}
          actionLabel="View My Events"
          onAction={() => {
            window.location.href = '/volunteer/my-events';
          }}
        />
      ) : (
        <div className="space-y-4">
          {events.map((evt) => {
            const myApp = user
              ? mockStorage.getVolunteerApplications(evt.id).find((a) => a.user_id === user.id)
              : undefined;

            return (
              <div
                key={evt.id}
                className="border border-slate-200 bg-white p-6 shadow-2xs hover:border-blue-300 transition-colors space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{evt.name}</h2>
                      <EventFormatBadges event={evt} />
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{evt.description}</p>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{evt.venue}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {formatDate(evt.starts_at)} — {formatDate(evt.ends_at)}
                        </span>
                      </span>
                    </div>
                    {getRegistrationStatus(evt, 'volunteers').open && (
                      <p className="text-[11px] text-amber-700 font-medium">
                        Applications close {formatDate(getRegistrationStatus(evt, 'volunteers').closesAt)}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {myApp ? (
                      <span
                        className={`text-xs font-mono font-bold px-3 py-1.5 border inline-flex items-center gap-1 ${
                          myApp.status === 'accepted'
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                            : myApp.status === 'rejected'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-amber-300 bg-amber-50 text-amber-800'
                        }`}
                      >
                        {myApp.status === 'accepted' && '✓ Accepted — see My Events'}
                        {myApp.status === 'rejected' && 'Not Selected'}
                        {myApp.status === 'pending' && 'Pending Review'}
                      </span>
                    ) : !getRegistrationStatus(evt, 'volunteers').open ? (
                      <span className="text-xs font-mono text-slate-600 border border-slate-300 bg-slate-100 px-3 py-1.5">
                        {getRegistrationStatus(evt, 'volunteers').reason}
                      </span>
                    ) : openFormFor !== evt.id ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setAnswers({});
                          setFormError(null);
                          setOpenFormFor(evt.id);
                        }}
                        className="space-x-1.5 font-medium"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Apply to Volunteer</span>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {openFormFor === evt.id && !myApp && (
                  <form
                    noValidate
                    onSubmit={(e) => handleSubmit(e, evt)}
                    className="border-t border-slate-100 pt-4 space-y-3"
                  >
                    {getVolunteerForm(evt).map((q) => {
                      const label = `${q.label}${q.required ? ' *' : ''}`;
                      const value = answers[q.id] || '';
                      const set = (v: string) => setAnswers({ ...answers, [q.id]: v });
                      if (q.type === 'choice')
                        return (
                          <Select
                            key={q.id}
                            id={`vq-${evt.id}-${q.id}`}
                            label={label}
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            required={q.required}
                            options={[
                              { value: '', label: 'Select…' },
                              ...(q.options ?? []).map((o) => ({ value: o, label: o })),
                            ]}
                          />
                        );
                      if (q.type === 'paragraph')
                        return (
                          <Textarea
                            key={q.id}
                            id={`vq-${evt.id}-${q.id}`}
                            label={label}
                            rows={3}
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            required={q.required}
                          />
                        );
                      return (
                        <Input
                          key={q.id}
                          id={`vq-${evt.id}-${q.id}`}
                          label={label}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          required={q.required}
                        />
                      );
                    })}
                    {formError && (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2" role="alert">
                        {formError}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setOpenFormFor(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm">
                        Submit Application
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Every application with its outcome — stays visible after the event leaves the browse list. */}
      {myApps.length > 0 && (
        <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">My Applications ({myApps.length})</h2>
          <div className="divide-y divide-slate-100">
            {myApps.map(({ app, event }) => (
              <div key={app.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{event?.name ?? 'Deleted event'}</div>
                  <div className="text-[11px] text-slate-500">
                    {app.role_title} • Applied {formatDate(app.created_at)}
                  </div>
                </div>
                {app.status === 'accepted' && event ? (
                  <Link to={`/volunteer/events/${event.id}`} className="font-mono font-bold text-emerald-700 hover:underline shrink-0">
                    ✓ Accepted — open
                  </Link>
                ) : (
                  <span className={`font-mono font-bold shrink-0 ${STATUS_STYLE[app.status]}`}>{STATUS_LABEL[app.status]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL = {
  pending: 'Pending Review',
  accepted: '✓ Accepted',
  rejected: 'Not Selected',
  expired: 'Closed — no decision before start',
} as const;
const STATUS_STYLE = {
  pending: 'text-amber-700',
  accepted: 'text-emerald-700',
  rejected: 'text-red-700',
  expired: 'text-slate-500',
} as const;
