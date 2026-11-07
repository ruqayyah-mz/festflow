import { Round } from '@/types';
import { TEAM_SIZE_LIMIT, validateTeamSize, validateRounds } from '@/lib/eventRules';
import { User, Users, Globe, MapPin } from 'lucide-react';

export interface EventFormat {
  participation_type: 'solo' | 'team';
  team_size_min: number;
  team_size_max: number;
  location_mode: 'online' | 'offline';
}

export const DEFAULT_EVENT_FORMAT: EventFormat = {
  participation_type: 'team',
  team_size_min: 1,
  team_size_max: 4,
  location_mode: 'offline',
};

interface Props {
  value: EventFormat;
  onChange: (value: EventFormat) => void;
  // Once people have registered, switching solo/team would orphan their registrations.
  participationLocked?: boolean;
}

function OptionCard({ selected, onSelect, disabled, icon: Icon, title, text, name }: {
  selected: boolean; onSelect: () => void; disabled?: boolean; icon: typeof User; title: string; text: string; name: string;
}) {
  return (
    <label
      className={`p-4 border rounded-xs transition-all space-y-1.5 block ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${selected ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-slate-200 bg-white hover:border-slate-300'}`}
    >
      <span className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Icon className="w-4 h-4 text-blue-600" />
          {title}
        </span>
        <input type="radio" name={name} checked={selected} onChange={onSelect} disabled={disabled} className="h-3.5 w-3.5 accent-blue-600" />
      </span>
      <span className="block text-[11px] text-slate-600 leading-relaxed">{text}</span>
    </label>
  );
}

export function EventFormatFields({ value, onChange, participationLocked }: Props) {
  const set = (patch: Partial<EventFormat>) => onChange({ ...value, ...patch });
  const sizeError = value.participation_type === 'team' ? validateTeamSize(value.team_size_min, value.team_size_max) : null;
  const num = (v: string) => (v === '' ? 0 : parseInt(v, 10) || 0);

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-slate-800 mb-2">How do participants compete?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OptionCard name="participation" icon={User} title="Solo" text="Each participant registers and submits individually."
            selected={value.participation_type === 'solo'} onSelect={() => set({ participation_type: 'solo' })} disabled={participationLocked} />
          <OptionCard name="participation" icon={Users} title="Teams" text="Participants form or join teams and submit one project per team."
            selected={value.participation_type === 'team'} onSelect={() => set({ participation_type: 'team' })} disabled={participationLocked} />
        </div>
        {participationLocked && (
          <p className="text-[11px] text-amber-700">Participants have already registered, so this can't be changed.</p>
        )}
      </fieldset>

      {value.participation_type === 'team' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <label className="text-xs font-medium text-slate-700 space-y-1">
              <span className="block">Min team size</span>
              <input type="number" min={1} max={TEAM_SIZE_LIMIT} value={value.team_size_min || ''}
                onChange={(e) => set({ team_size_min: num(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-blue-600" />
            </label>
            <label className="text-xs font-medium text-slate-700 space-y-1">
              <span className="block">Max team size</span>
              <input type="number" min={2} max={TEAM_SIZE_LIMIT} value={value.team_size_max || ''}
                onChange={(e) => set({ team_size_max: num(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-blue-600" />
            </label>
          </div>
          {sizeError ? (
            <p className="text-xs text-red-600 font-medium" role="alert">{sizeError}</p>
          ) : (
            <p className="text-[11px] text-slate-500">
              Teams of {value.team_size_min}–{value.team_size_max}. Teams below the minimum can't submit; full teams can't be joined.
            </p>
          )}
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-slate-800 mb-2">Where does it happen?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OptionCard name="location" icon={MapPin} title="Offline (In person)" text="At a physical venue. QR check-in is used for attendance."
            selected={value.location_mode === 'offline'} onSelect={() => set({ location_mode: 'offline' })} />
          <OptionCard name="location" icon={Globe} title="Online" text="Hosted on a platform (Discord, Zoom, etc.). No physical check-in."
            selected={value.location_mode === 'online'} onSelect={() => set({ location_mode: 'online' })} />
        </div>
      </fieldset>
    </div>
  );
}

// Live running total under the rounds editor; turns red unless it is exactly 100%.
export function RoundWeightTotal({ rounds }: { rounds: Round[] }) {
  const total = rounds.reduce((sum, r) => sum + (r.weight || 0), 0);
  const error = validateRounds(rounds);
  return (
    <div
      role="status"
      className={`flex items-center justify-between text-xs px-3 py-2 border ${
        error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      <span className="font-medium">{error ?? 'Weights add up to 100% ✓'}</span>
      <span className="font-mono font-bold">Total: {total}%</span>
    </div>
  );
}
