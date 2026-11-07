import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Users, CheckCircle, Award, CheckSquare, Layers } from 'lucide-react';

export function AnalyticsPage() {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');
  const events = mockStorage.getEvents();

  const [selectedEventId, setSelectedEventId] = useState<string>(
    eventIdParam || (events.length > 0 ? events[0].id : '')
  );

  const event = mockStorage.getEventById(selectedEventId);
  const analytics = selectedEventId ? mockStorage.getEventAnalytics(selectedEventId) : null;
  const tasks = selectedEventId ? mockStorage.getTasks(selectedEventId) : [];

  if (!event || !analytics) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-neutral-500">Please create or select an event to view analytics.</p>
        <Link to="/organizer">
          <Button variant="outline" size="sm">Back to Console</Button>
        </Link>
      </div>
    );
  }

  const volunteerTasks = tasks.filter((t) => t.assignee_type === 'volunteer');
  const volCompleted = volunteerTasks.filter((t) => t.status === 'done').length;
  const volInProgress = volunteerTasks.filter((t) => t.status === 'in_progress').length;
  const volTodo = volunteerTasks.filter((t) => t.status === 'todo').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="space-y-3">
        <Link to="/organizer" className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Organizer Console</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Event Analytics & Operational Metrics
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Live indicators on participant registrations, volunteer throughput, and project submissions.
            </p>
          </div>

          <div className="flex items-center border border-slate-200 bg-white shadow-xs px-3 py-1.5 text-xs rounded-sm">
            <span className="text-neutral-500 mr-2">Target Event:</span>
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

      {/* 3 Core Metric Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-2 rounded-sm">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Participants & Teams</span>
            <div className="w-7 h-7 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900 tracking-tight">
            {analytics.participantCount}
          </div>
          <div className="text-xs text-neutral-500 font-mono">
            Across {analytics.teamCount} registered team(s)
          </div>
        </div>

        {/* Metric 2 */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-2 rounded-sm">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Volunteer Duty Throughput</span>
            <div className="w-7 h-7 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xs">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900 tracking-tight">
            {volunteerTasks.length > 0 ? Math.round((volCompleted / volunteerTasks.length) * 100) : 0}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 transition-all duration-500 rounded-full"
              style={{
                width: `${volunteerTasks.length > 0 ? (volCompleted / volunteerTasks.length) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="text-xs text-neutral-500 font-mono">
            {volCompleted} of {volunteerTasks.length} volunteer duties completed
          </div>
        </div>

        {/* Metric 3 */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-2 rounded-sm">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Project Submissions</span>
            <div className="w-7 h-7 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xs">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900 tracking-tight">
            {analytics.submissionStats.submitted}
          </div>
          <div className="text-xs text-neutral-500 font-mono">
            {analytics.marksCount} criteria evaluations recorded
          </div>
        </div>
      </div>

      {/* Deep Dive Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Volunteer Duty Execution */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-6 rounded-sm">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              Volunteer Duty Breakdown
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Real-time operational staff task progress across event zones.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-neutral-700">Completed Duties</span>
                <span className="text-emerald-700 font-mono">
                  {volCompleted} / {volunteerTasks.length} ({volunteerTasks.length > 0 ? Math.round((volCompleted / volunteerTasks.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{
                    width: `${volunteerTasks.length > 0 ? (volCompleted / volunteerTasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xs">
                <div className="text-slate-500 text-[11px]">To Do</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{volTodo}</div>
              </div>
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xs">
                <div className="text-blue-600 text-[11px]">In Progress</div>
                <div className="text-sm font-bold text-blue-700 mt-0.5">{volInProgress}</div>
              </div>
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xs">
                <div className="text-emerald-600 text-[11px]">Done</div>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">{volCompleted}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hackathon Evaluation & Submissions */}
        <div className="border border-slate-200 bg-white shadow-xs p-6 space-y-6 rounded-sm">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              Hackathon Evaluation Pipeline
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Project submission status and live judge assessments.
            </p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Submitted Projects</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-100 rounded-xs">
                {analytics.submissionStats.submitted} / {analytics.teamCount} teams
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Active Stage</span>
              <span className="font-bold text-slate-800">
                {event.rounds.find((r) => r.active)?.name || 'None Active'}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">Judge Mark Records</span>
              <span className="font-bold text-slate-700">
                {analytics.marksCount} recorded
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link to={`/organizer/hackathon?eventId=${selectedEventId}`}>
              <Button variant="outline" size="sm" className="space-x-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Open Hackathon & Judge Ops</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
