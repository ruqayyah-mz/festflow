import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { SubmissionShowcase } from '@/components/SubmissionShowcase';
import { JudgeLink, Event, Team, Submission, MarkCriteria } from '@/types';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { getCriteria, emptyScores, scoreTotal, CRITERIA_TOTAL } from '@/lib/judging';
import { Wifi, WifiOff, CheckCircle2, AlertTriangle, Save } from 'lucide-react';

interface Draft {
  criteria: MarkCriteria;
  notes: string;
  savedAt: string | null; // local time of last successful save, null = never saved
  dirty: boolean;
}
type QueueItem = { submissionId: string; round: string; totalScore: number; notes: string; criteria: MarkCriteria };

const keyOf = (round: string, submissionId: string) => `${round}:${submissionId}`;
const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const AUTOSAVE_MS = 800;

export function JudgeMarkingPage() {
  const { token } = useParams<{ token: string }>();
  const [judgeLink, setJudgeLink] = useState<JudgeLink | undefined>(undefined);
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [activeRound, setActiveRound] = useState<string>('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const queueKey = `festflow_judge_offline_${token}`;

  // ---- load ----
  useEffect(() => {
    if (!token) return;
    const jl = mockStorage.getJudgeLinkByToken(token);
    if (!jl) return;
    const evt = mockStorage.getEventById(jl.event_id);
    setJudgeLink(jl);
    setEvent(evt);
    const allTeams = mockStorage.getTeams(jl.event_id);
    setTeams(allTeams);

    let subs = mockStorage.getSubmissions(jl.event_id).filter((s) => s.status === 'submitted');
    const table = jl.table_assignment?.trim();
    if (table && !/all/i.test(table)) {
      const ids = new Set(allTeams.filter((t) => t.table_number && table.includes(t.table_number)).map((t) => t.id));
      if (ids.size > 0) subs = subs.filter((s) => ids.has(s.team_id));
    }
    // Only filter on a real track of this event; anything else (e.g. "All Tracks", old free text) means all.
    const track = jl.track_assignment?.trim();
    if (track && evt?.tracks.includes(track)) {
      subs = subs.filter((s) => (s.track ?? allTeams.find((t) => t.id === s.team_id)?.track) === track);
    }
    setSubmissions(subs);

    const map: Record<string, Draft> = {};
    mockStorage.getMarks(jl.id).forEach((m) => {
      map[keyOf(m.round, m.submission_id)] = {
        criteria: m.criteria ?? emptyScores(getCriteria(evt)),
        notes: m.notes ?? '',
        savedAt: new Date(m.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dirty: false,
      };
    });
    setDrafts(map);
    setActiveRound(evt?.rounds.find((r) => r.active)?.id ?? evt?.rounds[0]?.id ?? '');
  }, [token]);

  // ---- saving ----
  const persist = (round: string, submissionId: string) => {
    const k = keyOf(round, submissionId);
    const d = draftsRef.current[k];
    if (!judgeLink || !d) return;
    clearTimeout(timers.current[k]);
    const item: QueueItem = { submissionId, round, totalScore: scoreTotal(d.criteria, getCriteria(event)), notes: d.notes, criteria: d.criteria };

    if (!navigator.onLine) {
      // Keep the latest version per (round, project) and retry when the connection returns.
      const queue: QueueItem[] = JSON.parse(localStorage.getItem(queueKey) || '[]').filter(
        (q: QueueItem) => !(q.submissionId === submissionId && q.round === round)
      );
      localStorage.setItem(queueKey, JSON.stringify([...queue, item]));
      return;
    }
    try {
      mockStorage.saveJudgeMark(judgeLink.id, submissionId, round, item.totalScore, item.notes, item.criteria);
      setError(null);
      setDrafts((prev) => ({ ...prev, [k]: { ...prev[k], dirty: false, savedAt: timeNow() } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save scores.');
    }
  };

  const update = (round: string, submissionId: string, patch: Partial<Pick<Draft, 'criteria' | 'notes'>>) => {
    const k = keyOf(round, submissionId);
    setDrafts((prev) => {
      const current = prev[k] ?? { criteria: emptyScores(getCriteria(event)), notes: '', savedAt: null, dirty: false };
      return { ...prev, [k]: { ...current, ...patch, dirty: true } };
    });
    clearTimeout(timers.current[k]);
    timers.current[k] = setTimeout(() => persist(round, submissionId), AUTOSAVE_MS);
  };

  // Flush the offline queue when the connection returns.
  useEffect(() => {
    const flush = () => {
      if (!judgeLink) return;
      const queue: QueueItem[] = JSON.parse(localStorage.getItem(queueKey) || '[]');
      try {
        queue.forEach((q) => mockStorage.saveJudgeMark(judgeLink.id, q.submissionId, q.round, q.totalScore, q.notes, q.criteria));
        localStorage.removeItem(queueKey);
        setDrafts((prev) => {
          const next = { ...prev };
          queue.forEach((q) => {
            const k = keyOf(q.round, q.submissionId);
            if (next[k]) next[k] = { ...next[k], dirty: false, savedAt: timeNow() };
          });
          return next;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not sync offline scores.');
      }
    };
    const on = () => {
      setIsOnline(true);
      flush();
    };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [judgeLink, queueKey]);

  // Never lose an edit that is still waiting on the autosave debounce: flush on tab close and on leaving the page.
  const persistRef = useRef(persist);
  persistRef.current = persist;
  useEffect(() => {
    const flushPending = () => {
      Object.entries(draftsRef.current).forEach(([k, d]) => {
        if (!d.dirty) return;
        const [roundId, ...rest] = k.split(':');
        persistRef.current(roundId, rest.join(':'));
      });
    };
    window.addEventListener('beforeunload', flushPending);
    return () => {
      window.removeEventListener('beforeunload', flushPending);
      flushPending();
    };
  }, []);

  if (judgeLink && event && mockStorage.isEventConcluded(event.id)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-slate-200 bg-white p-8 text-center space-y-3 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Judging Closed</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {event.name} has concluded, so scores can no longer be changed. Thank you for judging!
          </p>
        </div>
      </div>
    );
  }

  if (!judgeLink || !event) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-slate-200 bg-white p-8 text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Judge Link Invalid or Expired</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The token <code>{token}</code> was not recognized. Please request a fresh link from the event organizer.
          </p>
          <Link to="/">
            <Button variant="outline" size="sm">Return to Homepage</Button>
          </Link>
        </div>
      </div>
    );
  }

  const round = event.rounds.find((r) => r.id === activeRound) ?? event.rounds[0];
  const rubric = getCriteria(event);
  const unsaved = Object.values(drafts).filter((d) => d.dirty).length;
  const scoredIn = (roundId: string) => submissions.filter((s) => drafts[keyOf(roundId, s.id)]?.savedAt).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Connection + save status */}
      <div className="border border-blue-200 bg-blue-50/60 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs gap-2">
        {isOnline ? (
          <span className="flex items-center gap-1.5 text-blue-700 font-mono text-[11px] font-semibold">
            <Wifi className="w-3.5 h-3.5" /> Online
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-red-600 font-mono text-[11px] font-semibold">
            <WifiOff className="w-3.5 h-3.5" /> Offline — scores are kept on this device and sync when you reconnect
          </span>
        )}
        <span role="status" className={`font-mono text-[11px] font-semibold ${unsaved ? 'text-amber-700' : 'text-emerald-700'}`}>
          {unsaved ? `${unsaved} project${unsaved === 1 ? '' : 's'} with unsaved changes` : 'All changes saved'}
        </span>
      </div>

      {error && (
        <p className="p-3 text-xs bg-red-50 border border-red-200 text-red-700" role="alert">{error}</p>
      )}

      {/* Judge header */}
      <div className="border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">Judge Marking Terminal</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{judgeLink.judge_name}</h1>
            <p className="text-xs text-slate-500">Event: <strong className="text-slate-800">{event.name}</strong></p>
          </div>
          <div className="p-3.5 border border-blue-200 bg-blue-50/50 text-right">
            <div className="text-[10px] uppercase font-bold text-blue-800">Assigned Scope</div>
            <div className="text-sm font-bold text-blue-900 mt-0.5">{judgeLink.table_assignment || 'All Tables'}</div>
            <div className="text-[11px] text-slate-600 font-mono">Track: {judgeLink.track_assignment || 'All Tracks'}</div>
          </div>
        </div>
        <p className="text-xs text-slate-600 border-t border-slate-100 pt-3">
          <strong className="text-slate-800">Scoring:</strong> {rubric.map((c) => `${c.label} (${c.max})`).join(' · ')} — each project's total is out of {CRITERIA_TOTAL}.
          Score every round in its own tab. Scores autosave, and you can press <strong>Save</strong> any time.
        </p>
      </div>

      {/* Round tabs */}
      {event.rounds.length > 0 && (
        <div role="tablist" aria-label="Evaluation rounds" className="flex flex-wrap gap-1 border-b border-slate-200">
          {event.rounds.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={r.id === round?.id}
              onClick={() => setActiveRound(r.id)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px cursor-pointer transition-colors ${
                r.id === round?.id ? 'border-blue-600 text-blue-700 bg-blue-50/60' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.name} <span className="font-mono text-slate-400">({r.weight}%)</span>
              {r.active && <span className="ml-1.5 text-[10px] font-mono uppercase text-purple-600">● current</span>}
              <span className="ml-1.5 text-[10px] font-mono text-slate-500">{scoredIn(r.id)}/{submissions.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Projects for the selected round */}
      {submissions.length === 0 ? (
        <EmptyState message="No submitted projects in your assigned scope yet." />
      ) : !round ? (
        <EmptyState message="This event has no evaluation rounds set up yet." />
      ) : (
        <div role="tabpanel" aria-label={round.name} className="space-y-6">
          {submissions.map((sub, idx) => {
            const team = teams.find((t) => t.id === sub.team_id);
            const k = keyOf(round.id, sub.id);
            const d = drafts[k] ?? { criteria: emptyScores(rubric), notes: '', savedAt: null, dirty: false };
            const total = scoreTotal(d.criteria, rubric);
            return (
              <div key={k} className="border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
                <div className="space-y-1 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">#{idx + 1}</span>
                    <h3 className="text-lg font-bold text-slate-900">{sub.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {team?.name ?? 'Team'} • {team?.table_number || 'No table'} • Track: <strong className="text-slate-800">{sub.track ?? team?.track ?? 'General'}</strong>
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed max-w-2xl pt-1 whitespace-pre-line">{sub.description}</p>
                  <div className="pt-2 max-w-2xl"><SubmissionShowcase submission={sub} /></div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">{round.name} — criteria</span>
                    <span className="text-xs text-slate-500">
                      Total: <strong className="text-lg font-mono text-slate-900">{total}</strong>
                      <span className="font-mono text-slate-400">/{CRITERIA_TOTAL}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rubric.map((c) => {
                      const id = `c-${k}-${c.id}`;
                      const value = d.criteria[c.id] ?? 0;
                      const set = (v: number) =>
                        update(round.id, sub.id, { criteria: { ...d.criteria, [c.id]: Math.min(c.max, Math.max(0, Math.round(v) || 0)) } });
                      return (
                        <div key={c.id} className="flex items-center justify-between gap-2 border border-slate-200 bg-slate-50/50 px-3 py-2.5">
                          <label htmlFor={id} className="text-xs font-semibold text-slate-700">{c.label}</label>
                          <div className="flex items-center gap-2 shrink-0">
                            <input type="range" min={0} max={c.max} step={1} value={value} onChange={(e) => set(Number(e.target.value))}
                              aria-label={`${c.label} slider`} className="w-20 accent-blue-600 cursor-pointer" />
                            <input id={id} type="number" min={0} max={c.max} value={value} onChange={(e) => set(Number(e.target.value))}
                              className="w-12 px-1.5 py-1 text-center font-mono font-bold text-sm border border-blue-300 bg-blue-50/40 text-blue-800 focus:outline-none focus:border-blue-600" />
                            <span className="text-[11px] text-slate-400 font-mono w-7">/{c.max}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-full bg-slate-100 h-1.5">
                    <div className="h-1.5 bg-blue-500 transition-all" style={{ width: `${(total / CRITERIA_TOTAL) * 100}%` }} />
                  </div>
                </div>

                <Textarea
                  id={`notes-${k}`}
                  label="Feedback & notes"
                  placeholder="Code quality, novelty, presentation, follow-up questions…"
                  value={d.notes}
                  onChange={(e) => update(round.id, sub.id, { notes: e.target.value })}
                  rows={3}
                />

                <div className="flex items-center justify-end gap-3 pt-1">
                  <span className={`text-[11px] font-mono ${d.dirty ? 'text-amber-700' : d.savedAt ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {d.dirty ? 'Unsaved changes' : d.savedAt ? `✓ Saved ${d.savedAt}` : 'Not scored yet'}
                  </span>
                  <Button type="button" size="sm" onClick={() => persist(round.id, sub.id)} className="space-x-1.5">
                    {d.dirty || !d.savedAt ? <Save className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Save scores</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
