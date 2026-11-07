import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Event, JudgeLink } from '@/types';
import { EventHeaderBanner } from './EventHeaderBanner';
import { Leaderboard } from '@/components/judging/Leaderboard';
import { CriteriaEditor } from '@/components/judging/CriteriaEditor';
import { getEventCategory } from '../OrganizerOverviewPage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Award,
  Plus,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  X,
} from 'lucide-react';

export function EventJudgingPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<Event | undefined>(() =>
    eventId ? mockStorage.getEventById(eventId) : undefined
  );
  const [judgeLinks, setJudgeLinks] = useState<JudgeLink[]>([]);

  // Judge Link Generator State
  const [isAddingJudge, setIsAddingJudge] = useState(false);
  const [judgeName, setJudgeName] = useState('');
  const [tableAssignment, setTableAssignment] = useState('Table 14 - 16');
  const [trackAssignment, setTrackAssignment] = useState('All Tracks');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = () => {
    if (!eventId) return;
    setEvent(mockStorage.getEventById(eventId));
    setJudgeLinks(mockStorage.getJudgeLinks(eventId));
  };

  useEffect(() => {
    refreshData();
    const unsub = mockStorage.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, [eventId]);

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <Link to="/organizer" className="text-xs text-blue-600 font-semibold">
          ← Return to All Events
        </Link>
      </div>
    );
  }

  const handleGenerateJudgeLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeName.trim() || !eventId) return;

    const newLink = mockStorage.createJudgeLink({
      event_id: eventId,
      judge_name: judgeName.trim(),
      table_assignment: tableAssignment.trim(),
      track_assignment: trackAssignment.trim(),
    });

    setJudgeName('');
    setIsAddingJudge(false);
    showNotification(`Judge portal credential minted for ${newLink.judge_name}.`);
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <EventHeaderBanner event={event} subtitle="Judging" />

      {notification && (
        <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-2xs">
          <span className="font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{notification}</span>
          </span>
          <button
            onClick={() => setNotification(null)}
            className="font-mono text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
          >
            ×
          </button>
        </div>
      )}

      {/* Organizer-defined rubric (points total 100) */}
      <CriteriaEditor event={event} />

      {/* Guest Judge Links Generator */}
      <div className="border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>GUEST JUDGE LINKS (NO ACCOUNT NEEDED)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Generate frictionless shareable URLs with automated table and track rubrics.
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            disabled={getEventCategory(event) === 'past'}
            onClick={() => setIsAddingJudge(true)}
            className="space-x-1.5 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Mint Judge Link</span>
          </Button>
        </div>

        {/* Inline Create Form */}
        {isAddingJudge && (
          <div className="border border-purple-200 bg-purple-50/40 p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Generate Guest Judge Credential
              </h4>
              <button
                onClick={() => setIsAddingJudge(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateJudgeLink} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                    Judge Name *
                  </label>
                  <Input
                    placeholder="e.g. Dr. Aris Thorne"
                    value={judgeName}
                    onChange={(e) => setJudgeName(e.target.value)}
                    required
                    className="text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                    Table Range Scope
                  </label>
                  <Input
                    placeholder="e.g. Table 14 - 16"
                    value={tableAssignment}
                    onChange={(e) => setTableAssignment(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="judge-track" className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                    Track Scope
                  </label>
                  {/* A select (not free text) so the judge's filter always matches a real track. */}
                  <select
                    id="judge-track"
                    value={trackAssignment}
                    onChange={(e) => setTrackAssignment(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 px-3 py-2"
                  >
                    <option value="All Tracks">All Tracks</option>
                    {event.tracks.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingJudge(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  Generate Guest Portal URL
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Judge Links Roster */}
        <div className="space-y-2.5">
          {judgeLinks.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 italic text-center bg-slate-50 border border-dashed border-slate-200">
              No guest judge links generated yet. Click "+ Mint Judge Link" above.
            </div>
          ) : (
            judgeLinks.map((link) => {
              const fullUrl = `${window.location.origin}/judge/${link.token}`;
              return (
                <div
                  key={link.id}
                  className="p-3.5 border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{link.judge_name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                        Token: {link.token}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Tables: {link.table_assignment || 'All Tables'}</span>
                      <span>•</span>
                      <span>Tracks: {link.track_assignment || 'All Tracks'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(fullUrl, link.id)}
                      className="text-xs space-x-1"
                    >
                      {copiedId === link.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>

                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium"
                    >
                      <span>Open Judge View</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Weighted leaderboard (organizer-only) */}
      <Leaderboard event={event} />
    </div>
  );
}
