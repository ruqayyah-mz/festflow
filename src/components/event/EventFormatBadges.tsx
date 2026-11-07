import { Event } from '@/types';
import { getParticipation, getLocationMode, getCategory, categoryLabel } from '@/lib/eventRules';
import { User, Users, Globe, MapPin } from 'lucide-react';

const badge = 'inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold px-2 py-0.5 border';

export function EventFormatBadges({ event }: { event: Event }) {
  const p = getParticipation(event);
  const online = getLocationMode(event) === 'online';
  return (
    <>
      <span className={`${badge} border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700`}>{categoryLabel(getCategory(event))}</span>
      <span className={`${badge} border-indigo-200 bg-indigo-50 text-indigo-700`}>
        {p.type === 'solo' ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
        {p.type === 'solo' ? 'Solo' : p.min === p.max ? `Teams of ${p.max}` : `Teams of ${p.min}–${p.max}`}
      </span>
      <span className={`${badge} ${online ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        {online ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
        {online ? 'Online' : 'In person'}
      </span>
    </>
  );
}
