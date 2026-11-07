import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { SponsorshipApplication, Event } from '@/types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, Clock, Check, ArrowRight } from 'lucide-react';

export function SponsorApplicationsPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<SponsorshipApplication[]>(mockStorage.getSponsorshipApplications());
  const events = mockStorage.getEvents();

  const refresh = () => {
    setApps(mockStorage.getSponsorshipApplications());
  };

  useEffect(() => {
    refresh();
    const unsub = mockStorage.subscribe(() => {
      refresh();
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Applications & Partnerships
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status from initial application to confirmed festival partner.
          </p>
        </div>

        <Link to="/sponsor">
          <Button size="sm" className="space-x-1.5 font-medium">
            <span>Browse More Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {apps.length === 0 ? (
        <EmptyState
          message="No sponsorship applications found for your organization."
          actionLabel="Browse Events to Sponsor"
          onAction={() => {
            window.location.href = '/sponsor';
          }}
        />
      ) : (
        <div className="space-y-6">
          {apps.map((app) => {
            const targetEvent: Event | undefined = mockStorage.getEventById(app.event_id);

            // Stepper stages: applied -> under_review -> confirmed
            const steps = [
              { key: 'applied', label: '1. Applied' },
              { key: 'under_review', label: '2. Under Review' },
              { key: 'confirmed', label: '3. Confirmed' },
            ];

            const currentStepIdx =
              app.status === 'confirmed'
                ? 2
                : app.status === 'under_review'
                ? 1
                : 0;

            return (
              <div
                key={app.id}
                className="border border-slate-200 bg-white p-6 shadow-2xs space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">
                      {app.form_data.tier}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1.5">
                      {targetEvent?.name || 'HackFest 2026'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      Applicant: {app.form_data.company_name} ({app.form_data.contact_email})
                    </p>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    Submitted {formatDate(app.created_at)}
                  </span>
                </div>

                {/* Milestone Stepper: applied -> under_review -> confirmed */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Partnership Milestone Status:
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {steps.map((step, idx) => {
                      const isComplete = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div
                          key={step.key}
                          className={`p-3 border text-center text-xs transition-colors ${
                            isCurrent
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-2xs'
                              : isComplete
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold'
                              : 'border-slate-200 bg-slate-50 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            {isComplete && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            <span>{step.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Application Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider block">
                      Perks Offered & Grants:
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      {app.form_data.perks_offered}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-700 uppercase text-[10px] tracking-wider block">
                      Company Requirements:
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      {app.form_data.requirements}
                    </p>
                  </div>
                </div>

                {/* If Confirmed: Show Deliverables note */}
                {app.status === 'confirmed' && (
                  <div className="border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Partnership Confirmed!</strong> Your dedicated interview booth and stage workshop time are reserved.
                      </span>
                    </div>

                    <Link to="/sponsor">
                      <Button size="sm" variant="outline" className="bg-white text-xs">
                        Browse More Events
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

