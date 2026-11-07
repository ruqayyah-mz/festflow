import { mockStorage } from '@/lib/mockStorage';

// Compact organizer-facing view of a volunteer's self-written profile + FestFlow history.
export function VolunteerProfileSummary({ userId }: { userId: string }) {
  const d = mockStorage.getVolunteerDetails(userId);
  const exp = mockStorage.getVolunteerExperience(userId);

  return (
    <div className="text-[11px] text-slate-600 space-y-0.5">
      {d?.headline && <div className="font-medium text-slate-800">{d.headline}</div>}
      {d?.bio && <div className="line-clamp-2">{d.bio}</div>}
      {!!d?.skills?.length && <div><span className="text-slate-500">Skills:</span> {d.skills.join(', ')}</div>}
      {!!d?.preferred_roles?.length && <div><span className="text-slate-500">Wants:</span> {d.preferred_roles.join(', ')}</div>}
      {!!d?.languages?.length && <div><span className="text-slate-500">Languages:</span> {d.languages.join(', ')}</div>}
      {d?.prior_experience && <div className="line-clamp-2"><span className="text-slate-500">Prior experience:</span> {d.prior_experience}</div>}
      {(d?.contact || d?.linkedin_url) && (
        <div>
          {d.contact && <span className="mr-2"><span className="text-slate-500">Contact:</span> {d.contact}</span>}
          {d.linkedin_url && (
            <a href={d.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Profile link ↗</a>
          )}
        </div>
      )}
      <div>
        <span className="text-slate-500">FestFlow experience:</span>{' '}
        {exp.length === 0 ? 'first-time volunteer' : exp.map((x) => `${x.event.name} (${x.roleTitle}, ${x.tasksDone} tasks)`).join(' • ')}
      </div>
      {!d && <div className="italic text-slate-400">Hasn't filled in their profile yet.</div>}
    </div>
  );
}
