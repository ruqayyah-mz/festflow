import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  AppState,
} from 'react-native';

const STATUS_OPTIONS: [TaskStatus, string][] = [
  ['todo', 'To do'],
  ['in_progress', 'In progress'],
  ['done', 'Done'],
];
import { Task, RoleType } from '@festflow/shared';
import { MobileStorage, TaskStatus, onActiveEventChange } from '../../src/lib/storage';
import { isLiveSupabase } from '../../src/lib/supabase';
import {
  claimTask,
  fetchOpenTasks,
  getCachedMyTasks,
  getCurrentUserId,
  releaseTask,
  setTaskStatus,
  subscribeToEventTasks,
  subscribeToMyTasks,
  syncMyTasks,
} from '../../src/lib/tasks';
import { refreshTasksWidget } from '../../widgets/widgetManager';
import { CheckCircle2 } from 'lucide-react-native';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [role, setRole] = useState<RoleType>('volunteer');
  const [activeTab, setActiveTab] = useState<'pending' | 'portfolio'>('pending');
  const [notice, setNotice] = useState<string | null>(null);
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const activeRole = await MobileStorage.getActiveRole();
    const eventId = (await MobileStorage.getEvent())?.id;
    // Only the event picked in the header; demo data also holds other people's sponsor tasks.
    const scope = (list: Task[]) =>
      list.filter(
        (t) =>
          (!eventId || t.event_id === eventId) &&
          (isLiveSupabase || activeRole !== 'sponsor' || t.assignee_type === 'sponsor')
      );
    setRole(activeRole);
    setTasks(scope(await getCachedMyTasks())); // instant, from cache
    try {
      setTasks(scope(await syncMyTasks()));
      setOpenTasks(activeRole === 'volunteer' && eventId ? await fetchOpenTasks(eventId) : []);
      setNotice(null);
      await refreshTasksWidget();
    } catch {
      if (isLiveSupabase) setNotice('Offline. Showing saved tasks.');
    }
  }, []);

  // Open tasks of the chosen event change under us (posted, taken up by someone else): follow them live.
  const [eventId, setEventId] = useState<string | null>(null);
  useEffect(() => {
    const load = async () => setEventId((await MobileStorage.getEvent())?.id ?? null);
    load();
    return onActiveEventChange(() => {
      load();
      reload();
    });
  }, [reload]);
  useEffect(() => (eventId ? subscribeToEventTasks(eventId, reload) : undefined), [eventId, reload]);

  const handleClaimOrRelease = async (task: Task, action: 'claim' | 'release') => {
    setBusyId(task.id);
    try {
      await (action === 'claim' ? claimTask(task.id) : releaseTask(task.id));
      setNotice(null);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not update task');
    } finally {
      setBusyId(null);
      await reload();
    }
  };

  // Re-sync whenever the app comes back to the foreground (realtime only runs while it's open).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && reload());
    return () => sub.remove();
  }, [reload]);

  useEffect(() => {
    reload();
    let unsubscribe = () => {};
    getCurrentUserId().then((uid) => {
      if (uid) unsubscribe = subscribeToMyTasks(uid, reload); // organizer assigns -> list updates live
    });
    return () => unsubscribe();
  }, [reload]);

  const handleSetStatus = async (task: Task, nextStatus: TaskStatus) => {
    if (task.status === nextStatus) return;

    // Optimistic UI update
    const updated = tasks.map((t) =>
      t.id === task.id
        ? {
            ...t,
            status: nextStatus,
            completed_at: nextStatus === 'done' ? new Date().toISOString() : null,
          }
        : t
    );
    setTasks(updated);

    // Persist (Supabase in live mode, queued if offline) & keep the home-screen widget in step
    try {
      const { queued } = await setTaskStatus(task.id, nextStatus);
      setNotice(queued ? 'Offline. Your change will sync when you reconnect.' : null);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not update task');
      await reload();
    }
    await refreshTasksWidget();
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const completedTasks = tasks.filter((t) => t.status === 'done');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.tabHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            ACTIVE TASKS ({pendingTasks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'portfolio' && styles.tabButtonActive]}
          onPress={() => setActiveTab('portfolio')}
        >
          <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
            COMPLETED PORTFOLIO ({completedTasks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

      <ScrollView contentContainerStyle={styles.scrollList}>
        {activeTab === 'pending' && openTasks.length > 0 ? (
          <View style={styles.openSection}>
            <Text style={styles.openHeader}>OPEN TASKS · ANYONE CAN TAKE ONE UP</Text>
            {openTasks.map((t) => (
              <View key={t.id} style={[styles.taskCard, styles.openCard]}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                {t.description ? <Text style={styles.taskDesc}>{t.description}</Text> : null}
                <TouchableOpacity
                  style={[styles.statusChip, styles.statusChipActive]}
                  disabled={busyId === t.id}
                  accessibilityRole="button"
                  onPress={() => handleClaimOrRelease(t, 'claim')}
                >
                  <Text style={[styles.statusChipText, styles.statusChipTextActive]}>
                    {busyId === t.id ? 'Taking up…' : 'Take up this task'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === 'pending' ? (
          pendingTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No active tasks for this event.</Text>
              <Text style={styles.emptySubtitle}>
                {openTasks.length ? 'Take up an open task above.' : 'Finished tasks are in the Portfolio tab.'}
              </Text>
            </View>
          ) : (
            pendingTasks.map((t) => (
              <View key={t.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskType}>{t.claimed_at ? 'TAKEN UP BY YOU' : 'ASSIGNED TO YOU'}</Text>
                  {t.due_at && (
                    <Text style={styles.dueText}>
                      Due: {new Date(t.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>

                <Text style={styles.taskTitle}>{t.title}</Text>
                {t.description ? <Text style={styles.taskDesc}>{t.description}</Text> : null}

                <View style={styles.statusRow}>
                  {STATUS_OPTIONS.map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.statusChip, t.status === value && styles.statusChipActive]}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: t.status === value }}
                      onPress={() => handleSetStatus(t, value)}
                    >
                      <Text style={[styles.statusChipText, t.status === value && styles.statusChipTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {t.claimed_at ? (
                  <TouchableOpacity
                    style={styles.reopenButton}
                    disabled={busyId === t.id}
                    onPress={() => handleClaimOrRelease(t, 'release')}
                  >
                    <Text style={styles.reopenButtonText}>Release task</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )
        ) : (
          completedTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No completed tasks yet.</Text>
              <Text style={styles.emptySubtitle}>Complete pending duties to build your verified contribution portfolio.</Text>
            </View>
          ) : (
            completedTasks.map((t) => (
              <View key={t.id} style={[styles.taskCard, styles.portfolioCard]}>
                <View style={styles.taskHeader}>
                  <View style={styles.completedBadge}>
                    <CheckCircle2 size={12} color="#16a34a" />
                    <Text style={styles.completedBadgeText}>{t.verified_at ? 'VERIFIED BY ORGANIZER' : 'DONE'}</Text>
                  </View>
                  {t.completed_at && (
                    <Text style={styles.completedTime}>
                      {new Date(t.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>

                <Text style={styles.portfolioTitle}>{t.title}</Text>
                {t.description ? <Text style={styles.taskDesc}>{t.description}</Text> : null}

                <TouchableOpacity
                  style={styles.reopenButton}
                  onPress={() => handleSetStatus(t, 'todo')}
                >
                  <Text style={styles.reopenButtonText}>Reopen Task</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#1d4ed8',
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#1d4ed8',
  },
  noticeText: {
    fontSize: 11,
    color: '#92400e',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  scrollList: {
    padding: 16,
    gap: 12,
  },
  emptyCard: {
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  taskCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  portfolioCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#16a34a',
    backgroundColor: '#fcfdfd',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskType: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dueText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  portfolioTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  taskDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },
  openSection: {
    gap: 10,
    marginBottom: 6,
  },
  openHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  openCard: {
    borderStyle: 'dashed',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  statusChipActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#eff6ff',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  statusChipTextActive: {
    color: '#1d4ed8',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#16a34a',
  },
  completedTime: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  reopenButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  reopenButtonText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748b',
    textDecorationLine: 'underline',
  },
});

