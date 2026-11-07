import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { formatDate } from '@/lib/utils';
import { VolunteerDetails } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ChipInput } from '@/components/ui/ChipInput';
import { Award, Pencil, MapPin, Clock, Mail, Link2, Sparkles, Briefcase, Languages, CheckCircle2, CalendarDays } from 'lucide-react';

const SKILL_SUGGESTIONS = ['Event logistics', 'Registration desk', 'First aid', 'AV / sound', 'Photography', 'Social media', 'Public speaking', 'Mentoring', 'Crowd management', 'Hospitality'];
const ROLE_SUGGESTIONS = ['Check-in desk', 'Tech support', 'Judging escort', 'Stage crew', 'Food & beverages', 'Hacker experience', 'Sponsor liaison'];
const LANGUAGE_SUGGESTIONS = ['English', 'Hindi', 'Arabic', 'Spanish', 'French', 'Mandarin'];

const schema = z.object({
  headline: z.string().max(80, 'Keep the headline under 80 characters'),
  bio: z.string().max(1000, 'Keep the bio under 1000 characters'),
  linkedin_url: z.string().url('Must be a full URL, e.g. https://linkedin.com/in/…').or(z.literal('')),
  contact: z.string().max(100),
  availability: z.string().max(200),
  city: z.string().max(80),
  prior_experience: z.string().max(2000),
});

type FormState = {
  headline: string; bio: string; skills: string[]; preferred_roles: string[]; languages: string[];
  availability: string; city: string; contact: string; linkedin_url: string; prior_experience: string;
};

const toForm = (d?: VolunteerDetails): FormState => ({
  headline: d?.headline ?? '',
  bio: d?.bio ?? '',
  skills: d?.skills ?? [],
  preferred_roles: d?.preferred_roles ?? [],
  languages: d?.languages ?? [],
  availability: d?.availability ?? '',
  city: d?.city ?? '',
  contact: d?.contact ?? '',
  linkedin_url: d?.linkedin_url ?? '',
  prior_experience: d?.prior_experience ?? '',
});

const initials = (name = '') =>
  name.replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

// Account-level "about me" for volunteers (no QR — that lives on each event's profile tab).
export function VolunteerAccountProfilePage() {
  const { user } = useAuth();
  const [, setTick] = useState(0);
  useEffect(() => mockStorage.subscribe(() => setTick((t) => t + 1)), []);
  const details = user ? mockStorage.getVolunteerDetails(user.id) : undefined;
  const [editing, setEditing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  if (!user) return null;
  return editing ? (
    <ProfileForm
      name={user.full_name}
      initial={toForm(details)}
      onCancel={() => setEditing(false)}
      onSaved={() => {
        setEditing(false);
        setFlash('Profile saved. Organizers will see this when you apply.');
      }}
    />
  ) : (
    <ProfileView name={user.full_name} userId={user.id} details={details} flash={flash} onEdit={() => { setFlash(null); setEditing(true); }} />
  );
}

function Chips({ items, tone }: { items: string[]; tone: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((x) => (
        <span key={x} className={`text-xs px-2.5 py-1 border ${tone}`}>{x}</span>
      ))}
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Award; children: React.ReactNode }) {
  return (
    <section className="border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-600" /> {title}
      </h2>
      {children}
    </section>
  );
}

