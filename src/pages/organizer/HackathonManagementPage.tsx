import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Event, JudgeLink, Team, Submission, Mark } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Copy, Check, ExternalLink, Plus, Trophy, Award, Radio } from 'lucide-react';

export function HackathonManagementPage() {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const events = mockStorage.getEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    eventIdParam || (events.length > 0 ? events[0].id : '')
  );

  const [activeTab, setActiveTab] = useState<'judges' | 'submissions' | 'rounds_tables'>('judges');

  const event = mockStorage.getEventById(selectedEventId);
  const [judgeLinks, setJudgeLinks] = useState<JudgeLink[]>(() =>
    selectedEventId ? mockStorage.getJudgeLinks(selectedEventId) : []
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    selectedEventId ? mockStorage.getTeams(selectedEventId) : []
  );
  const [submissions, setSubmissions] = useState<Submission[]>(() =>
    selectedEventId ? mockStorage.getSubmissions(selectedEventId) : []
  );
  const [marks, setMarks] = useState<Mark[]>(() => mockStorage.getMarks());

  // Judge Link Generator form state
  const [isAddingJudge, setIsAddingJudge] = useState(false);
  const [judgeName, setJudgeName] = useState('');
  const [tableAssignment, setTableAssignment] = useState('Table 14 - 16');
  const [trackAssignment, setTrackAssignment] = useState('All Tracks');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const refreshData = () => {
    if (!selectedEventId) return;
    setJudgeLinks(mockStorage.getJudgeLinks(selectedEventId));
    setTeams(mockStorage.getTeams(selectedEventId));
    setSubmissions(mockStorage.getSubmissions(selectedEventId));
    setMarks(mockStorage.getMarks());
  };

  useEffect(() => {
    refreshData();
    const unsub = mockStorage.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, [selectedEventId]);

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-neutral-500">No active event selected.</p>
        <Link to="/organizer">
          <Button variant="outline" size="sm">Back to Console</Button>
        </Link>
      </div>
    );
  }

  const handleCreateJudgeLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeName.trim() || !selectedEventId) return;

    mockStorage.createJudgeLink({
      event_id: selectedEventId,
      judge_name: judgeName.trim(),
      table_assignment: tableAssignment.trim() || 'All Tables',
      track_assignment: trackAssignment.trim() || 'All Tracks',
    });

    setJudgeName('');
    setIsAddingJudge(false);
  };

  const handleCopyJudgeUrl = (token: string) => {
    const url = `${window.location.origin}/judge/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleToggleActiveRound = (roundId: string) => {
    const updatedRounds = event.rounds.map((r) => ({
      ...r,
      active: r.id === roundId ? !r.active : false,
    }));
    mockStorage.updateEvent(event.id, { rounds: updatedRounds });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Link to="/organizer" className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Organizer Console</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Hackathon Management Layer
              </h1>
              <span className="text-xs px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-mono font-medium rounded-sm">
                Ops
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Rounds, table tracks, live submissions, and token-based judge link generation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center border border-slate-200 bg-white shadow-xs px-3 py-1.5 text-xs rounded-sm">
              <span className="text-neutral-500 mr-2">Event:</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-transparent font-medium text-neutral-900 focus:outline-none cursor-pointer"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs gap-2">
        <button
          onClick={() => setActiveTab('judges')}
          className={`py-3 px-4 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'judges'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Judge Marking Links ({judgeLinks.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`py-3 px-4 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'submissions'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Submissions & Scores ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('rounds_tables')}
          className={`py-3 px-4 font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'rounds_tables'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Rounds & Table Allocation
        </button>
      </div>

      {/* TAB 1: JUDGE MARKING LINKS */}
      {activeTab === 'judges' && (
        <div className="space-y-6">
          <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  Shareable Judge Marking Links
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Judges access via unique token (NO account creation required). Marks autosave on every keystroke.
                </p>
              </div>
              <Button size="sm" onClick={() => setIsAddingJudge(!isAddingJudge)} className="space-x-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingJudge ? 'Close Form' : 'Generate Judge Link'}</span>
              </Button>
            </div>

            {isAddingJudge && (
              <form onSubmit={handleCreateJudgeLink} className="p-4 bg-blue-50/40 border border-blue-200 space-y-4 rounded-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Judge Name / Affiliation"
                    placeholder="e.g. Dr. Marcus Vance (Staff Architect)"
                    value={judgeName}
                    onChange={(e) => setJudgeName(e.target.value)}
                    required
                  />
                  <Input
                    label="Table Assignment"
                    placeholder="e.g. Table 14 - 16 or All Tables"
                    value={tableAssignment}
                    onChange={(e) => setTableAssignment(e.target.value)}
                  />
                  <Select
                    label="Track Assignment"
                    value={trackAssignment}
                    onChange={(e) => setTrackAssignment(e.target.value)}
                  >
                    <option value="All Tracks">All Tracks</option>
                    {event.tracks.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingJudge(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Mint Link Token
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {judgeLinks.length === 0 ? (
                <EmptyState
                  message="No judge links created yet for this event."
                  actionLabel="Generate First Judge Link"
                  onAction={() => setIsAddingJudge(true)}
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {judgeLinks.map((jl) => {
                    const judgeMarks = marks.filter((m) => m.judge_link_id === jl.id);
                    return (
                      <div
                        key={jl.id}
                        className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-neutral-900">
                              {jl.judge_name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-xs">
                              {jl.table_assignment || 'All Tables'}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-700 rounded-xs">
                              {jl.track_assignment || 'All Tracks'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 font-mono">
                            Token: <span className="text-blue-700 font-medium">{jl.token}</span> • {judgeMarks.length} project(s) evaluated
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyJudgeUrl(jl.token)}
                            className="space-x-1"
                          >
                            {copiedToken === jl.token ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-blue-600 font-medium">Copied Link!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </Button>
                          <Link to={`/judge/${jl.token}`}>
                            <Button size="sm" variant="secondary" className="space-x-1">
                              <span>Open Judge View</span>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBMISSIONS & SCORES */}
      {activeTab === 'submissions' && (
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                Live Submissions Overview
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Review submitted projects, repository links, demo URLs, and judge ratings.
              </p>
            </div>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-100 rounded-xs">
              {submissions.filter((s) => s.status === 'submitted').length} of {teams.length} teams submitted
            </span>
          </div>

          {submissions.length === 0 ? (
            <EmptyState
              message="No submissions received yet for this event."
              actionLabel="View Participant Portal"
              onAction={() => {
                window.location.href = '/participant';
              }}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {submissions.map((sub) => {
                const team = teams.find((t) => t.id === sub.team_id);
                const subMarks = marks.filter((m) => m.submission_id === sub.id);
                const avgScore =
                  subMarks.length > 0
                    ? Math.round(
                        subMarks.reduce((sum, m) => sum + Number(m.score), 0) / subMarks.length
                      )
                    : null;

                return (
                  <div key={sub.id} className="py-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border rounded-xs ${
                            sub.status === 'submitted'
                              ? 'border-blue-200 text-blue-700 bg-blue-50'
                              : 'border-slate-200 text-slate-600 bg-slate-50'
                          }`}>
                            {sub.status.replace('_', ' ')}
                          </span>
                          <h4 className="text-base font-semibold text-neutral-900">
                            {sub.title}
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-500">
                          Team: <strong className="text-neutral-800">{team?.name || 'Unknown Team'}</strong> • {team?.table_number || 'No table'} • Track: <strong className="text-blue-700">{team?.track || 'General'}</strong>
                        </p>
                        <p className="text-xs text-neutral-700 leading-relaxed max-w-3xl pt-1">
                          {sub.description}
                        </p>
                      </div>

                      {/* Score pill */}
                      <div className="p-3 border border-blue-100 bg-blue-50/60 text-right shrink-0 rounded-xs">
                        <div className="text-[11px] text-blue-700 uppercase font-semibold">Judge Score</div>
                        <div className="text-xl font-bold text-blue-900">
                          {avgScore !== null ? `${avgScore}/100` : 'Pending'}
                        </div>
                        <div className="text-[10px] text-blue-600 font-mono">
                          {subMarks.length} review(s)
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                      {sub.repo_url && (
                        <a
                          href={sub.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1 font-medium"
                        >
                          <span>Repository</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {sub.demo_url && (
                        <a
                          href={sub.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1 font-medium"
                        >
                          <span>Live Demo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <span className="text-slate-400 font-mono text-[11px]">
                        Submitted: {formatDate(sub.submitted_at)}
                      </span>
                    </div>

                    {/* Judge Notes breakdown */}
                    {subMarks.length > 0 && (
                      <div className="mt-2 p-3 bg-blue-50/30 border border-blue-100 text-xs space-y-1 rounded-xs">
                        <span className="text-[10px] uppercase font-semibold text-blue-800">Judge Notes:</span>
                        {subMarks.map((m) => (
                          <div key={m.id} className="text-slate-700">
                            • "{m.notes || 'No written critique provided'}" <span className="font-mono text-blue-600 font-medium">({m.score} pts)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROUNDS & TABLES */}
      {activeTab === 'rounds_tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rounds */}
          <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
            <h3 className="text-base font-semibold text-neutral-900">
              Rounds State Management
            </h3>
            <p className="text-xs text-neutral-500">
              Click to toggle the active evaluation round. Active rounds appear in the Judge portal.
            </p>

            <div className="space-y-3">
              {event.rounds.map((round) => (
                <div
                  key={round.id}
                  className={`p-4 border transition-colors flex items-center justify-between rounded-xs ${
                    round.active
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-neutral-900">
                        {round.name}
                      </span>
                      {round.active && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 border border-blue-300 text-blue-700 bg-blue-100/60 rounded-xs">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 font-mono">Weight: {round.weight}% of final grade</p>
                  </div>

                  <Button
                    size="sm"
                    variant={round.active ? 'secondary' : 'outline'}
                    onClick={() => handleToggleActiveRound(round.id)}
                  >
                    {round.active ? 'Deactivate' : 'Set Active'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Table / Track Assignments */}
          <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
            <h3 className="text-base font-semibold text-neutral-900">
              Table & Track Assignments
            </h3>
            <p className="text-xs text-neutral-500">
              Physical or virtual table numbers assigned to registered teams.
            </p>

            <div className="divide-y divide-slate-100">
              {teams.map((team) => (
                <div key={team.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-neutral-900">
                      {team.name}
                    </span>
                    <p className="text-neutral-500 font-mono text-[11px]">
                      Code: <span className="text-blue-700">{team.join_code}</span> • Track: {team.track || 'General'}
                    </p>
                  </div>
                  <span className="font-mono font-medium px-2 py-1 border border-blue-100 bg-blue-50 text-blue-700 rounded-xs">
                    {team.table_number || 'Unassigned'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
