import { useState } from 'react';
import { Event } from '@/types';
import { computeStandings } from '@/lib/eventReport';
import { Trophy, Medal } from 'lucide-react';

// Organizer-only results view. Participants never see scores or rankings.
export function Leaderboard({ event }: { event: Event }) {
  const [track, setTrack] = useState('all');
  const all = computeStandings(event.id);
  const rows = track === 'all' ? all : all.filter((r) => (r.submission.track ?? '') === track);
  const tracks = [...new Set(all.map((r) => r.submission.track).filter(Boolean))] as string[];
  const pending = all.filter((r) => !r.complete).length;

  return (
    <section className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4" aria-labelledby="leaderboard-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 id="leaderboard-heading" className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard
          </h3>
          <p className="text-xs text-slate-500">
            Each round shows the judges' average (as %). Final = Σ round average × round weight, out of 100. Organizers only.
          </p>
        </div>
        {tracks.length > 1 && (
          <label className="text-xs text-slate-600 flex items-center gap-2">
            Track
            <select value={track} onChange={(e) => setTrack(e.target.value)} className="text-xs border border-slate-300 bg-white px-2 py-1">
              <option value="all">All tracks</option>
              {tracks.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {pending > 0 && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2">
          {pending} project{pending === 1 ? ' is' : 's are'} still missing scores in at least one round — rankings are provisional.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="p-6 text-center text-xs text-slate-500 italic">No submitted projects yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] font-mono uppercase text-slate-500 border-b border-slate-200 bg-slate-50">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Project</th>
                {event.rounds.map((r) => (
                  <th key={r.id} className="py-2.5 px-3 text-right whitespace-nowrap">
                    {r.name.replace(/^Round \d+:\s*/i, '')} <span className="text-slate-400">({r.weight}%)</span>
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">Final /100</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.submission.id} className={r.rank <= 3 && r.judged ? 'bg-amber-50/40' : ''}>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {r.rank <= 3 && r.judged && (
                      <Medal className={`w-3.5 h-3.5 inline mr-1 ${r.rank === 1 ? 'text-amber-500' : r.rank === 2 ? 'text-slate-400' : 'text-orange-700'}`} />
                    )}
                    #{r.rank}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{r.submission.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.submission.team_name ?? 'Team'} · {r.submission.track ?? 'General'}
                    </div>
                  </td>
                  {r.perRound.map((avg, i) => (
                    <td key={i} className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                      {avg === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <>
                          {avg.toFixed(1)}%
                          <span className="text-[10px] text-slate-400 ml-1">({r.judgeCounts[i]} judge{r.judgeCounts[i] === 1 ? '' : 's'})</span>
                        </>
                      )}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700 whitespace-nowrap">
                    {r.judged ? r.final.toFixed(1) : <span className="text-slate-400 font-normal">Not judged</span>}
                    {r.judged && !r.complete && <span className="block text-[10px] font-normal text-amber-700">partial</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
