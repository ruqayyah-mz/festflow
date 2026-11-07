import { useState } from 'react';
import { Event } from '@/types';
import { mockStorage } from '@/lib/mockStorage';
import { formatDate } from '@/lib/utils';
import { getParticipation } from '@/lib/eventRules';
import { Button } from '@/components/ui/Button';
import { UserCheck, UserX } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  forming: 'bg-slate-100 text-slate-600 border-slate-200',
};

// Organizer review queue for participant/team applications (Participants page).
export function TeamApplications({ event }: { event: Event }) {
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const solo = getParticipation(event).type === 'solo';
  const isPast = mockStorage.isEventConcluded(event.id);
  const all = mockStorage.getTeams(event.id);
  const pending = all.filter((t) => t.status === 'pending');
  const others = all.filter((t) => t.status === 'rejected' || t.status === 'forming');
  const list = showAll ? [...pending, ...others] : pending;

  const decide = (teamId: string, decision: 'accepted' | 'rejected') => {
    try {
      setError(null);
      mockStorage.decideTeamApplication(teamId, decision);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the application.');
    }
  };

  return (
    <section className="border border-slate-200 bg-white p-5 shadow-2xs space-y-3" aria-labelledby="team-apps-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 id="team-apps-heading" className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {solo ? 'Participant' : 'Team'} Applications ({pending.length} pending)
          </h3>
          <p className="text-[11px] text-slate-500">
            Only accepted {solo ? 'participants' : 'teams'} can submit projects, check in and be judged.
          </p>
        </div>
        {others.length > 0 && (
          <button type="button" onClick={() => setShowAll(!showAll)} className="text-[11px] text-blue-600 hover:underline cursor-pointer">
            {showAll ? 'Show pending only' : `Also show ${others.length} forming / rejected`}
          </button>
        )}
      </div>

      {error && <p className="p-2 text-xs bg-red-50 border border-red-200 text-red-700" role="alert">{error}</p>}

      {list.length === 0 ? (
        <p className="p-4 text-xs text-slate-500 italic text-center bg-slate-50 border border-dashed border-slate-200">
          No applications waiting for review.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((t) => (
            <div key={t.id} className="p-3 border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{t.name}</span>
                  <span className={`text-[10px] font-mono uppercase px-1.5 border ${STATUS_STYLE[t.status ?? 'accepted']}`}>
                    {t.status === 'forming' ? 'not applied yet' : t.status}
                  </span>
                </div>
                {!solo && (
                  <div className="text-[11px] text-slate-600">
                    {(t.members ?? []).map((m) => m.full_name).join(', ')} · {t.members?.length ?? 0} member{t.members?.length === 1 ? '' : 's'}
                  </div>
                )}
                <div className="text-[11px] text-slate-500">
                  Track: {t.track ?? 'General'}
                  {t.applied_at && <> · Applied {formatDate(t.applied_at)}</>}
                </div>
              </div>
              {t.status === 'pending' && !isPast && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => decide(t.id, 'accepted')}
                    className="text-xs space-x-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                    <UserCheck className="w-3.5 h-3.5" /><span>Accept</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decide(t.id, 'rejected')}
                    className="text-xs space-x-1 text-red-700 border-red-300 hover:bg-red-50">
                    <UserX className="w-3.5 h-3.5" /><span>Reject</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
