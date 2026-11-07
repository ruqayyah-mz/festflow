import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { RoleGuard } from './lib/guards';
import { PublicHeader } from './components/layout/PublicHeader';

// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { PublicEventsPage } from './pages/PublicEventsPage';
import { PublicEventViewPage } from './pages/PublicEventViewPage';
import { LoginPage } from './pages/auth/LoginPage';

// Judge Page (No login, single-purpose, mobile-first, standalone)
import { JudgeMarkingPage } from './pages/judge/JudgeMarkingPage';

// Organizer Dashboard
import { OrganizerLayout } from './pages/organizer/OrganizerLayout';
import { OrganizerOverviewPage } from './pages/organizer/OrganizerOverviewPage';
import { OrganizerEventWorkspacePage } from './pages/organizer/OrganizerEventWorkspacePage';
import { OrganizerEventsPage } from './pages/organizer/OrganizerEventsPage';
import { CreateEventPage } from './pages/organizer/CreateEventPage';
import { EditEventPage } from './pages/organizer/EditEventPage';
import { OrganizerTasksPage } from './pages/organizer/OrganizerTasksPage';
import { OrganizerAnnouncementsPage } from './pages/organizer/OrganizerAnnouncementsPage';
import { OrganizerJudgingPage } from './pages/organizer/OrganizerJudgingPage';
import { OrganizerPeoplePage } from './pages/organizer/OrganizerPeoplePage';
import { EventOverviewPage } from './pages/organizer/event/EventOverviewPage';
import { EventVolunteersPage } from './pages/organizer/event/EventVolunteersPage';
import { EventParticipantsPage } from './pages/organizer/event/EventParticipantsPage';
import { EventJudgingPage } from './pages/organizer/event/EventJudgingPage';
import { EventSponsorshipsPage } from './pages/organizer/event/EventSponsorshipsPage';
import { EventAnnouncementsPage } from './pages/organizer/event/EventAnnouncementsPage';
import { OrganizerSponsorshipMarketplacePage } from './pages/organizer/OrganizerSponsorshipMarketplacePage';

// Participant Dashboard
import { ParticipantLayout } from './pages/participant/ParticipantLayout';
import { ParticipantAllEventsPage } from './pages/participant/ParticipantAllEventsPage';
import { ParticipantMyEventsPage } from './pages/participant/ParticipantMyEventsPage';
import { ParticipantEventLayout } from './pages/participant/ParticipantEventLayout';
import { ParticipantEventOverviewPage } from './pages/participant/ParticipantEventOverviewPage';
import { ParticipantSubmissionPage } from './pages/participant/ParticipantSubmissionPage';
import { ParticipantAnnouncementsPage } from './pages/participant/ParticipantAnnouncementsPage';

// Volunteer Dashboard
import { VolunteerLayout } from './pages/volunteer/VolunteerLayout';
import { VolunteerTasksPage } from './pages/volunteer/VolunteerTasksPage';
import { VolunteerAnnouncementsPage } from './pages/volunteer/VolunteerAnnouncementsPage';
import { VolunteerRolePage } from './pages/volunteer/VolunteerRolePage';
import { VolunteerInvitePage } from './pages/volunteer/VolunteerInvitePage';
import { VolunteerBrowsePage } from './pages/volunteer/VolunteerBrowsePage';
import { VolunteerMyEventsPage } from './pages/volunteer/VolunteerMyEventsPage';
import { VolunteerEventLayout } from './pages/volunteer/VolunteerEventLayout';
import { VolunteerAccountProfilePage } from './pages/volunteer/VolunteerAccountProfilePage';

// Sponsor Dashboard
import { SponsorLayout } from './pages/sponsor/SponsorLayout';
import { SponsorBrowsePage } from './pages/sponsor/SponsorBrowsePage';
import { SponsorApplicationsPage } from './pages/sponsor/SponsorApplicationsPage';
import { SponsorApplicationPage } from './pages/sponsor/SponsorApplicationPage';
import { SponsorTasksPage } from './pages/sponsor/SponsorTasksPage';
import { SponsorOffersPage } from './pages/sponsor/SponsorOffersPage';
import { SponsorOfferApplicationsPage } from './pages/sponsor/SponsorOfferApplicationsPage';

const queryClient = new QueryClient();

