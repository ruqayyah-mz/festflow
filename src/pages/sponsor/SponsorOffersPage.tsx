import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowRight, Pause, Pencil, Plus, Radio } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { mockStorage } from '@/lib/mockStorage';
import { SponsorOffer, SPONSOR_CATEGORY_LABELS } from '@/types';
import { SponsorOfferFormData, SponsorOfferFormInput, sponsorOfferSchema } from '@/lib/validators';
import { useAuth } from '@/hooks/useAuth';

const EMPTY_FORM: SponsorOfferFormData = {
  company_name: '',
  contact_email: '',
  description: '',
  category: 'other',
  amount: 0,
  currency: 'USD',
  expectations: '',
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SponsorOffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<SponsorOffer[]>([]);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SponsorOfferFormInput, unknown, SponsorOfferFormData>({
    resolver: zodResolver(sponsorOfferSchema),
    defaultValues: EMPTY_FORM,
  });

  const refresh = () => {
    setOffers(user ? mockStorage.getSponsorOffers(user.id, true) : []);
  };

  useEffect(() => {
    refresh();
    return mockStorage.subscribe(refresh);
  }, [user?.id]);

  const startCreate = () => {
    setEditingOfferId(null);
    setFormError(null);
    reset(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (offer: SponsorOffer) => {
    setEditingOfferId(offer.id);
    setFormError(null);
    reset({
      company_name: offer.company_name,
      contact_email: offer.contact_email,
      description: offer.description,
      category: offer.category,
      amount: offer.amount,
      currency: offer.currency as SponsorOfferFormData['currency'],
      expectations: offer.expectations,
    });
    setShowForm(true);
  };

  const onSubmit = (data: SponsorOfferFormData) => {
    try {
      mockStorage.saveSponsorOffer(data, editingOfferId ?? undefined);
      setShowForm(false);
      setEditingOfferId(null);
      setFormError(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save this sponsor offer.');
    }
  };

  const toggleOffer = (offer: SponsorOffer) => {
    try {
      mockStorage.updateSponsorOfferStatus(
        offer.id,
        offer.status === 'active' ? 'paused' : 'active'
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to update this sponsor offer.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sponsorship Offers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish funding opportunities and review event organizers who apply.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/sponsor/offer-applications">
            <Button variant="outline" size="sm">
              Offer Inbox <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
          <Button size="sm" onClick={startCreate}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Offer
          </Button>
        </div>
      </header>

      {formError && (
        <p role="alert" className="p-3 text-xs bg-red-50 border border-red-200 text-red-700">
          {formError}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="border border-blue-200 bg-white p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {editingOfferId ? 'Edit sponsorship offer' : 'Create sponsorship offer'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Organizers can see active offers and apply for up to the amount listed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Organization name *" {...register('company_name')} error={errors.company_name?.message} />
            <Input label="Contact email *" type="email" {...register('contact_email')} error={errors.contact_email?.message} />
          </div>
          <Textarea
            label="About your organization *"
            {...register('description')}
            error={errors.description?.message}
            rows={3}
          />
          <Select
            label="Sponsorship category *"
            {...register('category')}
            error={errors.category?.message}
            options={Object.entries(SPONSOR_CATEGORY_LABELS).map(([value, label]) => ({
              value,
              label: `${label} Sponsor`,
            }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Maximum sponsorship amount *"
              type="number"
              min="1"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />
            <Select
              label="Currency *"
              {...register('currency')}
              error={errors.currency?.message}
              options={[
                { value: 'USD', label: 'USD — US Dollar' },
                { value: 'INR', label: 'INR — Indian Rupee' },
                { value: 'EUR', label: 'EUR — Euro' },
                { value: 'GBP', label: 'GBP — Pound Sterling' },
              ]}
            />
          </div>
          <Textarea
            label="What do you expect in return? *"
            placeholder="For example: event logo placement, a booth, a workshop, or recruiting access."
            {...register('expectations')}
            error={errors.expectations?.message}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingOfferId(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingOfferId ? 'Save changes' : 'Publish offer'}
            </Button>
          </div>
        </form>
      )}

      {offers.length === 0 ? (
        <EmptyState
          message="You have not published any sponsorship offers yet."
          actionLabel="Create an offer"
          onAction={startCreate}
        />
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const applicationCount = mockStorage
              .getOrganizerSponsorshipApplications({ offerId: offer.id }).length;
            return (
              <article key={offer.id} className="border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-slate-900">{offer.company_name}</h2>
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold border border-blue-200 bg-blue-50 text-blue-700">
                        {SPONSOR_CATEGORY_LABELS[offer.category]} Sponsor
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${
                        offer.status === 'active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}>
                        {offer.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{offer.contact_email}</p>
                  </div>
                  <strong className="text-lg text-blue-700">{formatAmount(offer.amount, offer.currency)}</strong>
                </div>

                <p className="text-sm text-slate-600 whitespace-pre-wrap">{offer.description}</p>
                <div className="border-t border-slate-100 pt-3">
                  <h3 className="text-xs font-semibold text-slate-800">Expectations</h3>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{offer.expectations}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">
                    {applicationCount} organizer {applicationCount === 1 ? 'application' : 'applications'}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(offer)}>
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleOffer(offer)}>
                      {offer.status === 'active' ? <Pause className="w-3.5 h-3.5 mr-1.5" /> : <Radio className="w-3.5 h-3.5 mr-1.5" />}
                      {offer.status === 'active' ? 'Pause' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
