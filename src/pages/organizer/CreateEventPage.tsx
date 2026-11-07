import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EventFormData } from '@/lib/validators';
import { mockStorage } from '@/lib/mockStorage';
import { toLocalInputValue } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Round } from '@/types';
import { defaultVolunteerForm, getRoleOptions } from '@/lib/volunteerForm';
import { VolunteerFormBuilder } from '@/components/volunteer/VolunteerFormBuilder';
import { EventFormatFields, RoundWeightTotal, DEFAULT_EVENT_FORMAT } from '@/components/event/EventFormatFields';
import { validateRounds, validateTeamSize, validateRegistrationDeadlines, EVENT_CATEGORIES } from '@/lib/eventRules';
import { EventCategory } from '@/types';
import { RegistrationFields, EMPTY_REGISTRATION, registrationToEvent } from '@/components/event/RegistrationFields';
import { ArrowLeft, Plus, Trash2, Users, Link2 } from 'lucide-react';

export function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Custom state for dynamic rounds
  const [rounds, setRounds] = useState<Round[]>([
    { id: 'r1', name: 'Round 1: Idea Pitch & Viability', weight: 30, active: true },
    { id: 'r2', name: 'Round 2: Technical Prototype Demo', weight: 70, active: false },
  ]);

  // Volunteer onboarding policy & title
  const [volunteerPolicy, setVolunteerPolicy] = useState<'my_team' | 'open'>('my_team');
  const [volunteerForm, setVolunteerForm] = useState(() => defaultVolunteerForm(['Logistics & Hacker Experience']));
  const [formError, setFormError] = useState<string | null>(null);
  const [format, setFormat] = useState(DEFAULT_EVENT_FORMAT);
  const [registration, setRegistration] = useState(EMPTY_REGISTRATION);
  const [category, setCategory] = useState<EventCategory>('hackathon');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      venue: '',
      starts_at: toLocalInputValue(Date.now() + 86400000),
      ends_at: toLocalInputValue(Date.now() + 86400000 * 3),
      visibility: 'public',
      seeking_sponsors: true,
      tracks: ['AI / ML Systems', 'Decentralized Web', 'Developer Tooling'],
    },
  });

  const [trackInput, setTrackInput] = useState('');
  const [tracksList, setTracksList] = useState<string[]>([
    'AI / ML Systems',
    'Decentralized Web',
    'Developer Tooling',
  ]);

  const handleAddTrack = () => {
    if (trackInput.trim() && !tracksList.includes(trackInput.trim())) {
      const updated = [...tracksList, trackInput.trim()];
      setTracksList(updated);
      setValue('tracks', updated, { shouldValidate: true });
      setTrackInput('');
    }
  };

  const handleRemoveTrack = (track: string) => {
    const updated = tracksList.filter((t) => t !== track);
    setTracksList(updated);
    setValue('tracks', updated, { shouldValidate: true });
  };

  const handleAddRound = () => {
    const newId = `r-${Date.now().toString(36)}`;
    setRounds([
      ...rounds,
      {
        id: newId,
        name: `Round ${rounds.length + 1}: Finalist Review`,
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
          const val = field === 'weight' ? (parseInt(value, 10) || 0) : value;
          return { ...r, [field]: val };
        }
        if (field === 'active' && value === true) {
          return { ...r, active: false };
        }
        return r;
      })
    );
  };

  const onSubmit = (data: EventFormData) => {
    setFormError(null);
    const currentUser = user || mockStorage.getCurrentUser();
    if (!currentUser) {
      setFormError('Authentication required. Please sign in as an organizer.');
      return;
    }

    if (new Date(data.ends_at) <= new Date(data.starts_at)) {
      setFormError('Event End Date must be later than the Start Date.');
      return;
    }
    const configError =
      validateRounds(rounds) ||
      (format.participation_type === 'team' ? validateTeamSize(format.team_size_min, format.team_size_max) : null) ||
      validateRegistrationDeadlines({
        ...registrationToEvent(registration),
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
      });
    if (configError) {
      setFormError(configError);
      return;
    }

    const finalTracks = tracksList.length > 0 ? tracksList : ['General'];

    try {
      const newEvent = mockStorage.createEvent({
        organizer_id: currentUser.id,
        name: data.name.trim(),
        description: data.description.trim(),
        venue: data.venue.trim(),
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
        visibility: data.visibility,
        seeking_sponsors: data.seeking_sponsors,
        volunteer_policy: volunteerPolicy,
        ...format,
        ...registrationToEvent(registration),
        category,
        // Blank questions/options are dropped so applicants never see empty fields.
        volunteer_form: volunteerForm
          .filter((q) => q.label.trim())
          .map((q) => (q.options ? { ...q, options: q.options.filter((o) => o.trim()) } : q)),
        tracks: finalTracks,
        rounds: rounds,
      });

      // If "My Team", mint one private onboarding link per role
      if (volunteerPolicy === 'my_team') {
        getRoleOptions(volunteerForm).forEach((title) =>
          mockStorage.createInvite({
            event_id: newEvent.id,
            role_type: 'volunteer',
            role_title: title,
            token: `vol-${Math.random().toString(36).substring(2, 7)}-${newEvent.id.substring(4, 8)}`,
            expires_at: new Date(Date.now() + 86400000 * 14).toISOString(),
          })
        );
      }

      // Create an initial welcome announcement
      mockStorage.createAnnouncement({
        event_id: newEvent.id,
        audience: 'all',
        title: 'Welcome to ' + newEvent.name,
        message: `Welcome to ${newEvent.name}! Event registration and workspace are now open.`,
      });

      navigate(`/organizer/events/${newEvent.id}`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create event. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center space-x-2">
        <Link to="/organizer" className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Organizer Overview</span>
        </Link>
      </div>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Create New Event
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Configure event details, competition tracks, evaluation rounds, and volunteer recruitment.
        </p>
      </div>

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center justify-between">
          <span className="font-medium">{formError}</span>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xs space-y-1">
          <p className="font-semibold">Please resolve the following before publishing:</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700">
            {Object.entries(errors).map(([field, err]) => (
              <li key={field}>
                <span className="capitalize">{field.replace('_', ' ')}</span>: {err?.message as string}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 1. Core Event Details */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
            <span>1. Core Information</span>
          </h2>

          <Input
            label="Event Name *"
            placeholder="e.g. National Builder HackFest 2026"
            {...register('name')}
            error={errors.name?.message}
          />

          <Textarea
            label="Event Description *"
            placeholder="Explain the mission, schedule overview, eligibility, and prize pools..."
            {...register('description')}
            error={errors.description?.message}
            rows={4}
          />

          <Select
            id="event-category"
            label="Event type *"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            options={EVENT_CATEGORIES}
          />

          <Input
            label={format.location_mode === 'online' ? 'Platform / Meeting link *' : 'Venue *'}
            placeholder={format.location_mode === 'online' ? 'e.g. https://discord.gg/… or Zoom link' : 'e.g. Grand Innovation Arena, Floor 3'}
            {...register('venue')}
            error={errors.venue?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time *"
              type="datetime-local"
              {...register('starts_at')}
              error={errors.starts_at?.message}
            />
            <Input
              label="End Date & Time *"
              type="datetime-local"
              {...register('ends_at')}
              error={errors.ends_at?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Select
              label="Visibility Setting"
              {...register('visibility')}
              error={errors.visibility?.message}
              options={[
                { value: 'public', label: 'Public (Listed on global directory & seeking hackathons)' },
                { value: 'private', label: 'Private (Invite-only, hidden from search)' },
              ]}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Sponsorship Program
              </label>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="seeking_sponsors"
                  {...register('seeking_sponsors')}
                  className="h-4 w-4 rounded-xs border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="seeking_sponsors" className="text-xs text-slate-700 cursor-pointer">
                  Accept sponsorship applications for this event
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Participation & Format */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
            <span>2. Participation & Format</span>
          </h2>
          <EventFormatFields value={format} onChange={setFormat} />
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-semibold text-slate-800">Registration windows</h3>
            <RegistrationFields value={registration} onChange={setRegistration} />
          </div>
        </div>

        {/* 3. Tracks Configuration */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
            <span>3. Tracks & Themes</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Participants can choose these tracks during submission.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. FinTech & Payments"
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTrack();
                }
              }}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 bg-white text-neutral-900 focus:border-blue-600 focus:outline-none rounded-xs"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddTrack}>
              Add Track
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {tracksList.map((track) => (
              <span
                key={track}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs border border-blue-200 bg-blue-50 text-blue-700 rounded-xs"
              >
                <span className="font-medium">{track}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTrack(track)}
                  className="text-blue-400 hover:text-red-500 font-mono ml-1 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 3. Rounds Management */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
                <span>4. Evaluation Rounds</span>
              </h2>
              <p className="text-xs text-neutral-500">
                Stages judges score (e.g. Pitch, Prototype, Finals). Weights must add up to exactly 100%.
              </p>
            </div>
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

        {/* 4. Volunteer Onboarding (Two Options: My Team vs Open to Volunteers) */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-4 rounded-sm">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
              <span>5. Volunteer Recruitment & Onboarding</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Choose how volunteers join your event operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Option 1: My Team */}
            <div
              onClick={() => setVolunteerPolicy('my_team')}
              className={`p-4 border rounded-xs cursor-pointer transition-all space-y-2 ${
                volunteerPolicy === 'my_team'
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">My Team (Private Link)</span>
                </div>
                <input
                  type="radio"
                  name="vol_policy"
                  checked={volunteerPolicy === 'my_team'}
                  onChange={() => setVolunteerPolicy('my_team')}
                  className="h-3.5 w-3.5 text-blue-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                A private invite link will be generated. Only individuals who have this direct link can volunteer for this event.
              </p>
            </div>

            {/* Option 2: Open to Volunteers */}
            <div
              onClick={() => setVolunteerPolicy('open')}
              className={`p-4 border rounded-xs cursor-pointer transition-all space-y-2 ${
                volunteerPolicy === 'open'
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Open to Volunteers</span>
                </div>
                <input
                  type="radio"
                  name="vol_policy"
                  checked={volunteerPolicy === 'open'}
                  onChange={() => setVolunteerPolicy('open')}
                  className="h-3.5 w-3.5 text-blue-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Appears on the volunteer dashboard for users to apply. You can review and <strong>accept or reject</strong> volunteers prior to event start.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <VolunteerFormBuilder
              questions={volunteerForm}
              onChange={setVolunteerForm}
              rolesOnly={volunteerPolicy === 'my_team'}
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <Link to="/organizer">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Event...' : 'Publish Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
