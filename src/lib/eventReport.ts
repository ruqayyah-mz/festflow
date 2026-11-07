import { mockStorage } from '@/lib/mockStorage';
import { formatDate } from '@/lib/utils';
import { markPercent } from '@/lib/judging';
import { getParticipation, getLocationMode } from '@/lib/eventRules';
import { Event } from '@/types';

function formatLabel(event: Event) {
  const p = getParticipation(event);
  const who = p.type === 'solo' ? 'Solo' : `Teams of ${p.min}–${p.max}`;
  return `${who} · ${getLocationMode(event) === 'online' ? 'Online' : 'In person'}`;
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function table(headers: string[], rows: unknown[][], empty = 'None recorded.') {
  if (rows.length === 0) return `<p class="muted">${empty}</p>`;
  return `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

// Final score (out of 100) = Σ over rounds of (average judge score in that round, as % × round weight%).
// A round nobody has scored yet contributes 0, so partially-judged projects are flagged `complete: false`.
// Ties share a rank (1, 1, 3 …).
export function computeStandings(eventId: string) {
  const event = mockStorage.getEventById(eventId);
  const linkIds = new Set(mockStorage.getJudgeLinks(eventId).map((j) => j.id));
  const marks = mockStorage.getMarks().filter((m) => linkIds.has(m.judge_link_id));
  const rounds = event?.rounds ?? [];

  const rows = mockStorage
    .getSubmissions(eventId)
    .filter((s) => s.status === 'submitted')
    .map((s) => {
      // Each mark → % of the points it was scored against, then averaged across judges per round.
      const perRoundScores = rounds.map((r) => marks.filter((m) => m.submission_id === s.id && m.round === r.id).map(markPercent));
      const perRound = perRoundScores.map((xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null));
      const judgeCounts = perRoundScores.map((xs) => xs.length);
      const final = perRound.reduce<number>((sum, avg, i) => sum + ((avg ?? 0) * rounds[i].weight) / 100, 0);
      return {
        submission: s,
        perRound,
        judgeCounts,
        final: Math.round(final * 10) / 10,
        judged: perRound.some((x) => x !== null),
        complete: rounds.length > 0 && perRound.every((x) => x !== null),
        rank: 0,
      };
    })
    .sort((a, b) => b.final - a.final);

  rows.forEach((r, i) => (r.rank = i > 0 && r.final === rows[i - 1].final ? rows[i - 1].rank : i + 1));
  return rows;
}

export function buildEventReportHtml(eventId: string): string {
  const event = mockStorage.getEventById(eventId);
  if (!event) throw new Error('Event not found');

  const profiles = mockStorage.getProfiles();
  const nameOf = (id: string) => profiles.find((p) => p.id === id)?.full_name ?? id;
  const teams = mockStorage.getAcceptedTeams(eventId); // accepted competitors only
  const tasks = mockStorage.getTasks(eventId);
  const attendance = mockStorage.getAttendance(eventId);
  const volunteers = mockStorage.getRoles(eventId).filter((r) => r.role_type === 'volunteer');
  const sponsors = mockStorage.getSponsorshipApplications(eventId);
  const standings = computeStandings(eventId);
  const participantCount = teams.reduce((n, t) => n + (t.members?.length ?? 0), 0);
  const attendedIds = new Set(attendance.map((a) => a.target_id));

  const stat = (label: string, value: unknown) =>
    `<div class="stat"><div class="v">${esc(value)}</div><div class="l">${esc(label)}</div></div>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(event.name)} — Event Report</title>
<style>
  body{font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:#0f172a;max-width:960px;margin:32px auto;padding:0 16px}
  h1{margin:0 0 4px;font-size:24px} h2{font-size:16px;margin:32px 0 8px;border-bottom:2px solid #2563eb;padding-bottom:4px}
  .muted{color:#64748b} table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top} th{background:#f8fafc}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:16px}
  .stat{border:1px solid #e2e8f0;padding:10px} .stat .v{font-size:20px;font-weight:700} .stat .l{font-size:12px;color:#64748b}
  @media print{body{margin:0}}
</style></head><body>
<h1>${esc(event.name)}</h1>
<div class="muted">${esc(event.venue)} · ${esc(formatDate(event.starts_at))} → ${esc(formatDate(event.ends_at))}</div>
<div class="muted">${esc(formatLabel(event))}</div>
<div class="muted">Report generated ${esc(new Date().toLocaleString())}</div>
<p>${esc(event.description)}</p>

<div class="stats">
  ${stat('Participants', participantCount)}
  ${stat('Teams', teams.length)}
  ${stat('Submissions', standings.length)}
  ${stat('Volunteers', volunteers.length)}
  ${stat('Confirmed sponsors', sponsors.filter((s) => s.status === 'confirmed').length)}
  ${stat('Check-ins recorded', attendance.length)}
</div>

<h2>Final Standings</h2>
${table(
  ['#', 'Project', 'Team', 'Track', ...event.rounds.map((r) => `${r.name} (${r.weight}%) avg %`), 'Final /100'],
  standings.map((s) => [
    s.rank,
    s.submission.title,
    s.submission.team_name ?? teams.find((t) => t.id === s.submission.team_id)?.name ?? '',
    s.submission.track ?? '',
    ...s.perRound.map((x) => (x === null ? '—' : x.toFixed(1))),
    s.judged ? s.final.toFixed(1) : 'Not judged',
  ]),
  'No submitted projects.'
)}

<h2>Teams &amp; Participants</h2>
${table(
  ['Team', 'Track', 'Table', 'Members', 'Submitted', 'Checked in'],
  teams.map((t) => [
    t.name,
    t.track ?? '',
    t.table_number ?? '',
    (t.members ?? []).map((m) => m.full_name).join(', '),
    t.submission?.status === 'submitted' ? 'Yes' : 'No',
    attendedIds.has(t.id) ? 'Yes' : 'No',
  ])
)}

<h2>Volunteers</h2>
${table(
  ['Name', 'Role', 'Tasks done', 'Checked in'],
  volunteers.map((v) => {
    const mine = tasks.filter((t) => t.assignee_id === v.user_id);
    return [
      nameOf(v.user_id),
      v.role_title ?? 'General Volunteer',
      `${mine.filter((t) => t.status === 'done').length}/${mine.length}`,
      attendedIds.has(v.user_id) ? 'Yes' : 'No',
    ];
  })
)}

<h2>Sponsors</h2>
${table(
  ['Company', 'Tier', 'Status', 'Contact'],
  sponsors.map((s) => [s.sponsor_name, s.form_data.tier, s.status.replace('_', ' '), s.form_data.contact_email])
)}

<h2>Tasks</h2>
${table(
  ['Task', 'Assignee', 'Status', 'Completed'],
  tasks.map((t) => [t.title, t.assignee_name ?? 'Unassigned', t.status.replace('_', ' '), formatDate(t.completed_at)])
)}

<h2>Attendance Log</h2>
${table(
  ['Name', 'Type', 'Detail', 'Checked in', 'By'],
  attendance.map((a) => [a.target_name, a.target_type, a.detail ?? '', formatDate(a.marked_at), a.marked_by ?? ''])
)}
</body></html>`;
}

export function downloadEventReport(eventId: string) {
  const event = mockStorage.getEventById(eventId);
  const blob = new Blob([buildEventReportHtml(eventId)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(event?.name ?? 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-report.html`;
  a.click();
  URL.revokeObjectURL(url);
}
