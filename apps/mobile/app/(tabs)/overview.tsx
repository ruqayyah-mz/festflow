import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { DEMO_EVENT } from '../../src/lib/storage';
import { MobileStorage } from '../../src/lib/storage';
import { router } from 'expo-router';
import { Users, CheckSquare, HeartHandshake, Award } from 'lucide-react-native';

export default function OrganizerOverviewScreen() {
  const [tasksDone, setTasksDone] = useState(1);
  const [totalTasks, setTotalTasks] = useState(3);

  useEffect(() => {
    async function loadTasks() {
      const list = await MobileStorage.getTasks();
      const done = list.filter((t) => t.status === 'done').length;
      setTasksDone(done);
      setTotalTasks(list.length);
    }
    loadTasks();
  }, []);

  const stats = [
    { label: 'PARTICIPANTS', value: '48', sub: '12 active teams', icon: Users, color: '#1d4ed8' },
    { label: 'VOLUNTEERS', value: '8', sub: '2 floor shifts', icon: CheckSquare, color: '#9333ea' },
    { label: 'SPONSORS', value: '3', sub: '$15,000 pledged', icon: HeartHandshake, color: '#d97706' },
    { label: 'TASKS DONE', value: `${Math.round((tasksDone / totalTasks) * 100)}%`, sub: `${tasksDone}/${totalTasks} completed`, icon: Award, color: '#16a34a' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Event Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTag}>ORGANIZER OPERATIONS TERMINAL</Text>
          <Text style={styles.headerTitle}>{DEMO_EVENT.name}</Text>
          <Text style={styles.headerVenue}>{DEMO_EVENT.venue}</Text>
        </View>

        {/* 4 Stat Counts Grid */}
        <View style={styles.grid}>
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <View key={s.label} style={styles.statCard}>
                <View style={styles.statTop}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Icon size={14} color={s.color} />
                </View>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statSub}>{s.sub}</Text>
              </View>
            );
          })}
        </View>

        {/* Quick Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RAPID CONTROLS</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/announcements')}
          >
            <Text style={styles.actionTitle}>Broadcast Emergency / Floor Announcement →</Text>
            <Text style={styles.actionSub}>Send push notification to all participants, volunteers or sponsors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/tasks')}
          >
            <Text style={styles.actionTitle}>Review Task Completion & Checklists →</Text>
            <Text style={styles.actionSub}>Audit volunteer shifts and partner deliverables</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  headerCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 16,
    gap: 4,
  },
  headerTag: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerVenue: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  statSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  actionCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 2,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  actionSub: {
    fontSize: 11,
    color: '#64748b',
  },
});

