import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sponsorApplicationSchema, SponsorApplicationFormData } from '@/lib/validators';
import { mockStorage } from '@/lib/mockStorage';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Event } from '@/types';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export function SponsorApplicationPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, switchUser, availableProfiles } = useAuth();

  const event: Event | undefined = eventId ? mockStorage.getEventById(eventId) : undefined;
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SponsorApplicationFormData>({
    resolver: zodResolver(sponsorApplicationSchema),
    defaultValues: {
      company_name: 'CloudNova Labs',
      tier: 'Gold Tier ($5,000)',
      contact_email: 'partners@cloudnova.io',
      perks_offered: '$15,000 in GPU cloud inference credits for all hackers and recruitment interview slots.',
      requirements: 'Dedicated 10x10 foyer booth, 30-min keynote workshop slot, and logo on hacker lanyard.',
    },
  });

  if (!event || mockStorage.isEventConcluded(event.id)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-neutral-500">
          {event ? 'This event has concluded and is no longer accepting sponsors.' : 'Event not found.'}
        </p>
        <Link to="/sponsor">
          <Button variant="outline" size="sm">Back to Sponsorships</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = (data: SponsorApplicationFormData) => {
    mockStorage.submitSponsorshipApplication(event.id, data);

    // Switch to sponsor role so user can test sponsor portal immediately
    const sponsorProfile = user || availableProfiles[2];
    switchUser(sponsorProfile.id, 'sponsor');

    setSubmitted(true);
    setTimeout(() => {
      navigate('/sponsor/applications');
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link to="/sponsor" className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-medium">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Browse Events</span>
      </Link>

      <div className="border-b border-slate-200 pb-4">
        <span className="text-[10px] uppercase font-bold text-blue-700 font-mono">Official Partnership Application</span>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
          Apply to Sponsor {event.name}
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Venue: {event.venue} • Public builder ecosystem
        </p>
      </div>

      {submitted ? (
        <div className="border border-blue-200 bg-blue-50/80 p-8 text-center space-y-3 rounded-sm shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto" />
          <h2 className="text-lg font-bold text-blue-950">
            Application Received!
          </h2>
          <p className="text-xs text-blue-800">
            Status set to <strong>"Applied"</strong>. Redirecting you to the Sponsor Dashboard to monitor status...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
              <span>1. Organization & Contact</span>
            </h2>

            <Input
              label="Company or Brand Name *"
              placeholder="e.g. Supabase, Stripe, CloudNova Labs"
              {...register('company_name')}
              error={errors.company_name?.message}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Requested Sponsorship Tier *"
                {...register('tier')}
                error={errors.tier?.message}
                options={[
                  { value: 'Title Partner ($20,000)', label: 'Title Partner ($20,000)' },
                  { value: 'Platinum Tier ($10,000)', label: 'Platinum Tier ($10,000)' },
                  { value: 'Gold Tier ($5,000)', label: 'Gold Tier ($5,000)' },
                  { value: 'Silver Tier ($2,500)', label: 'Silver Tier ($2,500)' },
                  { value: 'Community Partner ($1,000)', label: 'Community Partner ($1,000)' },
                ]}
              />

              <Input
                label="Partnership Contact Email *"
                type="email"
                placeholder="partnerships@company.com"
                {...register('contact_email')}
                error={errors.contact_email?.message}
              />
            </div>
          </div>

          <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
              <span>2. Deliverables & Value Exchange</span>
            </h2>

            <Textarea
              label="Perks & Benefits Offered to Builders *"
              placeholder="Detail API credits, cloud infrastructure vouchers, dedicated hardware grants, swag kits, or cash prize pools..."
              {...register('perks_offered')}
              error={errors.perks_offered?.message}
              rows={4}
            />

            <Textarea
              label="Requirements from Event Organizers *"
              placeholder="Specify booth dimensions, electrical power requirements, speaking slot durations, judge table seats, or resume book access..."
              {...register('requirements')}
              error={errors.requirements?.message}
              rows={4}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Link to="/sponsors">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Application...' : 'Submit Sponsorship Application'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
