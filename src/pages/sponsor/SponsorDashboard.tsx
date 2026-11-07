import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { mockStorage } from '@/lib/mockStorage';
import { SponsorshipApplication, Task, Announcement, Event } from '@/types';
import { Button } from '@/components/ui/Button';
import { TaskWidget } from '@/components/TaskWidget';
import { AnnouncementFeed } from '@/components/AnnouncementFeed';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, Clock } from 'lucide-react';

export function SponsorDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState<SponsorshipApplication[]>(mockStorage.getSponsorshipApplications());
  const events = mockStorage.getEvents();
  const [selectedAppId, setSelectedAppId] = useState<string>(apps[0]?.id || '');

  const activeApp = apps.find((a) => a.id === selectedAppId) || apps[0];
  const targetEvent: Event | undefined = activeApp
    ? mockStorage.getEventById(activeApp.event_id)
    : events[0];

  const [tasks, setTasks] = useState<Task[]>(() =>
    targetEvent ? mockStorage.getTasks(targetEvent.id) : []
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    targetEvent ? mockStorage.getAnnouncements(targetEvent.id, 'sponsors') : []
  );

  const refresh = () => {
    const freshApps = mockStorage.getSponsorshipApplications();
    setApps(freshApps);
    if (targetEvent) {
      setTasks(mockStorage.getTasks(targetEvent.id));
      setAnnouncements(mockStorage.getAnnouncements(targetEvent.id, 'sponsors'));
    }
  };

  useEffect(() => {
    refresh();
    const unsub = mockStorage.subscribe(() => {
      refresh();
    });
    return () => unsub();
  }, [selectedAppId]);

  const handleUpdateStatus = (appId: string, newStatus: 'applied' | 'under_review' | 'confirmed') => {
    mockStorage.updateSponsorshipStatus(appId, newStatus);
    refresh();
  };

  const handleTaskStatus = (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    mockStorage.updateTaskStatus(taskId, status);
  };

  const getStatusBadge = (status: SponsorshipApplication['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed Partner</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Under Review</span>
          </span>
        );
      case 'applied':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300">
            <span>Applied (Pending)</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sponsor Operations Portal
            </h1>
            <span className="text-xs px-2.5 py-0.5 border border-blue-200 bg-blue-50 text-blue-700 font-bold font-mono">
              Partner Hub
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track application milestones, fulfill assigned deliverables, and communicate with organizers.
          </p>
        </div>

        <Link to="/sponsors">
          <Button variant="outline" size="sm">
            Browse More Hackathons →
          </Button>
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="p-8 border border-slate-200 bg-white text-center space-y-3 shadow-xs">
          <p className="text-sm text-slate-600">
            You do not have any active sponsorship applications yet.
          </p>
          <Link to="/sponsors">
            <Button size="sm">Explore Public Events Seeking Partners</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Application Status Tracker */}
          <div className="border border-slate-200 bg-white p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-600">
                  Application for {targetEvent?.name}
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  {activeApp.form_data.company_name} — {activeApp.form_data.tier}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Submitted {formatDate(activeApp.created_at)} • Contact: {activeApp.form_data.contact_email}
                </p>
              </div>

              <div>{getStatusBadge(activeApp.status)}</div>
            </div>

            {/* Stepper Progression: applied -> under review -> confirmed */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Application Progression:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div
                  className={`p-3 border font-semibold ${
                    activeApp.status === 'applied' || activeApp.status === 'under_review' || activeApp.status === 'confirmed'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 text-slate-400 bg-slate-50'
                  }`}
                >
                  1. Applied
                </div>
                <div
                  className={`p-3 border font-semibold ${
                    activeApp.status === 'under_review' || activeApp.status === 'confirmed'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 text-slate-400 bg-slate-50'
                  }`}
                >
                  2. Under Review
                </div>
                <div
                  className={`p-3 border font-semibold ${
                    activeApp.status === 'confirmed'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 text-slate-400 bg-slate-50'
                  }`}
                >
                  3. Confirmed Partner
                </div>
              </div>
            </div>

            {/* Interactive demo quick status toggle */}
            <div className="p-3.5 bg-blue-50/50 border border-blue-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <span className="text-blue-900 font-medium">Demo Simulator: Advance Status Stage:</span>
              <div className="flex items-center space-x-1.5">
                <Button
                  size="sm"
                  variant={activeApp.status === 'applied' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateStatus(activeApp.id, 'applied')}
                >
                  Applied
                </Button>
                <Button
                  size="sm"
                  variant={activeApp.status === 'under_review' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateStatus(activeApp.id, 'under_review')}
                >
                  Under Review
                </Button>
                <Button
                  size="sm"
                  variant={activeApp.status === 'confirmed' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateStatus(activeApp.id, 'confirmed')}
                >
                  Confirmed
                </Button>
              </div>
            </div>

            {/* Application Data Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3.5 border border-slate-100 bg-slate-50/70 space-y-1">
                <div className="font-bold text-slate-800">
                  Perks & Resources Offered:
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {activeApp.form_data.perks_offered}
                </p>
              </div>
              <div className="p-3.5 border border-slate-100 bg-slate-50/70 space-y-1">
                <div className="font-bold text-slate-800">
                  Booth & Stage Requirements:
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {activeApp.form_data.requirements}
                </p>
              </div>
            </div>
          </div>

          {/* Two Column: Sponsor Tasks & Announcements */}
          {targetEvent && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <TaskWidget
                  eventId={targetEvent.id}
                  tasks={tasks}
                  onUpdateStatus={handleTaskStatus}
                  filterAssigneeType="sponsor"
                  canCreate={false}
                  readOnly={true}
                  title="Sponsor Action Items & Deliverables"
                />
              </div>

              <div>
                <AnnouncementFeed
                  eventId={targetEvent.id}
                  announcements={announcements}
                  canPost={false}
                  title="Organizer Updates for Sponsors"
                  currentAudienceFilter="sponsors"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
