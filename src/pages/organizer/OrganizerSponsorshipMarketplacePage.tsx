import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { mockStorage } from '@/lib/mockStorage';
import {
  Event,
  OrganizerSponsorshipApplication,
  SponsorCategory,
  SponsorOffer,
  SPONSOR_CATEGORY_LABELS,
} from '@/types';
import {
  OrganizerSponsorshipApplicationFormData,
  OrganizerSponsorshipApplicationFormInput,
  organizerSponsorshipApplicationSchema,
} from '@/lib/validators';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusStyle(status: OrganizerSponsorshipApplication['status']) {
  if (status === 'accepted') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'declined') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'under_review') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function OrganizerSponsorshipMarketplacePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [offers, setOffers] = useState<SponsorOffer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<OrganizerSponsorshipApplication[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SponsorCategory | 'all'>('all');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrganizerSponsorshipApplicationFormInput, unknown, OrganizerSponsorshipApplicationFormData>({
    resolver: zodResolver(organizerSponsorshipApplicationSchema),
    defaultValues: {
      event_id: '',
      contact_email: '',
      requested_amount: 0,
      message: '',
    },
  });

  const refresh = () => {
    setOffers(mockStorage.getSponsorOffers());
    const organizerEvents = user
      ? mockStorage.getEvents().filter((event) =>
          event.organizer_id === user.id &&
          (!eventId || event.id === eventId) &&
          event.seeking_sponsors &&
          !mockStorage.isEventConcluded(event.id)
        )
      : [];
    setEvents(organizerEvents);
    setApplications(user
      ? mockStorage.getOrganizerSponsorshipApplications({ organizerId: user.id })
          .filter((application) => !eventId || application.event_id === eventId)
      : []);
  };

  useEffect(() => {
    refresh();
    return mockStorage.subscribe(refresh);
  }, [user?.id, eventId]);

  const filteredOffers = selectedCategory === 'all'
    ? offers
    : offers.filter((offer) => offer.category === selectedCategory);

  const offerApplications = useMemo(
    () => new Map(applications.map((application) => [`${application.offer_id}:${application.event_id}`, application])),
    [applications]
  );
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId);

  const beginApplication = (offer: SponsorOffer, eventId: string) => {
    setSelectedOfferId(offer.id);
    setSuccessMessage(null);
    setSubmitError(null);
    reset({
      event_id: eventId,
      contact_email: '',
      requested_amount: offer.amount,
      message: '',
    });
  };

  const onSubmit = (data: OrganizerSponsorshipApplicationFormData) => {
    if (!selectedOffer) return;
    if (data.requested_amount > selectedOffer.amount) {
      setError('requested_amount', {
        message: `The request cannot exceed ${formatAmount(selectedOffer.amount, selectedOffer.currency)}.`,
      });
      return;
    }
    try {
      mockStorage.applyToSponsorOffer(selectedOffer.id, data);
      setSuccessMessage(`Your application was sent to ${selectedOffer.company_name}.`);
      setSubmitError(null);
      setSelectedOfferId(null);
      reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to send this application.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {eventId && events[0] ? `Sponsor Marketplace · ${events[0].name}` : 'Sponsor Marketplace'}
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Explore sponsor offers, filter by sponsor type, review expectations, and apply on behalf of an event.
        </p>
      </header>

      {successMessage && (
        <p role="status" className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMessage}
        </p>
      )}
      {submitError && (
        <p role="alert" className="p-3 text-xs bg-red-50 border border-red-200 text-red-700">{submitError}</p>
      )}

      {events.length === 0 && (
        <div className="p-4 border border-amber-200 bg-amber-50 text-xs text-amber-800">
          {eventId
            ? 'This event is not currently accepting sponsorship applications.'
            : 'Create or open an event that is still accepting sponsorships to submit an application.'}
        </div>
      )}

      {offers.length > 0 && (
        <div className="max-w-xs">
          <Select
            label="Filter by sponsor type"
            name="category_filter"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value as SponsorCategory | 'all')}
            options={[
              { value: 'all', label: 'All sponsor types' },
              ...Object.entries(SPONSOR_CATEGORY_LABELS).map(([value, label]) => ({
                value,
                label: `${label} Sponsor`,
              })),
            ]}
          />
        </div>
      )}

      {offers.length === 0 ? (
        <EmptyState message="There are no active sponsor offers right now." />
      ) : filteredOffers.length === 0 ? (
        <EmptyState
          message="There are no sponsor offers in this category."
          actionLabel="Show all sponsor types"
          onAction={() => setSelectedCategory('all')}
        />
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => {
            const existingApplications = events.flatMap((event) => {
              const application = offerApplications.get(`${offer.id}:${event.id}`);
              return application ? [{ event, application }] : [];
            });
            const availableEvents = events.filter((event) =>
              !offerApplications.has(`${offer.id}:${event.id}`)
            );
            return (
              <article key={offer.id} className="border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{offer.company_name}</h2>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] uppercase font-bold border border-blue-200 bg-blue-50 text-blue-700">
                      {SPONSOR_CATEGORY_LABELS[offer.category]} Sponsor
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{offer.contact_email}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase tracking-wide text-slate-500">Up to</span>
                    <strong className="text-xl text-blue-700">{formatAmount(offer.amount, offer.currency)}</strong>
                  </div>
                </div>

                <p className="text-sm text-slate-600 whitespace-pre-wrap">{offer.description}</p>
                <div className="border-t border-slate-100 pt-3">
                  <h3 className="text-xs font-semibold text-slate-800">Sponsor expectations</h3>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{offer.expectations}</p>
                </div>

                {existingApplications.map(({ event, application }) => (
                  <div key={application.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-600">
                      Applied to {event.name} on {formatDate(application.created_at)}
                    </span>
                    <span className={`px-2.5 py-1 border text-xs capitalize ${statusStyle(application.status)}`}>
                      {application.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}

                {availableEvents.length > 0 && (
                  <div className="flex justify-end border-t border-slate-100 pt-3">
                    <Button size="sm" onClick={() => beginApplication(offer, availableEvents[0].id)}>
                      {existingApplications.length > 0 ? 'Apply for another event' : 'Apply for sponsorship'}
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                )}

                {selectedOfferId === offer.id && (
                  <form onSubmit={handleSubmit(onSubmit)} className="border-t border-blue-100 pt-4 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Apply to {offer.company_name}</h3>
                    <Select
                      label="Event *"
                      {...register('event_id')}
                      error={errors.event_id?.message}
                      options={[
                        { value: '', label: 'Choose an event' },
                      ...availableEvents.map((event) => ({ value: event.id, label: event.name })),
                      ]}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Organizer contact email *"
                        type="email"
                        {...register('contact_email')}
                        error={errors.contact_email?.message}
                      />
                      <Input
                        label={`Amount requested (up to ${formatAmount(offer.amount, offer.currency)}) *`}
                        type="number"
                        min="1"
                        max={offer.amount}
                        step="0.01"
                        {...register('requested_amount', { valueAsNumber: true })}
                        error={errors.requested_amount?.message}
                      />
                    </div>
                    <Textarea
                      label="Tell the sponsor about your event and how you can meet their expectations *"
                      {...register('message')}
                      error={errors.message?.message}
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setSelectedOfferId(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>Send application</Button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}

      {applications.length > 0 && (
        <section className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-lg font-bold text-slate-900">My Applications</h2>
            <p className="text-xs text-slate-500 mt-1">Track responses from sponsors.</p>
          </div>
          <div className="space-y-2">
            {applications.map((application) => {
              const offer = mockStorage.getSponsorOffers(undefined, true)
                .find((item) => item.id === application.offer_id);
              const event = mockStorage.getEventById(application.event_id);
              return (
                <div key={application.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{offer?.company_name ?? 'Sponsor'} · {event?.name ?? 'Event'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested {formatAmount(application.requested_amount, offer?.currency ?? 'USD')} · {formatDate(application.created_at)}
                    </p>
                  </div>
                  <span className={`self-start sm:self-auto px-2.5 py-1 border text-xs capitalize ${statusStyle(application.status)}`}>
                    {application.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
