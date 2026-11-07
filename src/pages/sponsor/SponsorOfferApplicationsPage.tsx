import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { mockStorage } from '@/lib/mockStorage';
import { OrganizerSponsorshipApplication, SponsorOffer } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

const STATUSES: OrganizerSponsorshipApplication['status'][] = [
  'applied',
  'under_review',
  'accepted',
  'declined',
];

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SponsorOfferApplicationsPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<SponsorOffer[]>([]);
  const [applications, setApplications] = useState<OrganizerSponsorshipApplication[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    const sponsorOffers = user ? mockStorage.getSponsorOffers(user.id, true) : [];
    setOffers(sponsorOffers);
    const offerIds = new Set(sponsorOffers.map((offer) => offer.id));
    setApplications(
      mockStorage.getOrganizerSponsorshipApplications()
        .filter((application) => offerIds.has(application.offer_id))
    );
  };

  useEffect(() => {
    refresh();
    return mockStorage.subscribe(refresh);
  }, [user?.id]);

  const changeStatus = (applicationId: string, status: OrganizerSponsorshipApplication['status']) => {
    try {
      mockStorage.updateOrganizerSponsorshipApplicationStatus(applicationId, status);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update the application.');
    }
  };

  const offerFor = (offerId: string) => offers.find((offer) => offer.id === offerId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link to="/sponsor/offers" className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Sponsorship Offers
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organizer Applications</h1>
          <p className="text-xs text-slate-500 mt-1">Review event proposals sent to your sponsorship offers.</p>
        </div>
      </header>

      {error && <p role="alert" className="p-3 text-xs bg-red-50 border border-red-200 text-red-700">{error}</p>}

      {applications.length === 0 ? (
        <EmptyState message="There are no organizer applications for your offers yet." />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const offer = offerFor(application.offer_id);
            const event = mockStorage.getEventById(application.event_id);
            if (!offer) return null;
            return (
              <article key={application.id} className="border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wide text-blue-700">{offer.company_name} offer</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">{event?.name ?? 'Event unavailable'}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Organizer: {application.organizer_name} · {application.contact_email}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 border border-slate-200 bg-slate-50 capitalize text-slate-700">
                    {application.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-100">
                    <strong className="block text-slate-800">Requested</strong>
                    <span className="text-blue-700 font-semibold">{formatAmount(application.requested_amount, offer.currency)}</span>
                    <span className="text-slate-500"> of {formatAmount(offer.amount, offer.currency)} offered</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100">
                    <strong className="block text-slate-800">Submitted</strong>
                    <span className="text-slate-600">{formatDate(application.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{application.message}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-500">Update application status</span>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={application.status === status ? 'primary' : 'outline'}
                        onClick={() => changeStatus(application.id, status)}
                      >
                        {status === 'accepted' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                        {status.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {offers.length === 0 && applications.length === 0 && (
        <Link to="/sponsor/offers">
          <Button variant="outline">Create a sponsorship offer</Button>
        </Link>
      )}
    </div>
  );
}
