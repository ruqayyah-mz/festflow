import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submissionSchema, SubmissionFormData } from '@/lib/validators';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { Event, Team, Submission, Announcement } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { AnnouncementFeed } from '@/components/AnnouncementFeed';
import { getCountdown, formatDate } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

export function ParticipantDashboard() {
  const { user } = useAuth();
  const events = mockStorage.getPublicEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');

  const event: Event | undefined = mockStorage.getEventById(selectedEventId);
  const teams = mockStorage.getTeams(selectedEventId);
  const myTeam: Team | undefined = teams.find((t) =>
    t.members?.some((m) => m.id === user?.id)
  );

  const announcements: Announcement[] = mockStorage.getAnnouncements(selectedEventId, 'participants');

  // Countdown timer state
  const [countdown, setCountdown] = useState(() =>
    event ? getCountdown(event.ends_at) : { expired: false, hours: 0, minutes: 0, seconds: 0, formatted: '' }
  );

  useEffect(() => {
    if (!event) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(event.ends_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  // Project submission state
  const existingSubmission: Submission | undefined = myTeam?.submission || undefined;
  const [statusMessage, setStatusMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      title: existingSubmission?.title || '',
      description: existingSubmission?.description || '',
      repo_url: existingSubmission?.repo_url || '',
      demo_url: existingSubmission?.demo_url || '',
    },
  });

  useEffect(() => {
    if (existingSubmission) {
      reset({
        title: existingSubmission.title,
        description: existingSubmission.description,
        repo_url: existingSubmission.repo_url,
        demo_url: existingSubmission.demo_url || '',
      });
    }
  }, [existingSubmission, reset]);

  const onSubmissionSubmit = (data: SubmissionFormData) => {
    if (!myTeam || !event) return;

    mockStorage.upsertSubmission({
      team_id: myTeam.id,
      event_id: event.id,
      title: data.title,
      description: data.description,
      repo_url: data.repo_url || "",
      demo_url: data.demo_url || '',
      status: 'submitted',
      team_name: myTeam.name,
      table_number: myTeam.table_number || undefined,
      track: myTeam.track,
    });

    setStatusMessage('Project submitted successfully! Judges will review your project.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Participant Hub
            </h1>
            <span className="text-xs px-2.5 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-bold font-mono">
              Hacker Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track hackathon deadline, coordinate your team roster, and submit your project.
          </p>
        </div>

        <div className="flex items-center border border-slate-300 bg-white px-3 py-1.5 text-xs shadow-2xs">
          <span className="text-slate-500 mr-2">Event:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 text-xs bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="font-mono hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Live Countdown & Event Banner */}
      {event && (
        <div className="border border-blue-200 bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold bg-blue-50 px-2 py-0.5 border border-blue-100">
              Event In Progress • Ends {formatDate(event.ends_at)}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              {event.name}
            </h2>
            <p className="text-xs text-slate-500">
              Venue: {event.venue}
            </p>
          </div>

          {/* Countdown Clock Display */}
          <div className="p-4 border border-blue-200 bg-blue-50/70 flex items-center space-x-4 shrink-0 shadow-2xs">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-800">
                Hackathon Submission Countdown
              </div>
              <div className="text-xl font-mono font-bold text-blue-900 mt-0.5">
                {countdown.formatted}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Status Card */}
      <div className="border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                My Team Status
              </span>
              {myTeam && (
                <span className="text-[10px] font-bold px-2 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-mono">
                  {myTeam.join_code}
                </span>
              )}
            </div>
            {myTeam ? (
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {myTeam.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {myTeam.table_number || 'Table unassigned'} • Track: <strong className="text-slate-700">{myTeam.track || 'General'}</strong> • {myTeam.members?.length || 1} Builder(s)
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  You are not in a team yet for this event
                </h3>
                <p className="text-xs text-slate-500">
                  Form a new team or enter a join code from your friends to submit projects together.
                </p>
              </div>
            )}
          </div>

          <Link to="/participant/team">
            <Button size="sm" variant={myTeam ? 'outline' : 'primary'}>
              {myTeam ? 'Manage Team Roster' : 'Create or Join Team →'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Two Column: Project Submission Form & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Submission (2 cols) */}
        <div className="lg:col-span-2 border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Project Submission
                </h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
                  existingSubmission?.status === 'submitted'
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : 'border-slate-300 text-slate-600 bg-slate-100'
                }`}>
                  Status: {existingSubmission?.status ? existingSubmission.status.replace('_', ' ') : 'Not Submitted'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Submissions are linked to your team and reviewed by link-based judges.
              </p>
            </div>
          </div>

          {!myTeam ? (
            <div className="p-8 border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
              <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-xs text-slate-600">
                You must create or join a team before submitting a hackathon project.
              </p>
              <Link to="/participant/team">
                <Button size="sm">Form Team Now</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmissionSubmit)} className="space-y-4">
              <Input
                label="Project Title *"
                placeholder="e.g. PulseAI: Emergency Dispatcher Copilot"
                {...register('title')}
                error={errors.title?.message}
              />

              <Textarea
                label="Project Description & Architecture *"
                placeholder="Describe what problem you are solving, how you built it, challenges overcome, and technologies used..."
                {...register('description')}
                error={errors.description?.message}
                rows={5}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GitHub / Code Repository URL *"
                  placeholder="https://github.com/organization/project"
                  {...register('repo_url')}
                  error={errors.repo_url?.message}
                />

                <Input
                  label="Live Demo URL (Optional)"
                  placeholder="https://my-demo-app.vercel.app"
                  {...register('demo_url')}
                  error={errors.demo_url?.message}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  {existingSubmission?.status === 'submitted'
                    ? `Last updated: ${formatDate(existingSubmission.submitted_at)}`
                    : 'Ready for initial submission'}
                </span>
                <Button type="submit" disabled={isSubmitting}>
                  {existingSubmission?.status === 'submitted' ? 'Update Submission' : 'Submit Project'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Announcements Feed (1 col) */}
        <div>
          <AnnouncementFeed
            eventId={selectedEventId}
            announcements={announcements}
            canPost={false}
            title="Live Broadcasts"
            currentAudienceFilter="participants"
          />
        </div>
      </div>
    </div>
  );
}
