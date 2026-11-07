import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { submissionSchema } from '@/lib/validators';
import { compressImage, MAX_IMAGES } from '@/lib/imageCompress';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ChipInput } from '@/components/ui/ChipInput';
import { SubmissionShowcase } from '@/components/SubmissionShowcase';
import { formatDate } from '@/lib/utils';
import { getParticipation } from '@/lib/eventRules';
import { CheckCircle2, ImagePlus, X, Send } from 'lucide-react';

const TAG_SUGGESTIONS = ['AI/ML', 'IoT', 'Web3', 'FinTech', 'HealthTech', 'EdTech', 'Sustainability', 'Cybersecurity', 'AR/VR', 'Gaming', 'Mobile', 'Open Source', 'Social Impact', 'Hardware'];
const TECH_SUGGESTIONS = ['React', 'TypeScript', 'Python', 'Node.js', 'Flutter', 'TensorFlow', 'PyTorch', 'Supabase', 'Firebase', 'PostgreSQL', 'Arduino', 'Raspberry Pi', 'Solidity', 'AWS'];

type Form = {
  title: string;
  description: string;
  repo_url: string;
  demo_url: string;
  youtube_url: string;
  tags: string[];
  technologies: string[];
  additional_info: string;
  images: string[];
};
const EMPTY: Form = { title: '', description: '', repo_url: '', demo_url: '', youtube_url: '', tags: [], technologies: [], additional_info: '', images: [] };

