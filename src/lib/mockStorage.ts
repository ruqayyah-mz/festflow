import {
  Event,
  Profile,
  Role,
  Team,
  Submission,
  Task,
  Announcement,
  JudgeLink,
  SponsorshipApplication,
  Invite,
  Mark,
  MarkCriteria,
  RoleType,
  VolunteerApplication,
  AttendanceRecord,
  UserNotification,
  VolunteerDetails,
} from '@/types';
import {
  INITIAL_PROFILES,
  INITIAL_EVENTS,
  INITIAL_ROLES,
  INITIAL_INVITES,
  INITIAL_TEAMS,
  INITIAL_SUBMISSIONS,
  INITIAL_TASKS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_JUDGE_LINKS,
  INITIAL_MARKS,
  INITIAL_SPONSOR_APPS,
  INITIAL_VOLUNTEER_APPS,
  INITIAL_ATTENDANCE,
} from './mockData';
import { getCriteria, maxScore, validateCriteria } from './judging';
import { getParticipation, validateRounds, validateTeamSize, getRegistrationStatus, validateRegistrationDeadlines, RegistrationKind } from './eventRules';

type Listener = () => void;

// Millisecond timestamps alone collide when two records are created in the same tick.
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

class MockStorage {
  private listeners: Set<Listener> = new Set();
  private currentUser: Profile;
  private currentRole: RoleType;

  constructor() {
    this.initStorage();
    const storedUser = localStorage.getItem('festflow_current_user');
    const storedRole = localStorage.getItem('festflow_current_role');

    this.currentUser = storedUser ? JSON.parse(storedUser) : INITIAL_PROFILES[0];
    this.currentRole = (storedRole as RoleType) || 'organizer';
  }

