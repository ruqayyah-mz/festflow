import { useState } from 'react';
import { Event } from '@/types';
import { mockStorage } from '@/lib/mockStorage';
import { getRegistrationStatus, RegistrationKind } from '@/lib/eventRules';
import { formatDate, toLocalInputValue } from '@/lib/utils';
import { Lock, Unlock } from 'lucide-react';

export interface RegistrationSettings {
  participant_registration_deadline: string; // datetime-local value, '' = none
  participant_registration_closed: boolean;
  volunteer_application_deadline: string;
  volunteer_applications_closed: boolean;
}

export const EMPTY_REGISTRATION: RegistrationSettings = {
  participant_registration_deadline: '',
  participant_registration_closed: false,
  volunteer_application_deadline: '',
  volunteer_applications_closed: false,
};

export function registrationFromEvent(e: Event): RegistrationSettings {
  return {
    participant_registration_deadline: e.participant_registration_deadline ? toLocalInputValue(e.participant_registration_deadline) : '',
    participant_registration_closed: !!e.participant_registration_closed,
    volunteer_application_deadline: e.volunteer_application_deadline ? toLocalInputValue(e.volunteer_application_deadline) : '',
    volunteer_applications_closed: !!e.volunteer_applications_closed,
  };
}

// Form values → Event fields (local datetime → ISO, '' → null).
export function registrationToEvent(r: RegistrationSettings): Partial<Event> {
  const iso = (v: string) => (v ? new Date(v).toISOString() : null);
  return {
    participant_registration_deadline: iso(r.participant_registration_deadline),
    participant_registration_closed: r.participant_registration_closed,
    volunteer_application_deadline: iso(r.volunteer_application_deadline),
    volunteer_applications_closed: r.volunteer_applications_closed,
  };
}

function Block({ title, hint, deadline, closed, onDeadline, onClosed, idPrefix }: {
  title: string; hint: string; deadline: string; closed: boolean; idPrefix: string;
  onDeadline: (v: string) => void; onClosed: (v: boolean) => void;
}) {
  return (
    <div className="p-4 border border-slate-200 space-y-3">
      <div>
        <div className="text-xs font-bold text-slate-900">{title}</div>
        <div className="text-[11px] text-slate-500">{hint}</div>
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-deadline`} className="block text-xs font-medium text-slate-700">Deadline (optional)</label>
        <div className="flex gap-2">
          <input id={`${idPrefix}-deadline`} type="datetime-local" value={deadline} onChange={(e) => onDeadline(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-blue-600" />
          {deadline && (
            <button type="button" onClick={() => onDeadline('')} className="text-xs text-slate-500 hover:text-red-600 cursor-pointer">Clear</button>
          )}
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
        <input type="checkbox" checked={closed} onChange={(e) => onClosed(e.target.checked)} className="h-4 w-4 accent-red-600" />
        Closed now (stop new sign-ups even before the deadline)
      </label>
    </div>
  );
}

export function RegistrationFields({ value, onChange, showVolunteers = true }: {
  value: RegistrationSettings; onChange: (v: RegistrationSettings) => void; showVolunteers?: boolean;
}) {
  const set = (patch: Partial<RegistrationSettings>) => onChange({ ...value, ...patch });
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Block idPrefix="reg-participants" title="Participant registration" hint="Without a deadline, registration closes when the event starts."
        deadline={value.participant_registration_deadline} closed={value.participant_registration_closed}
        onDeadline={(v) => set({ participant_registration_deadline: v })} onClosed={(v) => set({ participant_registration_closed: v })} />
      {showVolunteers && (
        <Block idPrefix="reg-volunteers" title="Volunteer applications" hint="Without a deadline, public applications close when the event starts; private invite links keep working until you close them."
          deadline={value.volunteer_application_deadline} closed={value.volunteer_applications_closed}
          onDeadline={(v) => set({ volunteer_application_deadline: v })} onClosed={(v) => set({ volunteer_applications_closed: v })} />
      )}
    </div>
  );
}

// Organizer quick switch shown on the Participants / Volunteers workspace pages.
export function RegistrationToggle({ event, kind }: { event: Event; kind: RegistrationKind }) {
  const [error, setError] = useState<string | null>(null);
  const status = getRegistrationStatus(event, kind);
  const manuallyClosed = kind === 'participants' ? !!event.participant_registration_closed : !!event.volunteer_applications_closed;
  const ended = mockStorage.isEventConcluded(event.id);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-mono font-semibold border ${
          status.open ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-slate-100 text-slate-700'
        }`}
      >
        {status.open ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        {status.open ? `${status.reason} · closes ${formatDate(status.closesAt)}` : status.reason}
      </span>
      {!ended && (status.open || manuallyClosed) && (
        <button
          type="button"
          onClick={() => {
            try {
              setError(null);
              mockStorage.setRegistrationClosed(event.id, kind, status.open);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not update.');
            }
          }}
          className={`px-2.5 py-1 font-semibold border cursor-pointer ${
            status.open ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {status.open ? 'Close now' : 'Reopen'}
        </button>
      )}
      {error && <span className="text-red-700" role="alert">{error}</span>}
    </div>
  );
}