export function ParticipantSubmissionPage() {
  const { eventId = '' } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [, setTick] = useState(0);
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);

  const event = mockStorage.getEventById(eventId);
  const myTeam = mockStorage.getTeams(eventId).find((t) => t.members?.some((m) => m.id === user?.id));
  const existing = myTeam?.submission ?? undefined;
  const isClosed = mockStorage.isEventConcluded(eventId);

  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load the saved submission once per team (not on every storage tick, which would wipe unsaved edits).
  useEffect(() => {
    setForm(
      existing
        ? {
            title: existing.title,
            description: existing.description,
            repo_url: existing.repo_url || '',
            demo_url: existing.demo_url || '',
            youtube_url: existing.youtube_url || '',
            tags: existing.tags ?? [],
            technologies: existing.technologies ?? [],
            additional_info: existing.additional_info || '',
            images: existing.images ?? [],
          }
        : { ...EMPTY, tags: myTeam?.track ? [myTeam.track] : [] }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myTeam?.id, existing?.id]);

  if (!event) return null; // ParticipantEventLayout guards this

  if (!myTeam) {
    return (
      <div className="border border-slate-200 bg-white p-8 text-center space-y-3 shadow-2xs">
        <p className="text-sm text-slate-600">You need a team before you can submit a project.</p>
        <Link to={`/participant/events/${eventId}`}>
          <Button size="sm">Create or join a team</Button>
        </Link>
      </div>
    );
  }

  const rules = getParticipation(event);
  const isSolo = rules.type === 'solo';
  const memberCount = myTeam.members?.length ?? 0;

  const teamStatus = myTeam.status ?? 'accepted';
  if (!isClosed && teamStatus !== 'accepted') {
    return (
      <div className="border border-slate-200 bg-white p-8 text-center space-y-3 shadow-2xs">
        <p className="text-sm text-slate-600">
          {teamStatus === 'rejected'
            ? `${isSolo ? 'Your' : 'Your team\'s'} application wasn't accepted, so there's nothing to submit for this event.`
            : `Submissions open once the organizer accepts ${isSolo ? 'your registration' : 'your team'}.`}
        </p>
        <Link to={`/participant/events/${eventId}`}>
          <Button size="sm" variant="outline">See application status</Button>
        </Link>
      </div>
    );
  }

  if (!isClosed && memberCount < rules.min) {
    return (
      <div className="border border-amber-200 bg-amber-50 p-8 text-center space-y-3">
        <p className="text-sm text-amber-900">
          Team <strong>{myTeam.name}</strong> has {memberCount} member{memberCount === 1 ? '' : 's'}; this event needs at least {rules.min} to submit.
        </p>
        <Link to={`/participant/events/${eventId}`}>
          <Button size="sm" variant="outline">Invite teammates from Overview</Button>
        </Link>
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Final Submission</h2>
        {existing?.status === 'submitted' ? (
          <>
            <div className="text-lg font-bold text-slate-900">{existing.title}</div>
            <p className="text-sm text-slate-600 whitespace-pre-line">{existing.description}</p>
            <SubmissionShowcase submission={existing} />
            <p className="text-[11px] text-slate-500 font-mono">Submitted {formatDate(existing.submitted_at)}</p>
          </>
        ) : (
          <p className="text-sm text-slate-600">{isSolo ? "You didn't" : "Your team didn't"} submit a project before the event closed.</p>
        )}
      </div>
    );
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const room = MAX_IMAGES - form.images.length;
    if (room <= 0) return setMessage({ kind: 'error', text: `You can add up to ${MAX_IMAGES} images.` });
    setProcessing(true);
    setMessage(null);
    try {
      const compressed = await Promise.all(list.slice(0, room).map(compressImage));
      setForm((f) => ({ ...f, images: [...f.images, ...compressed].slice(0, MAX_IMAGES) }));
      if (list.length > room) setMessage({ kind: 'error', text: `Only the first ${room} image(s) were added (max ${MAX_IMAGES}).` });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Could not add that image.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const parsed = submissionSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof Form, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Form;
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
      setMessage({ kind: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }
    try {
      mockStorage.upsertSubmission({
        team_id: myTeam.id,
        event_id: event.id,
        title: form.title.trim(),
        description: form.description.trim(),
        repo_url: form.repo_url.trim(),
        demo_url: form.demo_url.trim(),
        youtube_url: form.youtube_url.trim(),
        images: form.images,
        tags: form.tags,
        technologies: form.technologies,
        additional_info: form.additional_info.trim(),
        status: 'submitted',
        team_name: myTeam.name,
        table_number: myTeam.table_number || undefined,
        track: myTeam.track,
      });
      setMessage({ kind: 'ok', text: 'Project submitted! You can keep editing until the event ends.' });
    } catch (err) {
      const quota = err instanceof DOMException && err.name === 'QuotaExceededError';
      setMessage({
        kind: 'error',
        text: quota
          ? 'Not enough browser storage for these images. Remove an image or two and try again.'
          : err instanceof Error
          ? err.message
          : 'Could not save your submission.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Project Submission</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSolo ? 'Solo entry' : <>Team <strong className="text-slate-800">{myTeam.name}</strong></>} · closes {formatDate(event.ends_at)}
          </p>
        </div>
        {existing?.status === 'submitted' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Submitted {formatDate(existing.submitted_at)}
          </span>
        )}
      </div>

      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`p-3 text-xs border ${message.kind === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}
        >
          {message.text}
        </p>
      )}

      <section className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <Input id="sub-title" label="Project name *" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} placeholder="e.g. PulseAI" />

        {/* Image drop box */}
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-slate-700">
            Screenshots & images <span className="text-slate-400">({form.images.length}/{MAX_IMAGES})</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {form.images.map((src, i) => (
              <div key={i} className="relative w-28 h-20 border border-slate-200 bg-slate-50">
                <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                  aria-label={`Remove screenshot ${i + 1}`}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-slate-300 rounded-full flex items-center justify-center text-slate-500 hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {form.images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
                disabled={processing}
                className={`w-full sm:w-56 h-20 border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-700'
                }`}
              >
                <ImagePlus className="w-5 h-5" />
                {processing ? 'Processing…' : 'Drop images or click to upload'}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        <Textarea id="sub-description" label="Description *" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description}
          placeholder="What problem does it solve, how does it work, and what did you build during the event?" />
      </section>

      <section className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="sub-youtube" label="YouTube demo video" value={form.youtube_url} onChange={(e) => set('youtube_url', e.target.value)} error={errors.youtube_url} placeholder="https://youtu.be/…" />
          <Input id="sub-website" label="Hosted website (if available)" value={form.demo_url} onChange={(e) => set('demo_url', e.target.value)} error={errors.demo_url} placeholder="https://…" />
          <Input id="sub-repo" label="Code repository" value={form.repo_url} onChange={(e) => set('repo_url', e.target.value)} error={errors.repo_url} placeholder="https://github.com/…" />
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <ChipInput id="sub-tags" label="Tags * (type and press Enter, or pick below)" values={form.tags} onChange={(v) => set('tags', v)}
          suggestions={[...new Set([...(event.tracks ?? []), ...TAG_SUGGESTIONS])]} max={10} error={errors.tags} placeholder="e.g. AI/ML" />
        <ChipInput id="sub-tech" label="Technologies used" values={form.technologies} onChange={(v) => set('technologies', v)}
          suggestions={TECH_SUGGESTIONS} max={30} error={errors.technologies} placeholder="e.g. React, Python" />
        <Textarea id="sub-extra" label="Additional info (optional)" rows={3} value={form.additional_info} onChange={(e) => set('additional_info', e.target.value)}
          error={errors.additional_info} placeholder="Setup notes for judges, test credentials, what's next, credits…" />
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={processing} className="space-x-1.5">
          <Send className="w-4 h-4" />
          <span>{existing?.status === 'submitted' ? 'Update Submission' : 'Submit Project'}</span>
        </Button>
      </div>
    </form>
  );
}
