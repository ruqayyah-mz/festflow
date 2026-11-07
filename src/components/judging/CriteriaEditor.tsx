import { useState } from 'react';
import { Event, JudgingCriterion } from '@/types';
import { mockStorage } from '@/lib/mockStorage';
import { getCriteria, maxScore, validateCriteria, DEFAULT_CRITERIA, CRITERIA_TOTAL } from '@/lib/judging';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, ListChecks } from 'lucide-react';

// Organizer-defined judging rubric. Points across criteria must total exactly 100.
export function CriteriaEditor({ event }: { event: Event }) {
  const saved = getCriteria(event);
  const [rows, setRows] = useState<JudgingCriterion[]>(saved);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const isPast = mockStorage.isEventConcluded(event.id);

  const linkIds = new Set(mockStorage.getJudgeLinks(event.id).map((j) => j.id));
  const marksRecorded = mockStorage.getMarks().filter((m) => linkIds.has(m.judge_link_id)).length;
  const total = maxScore(rows);
  const problem = validateCriteria(rows);
  const changed = JSON.stringify(rows) !== JSON.stringify(saved);

  const update = (id: string, patch: Partial<JudgingCriterion>) => {
    setRows((r) => r.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setMessage(null);
  };

  const save = () => {
    if (problem) return setMessage({ ok: false, text: problem });
    try {
      mockStorage.updateEvent(event.id, { criteria: rows.map((c) => ({ ...c, label: c.label.trim() })) });
      setMessage({ ok: true, text: 'Judging criteria saved. Judges will see them the next time they open their link.' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Could not save criteria.' });
    }
  };

  return (
    <section className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4" aria-labelledby="criteria-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 id="criteria-heading" className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-blue-600" /> Judging Criteria
          </h3>
          <p className="text-xs text-slate-500">
            What judges score and how many points each is worth. Points must add up to exactly {CRITERIA_TOTAL}. Used for every round.
          </p>
        </div>
      </div>

      {marksRecorded > 0 && !isPast && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2">
          Judges have already recorded {marksRecorded} score{marksRecorded === 1 ? '' : 's'}. Those stay valid (each counts as a % of what it was scored
          out of), but judges re-scoring a project will use the new criteria.
        </p>
      )}

      <div className="space-y-2">
        {rows.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2">
            <span className="w-6 text-xs font-mono text-slate-400 text-right">{i + 1}.</span>
            <input
              type="text"
              value={c.label}
              disabled={isPast}
              onChange={(e) => update(c.id, { label: e.target.value })}
              aria-label={`Criterion ${i + 1} name`}
              placeholder="e.g. Innovation"
              className="flex-1 min-w-0 text-sm px-3 py-1.5 border border-slate-300 bg-white focus:outline-none focus:border-blue-600 disabled:bg-slate-50"
            />
            <input
              type="number"
              min={1}
              max={100}
              value={c.max || ''}
              disabled={isPast}
              onChange={(e) => update(c.id, { max: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0 })}
              aria-label={`Points for ${c.label || `criterion ${i + 1}`}`}
              className="w-20 text-sm text-center font-mono px-2 py-1.5 border border-slate-300 bg-white focus:outline-none focus:border-blue-600 disabled:bg-slate-50"
            />
            <span className="text-xs text-slate-500 w-8">pts</span>
            {!isPast && rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows((r) => r.filter((x) => x.id !== c.id))}
                aria-label={`Remove ${c.label || `criterion ${i + 1}`}`}
                className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div
        role="status"
        className={`flex items-center justify-between text-xs px-3 py-2 border ${
          problem ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}
      >
        <span className="font-medium">{problem ?? `Points add up to ${CRITERIA_TOTAL} ✓`}</span>
        <span className="font-mono font-bold">Total: {total}/{CRITERIA_TOTAL}</span>
      </div>

      {message && (
        <p role={message.ok ? 'status' : 'alert'}
          className={`text-xs p-2 border ${message.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </p>
      )}

      {!isPast && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="space-x-1"
              onClick={() => setRows((r) => [...r, { id: `c-${Date.now().toString(36)}`, label: '', max: 0 }])}>
              <Plus className="w-3.5 h-3.5" /><span>Add criterion</span>
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setRows(DEFAULT_CRITERIA)}>
              Reset to default
            </Button>
          </div>
          <Button type="button" size="sm" onClick={save} disabled={!changed}>
            Save criteria
          </Button>
        </div>
      )}
    </section>
  );
}
