import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockStorage } from '@/lib/mockStorage';
import { Task } from '@/types';
import { TaskWidget } from '@/components/TaskWidget';
import { EmptyState } from '@/components/EmptyState';
import { ArrowRight } from 'lucide-react';

export function OrganizerTasksPage() {
  const events = mockStorage.getEvents();
  const activeEvent = events[0];

  const [tasks, setTasks] = useState<Task[]>(() =>
    activeEvent ? mockStorage.getTasks(activeEvent.id) : []
  );

  const refresh = () => {
    if (!activeEvent) return;
    setTasks(mockStorage.getTasks(activeEvent.id));
  };

  useEffect(() => {
    refresh();
    const unsub = mockStorage.subscribe(() => {
      refresh();
    });
    return () => unsub();
  }, [activeEvent?.id]);

  const handleUpdateStatus = (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    mockStorage.updateTaskStatus(taskId, status);
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'created_at'>) => {
    mockStorage.createTask(taskData);
  };

  if (!activeEvent) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Delegation</h1>
          <p className="text-xs text-slate-500 mt-1">Assign duties to volunteers and corporate sponsors.</p>
        </div>
        <EmptyState
          message="No active event found. Create an event to begin assigning tasks."
          actionLabel="Create Event"
          onAction={() => {
            window.location.href = '/organizer/events/new';
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Task Delegation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign and monitor deliverables for volunteers and sponsors for <strong className="text-slate-800">{activeEvent.name}</strong>.
          </p>
        </div>

        <Link
          to={`/organizer/events/${activeEvent.id}?tab=volunteers`}
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xs"
        >
          <span>Open in Event Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Task Widget reusable component */}
      <TaskWidget
        eventId={activeEvent.id}
        tasks={tasks}
        onUpdateStatus={handleUpdateStatus}
        onCreateTask={handleCreateTask}
        canCreate={true}
        readOnly
        title="Active Event Task Board"
      />
    </div>
  );
}

