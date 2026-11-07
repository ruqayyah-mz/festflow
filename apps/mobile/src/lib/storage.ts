import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoleType, Profile, Event, Task, Announcement, Role } from '@festflow/shared';

const STORAGE_KEYS = {
  USER: 'festflow_mobile_user',
  ROLE: 'festflow_mobile_active_role',
  ROLES: 'festflow_mobile_user_roles',
  EVENT: 'festflow_mobile_active_event',
  TASKS: 'festflow_mobile_tasks',
  ANNOUNCEMENTS: 'festflow_mobile_announcements',
  FCM_TOKEN: 'festflow_mobile_fcm_token',
};

export const DEMO_PROFILES: Record<RoleType, Profile> = {
  organizer: { id: '00000000-0000-0000-0000-000000000001', full_name: 'Alex Rivera (Lead Organizer)' },
  volunteer: { id: '00000000-0000-0000-0000-000000000002', full_name: 'Sarah Chen (Volunteer Coordinator)' },
  sponsor: { id: '00000000-0000-0000-0000-000000000003', full_name: 'Elena Rostova (DevRel Sponsor)' },
  participant: { id: '00000000-0000-0000-0000-000000000004', full_name: 'David Kim (Team Lead Participant)' },
};

export const DEMO_EVENT: Event = {
  id: 'e0000000-0000-0000-0000-000000000001',
  organizer_id: '00000000-0000-0000-0000-000000000001',
  name: 'National Builder HackFest 2026',
  description: 'The flagship 36-hour collegiate builder hackathon.',
  venue: 'Grand Innovation Arena, Floor 3 & Virtual Discord',
  starts_at: new Date(Date.now() - 86400000).toISOString(),
  ends_at: new Date(Date.now() + 86400000 * 2).toISOString(),
  visibility: 'public',
  seeking_sponsors: true,
  rounds: [
    { id: 'r1', name: 'Round 1: Idea Validation & Pitch', weight: 25, active: false },
    { id: 'r2', name: 'Round 2: Technical Prototype Review', weight: 35, active: true },
    { id: 'r3', name: 'Round 3: Grand Stage Finals', weight: 40, active: false },
  ],
  tracks: ['AI / ML Systems', 'Decentralized Web', 'Developer Tooling', 'Social Impact'],
  created_at: new Date(Date.now() - 86400000).toISOString(),
  deleted_at: null,
};

export const DEMO_TASKS: Task[] = [
  {
    id: 'k0000000-0000-0000-0000-000000000001',
    event_id: 'e0000000-0000-0000-0000-000000000001',
    assignee_id: '00000000-0000-0000-0000-000000000002',
    assignee_name: 'Sarah Chen (Volunteer Coordinator)',
    assignee_type: 'volunteer',
    title: 'Coordinate Midnight Snack Delivery',
    description: 'Distribute energy bars and sponsor swag to Tables 1 to 20.',
    status: 'done',
    due_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'k0000000-0000-0000-0000-000000000002',
    event_id: 'e0000000-0000-0000-0000-000000000001',
    assignee_id: '00000000-0000-0000-0000-000000000002',
    assignee_name: 'Sarah Chen (Volunteer Coordinator)',
    assignee_type: 'volunteer',
    title: 'Check Table Wi-Fi signal & Power strips',
    description: 'Verify that all rows have adequate 240V power surge protectors.',
    status: 'in_progress',
    due_at: new Date(Date.now() + 7200000).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'k0000000-0000-0000-0000-000000000003',
    event_id: 'e0000000-0000-0000-0000-000000000001',
    assignee_id: '00000000-0000-0000-0000-000000000003',
    assignee_name: 'Elena Rostova (DevRel Sponsor)',
    assignee_type: 'sponsor',
    title: 'Submit Workshop Slides & API Credits Voucher',
    description: 'Upload presentation slides for the 2:00 PM Tech Talk on Edge AI.',
    status: 'todo',
    due_at: new Date(Date.now() + 14400000).toISOString(),
    completed_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    event_id: 'e0000000-0000-0000-0000-000000000001',
    audience: 'all',
    title: 'Opening Ceremony Ready',
    message: 'Welcome to National Builder HackFest 2026! Opening ceremony starts in Main Auditorium at 10:00 AM.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    event_id: 'e0000000-0000-0000-0000-000000000001',
    audience: 'participants',
    title: 'Round 2 Technical Review',
    message: 'Round 2 Technical Prototype reviews start at 3:00 PM. Please ensure your GitHub repo is public.',
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    event_id: 'e0000000-0000-0000-0000-000000000001',
    audience: 'volunteers',
    title: 'Volunteer Floor Briefing',
    message: 'All volunteers meet at Help Desk A for brief sync regarding dinner distribution logistics.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export class MobileStorage {
  static async getUser(): Promise<Profile | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  }

  static async setUser(user: Profile): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  static async getActiveRole(): Promise<RoleType> {
    const role = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);
    return (role as RoleType) || 'organizer';
  }

  static async setActiveRole(role: RoleType): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ROLE, role);
  }

  static async getUserRoles(): Promise<RoleType[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ROLES);
    return data ? JSON.parse(data) : ['organizer', 'volunteer', 'sponsor', 'participant'];
  }

  static async setUserRoles(roles: RoleType[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
  }

  static async getTasks(): Promise<Task[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : DEMO_TASKS;
  }

  static async setTasks(tasks: Task[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  static async updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'done'): Promise<Task[]> {
    const tasks = await this.getTasks();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status,
          completed_at: status === 'done' ? new Date().toISOString() : null,
        };
      }
      return t;
    });
    await this.setTasks(updated);
    return updated;
  }

  static async getAnnouncements(): Promise<Announcement[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return data ? JSON.parse(data) : DEMO_ANNOUNCEMENTS;
  }

  static async setAnnouncements(announcements: Announcement[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }

  static async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.ROLE]);
  }
}

