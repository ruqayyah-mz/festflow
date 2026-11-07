import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Round, Event, VolunteerFormQuestion } from '@/types';
import { toLocalInputValue } from '@/lib/utils';
import { getEditableVolunteerForm } from '@/lib/volunteerForm';
import { VolunteerFormBuilder } from '@/components/volunteer/VolunteerFormBuilder';
import { EventFormatFields, RoundWeightTotal, DEFAULT_EVENT_FORMAT, EventFormat } from '@/components/event/EventFormatFields';
import { getParticipation, getLocationMode, validateRounds, validateTeamSize, validateRegistrationDeadlines, EVENT_CATEGORIES, getCategory } from '@/lib/eventRules';
import { EventCategory } from '@/types';
import { RegistrationFields, EMPTY_REGISTRATION, registrationFromEvent, registrationToEvent } from '@/components/event/RegistrationFields';
import { getEventCategory } from './OrganizerOverviewPage';
import { ArrowLeft, Plus, Trash2, Lock } from 'lucide-react';

export function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | undefined>(() =>
    eventId ? mockStorage.getEventById(eventId) : undefined
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [seekingSponsors, setSeekingSponsors] = useState(true);
  const [volunteerPolicy, setVolunteerPolicy] = useState<'my_team' | 'open'>('my_team');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);
  const [trackInput, setTrackInput] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [volunteerForm, setVolunteerForm] = useState<VolunteerFormQuestion[]>([]);
  const [format, setFormat] = useState<EventFormat>(DEFAULT_EVENT_FORMAT);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [registration, setRegistration] = useState(EMPTY_REGISTRATION);
  const [category, setCategory] = useState<EventCategory>('other');

  useEffect(() => {
    if (eventId) {
      const evt = mockStorage.getEventById(eventId);
      if (evt) {
        setEvent(evt);
        setName(evt.name);
        setDescription(evt.description);
        setVenue(evt.venue);
        setStartsAt(toLocalInputValue(evt.starts_at));
        setEndsAt(toLocalInputValue(evt.ends_at));
        setVisibility(evt.visibility);
        setSeekingSponsors(evt.seeking_sponsors);
        setVolunteerPolicy(evt.volunteer_policy || 'my_team');
        setRounds(evt.rounds || []);
        setTracks(evt.tracks || []);
        setVolunteerForm(getEditableVolunteerForm(evt));
        const rules = getParticipation(evt);
        setFormat({
          participation_type: rules.type,
          team_size_min: rules.type === 'team' ? rules.min : 1,
          team_size_max: rules.type === 'team' ? rules.max : 4,
          location_mode: getLocationMode(evt),
        });
        setRegistration(registrationFromEvent(evt));
        setCategory(getCategory(evt));
      }
    }
  }, [eventId]);

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-sm text-neutral-500">Event not found or has been soft-deleted.</p>
        <Link to="/organizer">
          <Button variant="outline" size="sm">Back to Organizer Console</Button>
        </Link>
      </div>
    );
  }

  // Concluded events are a historical record — nothing to edit.
  if (getEventCategory(event) === 'past') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <Lock className="w-6 h-6 text-slate-400 mx-auto" />
        <p className="text-sm text-slate-600">
          <strong>{event.name}</strong> has concluded and can no longer be edited.
        </p>
        <Link to={`/organizer/events/${event.id}`}>
          <Button variant="outline" size="sm">Open Workspace</Button>
        </Link>
      </div>
    );
  }

  const handleAddRound = () => {
    const newId = `r-${Date.now().toString(36)}`;
    setRounds([
      ...rounds,
      {
        id: newId,
        name: `Round ${rounds.length + 1}`,
        weight: 20,
        active: false,
      },
    ]);
  };

  const handleRemoveRound = (id: string) => {
    if (rounds.length <= 1) return;
    setRounds(rounds.filter((r) => r.id !== id));
  };

  const handleRoundChange = (id: string, field: 'name' | 'weight' | 'active', value: any) => {
    setRounds(
      rounds.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value };
        }
        if (field === 'active' && value === true) {
          return { ...r, active: false };
        }
        return r;
      })
    );
  };

  const handleAddTrack = () => {
    if (trackInput.trim() && !tracks.includes(trackInput.trim())) {
      setTracks([...tracks, trackInput.trim()]);
      setTrackInput('');
    }
  };

  const handleRemoveTrack = (track: string) => {
    setTracks(tracks.filter((t) => t !== track));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setSaveError(null);
    if (new Date(endsAt) <= new Date(startsAt)) {
      setSaveError('Event End Date must be later than the Start Date.');
      return;
    }
    const configError =
      validateRounds(rounds) ||
      (format.participation_type === 'team' ? validateTeamSize(format.team_size_min, format.team_size_max) : null) ||
      validateRegistrationDeadlines({
        ...registrationToEvent(registration),
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
      });
    if (configError) {
      setSaveError(configError);
      return;
    }

    try {
      mockStorage.updateEvent(eventId, {
        name,
        description,
        venue,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        visibility,
        seeking_sponsors: seekingSponsors,
        volunteer_policy: volunteerPolicy,
        ...format,
        ...registrationToEvent(registration),
        category,
        volunteer_form: volunteerForm
          .filter((q) => q.label.trim())
          .map((q) => (q.options ? { ...q, options: q.options.filter((o) => o.trim()) } : q)),
        rounds,
        tracks,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes.');
      return;
    }

    setStatusMsg('Event configuration saved successfully.');
    setTimeout(() => {
      navigate(`/organizer/events/${eventId}`);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center space-x-2">
        <Link to={`/organizer/events/${eventId}`} className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Workspace</span>
        </Link>
      </div>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Edit Event & Rounds
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Update event logistics, manage rounds, and adjust track assignments.
        </p>
      </div>

      {saveError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm" role="alert">
          {saveError}
        </div>
      )}

      {statusMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-sm">
          {statusMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
            <span>Event Logistics</span>
          </h2>

          <Input
            label="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />

          <Select
            id="event-category"
            label="Event type"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            options={EVENT_CATEGORIES}
          />

          <Input
            label={format.location_mode === 'online' ? 'Platform / Meeting link' : 'Venue'}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Select
              label="Visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              options={[
                { value: 'public', label: 'Public (Open listing)' },
                { value: 'private', label: 'Private (Members only)' },
              ]}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Seeking Sponsors
              </label>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="seeking"
                  checked={seekingSponsors}
                  onChange={(e) => setSeekingSponsors(e.target.checked)}
                  className="h-4 w-4 rounded-none border-neutral-300"
                />
                <label htmlFor="seeking" className="text-xs text-slate-700 cursor-pointer">
                  Accept sponsorship inquiries
                </label>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-700">
                Volunteer Onboarding Policy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 p-2.5 border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="edit_vol_policy"
                    checked={volunteerPolicy === 'my_team'}
                    onChange={() => setVolunteerPolicy('my_team')}
                    className="h-3.5 w-3.5 text-blue-600"
                  />
                  <span className="text-xs text-slate-800 font-medium">My Team (Private Direct Link)</span>
                </label>
                <label className="flex items-center space-x-2 p-2.5 border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="edit_vol_policy"
                    checked={volunteerPolicy === 'open'}
                    onChange={() => setVolunteerPolicy('open')}
                    className="h-3.5 w-3.5 text-blue-600"
                  />
                  <span className="text-xs text-slate-800 font-medium">Open to Volunteers (Public Applications)</span>
                </label>
              </div>
              <div className="pt-3">
                <VolunteerFormBuilder
                  questions={volunteerForm}
                  onChange={setVolunteerForm}
                  rolesOnly={volunteerPolicy === 'my_team'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Participation & Format */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
            <span>Participation & Format</span>
          </h2>
          <EventFormatFields
            value={format}
            onChange={setFormat}
            participationLocked={
              mockStorage.getTeams(event.id).length > 0 ||
              mockStorage.getRoles(event.id).some((r) => r.role_type === 'participant')
            }
          />
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-semibold text-slate-800">Registration windows</h3>
            <RegistrationFields value={registration} onChange={setRegistration} />
          </div>
        </div>

        {/* Tracks */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
            <span>Tracks & Themes</span>
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add track name..."
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 bg-white text-neutral-900 rounded-xs focus:border-blue-600 focus:outline-none"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddTrack}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tracks.map((t) => (
              <span key={t} className="px-2.5 py-1 text-xs border border-blue-200 bg-blue-50 text-blue-700 rounded-xs flex items-center space-x-1 font-medium">
                <span>{t}</span>
                <button type="button" onClick={() => handleRemoveTrack(t)} className="text-blue-400 hover:text-red-500 font-mono ml-1 cursor-pointer">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Rounds Management */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
              <span>Rounds & Weights</span>
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddRound} className="space-x-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Round</span>
            </Button>
          </div>

          <div className="space-y-3">
            {rounds.map((round) => (
              <div
                key={round.id}
                className={`p-3 border rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  round.active ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    value={round.name}
                    onChange={(e) => handleRoundChange(round.id, 'name', e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-200 bg-white text-neutral-900 rounded-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="flex items-center space-x-1 text-xs">
                    <span className="text-neutral-500">Weight:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={round.weight === 0 ? '' : round.weight}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                        handleRoundChange(round.id, 'weight', isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                      }}
                      className="w-16 px-2 py-1 text-xs border border-slate-200 bg-white text-neutral-900 text-center rounded-xs focus:border-blue-600 focus:outline-none"
                    />
                    <span className="text-neutral-400">%</span>
                  </div>

                  <label className="flex items-center space-x-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="active_round"
                      checked={round.active}
                      onChange={() => handleRoundChange(round.id, 'active', true)}
                      className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className={`text-xs ${round.active ? 'text-blue-700 font-semibold' : 'text-slate-600'}`}>Active</span>
                  </label>

                  {rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRound(round.id)}
                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <RoundWeightTotal rounds={rounds} />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <Link to={`/organizer/events/${eventId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
