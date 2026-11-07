import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { JudgeLink, Submission, Team, Mark } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { Copy, Check, ExternalLink, Plus } from 'lucide-react';

export function OrganizerJudgingPage() {
  const events = mockStorage.getEvents();
  const activeEvent = events[0];

  const [judgeLinks, setJudgeLinks] = useState<JudgeLink[]>(() =>
    activeEvent ? mockStorage.getJudgeLinks(activeEvent.id) : []
  );
  const [submissions, setSubmissions] = useState<Submission[]>(() =>
    activeEvent ? mockStorage.getSubmissions(activeEvent.id) : []
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    activeEvent ? mockStorage.getTeams(activeEvent.id) : []
  );
  const [marks, setMarks] = useState<Mark[]>(() => mockStorage.getMarks());

  // Judge Link Generator state
  const [isAddingJudge, setIsAddingJudge] = useState(false);
  const [judgeName, setJudgeName] = useState('');
  const [tableAssignment, setTableAssignment] = useState('Table 14 - 16');
  const [trackAssignment, setTrackAssignment] = useState('All Tracks');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [recentlyGeneratedLink, setRecentlyGeneratedLink] = useState<string | null>(null);

  const refresh = () => {
    if (!activeEvent) return;
    setJudgeLinks(mockStorage.getJudgeLinks(activeEvent.id));
    setSubmissions(mockStorage.getSubmissions(activeEvent.id));
    setTeams(mockStorage.getTeams(activeEvent.id));
    setMarks(mockStorage.getMarks());
  };

  useEffect(() => {
    refresh();
    const unsub = mockStorage.subscribe(() => {
      refresh();
    });
    return () => unsub();
  }, [activeEvent?.id]);

  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeName.trim() || !activeEvent) return;

    const newLink = mockStorage.createJudgeLink({
      event_id: activeEvent.id,
      judge_name: judgeName.trim(),
      table_assignment: tableAssignment,
      track_assignment: trackAssignment,
    });

    const fullUrl = `${window.location.origin}/judge/${newLink.token}`;
    setRecentlyGeneratedLink(fullUrl);
    setJudgeName('');
    setIsAddingJudge(false);
  };

  const handleCopy = (token: string) => {
    const fullUrl = `${window.location.origin}/judge/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  if (!activeEvent) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Judging Operations</h1>
          <p className="text-xs text-slate-500 mt-1">Manage guest judge links and scoring.</p>
        </div>
        <EmptyState
          message="No active events found. Create an event to generate judge credentials."
          actionLabel="Create Event"
          onAction={() => {
            window.location.href = '/organizer/events/new';
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Judging & Marks Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate guest judge links and review scores for <strong className="text-slate-800">{activeEvent.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link
            to={`/organizer/events/${activeEvent.id}?tab=people&subtab=judging`}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xs"
          >
            <span>Open in Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Button
            size="sm"
            onClick={() => setIsAddingJudge(!isAddingJudge)}
            className="space-x-1.5 font-medium shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingJudge ? 'Close Form' : 'Generate Judge Link'}</span>
          </Button>
        </div>
      </div>

      {recentlyGeneratedLink && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Judge Access Link Generated:</span>
            <button
              onClick={() => setRecentlyGeneratedLink(null)}
              className="text-xs text-emerald-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={recentlyGeneratedLink}
              className="w-full text-xs font-mono bg-white border border-emerald-300 p-2 text-slate-800"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(recentlyGeneratedLink);
                alert('Copied to clipboard!');
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      )}

      {/* Generator Form if toggled */}
      {isAddingJudge && (
        <form onSubmit={handleGenerateLink} className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Issue Guest Judge Access Link
          </h2>
          <p className="text-xs text-slate-500">
            Judges do not require accounts. A secure single-purpose mobile link will be provisioned.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Judge Name & Affiliation"
              placeholder="e.g. Dr. Alex Mercer (Anthropic)"
              value={judgeName}
              onChange={(e) => setJudgeName(e.target.value)}
              required
            />

            <Input
              label="Assigned Table(s)"
              placeholder="e.g. Table 14 - 16 or All"
              value={tableAssignment}
              onChange={(e) => setTableAssignment(e.target.value)}
            />

            <Select
              label="Track Scope"
              value={trackAssignment}
              onChange={(e) => setTrackAssignment(e.target.value)}
            >
              <option value="All Tracks">All Tracks</option>
              {activeEvent.tracks.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingJudge(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create & Copy Token
            </Button>
          </div>
        </form>
      )}

      {/* Table / Track Assignments List */}
      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Active Judge Credentials ({judgeLinks.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Zero-login guest tokens
          </span>
        </div>

        {judgeLinks.length === 0 ? (
          <EmptyState
            message="No judge links created yet for this event."
            actionLabel="Generate Judge Link"
            onAction={() => setIsAddingJudge(true)}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {judgeLinks.map((jl) => {
              const judgeMarksCount = marks.filter((m) => m.judge_link_id === jl.id).length;

              return (
                <div key={jl.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-bold text-slate-900">{jl.judge_name}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                        {jl.table_assignment || 'All Tables'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200">
                        {jl.track_assignment || 'All Tracks'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Token: <span className="text-slate-700">{jl.token}</span> • {judgeMarksCount} reviews submitted
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleCopy(jl.token)}
                      className="px-2.5 py-1 border border-slate-200 hover:border-slate-300 bg-white text-xs text-slate-700 font-medium inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      {copiedToken === jl.token ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <Link
                      to={`/judge/${jl.token}`}
                      target="_blank"
                      className="px-2.5 py-1 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs text-blue-700 font-medium inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Marks Overview */}
      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Live Marks Overview ({marks.length} marks recorded)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Across {submissions.length} project submissions
          </span>
        </div>

        {submissions.length === 0 ? (
          <EmptyState
            message="No team submissions registered yet to review."
            actionLabel="View Teams"
            onAction={() => {
              window.location.href = '/organizer/people';
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                <tr>
                  <th className="p-3">Team & Project</th>
                  <th className="p-3">Table</th>
                  <th className="p-3">Track</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {submissions.map((sub) => {
                  const subMarks = marks.filter((m) => m.submission_id === sub.id);
                  const avgScore =
                    subMarks.length > 0
                      ? Math.round(
                          subMarks.reduce((acc, curr) => acc + curr.score, 0) / subMarks.length
                        )
                      : null;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{sub.team_name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{sub.title}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-700">{sub.table_number || 'TBD'}</td>
                      <td className="p-3 text-slate-600">{sub.track || 'General'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono uppercase ${
                            sub.status === 'submitted'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {avgScore !== null ? `${avgScore} pts (${subMarks.length} revs)` : 'Unscored'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

