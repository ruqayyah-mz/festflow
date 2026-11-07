import { Event, EventCategory } from '@/types';
import { EVENT_CATEGORIES, getCategory } from '@/lib/eventRules';

export type CategoryFilterValue = EventCategory | 'all';

// Type chips for browse pages; only types that actually appear in the list are offered.
export function CategoryFilter({ events, value, onChange }: { events: Event[]; value: CategoryFilterValue; onChange: (v: CategoryFilterValue) => void }) {
  const counts = new Map<EventCategory, number>();
  events.forEach((e) => counts.set(getCategory(e), (counts.get(getCategory(e)) ?? 0) + 1));
  const present = EVENT_CATEGORIES.filter((c) => counts.has(c.value));
  if (present.length < 2) return null;

  const chip = (active: boolean) =>
    `px-3 py-1 text-xs font-medium border cursor-pointer transition-colors ${
      active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
    }`;

  return (
    <div role="group" aria-label="Filter by event type" className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={value === 'all'} onClick={() => onChange('all')} className={chip(value === 'all')}>
        All types ({events.length})
      </button>
      {present.map((c) => (
        <button key={c.value} type="button" aria-pressed={value === c.value} onClick={() => onChange(c.value)} className={chip(value === c.value)}>
          {c.label} ({counts.get(c.value)})
        </button>
      ))}
    </div>
  );
}

export const filterByCategory = (events: Event[], value: CategoryFilterValue) =>
  value === 'all' ? events : events.filter((e) => getCategory(e) === value);