// Public Layout Wrapper with PublicHeader and Footer
function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-blue-600">FestFlow</span>
            <span>—</span>
            <span>Event & Hackathon Operating System</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Role-Isolated Dashboard Architecture</span>
            <span>•</span>
            <span>Autonomous Coordination</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Judge page: Single-purpose, mobile-first, no login, no shared shell */}
            <Route path="/judge/:token" element={<JudgeMarkingPage />} />

            {/* Volunteer direct token access routes */}
            <Route path="/volunteer/access/:token" element={<VolunteerInvitePage />} />
            <Route path="/invite/:token" element={<VolunteerInvitePage />} />

            {/* Organizer Dashboard Routes (Protected by RoleGuard allowedRoles=['organizer']) */}
            <Route
              path="/organizer"
              element={
                <RoleGuard allowedRoles={['organizer']}>
                  <OrganizerLayout />
                </RoleGuard>
              }
            >
              <Route index element={<OrganizerOverviewPage />} />
              <Route path="events" element={<OrganizerOverviewPage />} />
              <Route path="events/new" element={<CreateEventPage />} />
              <Route path="events/:eventId" element={<EventOverviewPage />} />
              <Route path="events/:eventId/edit" element={<EditEventPage />} />
              <Route path="events/:eventId/volunteers" element={<EventVolunteersPage />} />
              <Route path="events/:eventId/participants" element={<EventParticipantsPage />} />
              <Route path="events/:eventId/judging" element={<EventJudgingPage />} />
              <Route path="events/:eventId/sponsorships" element={<EventSponsorshipsPage />} />
              <Route path="events/:eventId/sponsor-marketplace" element={<OrganizerSponsorshipMarketplacePage />} />
              <Route path="events/:eventId/announcements" element={<EventAnnouncementsPage />} />
              <Route path="sponsorship-marketplace" element={<OrganizerSponsorshipMarketplacePage />} />
              <Route path="tasks" element={<OrganizerTasksPage />} />
              <Route path="announcements" element={<OrganizerAnnouncementsPage />} />
              <Route path="judging" element={<OrganizerJudgingPage />} />
              <Route path="people" element={<OrganizerPeoplePage />} />
            </Route>

            {/* Participant Dashboard Routes (Protected by RoleGuard allowedRoles=['participant']) */}
            <Route
              path="/participant"
              element={
                <RoleGuard allowedRoles={['participant']}>
                  <ParticipantLayout />
                </RoleGuard>
              }
            >
              <Route index element={<ParticipantAllEventsPage />} />
              <Route path="my-events" element={<ParticipantMyEventsPage />} />
              <Route path="events/:eventId" element={<ParticipantEventLayout />}>
                <Route index element={<ParticipantEventOverviewPage />} />
                <Route path="submission" element={<ParticipantSubmissionPage />} />
                <Route path="announcements" element={<ParticipantAnnouncementsPage />} />
              </Route>
            </Route>

            {/* Volunteer Dashboard Routes (Protected by RoleGuard allowedRoles=['volunteer']) */}
            <Route
              path="/volunteer"
              element={
                <RoleGuard allowedRoles={['volunteer']}>
                  <VolunteerLayout />
                </RoleGuard>
              }
            >
              <Route index element={<VolunteerBrowsePage />} />
              <Route path="my-events" element={<VolunteerMyEventsPage />} />
              <Route path="profile" element={<VolunteerAccountProfilePage />} />
              <Route path="events/:eventId" element={<VolunteerEventLayout />}>
                <Route index element={<VolunteerTasksPage />} />
                <Route path="announcements" element={<VolunteerAnnouncementsPage />} />
                <Route path="profile" element={<VolunteerRolePage />} />
              </Route>
            </Route>

            {/* Sponsor Dashboard Routes (Protected by RoleGuard allowedRoles=['sponsor']) */}
            <Route
              path="/sponsor"
              element={
                <RoleGuard allowedRoles={['sponsor']}>
                  <SponsorLayout />
                </RoleGuard>
              }
            >
              <Route index element={<SponsorBrowsePage />} />
              <Route path="applications" element={<SponsorApplicationsPage />} />
              <Route path="offers" element={<SponsorOffersPage />} />
              <Route path="offer-applications" element={<SponsorOfferApplicationsPage />} />
              <Route path="tasks" element={<SponsorTasksPage />} />
              <Route path="apply/:eventId" element={<SponsorApplicationPage />} />
            </Route>

            {/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/events" element={<PublicEventsPage />} />
              <Route path="/events/:eventId" element={<PublicEventViewPage />} />
              <Route path="/login" element={<LoginPage />} />
              {/* Legacy redirect alias for sponsors */}
              <Route path="/sponsors" element={<Navigate to="/sponsor" replace />} />
              <Route path="/sponsor/dashboard" element={<Navigate to="/sponsor/applications" replace />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