  private initStorage() {
    if (!localStorage.getItem('festflow_events')) {
      localStorage.setItem('festflow_events', JSON.stringify(INITIAL_EVENTS));
    }
    if (!localStorage.getItem('festflow_profiles')) {
      localStorage.setItem('festflow_profiles', JSON.stringify(INITIAL_PROFILES));
    }
    if (!localStorage.getItem('festflow_roles')) {
      localStorage.setItem('festflow_roles', JSON.stringify(INITIAL_ROLES));
    }
    if (!localStorage.getItem('festflow_invites')) {
      localStorage.setItem('festflow_invites', JSON.stringify(INITIAL_INVITES));
    }
    if (!localStorage.getItem('festflow_teams')) {
      localStorage.setItem('festflow_teams', JSON.stringify(INITIAL_TEAMS));
    }
    if (!localStorage.getItem('festflow_submissions')) {
      localStorage.setItem('festflow_submissions', JSON.stringify(INITIAL_SUBMISSIONS));
    }
    if (!localStorage.getItem('festflow_tasks')) {
      localStorage.setItem('festflow_tasks', JSON.stringify(INITIAL_TASKS));
    }
    if (!localStorage.getItem('festflow_announcements')) {
      localStorage.setItem('festflow_announcements', JSON.stringify(INITIAL_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem('festflow_judge_links')) {
      localStorage.setItem('festflow_judge_links', JSON.stringify(INITIAL_JUDGE_LINKS));
    }
    if (!localStorage.getItem('festflow_marks')) {
      localStorage.setItem('festflow_marks', JSON.stringify(INITIAL_MARKS));
    }
    if (!localStorage.getItem('festflow_sponsor_apps')) {
      localStorage.setItem('festflow_sponsor_apps', JSON.stringify(INITIAL_SPONSOR_APPS));
    }
    if (!localStorage.getItem('festflow_volunteer_apps')) {
      localStorage.setItem('festflow_volunteer_apps', JSON.stringify(INITIAL_VOLUNTEER_APPS));
    }
    if (!localStorage.getItem('festflow_attendance')) {
      localStorage.setItem('festflow_attendance', JSON.stringify(INITIAL_ATTENDANCE));
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetToDefaults() {
    localStorage.removeItem('festflow_events');
    localStorage.removeItem('festflow_profiles');
    localStorage.removeItem('festflow_roles');
    localStorage.removeItem('festflow_invites');
    localStorage.removeItem('festflow_teams');
    localStorage.removeItem('festflow_submissions');
    localStorage.removeItem('festflow_tasks');
    localStorage.removeItem('festflow_announcements');
    localStorage.removeItem('festflow_judge_links');
    localStorage.removeItem('festflow_marks');
    localStorage.removeItem('festflow_sponsor_apps');
    localStorage.removeItem('festflow_volunteer_apps');
    localStorage.removeItem('festflow_attendance');
    localStorage.removeItem('festflow_notifications');
    localStorage.removeItem('festflow_volunteer_profiles');
    this.initStorage();
    this.currentUser = INITIAL_PROFILES[0];
    this.currentRole = 'organizer';
    localStorage.setItem('festflow_current_user', JSON.stringify(this.currentUser));
    localStorage.setItem('festflow_current_role', 'organizer');
    this.notify();
  }

  public isEventConcluded(eventId: string | undefined): boolean {
    const evt = eventId ? this.getEventById(eventId) : undefined;
    return !!evt && new Date(evt.ends_at).getTime() < Date.now();
  }

  // Concluded events are a historical record; every write path goes through this.
  private assertEditable(eventId: string | undefined) {
    if (this.isEventConcluded(eventId)) throw new Error('This event has concluded and is read-only.');
  }

  // --- Volunteer self-written profile ---
  public getVolunteerDetails(userId: string): VolunteerDetails | undefined {
    const all: Record<string, VolunteerDetails> = JSON.parse(localStorage.getItem('festflow_volunteer_profiles') || '{}');
    return all[userId];
  }

  public saveVolunteerDetails(details: Omit<VolunteerDetails, 'user_id' | 'updated_at'>): VolunteerDetails {
    if (this.currentRole !== 'volunteer') throw new Error('Switch to your volunteer account to edit this profile.');
    const all: Record<string, VolunteerDetails> = JSON.parse(localStorage.getItem('festflow_volunteer_profiles') || '{}');
    const saved: VolunteerDetails = { ...details, user_id: this.currentUser.id, updated_at: new Date().toISOString() };
    all[this.currentUser.id] = saved;
    localStorage.setItem('festflow_volunteer_profiles', JSON.stringify(all));
    this.notify();
    return saved;
  }

  // --- Role conflicts: one person can't be both a participant and a volunteer at the same event ---
  public isParticipantIn(eventId: string, userId: string): boolean {
    const raw: Team[] = JSON.parse(localStorage.getItem('festflow_teams') || '[]');
    return (
      this.getRoles(eventId).some((r) => r.user_id === userId && r.role_type === 'participant') ||
      raw.some((t) => t.event_id === eventId && t.members?.some((m) => m.id === userId))
    );
  }

  // Registering creates the participant role; a team can be created or joined afterwards from the event Overview.
  public registerForEvent(eventId: string): Role {
    this.assertEditable(eventId);
    if (this.currentRole !== 'participant') throw new Error('Switch to a participant account to register.');
    this.assertCanParticipate(eventId, this.currentUser.id);
    const roles: Role[] = JSON.parse(localStorage.getItem('festflow_roles') || '[]');
    const existing = roles.find(
      (r) => r.event_id === eventId && r.user_id === this.currentUser.id && r.role_type === 'participant'
    );
    if (existing) return existing;
    this.assertRegistrationOpen(eventId, 'participants');
    const role: Role = {
      id: uid('role'),
      user_id: this.currentUser.id,
      event_id: eventId,
      role_type: 'participant',
      created_at: new Date().toISOString(),
    };
    roles.push(role);
    localStorage.setItem('festflow_roles', JSON.stringify(roles));

    // Solo events: a hidden one-person team keeps judging, check-in and reports working unchanged.
    const evt = this.requireEvent(eventId);
    if (getParticipation(evt).type === 'solo') {
      const teams = this.readTeams();
      if (!teams.some((t) => t.event_id === eventId && t.members?.some((m) => m.id === this.currentUser.id))) {
        const entry = this.newTeamRow(eventId, this.currentUser.full_name, evt.tracks?.[0] ?? 'General', teams.filter((t) => t.event_id === eventId).length);
        entry.status = 'pending'; // a solo registration is the application
        entry.applied_at = new Date().toISOString();
        teams.push(entry);
        this.writeTeams(teams);
        this.notifyOrganizer(eventId, `New solo registration: ${this.currentUser.full_name}`, `/organizer/events/${eventId}/participants`);
      }
    }
    this.notify();
    return role;
  }

  public isVolunteerIn(eventId: string, userId: string): boolean {
    return this.getRoles(eventId).some((r) => r.user_id === userId && r.role_type === 'volunteer');
  }

  private assertCanVolunteer(eventId: string, userId: string) {
    if (this.isParticipantIn(eventId, userId)) {
      throw new Error("You're registered as a participant at this event, so you can't also volunteer at it.");
    }
  }

  private assertCanParticipate(eventId: string, userId: string) {
    if (this.isVolunteerIn(eventId, userId)) {
      throw new Error("You're a volunteer at this event, so you can't also join it as a participant.");
    }
  }

  // --- In-app notifications (per user) ---
  public getNotifications(userId: string): UserNotification[] {
    const list: UserNotification[] = JSON.parse(localStorage.getItem('festflow_notifications') || '[]');
    return list.filter((n) => n.user_id === userId);
  }

  public dismissNotification(id: string): void {
    const list: UserNotification[] = JSON.parse(localStorage.getItem('festflow_notifications') || '[]');
    localStorage.setItem('festflow_notifications', JSON.stringify(list.filter((n) => n.id !== id)));
    this.notify();
  }

  // Callers notify() themselves after their own write.
  private pushNotification(userId: string, message: string, link?: string) {
    const list: UserNotification[] = JSON.parse(localStorage.getItem('festflow_notifications') || '[]');
    list.unshift({
      id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      message,
      link,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem('festflow_notifications', JSON.stringify(list));
  }

  // --- Auth & Persona Switching ---
  public getCurrentUser(): Profile {
    return this.currentUser;
  }

  public getCurrentRole(): RoleType {
    return this.currentRole;
  }

  public switchUser(profileId: string, role: RoleType) {
    const profiles = this.getProfiles();
    const found = profiles.find((p) => p.id === profileId) || profiles[0];
    this.currentUser = found;
    this.currentRole = role;
    localStorage.setItem('festflow_current_user', JSON.stringify(this.currentUser));
    localStorage.setItem('festflow_current_role', role);
    this.notify();
  }

  public getProfiles(): Profile[] {
    return JSON.parse(localStorage.getItem('festflow_profiles') || '[]');
  }

  // --- Events ---
  public getEvents(includeDeleted = false): Event[] {
    let raw: Event[] = JSON.parse(localStorage.getItem('festflow_events') || '[]');
    // Ensure demo past event is available if list is missing it
    if (!raw.some((e) => e.id === 'evt-past-genesis-2025')) {
      const pastEvt = INITIAL_EVENTS.find((e) => e.id === 'evt-past-genesis-2025');
      if (pastEvt) {
        raw.push(pastEvt);
        localStorage.setItem('festflow_events', JSON.stringify(raw));
      }
    }
    if (includeDeleted) return raw;
    return raw.filter((e) => !e.deleted_at);
  }

  public getPublicEvents(): Event[] {
    return this.getEvents().filter((e) => e.visibility === 'public');
  }

  public getEventById(id: string): Event | undefined {
    return this.getEvents().find((e) => e.id === id);
  }

  private assertValidEventConfig(evt: Partial<Event>) {
    if (evt.rounds) {
      const roundError = validateRounds(evt.rounds);
      if (roundError) throw new Error(roundError);
    }
    if (evt.participation_type === 'team') {
      const sizeError = validateTeamSize(evt.team_size_min ?? 1, evt.team_size_max ?? 5);
      if (sizeError) throw new Error(sizeError);
    }
    if (evt.criteria) {
      const criteriaError = validateCriteria(evt.criteria);
      if (criteriaError) throw new Error(criteriaError);
    }
    if (evt.starts_at && evt.ends_at) {
      const deadlineError = validateRegistrationDeadlines(evt as Event);
      if (deadlineError) throw new Error(deadlineError);
    }
  }

  private assertRegistrationOpen(eventId: string, kind: RegistrationKind) {
    const status = getRegistrationStatus(this.requireEvent(eventId), kind);
    if (!status.open) throw new Error(`${status.reason}.`);
  }

  // Organizer quick switch (Participants / Volunteers pages).
  public setRegistrationClosed(eventId: string, kind: RegistrationKind, closed: boolean): Event {
    return this.updateEvent(
      eventId,
      kind === 'participants' ? { participant_registration_closed: closed } : { volunteer_applications_closed: closed }
    );
  }

  public createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'deleted_at'>): Event {
    this.assertValidEventConfig(eventData);
    const events = this.getEvents(true);
    const newEvent: Event = {
      ...eventData,
      id: uid('evt'),
      created_at: new Date().toISOString(),
      deleted_at: null,
    };
    events.unshift(newEvent);
    localStorage.setItem('festflow_events', JSON.stringify(events));

    // Also register current user as organizer role
    const roles: Role[] = JSON.parse(localStorage.getItem('festflow_roles') || '[]');
    roles.push({
      id: uid('role'),
      user_id: this.currentUser.id,
      event_id: newEvent.id,
      role_type: 'organizer',
      role_title: 'Lead Organizer',
      created_at: new Date().toISOString(),
    });
    localStorage.setItem('festflow_roles', JSON.stringify(roles));

    this.notify();
    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<Event>): Event {
    this.assertEditable(id);
    const events = this.getEvents(true);
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Event not found');
    const merged = { ...events[index], ...updates };
    this.assertValidEventConfig(merged);
    // Switching solo/team or shrinking teams below their current size would orphan registrations.
    const teams = this.readTeams().filter((t) => t.event_id === id);
    const hasRegistrations = teams.length > 0 || this.getRoles(id).some((r) => r.role_type === 'participant');
    if (hasRegistrations && (merged.participation_type ?? 'team') !== (events[index].participation_type ?? 'team')) {
      throw new Error('Participants have already registered, so the event can no longer switch between solo and team.');
    }
    const largest = Math.max(0, ...teams.map((t) => t.members?.length ?? 0));
    if (getParticipation(merged).type === 'team' && largest > getParticipation(merged).max) {
      throw new Error(`A team already has ${largest} members, so the maximum team size can't be lower than ${largest}.`);
    }
    events[index] = merged;
    localStorage.setItem('festflow_events', JSON.stringify(events));
    this.notify();
    return events[index];
  }

  public softDeleteEvent(id: string): void {
    const events = this.getEvents(true);
    const index = events.findIndex((e) => e.id === id);
    if (index !== -1) {
      events[index].deleted_at = new Date().toISOString();
      localStorage.setItem('festflow_events', JSON.stringify(events));
      this.notify();
    }
  }

  // --- Roles & Invites ---
  public getRoles(eventId?: string): Role[] {
    const roles: Role[] = JSON.parse(localStorage.getItem('festflow_roles') || '[]');
    if (eventId) return roles.filter((r) => r.event_id === eventId);
    return roles;
  }

  public getInvites(eventId?: string): Invite[] {
    const invites: Invite[] = JSON.parse(localStorage.getItem('festflow_invites') || '[]');
    if (eventId) return invites.filter((i) => i.event_id === eventId);
    return invites;
  }

  public createInvite(inviteData: Omit<Invite, 'id' | 'created_at'>): Invite {
    this.assertEditable(inviteData.event_id);
    const invites = this.getInvites();
    const newInvite: Invite = {
      ...inviteData,
      id: uid('inv'),
      created_at: new Date().toISOString(),
    };
    invites.unshift(newInvite);
    localStorage.setItem('festflow_invites', JSON.stringify(invites));
    this.notify();
    return newInvite;
  }

  public getInviteByToken(token: string): Invite | undefined {
    const invites = this.getInvites();
    return invites.find((i) => i.token === token && new Date(i.expires_at) > new Date());
  }

  public revokeInvite(inviteId: string): void {
    this.assertEditable(this.getInvites().find((i) => i.id === inviteId)?.event_id);
    const invites = this.getInvites();
    const filtered = invites.filter((i) => i.id !== inviteId);
    localStorage.setItem('festflow_invites', JSON.stringify(filtered));
    this.notify();
  }

  public getOrCreateVolunteerProfile(name: string): Profile {
    const profiles: Profile[] = this.getProfiles();
    const existing = profiles.find((p) => p.full_name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;

    const newProfile: Profile = {
      id: uid('usr-vol'),
      full_name: name.trim(),
      created_at: new Date().toISOString(),
    };
    profiles.push(newProfile);
    localStorage.setItem('festflow_profiles', JSON.stringify(profiles));
    this.notify();
    return newProfile;
  }

  public acceptInvite(token: string, userId: string): Role {
    this.assertEditable(this.getInviteByToken(token)?.event_id);
    const invite = this.getInviteByToken(token);
    if (!invite) throw new Error('Invalid or expired invite token');
    if (invite.role_type === 'volunteer') this.assertCanVolunteer(invite.event_id, userId);

    // Update last_accessed_at on invite
    const invites = this.getInvites();
    const invIndex = invites.findIndex((i) => i.id === invite.id);
    if (invIndex !== -1) {
      invites[invIndex].last_accessed_at = new Date().toISOString();
      localStorage.setItem('festflow_invites', JSON.stringify(invites));
    }

    const roles: Role[] = JSON.parse(localStorage.getItem('festflow_roles') || '[]');
    const existing = roles.find(
      (r) => r.event_id === invite.event_id && r.user_id === userId && r.role_type === invite.role_type
    );
    if (existing) return existing;
    if (invite.role_type === 'volunteer') {
      // Private invites may be used during a live event (extra staff on the day), so only an explicit
      // organizer close or deadline blocks them — not the "applications lock at start" rule.
      const evt = this.requireEvent(invite.event_id);
      const deadline = evt.volunteer_application_deadline;
      if (evt.volunteer_applications_closed) throw new Error('Volunteer sign-ups were closed by the organizer.');
      if (deadline && new Date(deadline).getTime() <= Date.now()) throw new Error('The volunteer sign-up deadline has passed.');
    }

    const newRole: Role = {
      id: uid('role'),
      user_id: userId,
      event_id: invite.event_id,
      role_type: invite.role_type as RoleType,
      role_title: invite.role_title,
      created_at: new Date().toISOString(),
    };
    roles.push(newRole);
    localStorage.setItem('festflow_roles', JSON.stringify(roles));
    this.notify();
    return newRole;
  }

  // --- Tasks (Reusable Task Widget) ---
  public getTasks(eventId?: string): Task[] {
    const tasks: Task[] = JSON.parse(localStorage.getItem('festflow_tasks') || '[]');
    if (eventId) return tasks.filter((t) => t.event_id === eventId);
    return tasks;
  }

  public createTask(taskData: Omit<Task, 'id' | 'created_at'>): Task {
    this.assertEditable(taskData.event_id);
    const tasks = this.getTasks();
    const newTask: Task = {
      ...taskData,
      id: uid('tsk'),
      created_at: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    localStorage.setItem('festflow_tasks', JSON.stringify(tasks));
    if (newTask.assignee_id && newTask.assignee_type === 'volunteer') {
      this.pushNotification(
        newTask.assignee_id,
        `New task assigned: ${newTask.title}`,
        `/volunteer/events/${newTask.event_id}`
      );
    }
    this.notify();
    return newTask;
  }

  public updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'done'): Task {
    this.assertEditable(this.getTasks().find((t) => t.id === taskId)?.event_id);
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error('Task not found');
    // Progress is reported by whoever does the work; organizers only verify.
    if (this.currentRole === 'organizer') throw new Error('Task status is updated by the assignee');
    if (tasks[index].assignee_type === 'volunteer' && tasks[index].assignee_id !== this.currentUser.id) {
      throw new Error(tasks[index].assignee_id ? 'This task is assigned to someone else' : 'Take up this task before updating it');
    }
    tasks[index].status = status;
    tasks[index].verified_at = null; // any status change needs re-verification
    if (status === 'done') {
      tasks[index].completed_at = new Date().toISOString();
    } else {
      tasks[index].completed_at = null;
    }
    localStorage.setItem('festflow_tasks', JSON.stringify(tasks));
    this.notify();
    return tasks[index];
  }

  public claimTask(taskId: string): Task {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    this.assertEditable(task.event_id);
    if (task.assignee_type !== 'volunteer') throw new Error('Only volunteer tasks can be taken up');
    if (task.assignee_id) throw new Error('Someone has already taken up this task');
    const isVolunteer = this.getRoles(task.event_id).some(
      (r) => r.user_id === this.currentUser.id && r.role_type === 'volunteer'
    );
    if (!isVolunteer) throw new Error('Only volunteers of this event can take up its tasks');
    task.assignee_id = this.currentUser.id;
    task.assignee_name = this.currentUser.full_name;
    task.claimed_at = new Date().toISOString();
    localStorage.setItem('festflow_tasks', JSON.stringify(tasks));
    this.notify();
    return task;
  }

  public releaseTask(taskId: string): Task {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    this.assertEditable(task.event_id);
    if (task.assignee_id !== this.currentUser.id || !task.claimed_at) throw new Error('You can only release tasks you took up');
    if (task.status === 'done') throw new Error('Completed tasks cannot be released');
    task.assignee_id = null;
    task.assignee_name = 'General Volunteer Staff';
    task.claimed_at = null;
    task.status = 'todo';
    localStorage.setItem('festflow_tasks', JSON.stringify(tasks));
    this.notify();
    return task;
  }

  public verifyTask(taskId: string): Task {
    this.assertEditable(this.getTasks().find((t) => t.id === taskId)?.event_id);
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'done') throw new Error('Only completed tasks can be verified');
    task.verified_at = new Date().toISOString();
    localStorage.setItem('festflow_tasks', JSON.stringify(tasks));
    if (task.assignee_id) {
      this.pushNotification(task.assignee_id, `Organizer verified your task: ${task.title}`, `/volunteer/events/${task.event_id}`);
    }
    this.notify();
    return task;
  }

  public deleteTask(taskId: string): void {
    this.assertEditable(this.getTasks().find((t) => t.id === taskId)?.event_id);
    let tasks = this.getTasks();
    tasks = tasks.filter((t) => t.id !== taskId);
    localStorage.setItem('festflow_tasks', JSON.stringify(tasks));
    this.notify();
  }

  // --- Announcements ---
  public getAnnouncements(eventId?: string, audienceFilter?: string): Announcement[] {
    let raw: Announcement[] = JSON.parse(localStorage.getItem('festflow_announcements') || '[]');
    if (eventId) raw = raw.filter((a) => a.event_id === eventId);
    if (audienceFilter && audienceFilter !== 'all') {
      raw = raw.filter((a) => a.audience === 'all' || a.audience === audienceFilter);
    }
    // Sort descending by timestamp
    return raw.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createAnnouncement(announcementData: Omit<Announcement, 'id' | 'created_at'>): Announcement {
    this.assertEditable(announcementData.event_id);
    const list: Announcement[] = JSON.parse(localStorage.getItem('festflow_announcements') || '[]');
    const newAnc: Announcement = {
      ...announcementData,
      id: uid('anc'),
      created_at: new Date().toISOString(),
    };
    list.unshift(newAnc);
    localStorage.setItem('festflow_announcements', JSON.stringify(list));

    // Ping everyone in the audience (organizers excluded) with a link to the event's announcements.
    const eventId = newAnc.event_id;
    const roles = this.getRoles(eventId);
    const audience = new Set<string>();
    const wants = (kind: 'participants' | 'volunteers' | 'sponsors') => newAnc.audience === 'all' || newAnc.audience === kind;
    if (wants('participants')) {
      roles.filter((r) => r.role_type === 'participant').forEach((r) => audience.add(`participant:${r.user_id}`));
      this.readTeams().filter((t) => t.event_id === eventId).forEach((t) => t.members?.forEach((m) => audience.add(`participant:${m.id}`)));
    }
    if (wants('volunteers')) roles.filter((r) => r.role_type === 'volunteer').forEach((r) => audience.add(`volunteer:${r.user_id}`));
    if (wants('sponsors')) roles.filter((r) => r.role_type === 'sponsor').forEach((r) => audience.add(`sponsor:${r.user_id}`));
    const title = newAnc.title || newAnc.message.slice(0, 60);
    const linkFor: Record<string, string> = {
      participant: `/participant/events/${eventId}/announcements`,
      volunteer: `/volunteer/events/${eventId}/announcements`,
      sponsor: '/sponsor',
    };
    const seen = new Set<string>();
    audience.forEach((key) => {
      const [kind, userId] = key.split(':');
      if (seen.has(userId)) return; // one ping per person even if they hold two roles
      seen.add(userId);
      this.pushNotification(userId, `New announcement: ${title}`, linkFor[kind]);
    });

    this.notify();
    return newAnc;
  }

  // --- Teams & Submissions ---
  // Raw rows for writes. getTeams() decorates rows with `submission`, which must never be persisted,
  // and getTeams(eventId) is filtered — writing either back would drop or corrupt other teams.
  private readTeams(): Team[] {
    return JSON.parse(localStorage.getItem('festflow_teams') || '[]');
  }

  private writeTeams(teams: Team[]) {
    localStorage.setItem('festflow_teams', JSON.stringify(teams.map(({ submission: _s, ...t }) => t)));
  }

  private ensureParticipantRole(eventId: string, userId: string) {
    const roles: Role[] = JSON.parse(localStorage.getItem('festflow_roles') || '[]');
    if (!roles.some((r) => r.event_id === eventId && r.user_id === userId && r.role_type === 'participant')) {
      roles.push({ id: uid('role'), user_id: userId, event_id: eventId, role_type: 'participant', created_at: new Date().toISOString() });
      localStorage.setItem('festflow_roles', JSON.stringify(roles));
    }
  }

  private newTeamRow(eventId: string, name: string, track: string, existingCount: number): Team {
    return {
      id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      event_id: eventId,
      name,
      join_code: `FF-${Math.floor(1000 + Math.random() * 9000)}`,
      table_number: `Table ${existingCount + 1}`,
      track,
      created_at: new Date().toISOString(),
      members: [this.currentUser],
      status: 'forming',
      applied_at: null,
    };
  }

  private requireEvent(eventId: string): Event {
    const evt = this.getEventById(eventId);
    if (!evt) throw new Error('Event not found');
    return evt;
  }

  // Deletes a team and its submission (used when the last member leaves).
  private deleteTeam(teams: Team[], teamId: string): Team[] {
    const subs: Submission[] = JSON.parse(localStorage.getItem('festflow_submissions') || '[]');
    localStorage.setItem('festflow_submissions', JSON.stringify(subs.filter((x) => x.team_id !== teamId)));
    return teams.filter((t) => t.id !== teamId);
  }

  public leaveTeam(eventId: string): void {
    this.assertEditable(eventId);
    if (getParticipation(this.requireEvent(eventId)).type === 'solo') {
      throw new Error('This is a solo event — unregister instead of leaving a team.');
    }
    let teams = this.readTeams();
    const team = teams.find((t) => t.event_id === eventId && t.members?.some((m) => m.id === this.currentUser.id));
    if (!team) throw new Error("You're not in a team for this event.");
    team.members = (team.members ?? []).filter((m) => m.id !== this.currentUser.id);
    if (team.members.length === 0) {
      teams = this.deleteTeam(teams, team.id);
    } else {
      // The next member in line becomes lead automatically (lead = first member).
      team.members.forEach((m) =>
        this.pushNotification(m.id, `${this.currentUser.full_name} left your team "${team.name}".`, `/participant/events/${eventId}`)
      );
    }
    this.writeTeams(teams);
    this.notify();
  }

  public removeTeamMember(teamId: string, memberId: string): void {
    const teams = this.readTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');
    this.assertEditable(team.event_id);
    if (team.members?.[0]?.id !== this.currentUser.id) throw new Error('Only the team lead can remove members.');
    if (memberId === this.currentUser.id) throw new Error('Use "Leave team" to remove yourself.');
    if (!team.members.some((m) => m.id === memberId)) throw new Error('That person is not in your team.');
    team.members = team.members.filter((m) => m.id !== memberId);
    this.writeTeams(teams);
    this.pushNotification(memberId, `You were removed from team "${team.name}". You can create or join another team.`, `/participant/events/${team.event_id}`);
    this.notify();
  }

  public unregisterFromEvent(eventId: string): void {
    this.assertEditable(eventId);
    const isSolo = getParticipation(this.requireEvent(eventId)).type === 'solo';
    let teams = this.readTeams();
    const team = teams.find((t) => t.event_id === eventId && t.members?.some((m) => m.id === this.currentUser.id));
    if (team) {
      team.members = (team.members ?? []).filter((m) => m.id !== this.currentUser.id);
      if (isSolo || team.members.length === 0) {
        teams = this.deleteTeam(teams, team.id);
      } else {
        team.members.forEach((m) =>
          this.pushNotification(m.id, `${this.currentUser.full_name} left your team "${team.name}".`, `/participant/events/${eventId}`)
        );
      }
      this.writeTeams(teams);
    }
    const roles: Role[] = JSON.parse(localStorage.getItem('festflow_roles') || '[]');
    localStorage.setItem(
      'festflow_roles',
      JSON.stringify(roles.filter((r) => !(r.event_id === eventId && r.user_id === this.currentUser.id && r.role_type === 'participant')))
    );
    this.notify();
  }

  public static teamStatus(team: Team): NonNullable<Team['status']> {
    return team.status ?? 'accepted';
  }

  // Only accepted teams count as competitors (rosters, check-in, stats, reports).
  public getAcceptedTeams(eventId: string): Team[] {
    return this.getTeams(eventId).filter((t) => MockStorage.teamStatus(t) === 'accepted');
  }

  private notifyOrganizer(eventId: string, message: string, link: string) {
    const evt = this.getEventById(eventId);
    if (evt?.organizer_id) this.pushNotification(evt.organizer_id, message, link);
  }

  // Team lead submits the team for organizer review once it meets the minimum size.
  public applyTeam(teamId: string): Team {
    const teams = this.readTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');
    this.assertEditable(team.event_id);
    if (team.members?.[0]?.id !== this.currentUser.id) throw new Error('Only the team lead can submit the application.');
    const status = MockStorage.teamStatus(team);
    if (status !== 'forming') throw new Error(`This team's application is already ${status}.`);
    this.assertRegistrationOpen(team.event_id, 'participants');
    const rules = getParticipation(this.requireEvent(team.event_id));
    if ((team.members?.length ?? 0) < rules.min) throw new Error(`Your team needs at least ${rules.min} members before applying.`);
    team.status = 'pending';
    team.applied_at = new Date().toISOString();
    this.writeTeams(teams);
    this.notifyOrganizer(team.event_id, `New team application: ${team.name} (${team.members?.length} members)`, `/organizer/events/${team.event_id}/participants`);
    this.notify();
    return team;
  }

  public decideTeamApplication(teamId: string, decision: 'accepted' | 'rejected'): Team {
    const teams = this.readTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');
    this.assertEditable(team.event_id);
    if (this.currentRole !== 'organizer') throw new Error('Only organizers can review applications.');
    if (MockStorage.teamStatus(team) !== 'pending') throw new Error('Only pending applications can be reviewed.');
    if (decision === 'accepted') team.members?.forEach((m) => this.assertCanVolunteerOrParticipateCheck(team.event_id, m.id));
    team.status = decision;
    this.writeTeams(teams);
    const evtName = this.getEventById(team.event_id)?.name ?? 'the event';
    const solo = getParticipation(this.requireEvent(team.event_id)).type === 'solo';
    team.members?.forEach((m) =>
      this.pushNotification(
        m.id,
        decision === 'accepted'
          ? `${solo ? "You're" : `Team "${team.name}" is`} accepted into ${evtName}! You can now submit your project.`
          : `${solo ? 'Your' : `Team "${team.name}"'s`} application to ${evtName} was not accepted.`,
        `/participant/events/${team.event_id}`
      )
    );
    this.notify();
    return team;
  }

  // A participant accepted into a team must not have become a volunteer at the same event meanwhile.
  private assertCanVolunteerOrParticipateCheck(eventId: string, userId: string) {
    if (this.isVolunteerIn(eventId, userId)) {
      const name = this.getProfiles().find((p) => p.id === userId)?.full_name ?? 'A member';
      throw new Error(`${name} is now a volunteer at this event, so the team can't be accepted until they leave it.`);
    }
  }

  public updateTeamRecruiting(teamId: string, settings: { open_to_join: boolean; looking_for?: string }): Team {
    const teams = this.readTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');
    this.assertEditable(team.event_id);
    if (team.members?.[0]?.id !== this.currentUser.id) throw new Error('Only the team lead can change this.');
    team.open_to_join = settings.open_to_join;
    team.looking_for = (settings.looking_for ?? '').trim().slice(0, 200);
    this.writeTeams(teams);
    this.notify();
    return team;
  }

  // Teams advertising for members that the current user could join right now.
  public getOpenTeams(eventId: string): Team[] {
    const max = getParticipation(this.requireEvent(eventId)).max;
    return this.getTeams(eventId).filter(
      (t) => t.open_to_join && MockStorage.teamStatus(t) !== 'rejected' && (t.members?.length ?? 0) < max
    );
  }

  public joinOpenTeam(teamId: string): Team {
    const team = this.readTeams().find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');
    if (!team.open_to_join) throw new Error('This team is not taking new members right now.');
    return this.joinTeamByCode(team.event_id, team.join_code);
  }

  public getTeams(eventId?: string): Team[] {
    const teams: Team[] = JSON.parse(localStorage.getItem('festflow_teams') || '[]');
    const submissions = this.getSubmissions();
    const mapped = teams.map((team) => {
      const sub = submissions.find((s) => s.team_id === team.id) || null;
      return { ...team, submission: sub };
    });
    if (eventId) return mapped.filter((t) => t.event_id === eventId);
    return mapped;
  }

  public getTeamByJoinCode(code: string): Team | undefined {
    return this.getTeams().find((t) => t.join_code.trim().toUpperCase() === code.trim().toUpperCase());
  }

  public createTeam(eventId: string, name: string, track = 'General'): Team {
    this.assertEditable(eventId);
    this.assertCanParticipate(eventId, this.currentUser.id);
    if (getParticipation(this.requireEvent(eventId)).type === 'solo') throw new Error('This is a solo event — teams are not used.');
    if (!this.isParticipantIn(eventId, this.currentUser.id)) this.assertRegistrationOpen(eventId, 'participants');
    const teams = this.readTeams();
    const current = teams.find((t) => t.event_id === eventId && t.members?.some((m) => m.id === this.currentUser.id));
    if (current) throw new Error(`You're already in team "${current.name}" for this event.`);
    if (teams.some((t) => t.event_id === eventId && t.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      throw new Error(`A team called "${name.trim()}" already exists in this event.`);
    }
    const newTeam = this.newTeamRow(eventId, name.trim(), track, teams.filter((t) => t.event_id === eventId).length);
    teams.push(newTeam);
    this.writeTeams(teams);
    this.ensureParticipantRole(eventId, this.currentUser.id);
    this.notify();
    return newTeam;
  }

  public joinTeamByCode(eventId: string, code: string): Team {
    this.assertEditable(eventId);
    this.assertCanParticipate(eventId, this.currentUser.id);
    const rules = getParticipation(this.requireEvent(eventId));
    if (rules.type === 'solo') throw new Error('This is a solo event — teams are not used.');
    if (!this.isParticipantIn(eventId, this.currentUser.id)) this.assertRegistrationOpen(eventId, 'participants');
    const teams = this.readTeams();
    const team = teams.find((t) => t.event_id === eventId && t.join_code.toUpperCase() === code.trim().toUpperCase());
    if (!team) throw new Error('Invalid join code');
    const current = teams.find((t) => t.event_id === eventId && t.id !== team.id && t.members?.some((m) => m.id === this.currentUser.id));
    if (current) throw new Error(`You're already in team "${current.name}" for this event.`);

    const members = team.members ?? [];
    if (members.some((m) => m.id === this.currentUser.id)) return team;
    if (MockStorage.teamStatus(team) === 'rejected') throw new Error(`Team "${team.name}" was not accepted, so it can't take new members.`);
    if (members.length >= rules.max) throw new Error(`Team "${team.name}" is full (max ${rules.max} members).`);
    members.forEach((m) =>
      this.pushNotification(m.id, `${this.currentUser.full_name} joined your team "${team.name}".`, `/participant/events/${eventId}`)
    );
    team.members = [...members, this.currentUser];
    this.writeTeams(teams);
    this.ensureParticipantRole(eventId, this.currentUser.id);
    this.notify();
    return team;
  }

  public updateTeamTable(teamId: string, tableNumber: string): Team {
    const teams = this.readTeams();
    const index = teams.findIndex((t) => t.id === teamId);
    if (index === -1) throw new Error('Team not found');
    this.assertEditable(teams[index].event_id);
    teams[index].table_number = tableNumber.trim() || null;
    this.writeTeams(teams);

    // Also synchronize table_number in submissions
    const submissions: Submission[] = JSON.parse(localStorage.getItem('festflow_submissions') || '[]');
    const subIndex = submissions.findIndex((x) => x.team_id === teamId);
    if (subIndex !== -1) {
      submissions[subIndex].table_number = tableNumber.trim() || undefined;
      localStorage.setItem('festflow_submissions', JSON.stringify(submissions));
    }

    this.notify();
    return teams[index];
  }

  public updateTeam(teamId: string, updates: Partial<Team>): Team {
    const teams = this.readTeams();
    const index = teams.findIndex((t) => t.id === teamId);
    if (index === -1) throw new Error('Team not found');
    this.assertEditable(teams[index].event_id);
    teams[index] = { ...teams[index], ...updates };
    this.writeTeams(teams);
    this.notify();
    return teams[index];
  }

  public getSubmissions(eventId?: string): Submission[] {
    const list: Submission[] = JSON.parse(localStorage.getItem('festflow_submissions') || '[]');
    if (eventId) return list.filter((s) => s.event_id === eventId);
    return list;
  }

  public upsertSubmission(subData: Omit<Submission, 'id' | 'submitted_at'>): Submission {
    this.assertEditable(subData.event_id);
    const team = this.readTeams().find((t) => t.id === subData.team_id);
    if (!team) throw new Error('Team not found');
    if (!team.members?.some((m) => m.id === this.currentUser.id)) throw new Error('Only team members can submit for this team.');
    if (MockStorage.teamStatus(team) !== 'accepted') throw new Error('Your application has to be accepted by the organizer before you can submit.');
    const rules = getParticipation(this.requireEvent(subData.event_id));
    if ((team.members?.length ?? 0) < rules.min) {
      throw new Error(`Your team needs at least ${rules.min} members to submit (currently ${team.members?.length ?? 0}).`);
    }
    const list = this.getSubmissions();
    const index = list.findIndex((s) => s.team_id === subData.team_id);
    let sub: Submission;

    if (index >= 0) {
      sub = {
        ...list[index],
        ...subData,
        submitted_at: new Date().toISOString(),
      };
      list[index] = sub;
    } else {
      sub = {
        ...subData,
        id: uid('sub'),
        submitted_at: new Date().toISOString(),
      };
      list.push(sub);
    }

    localStorage.setItem('festflow_submissions', JSON.stringify(list));
    this.notify();
    return sub;
  }

  // --- Judge Links & Marks ---
  public getJudgeLinks(eventId?: string): JudgeLink[] {
    const list: JudgeLink[] = JSON.parse(localStorage.getItem('festflow_judge_links') || '[]');
    if (eventId) return list.filter((j) => j.event_id === eventId);
    return list;
  }

  public createJudgeLink(data: Omit<JudgeLink, 'id' | 'created_at' | 'token'>): JudgeLink {
    this.assertEditable(data.event_id);
    const list = this.getJudgeLinks();
    const token = `judge-${Math.random().toString(36).substring(2, 8)}-${Date.now().toString(36).substring(4)}`;
    const newLink: JudgeLink = {
      ...data,
      id: uid('jl'),
      token,
      created_at: new Date().toISOString(),
    };
    list.unshift(newLink);
    localStorage.setItem('festflow_judge_links', JSON.stringify(list));
    this.notify();
    return newLink;
  }

  public getJudgeLinkByToken(token: string): JudgeLink | undefined {
    return this.getJudgeLinks().find((j) => j.token === token);
  }

  public getMarks(judgeLinkId?: string): Mark[] {
    const marks: Mark[] = JSON.parse(localStorage.getItem('festflow_marks') || '[]');
    if (judgeLinkId) return marks.filter((m) => m.judge_link_id === judgeLinkId);
    return marks;
  }

  public saveJudgeMark(
    judgeLinkId: string,
    submissionId: string,
    round: string,
    _clientScore: number, // ignored: the total is recomputed from the event's criteria below
    notes = '',
    criteria?: MarkCriteria
  ): Mark {
    const link = this.getJudgeLinks().find((j) => j.id === judgeLinkId);
    if (!link) throw new Error('Judge link not found');
    this.assertEditable(link.event_id);
    const evt = this.requireEvent(link.event_id);
    if (!evt.rounds.some((r) => r.id === round)) throw new Error('Unknown evaluation round');
    // Clamp every criterion to 0..max and keep only the event's current criteria.
    const rubric = getCriteria(evt);
    const clean: MarkCriteria = Object.fromEntries(
      rubric.map((c) => [c.id, Math.min(c.max, Math.max(0, Math.round(Number(criteria?.[c.id]) || 0)))])
    );
    const score = rubric.reduce((sum, c) => sum + clean[c.id], 0);
    const max_score = maxScore(rubric);
    const marks = this.getMarks();
    const index = marks.findIndex(
      (m) => m.judge_link_id === judgeLinkId && m.submission_id === submissionId && m.round === round
    );

    let mark: Mark;
    if (index >= 0) {
      mark = {
        ...marks[index],
        score,
        max_score,
        notes,
        criteria: clean,
        updated_at: new Date().toISOString(),
      };
      marks[index] = mark;
    } else {
      mark = {
        id: uid('mark'),
        judge_link_id: judgeLinkId,
        submission_id: submissionId,
        round,
        score,
        max_score,
        notes,
        criteria: clean,
        updated_at: new Date().toISOString(),
      };
      marks.push(mark);
    }

    localStorage.setItem('festflow_marks', JSON.stringify(marks));
    this.notify();
    return mark;
  }

  // --- Sponsorship Applications ---
  public getSponsorshipApplications(eventId?: string): SponsorshipApplication[] {
    const apps: SponsorshipApplication[] = JSON.parse(localStorage.getItem('festflow_sponsor_apps') || '[]');
    if (eventId) return apps.filter((a) => a.event_id === eventId);
    return apps;
  }

  public submitSponsorshipApplication(
    eventId: string,
    formData: SponsorshipApplication['form_data']
  ): SponsorshipApplication {
    this.assertEditable(eventId);
    const apps = this.getSponsorshipApplications();
    const newApp: SponsorshipApplication = {
      id: uid('app'),
      event_id: eventId,
      sponsor_id: this.currentUser.id,
      sponsor_name: formData.company_name || this.currentUser.full_name,
      status: 'applied',
      form_data: formData,
      created_at: new Date().toISOString(),
    };
    apps.unshift(newApp);
    localStorage.setItem('festflow_sponsor_apps', JSON.stringify(apps));

    // Register sponsor role
    const roles: Role[] = JSON.parse(localStorage.getItem('festflow_roles') || '[]');
    if (!roles.some((r) => r.event_id === eventId && r.user_id === this.currentUser.id && r.role_type === 'sponsor')) {
      roles.push({
        id: uid('role'),
        user_id: this.currentUser.id,
        event_id: eventId,
        role_type: 'sponsor',
        role_title: `${formData.tier} Partner`,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('festflow_roles', JSON.stringify(roles));
    }

    this.notify();
    return newApp;
  }

  public updateSponsorshipStatus(appId: string, status: 'applied' | 'under_review' | 'confirmed'): SponsorshipApplication {
    this.assertEditable(this.getSponsorshipApplications().find((a) => a.id === appId)?.event_id);
    const apps = this.getSponsorshipApplications();
    const index = apps.findIndex((a) => a.id === appId);
    if (index === -1) throw new Error('Application not found');
    apps[index].status = status;
    localStorage.setItem('festflow_sponsor_apps', JSON.stringify(apps));
    this.notify();
    return apps[index];
  }

  // --- Volunteer Applications ---
  public getVolunteerApplications(eventId?: string): VolunteerApplication[] {
    let raw: VolunteerApplication[] = JSON.parse(localStorage.getItem('festflow_volunteer_apps') || '[]');
    if (raw.length === 0 && (!localStorage.getItem('festflow_volunteer_apps') || localStorage.getItem('festflow_volunteer_apps') === '[]')) {
      raw = INITIAL_VOLUNTEER_APPS;
      localStorage.setItem('festflow_volunteer_apps', JSON.stringify(raw));
    }
    const startOf = new Map(this.getEvents(true).map((e) => [e.id, new Date(e.starts_at).getTime()]));
    const now = Date.now();
    raw = raw.map((a) =>
      a.status === 'pending' && (startOf.get(a.event_id) ?? Infinity) <= now ? { ...a, status: 'expired' as const } : a
    );
    if (eventId) return raw.filter((a) => a.event_id === eventId);
    return raw;
  }

  // Raw stored rows (no derived 'expired') — use for writes so derivations aren't persisted.
  private getStoredVolunteerApplications(): VolunteerApplication[] {
    this.getVolunteerApplications(); // seeds defaults if empty
    return JSON.parse(localStorage.getItem('festflow_volunteer_apps') || '[]');
  }

  public submitVolunteerApplication(
    eventId: string,
    roleTitle = 'General Volunteer',
    answers: VolunteerApplication['answers'] = []
  ): VolunteerApplication {
    this.assertEditable(eventId);
    if (this.currentRole !== 'volunteer') throw new Error('Switch to a volunteer account to apply.');
    this.assertRegistrationOpen(eventId, 'volunteers');
    this.assertCanVolunteer(eventId, this.currentUser.id);
    const apps = this.getStoredVolunteerApplications();
    const existing = apps.find((a) => a.event_id === eventId && a.user_id === this.currentUser.id);
    if (existing) return existing;

    const newApp: VolunteerApplication = {
      id: uid('vapp'),
      event_id: eventId,
      user_id: this.currentUser.id,
      user_name: this.currentUser.full_name,
      user_email: (this.currentUser as any).email || `${this.currentUser.full_name.toLowerCase().replace(/\s+/g, '.')}@festflow.dev`,
      role_title: roleTitle,
      answers,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    apps.unshift(newApp);
    localStorage.setItem('festflow_volunteer_apps', JSON.stringify(apps));
    this.notify();
    return newApp;
  }

  public updateVolunteerApplicationStatus(appId: string, status: 'accepted' | 'rejected'): VolunteerApplication {
    this.assertEditable(this.getVolunteerApplications().find((a) => a.id === appId)?.event_id);
    const apps = this.getStoredVolunteerApplications();
    const index = apps.findIndex((a) => a.id === appId);
    if (index === -1) throw new Error('Volunteer application not found');

    const app = apps[index];
    const current = this.getVolunteerApplications().find((a) => a.id === appId)?.status;
    if (current !== 'pending') throw new Error(`Application is already ${current}`);
    if (status === 'accepted') this.assertCanVolunteer(app.event_id, app.user_id); // may have joined a team since applying
    app.status = status;
    localStorage.setItem('festflow_volunteer_apps', JSON.stringify(apps));

    if (status === 'accepted') {
      const roles: Role[] = JSON.parse(localStorage.getItem('festflow_roles') || '[]');
      if (!roles.some((r) => r.event_id === app.event_id && r.user_id === app.user_id && r.role_type === 'volunteer')) {
        roles.push({
          id: uid('role'),
          user_id: app.user_id,
          event_id: app.event_id,
          role_type: 'volunteer',
          role_title: app.role_title || 'General Volunteer Staff',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('festflow_roles', JSON.stringify(roles));
      }
    }

    const evtName = this.getEventById(app.event_id)?.name ?? 'the event';
    this.pushNotification(
      app.user_id,
      status === 'accepted'
        ? `You're in! Your application to volunteer at ${evtName} was accepted.`
        : `Your application to volunteer at ${evtName} was not selected this time.`,
      status === 'accepted' ? `/volunteer/events/${app.event_id}` : '/volunteer'
    );
    this.notify();
    return app;
  }

  // Past events this user volunteered at, with tasks completed — shown to organizers reviewing applications.
  public getVolunteerExperience(userId: string) {
    const now = Date.now();
    const tasks = this.getTasks();
    return this.getRoles()
      .filter((r) => r.user_id === userId && r.role_type === 'volunteer')
      .map((r) => ({ role: r, event: this.getEventById(r.event_id) }))
      .filter((x): x is { role: Role; event: Event } => !!x.event && new Date(x.event.ends_at).getTime() < now)
      .map(({ role, event }) => ({
        event,
        roleTitle: role.role_title || 'General Volunteer',
        tasksDone: tasks.filter((t) => t.event_id === event.id && t.assignee_id === userId && t.status === 'done').length,
      }));
  }

  // --- Attendance Tracking ---
  public getAttendance(eventId?: string): AttendanceRecord[] {
    const list: AttendanceRecord[] = JSON.parse(
      localStorage.getItem('festflow_attendance') || '[]'
    );
    if (!eventId) return list;
    return list.filter((a) => a.event_id === eventId);
  }

  public markAttendance(
    record: Omit<AttendanceRecord, 'id' | 'marked_at'>
  ): AttendanceRecord {
    this.assertEditable(record.event_id);
    const list = this.getAttendance();
    const existingIndex = list.findIndex(
      (a) => a.event_id === record.event_id && a.target_id === record.target_id
    );

    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...record,
        marked_at: now,
      };
      localStorage.setItem('festflow_attendance', JSON.stringify(list));
      this.notify();
      return list[existingIndex];
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...record,
      marked_at: now,
    };
    list.push(newRecord);
    localStorage.setItem('festflow_attendance', JSON.stringify(list));
    this.notify();
    return newRecord;
  }

  public unmarkAttendance(eventId: string, targetId: string): void {
    this.assertEditable(eventId);
    const list = this.getAttendance();
    const filtered = list.filter(
      (a) => !(a.event_id === eventId && a.target_id === targetId)
    );
    localStorage.setItem('festflow_attendance', JSON.stringify(filtered));
    this.notify();
  }

  public isAttendanceMarked(eventId: string, targetId: string): boolean {
    const list = this.getAttendance(eventId);
    return list.some((a) => a.target_id === targetId);
  }

  public getAttendanceRecord(
    eventId: string,
    targetId: string
  ): AttendanceRecord | undefined {
    const list = this.getAttendance(eventId);
    return list.find((a) => a.target_id === targetId);
  }

  // --- Analytics Dashboard Helpers ---
  public getEventAnalytics(eventId: string) {
    const teams = this.getTeams(eventId);
    const submissions = this.getSubmissions(eventId);
    const tasks = this.getTasks(eventId);
    const sponsorApps = this.getSponsorshipApplications(eventId);
    const marks = this.getMarks();

    // Total participants count across teams
    let participantCount = 0;
    teams.forEach((t) => {
      participantCount += t.members ? t.members.length : 1;
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const sponsorStatus = {
      applied: sponsorApps.filter((a) => a.status === 'applied').length,
      under_review: sponsorApps.filter((a) => a.status === 'under_review').length,
      confirmed: sponsorApps.filter((a) => a.status === 'confirmed').length,
      total: sponsorApps.length,
    };

    const submissionStats = {
      total: submissions.length,
      submitted: submissions.filter((s) => s.status === 'submitted').length,
      not_submitted: submissions.filter((s) => s.status === 'not_submitted').length,
    };

    return {
      participantCount,
      teamCount: teams.length,
      totalTasks,
      completedTasks,
      taskCompletionRate,
      sponsorStatus,
      submissionStats,
      marksCount: marks.length,
    };
  }
}

export const mockStorage = new MockStorage();
