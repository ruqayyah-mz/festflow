import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { Task } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { PushNotificationsCard } from '@/components/volunteer/PushNotificationsCard';
import { formatDate } from '@/lib/utils';
import { Clock, CheckCircle2, Award } from 'lucide-react';

export function VolunteerTasksPage() {
  const { eventId = '' } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => mockStorage.getTasks(eventId));
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');

  useEffect(() => {
    setTasks(mockStorage.getTasks(eventId));
    return mockStorage.subscribe(() => setTasks(mockStorage.getTasks(eventId)));
  }, [eventId]);

  const isPast = mockStorage.isEventConcluded(eventId);

  const handleUpdateStatus = (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    run(() => mockStorage.updateTaskStatus(taskId, status));
  };

  // My tasks = assigned to me (directly or taken up). Open tasks = "General", anyone may take them up.
  const volunteerTasks = tasks.filter((t) => t.assignee_type === 'volunteer' && t.assignee_id === user?.id);
  const openTasks = tasks.filter((t) => t.assignee_type === 'volunteer' && !t.assignee_id);

  const [claimError, setClaimError] = useState<string | null>(null);
  const run = (fn: () => void) => {
    try {
      setClaimError(null);
      fn();
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };
  const completedTasks = volunteerTasks.filter((t) => t.status === 'done');

  const filteredTasks =
    activeTab === 'all'
      ? volunteerTasks
      : volunteerTasks.filter((t) => t.status === activeTab);

  return (
    <div className="space-y-6">
      <PushNotificationsCard />

      <div className="flex items-center justify-end text-xs font-mono">
        <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 font-bold">
          {completedTasks.length} / {volunteerTasks.length} Done (
          {volunteerTasks.length > 0 ? Math.round((completedTasks.length / volunteerTasks.length) * 100) : 0}%)
        </span>
      </div>

      {claimError && (
        <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700" role="alert">
          {claimError}
        </div>
      )}

      {/* Open tasks anyone can take up */}
      {openTasks.length > 0 && (
        <div className="border border-emerald-200 bg-emerald-50/30 p-5 space-y-3">
          <div className="border-b border-emerald-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Open Tasks ({openTasks.length})
            </h2>
            <p className="text-[11px] text-emerald-800/80">
              Assigned to all volunteers. Take one up and it moves to your list.
            </p>
          </div>
          <div className="divide-y divide-emerald-100/60">
            {openTasks.map((t) => (
              <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 text-sm">{t.title}</div>
                  {t.description && <p className="text-slate-600">{t.description}</p>}
                  {t.due_at && (
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>Target: {formatDate(t.due_at)}</span>
                    </div>
                  )}
                </div>
                {!isPast && (
                  <button
                    type="button"
                    onClick={() => run(() => mockStorage.claimTask(t.id))}
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  >
                    Take Up Task
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex space-x-1">
          {(['all', 'todo', 'in_progress', 'done'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Task List (Home Screen) */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          message="No tasks match the selected filter."
          actionLabel="Show All Tasks"
          onAction={() => setActiveTab('all')}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => {
            return (
              <div
                key={t.id}
                className="border border-slate-200 bg-white p-5 shadow-2xs space-y-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 border ${
                          t.status === 'done'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : t.status === 'in_progress'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {t.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {t.description}
                    </p>

                    {t.due_at && (
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 pt-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>Target: {formatDate(t.due_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle buttons: todo / in-progress / done — locked once the event has concluded */}
                  <fieldset
                    disabled={isPast}
                    className="flex items-center border border-slate-200 bg-slate-50 p-1 shrink-0 gap-1 text-xs font-medium disabled:opacity-60 [&_button]:disabled:cursor-not-allowed"
                  >
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'todo')}
                      className={`px-2 py-1 text-[11px] cursor-pointer transition-colors ${
                        t.status === 'todo'
                          ? 'bg-white font-bold text-slate-900 shadow-2xs border border-slate-300'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Todo
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'in_progress')}
                      className={`px-2 py-1 text-[11px] cursor-pointer transition-colors ${
                        t.status === 'in_progress'
                          ? 'bg-blue-600 font-bold text-white shadow-2xs'
                          : 'text-slate-500 hover:text-blue-700'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(t.id, 'done')}
                      className={`px-2 py-1 text-[11px] cursor-pointer transition-colors ${
                        t.status === 'done'
                          ? 'bg-emerald-600 font-bold text-white shadow-2xs'
                          : 'text-slate-500 hover:text-emerald-700'
                      }`}
                    >
                      Done
                    </button>
                  </fieldset>
                  {t.claimed_at && t.status !== 'done' && !isPast && (
                    <button
                      type="button"
                      onClick={() => run(() => mockStorage.releaseTask(t.id))}
                      className="text-[11px] text-slate-500 hover:text-red-600 underline cursor-pointer shrink-0"
                      title="Put this task back in Open Tasks"
                    >
                      Release
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Tasks Portfolio View */}
      <div className="border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Volunteer Contribution Portfolio ({completedTasks.length} Done)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Completed Operations
          </span>
        </div>

        {completedTasks.length === 0 ? (
          <EmptyState
            message="No tasks marked completed yet. Complete your first task to build your portfolio."
            actionLabel="View Todo Tasks"
            onAction={() => setActiveTab('todo')}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {completedTasks.map((ct) => (
              <div key={ct.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-900">{ct.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-md">
                    {ct.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {ct.verified_at ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      ✓ Verified by organizer
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                      Awaiting verification
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

