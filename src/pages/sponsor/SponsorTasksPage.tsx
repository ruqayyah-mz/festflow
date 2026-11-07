import { useState, useEffect } from 'react';
import { mockStorage } from '@/lib/mockStorage';
import { Task, Event } from '@/types';
import { TaskWidget } from '@/components/TaskWidget';
import { EmptyState } from '@/components/EmptyState';

export function SponsorTasksPage() {
  const events = mockStorage.getPublicEvents();
  const activeEvent: Event | undefined = events[0];

  const [tasks, setTasks] = useState<Task[]>(() =>
    activeEvent ? mockStorage.getTasks(activeEvent.id).filter((t) => t.assignee_type === 'sponsor') : []
  );

  const refresh = () => {
    if (!activeEvent) return;
    const sponsorTasks = mockStorage.getTasks(activeEvent.id).filter((t) => t.assignee_type === 'sponsor');
    setTasks(sponsorTasks);
  };

  useEffect(() => {
    refresh();
    const unsub = mockStorage.subscribe(() => {
      refresh();
    });
    return () => unsub();
  }, [activeEvent?.id]);

  const handleStatusChange = (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    mockStorage.updateTaskStatus(taskId, status);
  };

  if (!activeEvent) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sponsor Deliverables & Tasks</h1>
          <p className="text-xs text-slate-500 mt-1">Fulfill key event partner commitments.</p>
        </div>
        <EmptyState
          message="No active events found."
          actionLabel="Browse Events"
          onAction={() => {
            window.location.href = '/sponsor';
          }}
        />
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sponsor Deliverables & Tasks
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Deliverables, workshop slides, and booth requirements for <strong className="text-slate-800">{activeEvent.name}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 px-3 py-1.5 font-mono text-xs text-blue-800">
            <span>Completed:</span>
            <strong>{completedCount} / {tasks.length}</strong>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          message="No deliverables currently assigned for your sponsorship tier."
          actionLabel="Browse Events"
          onAction={() => {
            window.location.href = '/sponsor';
          }}
        />
      ) : (
        <TaskWidget
          eventId={activeEvent.id}
          tasks={tasks}
          onUpdateStatus={handleStatusChange}
          filterAssigneeType="sponsor"
          readOnly={false}
          title="Assigned Partner Deliverables"
        />
      )}
    </div>
  );
}
