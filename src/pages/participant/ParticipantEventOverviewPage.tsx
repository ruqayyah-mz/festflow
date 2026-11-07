import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { Event, Team } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { EventFormatBadges } from '@/components/event/EventFormatBadges';
import { formatDate } from '@/lib/utils';
import { getParticipation, getLocationMode, getRegistrationStatus } from '@/lib/eventRules';
import { getEventCategory } from '@/pages/organizer/OrganizerOverviewPage';
import { Calendar, MapPin, Globe, Layers, Award, Copy, Check, Users, User, Plus, CheckCircle2, Clock, ArrowRight, LogOut, UserMinus } from 'lucide-react';

export function ParticipantEventOverviewPage() {
  const { eventId = '' } = useParams<{ eventId: string }>();
  const [, setTick] = useState(0);
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);
  const event = mockStorage.getEventById(eventId);
  if (!event) return null; // ParticipantEventLayout guards this

  return (
    <div className="space-y-6">
      <EventDetails event={event} />
      {getParticipation(event).type === 'solo' ? <SoloSection event={event} /> : <TeamSection event={event} />}
      <UnregisterSection event={event} />
    </div>
  );
}

function EventDetails({ event }: { event: Event }) {
  const status = getEventCategory(event);
  const online = getLocationMode(event) === 'online';
  const venueIsUrl = /^https?:\/\//i.test(event.venue);
  return (
    <section className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4" aria-labelledby="event-details-heading">
      <div className="flex flex-wrap items-center gap-2">
        {status === 'ongoing' && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Now
          </span>
        )}
        {status === 'upcoming' && (
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">Upcoming</span>
        )}
        {status === 'past' && (
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-slate-300 bg-slate-100 text-slate-700">Concluded</span>
        )}
        <EventFormatBadges event={event} />
      </div>
      <div>
        <h1 id="event-details-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{event.name}</h1>
        <p className="text-sm text-slate-600 leading-relaxed mt-1">{event.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 flex gap-2">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <div className="text-slate-500">When</div>
            <div className="font-semibold text-slate-900">{formatDate(event.starts_at)} → {formatDate(event.ends_at)}</div>
            <div className="text-[11px] text-slate-500">Submissions close when the event ends.</div>
          </div>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 flex gap-2">
          {online ? <Globe className="w-4 h-4 text-blue-600 shrink-0" /> : <MapPin className="w-4 h-4 text-blue-600 shrink-0" />}
          <div className="min-w-0">
            <div className="text-slate-500">{online ? 'Online at' : 'Where'}</div>
            {venueIsUrl ? (
              <a href={event.venue} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline break-all">
                {event.venue}
              </a>
            ) : (
              <div className="font-semibold text-slate-900">{event.venue}</div>
            )}
          </div>
        </div>
      </div>

      {event.tracks?.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" /> Tracks
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {event.tracks.map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700">{t}</span>
            ))}
          </div>
        </div>
      )}

      {event.rounds?.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-purple-600" /> Judging Rounds
          </h2>
          <div className="divide-y divide-slate-100 border border-slate-200">
            {event.rounds.map((r) => (
              <div key={r.id} className="px-3 py-2 flex items-center justify-between text-xs">
                <span className={r.active ? 'font-semibold text-purple-800' : 'text-slate-700'}>
                  {r.name}
                  {r.active && <span className="ml-2 text-[10px] font-mono uppercase text-purple-600">● Current</span>}
                </span>
                <span className="font-mono text-slate-500">{r.weight}% of score</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function useMyTeam(event: Event): Team | undefined {
  const { user } = useAuth();
  return mockStorage.getTeams(event.id).find((t) => t.members?.some((m) => m.id === user?.id));
}

function ErrorNote({ error }: { error: string }) {
  return error ? <p className="p-3 text-xs bg-red-50 border border-red-200 text-red-800" role="alert">{error}</p> : null;
}

function useRun() {
  const [error, setError] = useState('');
  const run = (fn: () => void) => {
    setError('');
    try {
      fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };
  return { error, setError, run };
}

// Check-in only makes sense at a physical venue.
function CheckInBadge({ event, team, label }: { event: Event; team: Team; label: string }) {
  if (getLocationMode(event) === 'online') {
    return <p className="text-[11px] text-slate-500 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Online event — no physical check-in needed.</p>;
  }
  return (
    <div className="p-4 border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-4">
      {/* Encodes the team id, which the organizer's Participants scanner matches. */}
      <div className="bg-white p-2 border border-slate-200">
        <QRCodeSVG value={team.id} size={112} level="M" aria-label={`${label} check-in QR code`} />
      </div>
      <div className="space-y-1.5 text-center sm:text-left">
        <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">{label} Check-In Badge</span>
        <p className="text-xs text-slate-600">Show this to an organizer when you arrive.</p>
        {mockStorage.isAttendanceMarked(event.id, team.id) ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> CHECKED IN
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" /> NOT CHECKED IN YET
          </span>
        )}
      </div>
    </div>
  );
}

// Where the application stands, plus the one action available to this person (if any).
function ApplicationStatus({ event, team, isLead, onApply }: { event: Event; team: Team; isLead: boolean; onApply: () => void }) {
  const status = team.status ?? 'accepted';
  const rules = getParticipation(event);
  const solo = rules.type === 'solo';
  const short = rules.min - (team.members?.length ?? 0);
  const reg = getRegistrationStatus(event, 'participants');

  const styles: Record<string, string> = {
    forming: 'border-slate-300 bg-slate-50 text-slate-800',
    pending: 'border-amber-300 bg-amber-50 text-amber-900',
    accepted: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    rejected: 'border-red-300 bg-red-50 text-red-900',
  };
  const text: Record<string, string> = {
    forming: isLead
      ? short > 0
        ? `Not applied yet — add ${short} more member${short === 1 ? '' : 's'} (minimum ${rules.min}) before applying.`
        : 'Not applied yet — submit your application when the team is ready.'
      : 'Not applied yet — your team lead submits the application.',
    pending: 'Application submitted — waiting for the organizer to review it.',
    accepted: `Accepted! ${solo ? 'You' : 'Your team'} can submit a project.`,
    rejected: solo
      ? 'Your application was not accepted for this event.'
      : 'This team was not accepted. You can leave it to join or create another team while registration is open.',
  };

  return (
    <div className={`p-3 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${styles[status]}`} role="status">
      <span>
        <strong className="uppercase font-mono text-[10px] mr-2">{status === 'forming' ? 'Not applied' : status}</strong>
        {text[status]}
      </span>
      {status === 'forming' && isLead && (
        <Button type="button" size="sm" onClick={onApply} disabled={short > 0 || !reg.open} className="shrink-0"
          title={!reg.open ? reg.reason : short > 0 ? `Needs ${rules.min} members` : undefined}>
          Submit Application
        </Button>
      )}
      {status === 'forming' && isLead && !reg.open && <span className="text-[11px]">{reg.reason}</span>}
    </div>
  );
}

function SoloSection({ event }: { event: Event }) {
  const myEntry = useMyTeam(event);
  const isPast = getEventCategory(event) === 'past';
  const { error, run } = useRun();
  if (!myEntry) return null;

  return (
    <section className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4" aria-labelledby="solo-heading">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h2 id="solo-heading" className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> My Entry
        </h2>
        <Link to={`/participant/events/${event.id}/submission`}>
          <Button size="sm" variant="outline" className="space-x-1.5 text-xs">
            <span>{myEntry.submission?.status === 'submitted' ? 'View Submission' : 'Go to Submission'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
      <p className="text-xs text-slate-600">This is a solo event — you compete and submit individually.</p>
      <ApplicationStatus event={event} team={myEntry} isLead onApply={() => undefined} />
      <ErrorNote error={error} />
      {event.tracks?.length > 1 && (
        <div className="max-w-xs">
          <Select
            id="solo-track"
            label="Your track"
            value={myEntry.track ?? event.tracks[0]}
            disabled={isPast}
            onChange={(e) => run(() => mockStorage.updateTeam(myEntry.id, { track: e.target.value }))}
            options={event.tracks.map((t) => ({ value: t, label: t }))}
          />
        </div>
      )}
      {(myEntry.status ?? 'accepted') === 'accepted' && <CheckInBadge event={event} team={myEntry} label="Personal" />}
    </section>
  );
}

function TeamSection({ event }: { event: Event }) {
  const { user } = useAuth();
  const isPast = getEventCategory(event) === 'past';
  const rules = getParticipation(event);
  const myTeam = useMyTeam(event);

  const [teamName, setTeamName] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(event.tracks?.[0] ?? 'General');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [lookingFor, setLookingFor] = useState(myTeam?.looking_for ?? '');
  const { error, setError, run } = useRun();
  const openTeams = myTeam ? [] : mockStorage.getOpenTeams(event.id);

  const members = myTeam?.members ?? [];
  const isLead = members[0]?.id === user?.id;
  const belowMin = members.length < rules.min;

  return (
    <section className="border border-slate-200 bg-white p-6 shadow-2xs space-y-5" aria-labelledby="my-team-heading">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h2 id="my-team-heading" className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" /> My Team
        </h2>
        {myTeam && (
          <Link to={`/participant/events/${event.id}/submission`}>
            <Button size="sm" variant="outline" className="space-x-1.5 text-xs">
              <span>{myTeam.submission?.status === 'submitted' ? 'View Submission' : 'Go to Submission'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>

      <ErrorNote error={error} />

      {myTeam ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                  {myTeam.track || 'General Track'}
                </span>
                <h3 className="text-xl font-bold text-slate-900">{myTeam.name}</h3>
              </div>
              {getLocationMode(event) === 'offline' && (
                <p className="text-xs text-slate-500 mt-1">
                  Table: <strong className="text-slate-800">{myTeam.table_number || 'Not assigned yet'}</strong>
                </p>
              )}
            </div>
            {members.length < rules.max && !isPast && (
              <div className="bg-blue-50/70 border border-blue-200 p-3 flex items-center gap-3 shrink-0">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-800 block font-semibold">Teammate invite code</span>
                  <span className="text-sm font-mono font-bold text-blue-900 tracking-wider">{myTeam.join_code}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(myTeam.join_code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-blue-300 text-blue-700 text-xs font-semibold hover:bg-blue-50 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <ApplicationStatus event={event} team={myTeam} isLead={isLead} onApply={() => run(() => mockStorage.applyTeam(myTeam.id))} />

          {isLead && !isPast && myTeam.status !== 'rejected' && members.length < rules.max && (
            <div className="p-3 border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!myTeam.open_to_join}
                  onChange={(e) => run(() => mockStorage.updateTeamRecruiting(myTeam.id, { open_to_join: e.target.checked, looking_for: lookingFor }))}
                  className="h-4 w-4 accent-blue-600"
                />
                Open to new members — list this team for participants who don't have one
              </label>
              {myTeam.open_to_join && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                    placeholder="Who are you looking for? e.g. a designer, someone who knows Flutter"
                    aria-label="Who your team is looking for"
                    maxLength={200}
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
                  />
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => run(() => mockStorage.updateTeamRecruiting(myTeam.id, { open_to_join: true, looking_for: lookingFor }))}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Members ({members.length}/{rules.max}){members.length >= rules.max && ' · Team full'}
            </h4>
            {belowMin && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2">
                Your team needs at least {rules.min} members to submit — invite {rules.min - members.length} more with the code above.
              </p>
            )}
            <div className="divide-y divide-slate-100 border border-slate-200">
              {members.map((m, idx) => (
                <div key={m.id} className="p-3 flex items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">{idx + 1}</div>
                    <div>
                      <div className="font-semibold text-slate-900">{m.full_name} {m.id === user?.id && '(You)'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{idx === 0 ? 'Team Lead' : 'Teammate'}</div>
                    </div>
                  </div>
                  {isLead && m.id !== user?.id && !isPast && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove ${m.full_name} from ${myTeam.name}?`)) run(() => mockStorage.removeTeamMember(myTeam.id, m.id));
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 cursor-pointer"
                      aria-label={`Remove ${m.full_name} from the team`}
                    >
                      <UserMinus className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {(myTeam.status ?? 'accepted') === 'accepted' && <CheckInBadge event={event} team={myTeam} label="Team" />}

          {!isPast && (
            <div className="pt-1">
              {confirmLeave ? (
                <div className="p-3 border border-red-200 bg-red-50 text-xs text-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    {members.length === 1
                      ? `You're the only member — leaving deletes "${myTeam.name}" and its submission.`
                      : isLead
                      ? `${members[1].full_name} will become team lead.`
                      : `You'll leave "${myTeam.name}" but stay registered for the event.`}
                  </span>
                  <span className="flex gap-2 shrink-0">
                    <Button type="button" size="sm" variant="outline" onClick={() => setConfirmLeave(false)}>Cancel</Button>
                    <Button type="button" size="sm" onClick={() => { setConfirmLeave(false); run(() => mockStorage.leaveTeam(event.id)); }}
                      className="bg-red-600 hover:bg-red-700 border-red-600">
                      Leave Team
                    </Button>
                  </span>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmLeave(true)} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 cursor-pointer">
                  <LogOut className="w-3.5 h-3.5" /> Leave team
                </button>
              )}
            </div>
          )}
        </>
      ) : isPast ? (
        <p className="text-xs text-slate-500">You didn't join a team for this event.</p>
      ) : (
        <>
          <p className="text-xs text-slate-600">
            Teams of {rules.min === rules.max ? rules.max : `${rules.min}–${rules.max}`} members. Create a team and share its invite code, join one with a code, or join a team that's looking for members.
          </p>

          {openTeams.length > 0 && (
            <div className="border border-blue-200 bg-blue-50/30 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">Teams looking for members ({openTeams.length})</h3>
              <div className="divide-y divide-blue-100">
                {openTeams.map((t) => (
                  <div key={t.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900">
                        {t.name} <span className="font-normal text-slate-500">· {t.track} · {t.members?.length ?? 0}/{rules.max} members</span>
                      </div>
                      {t.looking_for && <div className="text-slate-600">Looking for: {t.looking_for}</div>}
                      <div className="text-[11px] text-slate-500">{(t.members ?? []).map((m) => m.full_name).join(', ')}</div>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="shrink-0"
                      onClick={() => run(() => mockStorage.joinOpenTeam(t.id))}
                      aria-label={`Join team ${t.name}`}>
                      Join this team
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!teamName.trim()) return setError('Please enter a team name.');
                run(() => mockStorage.createTeam(event.id, teamName.trim(), selectedTrack));
              }}
              className="border border-slate-200 p-5 space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" /> Create a team
              </h3>
              <Input id="team-name" label="Team name" placeholder="e.g. NeuralNomads" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              <Select id="team-track" label="Track" value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)}
                options={(event.tracks?.length ? event.tracks : ['General']).map((t) => ({ value: t, label: t }))} />
              <Button type="submit" size="sm" className="w-full">Create Team & Get Invite Code</Button>
            </form>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!joinCode.trim()) return setError('Please enter a join code.');
                run(() => mockStorage.joinTeamByCode(event.id, joinCode.trim()));
              }}
              className="border border-slate-200 p-5 space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" /> Join a team
              </h3>
              <Input id="join-code" label="Join code" placeholder="e.g. FF-1234" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
              <p className="text-[11px] text-slate-500">Ask your team lead for the invite code shown on their Overview.</p>
              <Button type="submit" variant="secondary" size="sm" className="w-full">Join Team</Button>
            </form>
          </div>
        </>
      )}
    </section>
  );
}

function UnregisterSection({ event }: { event: Event }) {
  const navigate = useNavigate();
  const myTeam = useMyTeam(event);
  const [confirming, setConfirming] = useState(false);
  const { error, run } = useRun();
  if (getEventCategory(event) === 'past') return null;

  const solo = getParticipation(event).type === 'solo';
  const consequence = solo
    ? 'Your submission (if any) will be deleted.'
    : myTeam && (myTeam.members?.length ?? 0) <= 1
    ? `You're the only member of "${myTeam.name}", so the team and its submission will be deleted.`
    : myTeam
    ? `You'll be removed from "${myTeam.name}"; your teammates keep the team.`
    : '';

  return (
    <section className="border border-slate-200 bg-white p-5 shadow-2xs space-y-2" aria-label="Unregister">
      <ErrorNote error={error} />
      {confirming ? (
        <div className="text-xs text-red-800 space-y-2">
          <p><strong>Unregister from {event.name}?</strong> {consequence}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button type="button" size="sm" className="bg-red-600 hover:bg-red-700 border-red-600"
              onClick={() => run(() => { mockStorage.unregisterFromEvent(event.id); navigate('/participant/my-events'); })}>
              Yes, unregister
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">Can't make it anymore?</span>
          <button type="button" onClick={() => setConfirming(true)} className="text-red-600 hover:underline font-medium cursor-pointer">
            Unregister from event
          </button>
        </div>
      )}
    </section>
  );
}
