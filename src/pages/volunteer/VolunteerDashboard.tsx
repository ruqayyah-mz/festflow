import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { Task, Event, Announcement, Role } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { AnnouncementFeed } from '@/components/AnnouncementFeed';
import { formatDate } from '@/lib/utils';
import { Clock, Check, ListTodo, Award, CheckCircle2, ShieldCheck } from 'lucide-react';

export function VolunteerDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryEventId = searchParams.get('eventId');
  const isDirect = searchParams.get('directAccess') === 'true';

  const events = mockStorage.getEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    queryEventId || events[0]?.id || ''
  );
  const [showDirectAccessBanner, setShowDirectAccessBanner] = useState(isDirect);

  useEffect(() => {
    if (queryEventId && queryEventId !== selectedEventId) {
      setSelectedEventId(queryEventId);
    }
  }, [queryEventId]);

  const event: Event | undefined = mockStorage.getEventById(selectedEventId);
  const roles: Role[] = mockStorage.getRoles(selectedEventId);
  const myRole = roles.find((r) => r.user_id === user?.id && r.role_type === 'volunteer');

  const [tasks, setTasks] = useState<Task[]>(() =>
    selectedEventId ? mockStorage.getTasks(selectedEventId) : []
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    selectedEventId ? mockStorage.getAnnouncements(selectedEventId, 'volunteers') : []
  );
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');

  const refreshData = () => {
    if (!selectedEventId) return;
    setTasks(mockStorage.getTasks(selectedEventId));
    setAnnouncements(mockStorage.getAnnouncements(selectedEventId, 'volunteers'));
  };

  useEffect(() => {
    refreshData();
    const unsub = mockStorage.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, [selectedEventId]);

  const handleUpdateStatus = (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    mockStorage.updateTaskStatus(taskId, status);
  };

  // Volunteer tasks for this event
  const myTasks = tasks.filter((t) => t.assignee_type === 'volunteer');
  const completedCount = myTasks.filter((t) => t.status === 'done').length;
  const inProgressCount = myTasks.filter((t) => t.status === 'in_progress').length;
  const todoCount = myTasks.filter((t) => t.status === 'todo').length;
  const completionRate = myTasks.length > 0 ? Math.round((completedCount / myTasks.length) * 100) : 0;

  const filteredTasks = activeTab === 'all' ? myTasks : myTasks.filter((t) => t.status === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Direct Volunteer Access Banner */}
      {showDirectAccessBanner && (
        <div className="p-4 border border-blue-200 bg-blue-50/80 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs">
              <span className="font-bold text-blue-900 uppercase tracking-wider block sm:inline mr-2">
                Direct Volunteer Access Active
              </span>
              <span>
                Authenticated as <strong className="text-blue-950">{user?.full_name}</strong> for <strong className="text-blue-950">{event?.name}</strong>. Duty: <strong className="text-blue-950">{myRole?.role_title || 'General Volunteer Staff'}</strong>.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowDirectAccessBanner(false)}
            className="text-xs text-blue-700 hover:text-blue-900 font-mono hover:underline cursor-pointer shrink-0 self-end sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Volunteer Operations & Task List
            </h1>
            <span className="text-xs px-2.5 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-bold font-mono">
              Staff Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track and toggle your event duties in real-time. Optimized for mobile devices during venue shifts.
          </p>
        </div>

        <div className="flex items-center border border-slate-300 bg-white px-3 py-1.5 text-xs shadow-2xs self-start sm:self-auto">
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

      {/* Volunteer Profile & Portfolio Stats */}
      <div className="border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-100">
              Assigned Staff Role
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              {myRole?.role_title || 'Hacker Experience & Logistics Lead'}
            </h2>
            <p className="text-xs text-slate-500">
              Staff Member: <strong className="text-slate-800">{user?.full_name}</strong> • Event: <strong className="text-slate-800">{event?.name}</strong>
            </p>
          </div>

          {/* Portfolio Metric Pill */}
          <div className="p-3.5 border border-blue-200 bg-blue-50/60 flex items-center space-x-4 shadow-2xs">
            <Award className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-800">
                Staff Throughput Portfolio
              </div>
              <div className="text-base font-bold text-blue-900 mt-0.5">
                {completionRate}% Complete ({completedCount}/{myTasks.length})
              </div>
            </div>
          </div>
        </div>

        {/* Flat Progress bar */}
        <div className="w-full bg-slate-100 h-2">
          <div
            className="bg-blue-600 h-2 transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Two column: Mobile-optimized Tasks & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List (2 cols) */}
        <div className="lg:col-span-2 border border-slate-200 bg-white shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ListTodo className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                My Assigned Duty List
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {myTasks.length} active duties
            </span>
          </div>

          {/* Mobile Filter Tabs */}
          <div className="flex border-b border-slate-200 text-xs px-4 bg-slate-50/70 overflow-x-auto">
            {(['all', 'todo', 'in_progress', 'done'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 px-3.5 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-700 bg-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-blue-600'
                }`}
              >
                {tab === 'all'
                  ? `All (${myTasks.length})`
                  : tab === 'todo'
                  ? `To Do (${todoCount})`
                  : tab === 'in_progress'
                  ? `In Progress (${inProgressCount})`
                  : `Done (${completedCount})`}
              </button>
            ))}
          </div>

          {/* Duties list */}
          <div className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  message={
                    activeTab === 'all'
                      ? 'No volunteer duties currently assigned.'
                      : `No duties marked as "${activeTab.replace('_', ' ')}".`
                  }
                />
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 flex flex-col gap-3 hover:bg-blue-50/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 border ${
                        task.status === 'done'
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                          : task.status === 'in_progress'
                          ? 'border-blue-300 text-blue-700 bg-blue-50'
                          : 'border-slate-300 text-slate-600 bg-slate-100'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.due_at && (
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> Due {formatDate(task.due_at)}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-semibold text-slate-900 ${
                      task.status === 'done' ? 'line-through text-slate-400' : ''
                    }`}>
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Fast Mobile Status Toggle Strip */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      Update Status:
                    </span>
                    <div className="inline-flex border border-slate-200 p-0.5 bg-slate-50">
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'todo')}
                        className={`px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                          task.status === 'todo'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        To Do
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                        className={`px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                          task.status === 'in_progress'
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'done')}
                        className={`px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff Announcements (1 col) */}
        <div>
          <AnnouncementFeed
            eventId={selectedEventId}
            announcements={announcements}
            canPost={false}
            title="Volunteer Staff Alerts"
            currentAudienceFilter="volunteers"
          />
        </div>
      </div>
    </div>
  );
}
