import React, { useState } from 'react';
import { Task } from '@/types';
import { Button } from './ui/Button';
import { Input, Textarea, Select } from './ui/Input';
import { EmptyState } from './EmptyState';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Check, Clock, CheckCircle } from 'lucide-react';

interface TaskWidgetProps {
  eventId: string;
  tasks: Task[];
  onUpdateStatus: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void;
  onCreateTask?: (taskData: Omit<Task, 'id' | 'created_at'>) => void;
  canCreate?: boolean;
  readOnly?: boolean;
  filterAssigneeId?: string;
  filterAssigneeType?: 'volunteer' | 'sponsor';
  title?: string;
}

export function TaskWidget({
  eventId,
  tasks,
  onUpdateStatus,
  onCreateTask,
  canCreate = false,
  readOnly = false,
  filterAssigneeId,
  filterAssigneeType,
  title = 'Task Management',
}: TaskWidgetProps) {
  const { availableProfiles } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssigneeType, setTaskAssigneeType] = useState<'volunteer' | 'sponsor'>(
    filterAssigneeType || 'volunteer'
  );
  const [taskAssigneeId, setTaskAssigneeId] = useState(filterAssigneeId || '');
  const [taskDueAt, setTaskDueAt] = useState('');
  const [formError, setFormError] = useState('');

  // Scoped tasks based on props
  const scopedTasks = tasks
    .filter((t) => (!filterAssigneeId || t.assignee_id === filterAssigneeId))
    .filter((t) => (!filterAssigneeType || t.assignee_type === filterAssigneeType));

  const completedCount = scopedTasks.filter((t) => t.status === 'done').length;
  const inProgressCount = scopedTasks.filter((t) => t.status === 'in_progress').length;
  const todoCount = scopedTasks.filter((t) => t.status === 'todo').length;
  const totalCount = scopedTasks.length;

  const filtered = activeTab === 'all'
    ? scopedTasks
    : scopedTasks.filter((t) => t.status === activeTab);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!onCreateTask) return;

    const assignedProfile = availableProfiles.find((p) => p.id === taskAssigneeId);

    onCreateTask({
      event_id: eventId,
      assignee_type: taskAssigneeType,
      assignee_id: taskAssigneeId || null,
      assignee_name: assignedProfile ? assignedProfile.full_name : undefined,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      status: 'todo',
      due_at: taskDueAt ? new Date(taskDueAt).toISOString() : null,
    });

    setTaskTitle('');
    setTaskDescription('');
    setTaskDueAt('');
    setFormError('');
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200">
            In Progress
          </span>
        );
      case 'todo':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200">
            To Do
          </span>
        );
    }
  };

  return (
    <div className="border border-slate-200 bg-white shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="text-blue-600 font-semibold">{completedCount}</span> of {totalCount} tasks completed
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {canCreate && (
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="space-x-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs px-4 bg-slate-50/70 overflow-x-auto">
        {(['all', 'todo', 'in_progress', 'done'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-3.5 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-blue-600 hover:bg-slate-100/50'
            }`}
          >
            {tab === 'all'
              ? `All (${totalCount})`
              : tab === 'todo'
              ? `To Do (${todoCount})`
              : tab === 'in_progress'
              ? `In Progress (${inProgressCount})`
              : `Done (${completedCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              message={
                activeTab === 'all'
                  ? 'No tasks assigned yet.'
                  : `No tasks currently marked as "${activeTab.replace('_', ' ')}".`
              }
              actionLabel={canCreate ? 'Create First Task' : undefined}
              onAction={canCreate ? () => setIsModalOpen(true) : undefined}
            />
          </div>
        ) : (
          filtered.map((task) => (
            <div
              key={task.id}
              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-blue-50/20 transition-colors"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                    {task.assignee_type}
                  </span>
                  {getStatusBadge(task.status)}
                  {task.due_at && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" /> Due {formatDate(task.due_at)}
                    </span>
                  )}
                </div>
                <h4
                  className={`text-sm font-semibold text-slate-900 ${
                    task.status === 'done' ? 'line-through text-slate-400' : ''
                  }`}
                >
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {task.description}
                  </p>
                )}
                {task.assignee_name && (
                  <p className="text-xs text-slate-500">
                    Assigned to: <span className="font-semibold text-slate-700">{task.assignee_name}</span>
                  </p>
                )}
              </div>

              {/* Status toggles — only shown when not readOnly (i.e. volunteer view) */}
              {!readOnly && (
                <div className="flex items-center space-x-1 shrink-0 self-start md:self-center border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    onClick={() => onUpdateStatus(task.id, 'todo')}
                    className={`px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      task.status === 'todo'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    To Do
                  </button>
                  <button
                    onClick={() => onUpdateStatus(task.id, 'in_progress')}
                    className={`px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      task.status === 'in_progress'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => onUpdateStatus(task.id, 'done')}
                    className={`px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      task.status === 'done'
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> Done
                    </span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 p-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Assign New Task
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <Input
                label="Task Title"
                placeholder="e.g. Verify power strips at tables 1-10"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                error={formError}
                required
              />

              <Textarea
                label="Instructions & Details (Optional)"
                placeholder="Provide specific notes, room numbers, or contact details..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />

              <div className={`grid ${filterAssigneeType ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-4`}>
                {!filterAssigneeType && (
                  <Select
                    label="Target Group"
                    value={taskAssigneeType}
                    onChange={(e) => setTaskAssigneeType(e.target.value as 'volunteer' | 'sponsor')}
                    options={[
                      { value: 'volunteer', label: 'Volunteers' },
                      { value: 'sponsor', label: 'Sponsors' },
                    ]}
                  />
                )}

                <Select
                  label="Assignee (Optional)"
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                >
                  <option value="">Unassigned (Any {taskAssigneeType})</option>
                  {availableProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                label="Due Date / Time"
                type="datetime-local"
                value={taskDueAt}
                onChange={(e) => setTaskDueAt(e.target.value)}
              />

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
