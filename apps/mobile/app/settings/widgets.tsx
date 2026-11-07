import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { CheckSquare, LayoutDashboard, Bell, Smartphone } from 'lucide-react-native';

export default function WidgetSettingsScreen() {
  const guides = [
    {
      title: 'Volunteer & Sponsor Tasks Widget',
      icon: CheckSquare,
      desc: 'Interactive 2x2 or 4x2 checklist with tap-to-complete checkboxes directly on the Android home screen without launching the app.',
      steps: [
        '1. Long-press any empty space on your Android home screen.',
        '2. Tap "Widgets" in the launcher menu, scroll and select "FestFlow".',
        '3. Drag "FestFlow: Tasks" onto your screen. Checkboxes work interactively!',
      ],
    },
    {
      title: 'Organizer Progress Widget',
      icon: LayoutDashboard,
      desc: 'Read-only 4x1 milestone tracker displaying percentage of tasks completed and active participant counts.',
      steps: [
        '1. Long-press home screen -> Select "Widgets".',
        '2. Choose "FestFlow: Event Progress".',
        '3. Tap anywhere on the widget bar to open the Organizer Operations Terminal.',
      ],
    },
    {
      title: 'Participant Announcements Widget',
      icon: Bell,
      desc: 'Real-time 4x2 feed of emergency broadcasts, schedule shifts, and judging announcements.',
      steps: [
        '1. Long-press home screen -> Select "Widgets".',
        '2. Choose "FestFlow: Announcements".',
        '3. Tapping any headline opens the announcement directly.',
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Smartphone size={24} color="#1d4ed8" />
          <Text style={styles.heroTitle}>Android Home Screen Widgets</Text>
          <Text style={styles.heroSub}>
            FestFlow widgets work when the app is completely closed. Actions sync to the organizer via Supabase Realtime.
          </Text>
        </View>

        {guides.map((g) => {
          const Icon = g.icon;
          return (
            <View key={g.title} style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon size={16} color="#1d4ed8" />
                <Text style={styles.cardTitle}>{g.title}</Text>
              </View>
              <Text style={styles.desc}>{g.desc}</Text>

              <View style={styles.stepList}>
                {g.steps.map((st) => (
                  <Text key={st} style={styles.stepText}>
                    {st}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
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
  hero: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  desc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  stepList: {
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: 8,
    gap: 6,
  },
  stepText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#334155',
    lineHeight: 16,
  },
});