function ProfileView({ name, userId, details: d, flash, onEdit }: {
  name: string; userId: string; details?: VolunteerDetails; flash: string | null; onEdit: () => void;
}) {
  const experience = mockStorage.getVolunteerExperience(userId);
  const tasksDone = experience.reduce((n, x) => n + x.tasksDone, 0);
  const empty = !d || (!d.headline && !d.bio && !d.skills?.length && !d.prior_experience);
  const facts = [
    d?.city && { icon: MapPin, text: d.city },
    d?.availability && { icon: Clock, text: d.availability },
    d?.contact && { icon: Mail, text: d.contact },
  ].filter(Boolean) as { icon: typeof MapPin; text: string }[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {flash && (
        <p role="status" className="p-3 text-xs border bg-emerald-50 border-emerald-200 text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> {flash}
        </p>
      )}

      {/* Header card */}
      <section className="border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600" aria-hidden="true" />
        {/* Only the avatar overlaps the banner; the name always sits on white so it stays readable. */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="-mt-10 shrink-0 w-20 h-20 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-blue-700 bg-blue-50">
              {initials(name)}
            </div>
            <div className="pt-3 min-w-0">
              <h1 className="text-xl font-bold text-slate-900">{name}</h1>
              <p className="text-sm text-slate-600">{d?.headline || 'Volunteer'}</p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onEdit} className="space-x-1.5 self-start sm:mt-3 shrink-0">
            <Pencil className="w-3.5 h-3.5" /><span>Edit profile</span>
          </Button>
        </div>
        {(facts.length > 0 || d?.linkedin_url) && (
          <div className="px-6 pb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            {facts.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-slate-400" />{text}</span>
            ))}
            {d?.linkedin_url && (
              <a href={d.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-700 hover:underline">
                <Link2 className="w-3.5 h-3.5" /> Profile link
              </a>
            )}
          </div>
        )}
        <div className="grid grid-cols-3 border-t border-slate-100 text-center divide-x divide-slate-100">
          <div className="py-3"><div className="text-lg font-bold text-slate-900">{experience.length}</div><div className="text-[11px] text-slate-500">Events completed</div></div>
          <div className="py-3"><div className="text-lg font-bold text-slate-900">{tasksDone}</div><div className="text-[11px] text-slate-500">Tasks done</div></div>
          <div className="py-3"><div className="text-lg font-bold text-slate-900">{d?.skills?.length ?? 0}</div><div className="text-[11px] text-slate-500">Skills listed</div></div>
        </div>
      </section>

      {empty && (
        <div className="border border-dashed border-blue-300 bg-blue-50/50 p-5 text-center space-y-2">
          <p className="text-sm text-slate-700">Your profile is empty. Organizers see it when you apply — tell them a bit about yourself.</p>
          <Button type="button" size="sm" onClick={onEdit}>Complete profile</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {d?.bio && (
            <Card title="About" icon={Sparkles}>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{d.bio}</p>
            </Card>
          )}
          {d?.prior_experience && (
            <Card title="Previous experience" icon={Briefcase}>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{d.prior_experience}</p>
            </Card>
          )}
          <Card title="FestFlow experience" icon={Award}>
            {experience.length === 0 ? (
              <p className="text-xs text-slate-500">No completed FestFlow events yet — they'll appear here automatically.</p>
            ) : (
              <ol className="relative border-l border-slate-200 ml-2 space-y-4">
                {experience.map((x) => (
                  <li key={x.event.id} className="ml-4">
                    <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" aria-hidden="true" />
                    <div className="text-sm font-semibold text-slate-900">{x.event.name}</div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-3">
                      <span>{x.roleTitle}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatDate(x.event.starts_at)}</span>
                      <span className="text-emerald-700 font-medium">{x.tasksDone} tasks done</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Skills" icon={Sparkles}>
            {d?.skills?.length ? <Chips items={d.skills} tone="border-blue-200 bg-blue-50 text-blue-800" /> : <p className="text-xs text-slate-400">None added</p>}
          </Card>
          <Card title="Roles I'd like" icon={Briefcase}>
            {d?.preferred_roles?.length ? <Chips items={d.preferred_roles} tone="border-purple-200 bg-purple-50 text-purple-800" /> : <p className="text-xs text-slate-400">None added</p>}
          </Card>
          <Card title="Languages" icon={Languages}>
            {d?.languages?.length ? <Chips items={d.languages} tone="border-slate-200 bg-slate-50 text-slate-700" /> : <p className="text-xs text-slate-400">None added</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ name, initial, onCancel, onSaved }: { name: string; initial: FormState; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] ??= i.message));
      setErrors(errs);
      setError('Please fix the highlighted fields.');
      return;
    }
    try {
      const trimmed = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
      ) as FormState;
      mockStorage.saveVolunteerDetails(trimmed);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    }
  };

  return (
    <form onSubmit={handleSave} noValidate className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit profile</h1>
          <p className="text-xs text-slate-500">{name} · shown to organizers of events you apply to or join.</p>
        </div>
      </div>

      {error && <p role="alert" className="p-3 text-xs border bg-red-50 border-red-200 text-red-700">{error}</p>}

      <section className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <Input id="vp-headline" label="Headline" placeholder="e.g. CS student · loves running registration desks" value={form.headline}
          onChange={(e) => set({ headline: e.target.value })} error={errors.headline} />
        <Textarea id="vp-bio" label="About me" rows={4} placeholder="A few lines about you, what you enjoy and why you volunteer." value={form.bio}
          onChange={(e) => set({ bio: e.target.value })} error={errors.bio} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="vp-city" label="City" value={form.city} onChange={(e) => set({ city: e.target.value })} error={errors.city} />
          <Input id="vp-availability" label="General availability" placeholder="e.g. Weekends, evenings" value={form.availability}
            onChange={(e) => set({ availability: e.target.value })} error={errors.availability} />
          <Input id="vp-contact" label="Contact (phone or email)" value={form.contact} onChange={(e) => set({ contact: e.target.value })} error={errors.contact} />
          <Input id="vp-linkedin" label="LinkedIn / portfolio URL" placeholder="https://…" value={form.linkedin_url}
            onChange={(e) => set({ linkedin_url: e.target.value })} error={errors.linkedin_url} />
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <ChipInput id="vp-skills" label="Skills" values={form.skills} onChange={(v) => set({ skills: v })} suggestions={SKILL_SUGGESTIONS} max={20} placeholder="e.g. First aid" />
        <ChipInput id="vp-roles" label="Roles I'd like" values={form.preferred_roles} onChange={(v) => set({ preferred_roles: v })} suggestions={ROLE_SUGGESTIONS} max={10} placeholder="e.g. Check-in desk" />
        <ChipInput id="vp-languages" label="Languages" values={form.languages} onChange={(v) => set({ languages: v })} suggestions={LANGUAGE_SUGGESTIONS} max={10} placeholder="e.g. English" />
        <Textarea id="vp-prior" label="Previous volunteering or relevant experience (outside FestFlow)" rows={3}
          placeholder="College fests, NGOs, conferences, part-time jobs… anything that shows how you'd help." value={form.prior_experience}
          onChange={(e) => set({ prior_experience: e.target.value })} error={errors.prior_experience} />
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Profile</Button>
      </div>
    </form>
  );
}
