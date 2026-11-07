import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Task, RoleType } from '@festflow/shared';
import { MobileStorage } from '../../src/lib/storage';
import { refreshAllWidgets } from '../../widgets/widgetManager';
import { CheckCircle2, Clock, Circle } from 'lucide-react-native';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [role, setRole] = useState<RoleType>('volunteer');
  const [activeTab, setActiveTab] = useState<'pending' | 'portfolio'>('pending');

  useEffect(() => {
    async function loadData() {
      const activeRole = await MobileStorage.getActiveRole();
      setRole(activeRole);
      const allTasks = await MobileStorage.getTasks();
      // Filter by assignee type if volunteer or sponsor
      if (activeRole === 'sponsor') {
        setTasks(allTasks.filter((t) => t.assignee_type === 'sponsor'));
      } else {
        setTasks(allTasks);
      }
    }
    loadData();
  }, []);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: 'todo' | 'in_progress' | 'done' =
      task.status === 'todo'
        ? 'in_progress'
        : task.status === 'in_progress'
        ? 'done'
        : 'todo';

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

    // Persist in storage & trigger widget sync
    await MobileStorage.updateTaskStatus(task.id, nextStatus);
    await refreshAllWidgets();
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

      <ScrollView contentContainerStyle={styles.scrollList}>
        {activeTab === 'pending' ? (
          pendingTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>All scheduled tasks are completed!</Text>
              <Text style={styles.emptySubtitle}>Review your completed contributions in the Portfolio tab.</Text>
            </View>
          ) : (
            pendingTasks.map((t) => (
              <View key={t.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskType}>{t.assignee_type.toUpperCase()}</Text>
                  {t.due_at && (
                    <Text style={styles.dueText}>
                      Due: {new Date(t.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>

                <Text style={styles.taskTitle}>{t.title}</Text>
                {t.description ? <Text style={styles.taskDesc}>{t.description}</Text> : null}

                {/* Status Toggle Button */}
                <TouchableOpacity
                  style={[
                    styles.statusToggle,
                    t.status === 'in_progress' ? styles.statusInProgress : styles.statusTodo,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleToggleStatus(t)}
                >
                  {t.status === 'in_progress' ? (
                    <Clock size={14} color="#1d4ed8" />
                  ) : (
                    <Circle size={14} color="#64748b" />
                  )}
                  <Text
                    style={[
                      styles.statusToggleText,
                      t.status === 'in_progress' ? styles.statusTextInProgress : styles.statusTextTodo,
                    ]}
                  >
                    STATUS: {t.status === 'in_progress' ? 'IN PROGRESS (TAP TO COMPLETE)' : 'TODO (TAP TO START)'}
                  </Text>
                </TouchableOpacity>
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
                    <Text style={styles.completedBadgeText}>VERIFIED CONTRIBUTION</Text>
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
                  onPress={() => handleToggleStatus(t)}
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
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  statusTodo: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  statusInProgress: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statusTextTodo: {
    color: '#475569',
  },
  statusTextInProgress: {
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

