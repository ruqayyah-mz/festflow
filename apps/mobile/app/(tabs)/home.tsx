import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { formatTimeRemaining } from '@festflow/shared';
import { DEMO_EVENT, DEMO_ANNOUNCEMENTS } from '../../src/lib/storage';
import { router } from 'expo-router';
import { Clock, ArrowRight, CheckCircle2, Bell } from 'lucide-react-native';

export default function ParticipantHomeScreen() {
  const [timeLeft, setTimeLeft] = useState(formatTimeRemaining(DEMO_EVENT.ends_at));
  const latestAnnouncement = DEMO_ANNOUNCEMENTS[1]; // Participant specific

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(formatTimeRemaining(DEMO_EVENT.ends_at));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Next Action Banner */}
        <View style={styles.nextActionBanner}>
          <Text style={styles.bannerTag}>NEXT ACTION REQUIRED</Text>
          <Text style={styles.bannerTitle}>Complete & Submit Round 2 Prototype</Text>
          <Text style={styles.bannerDesc}>
            Push code to your public GitHub repo and ensure your demo URL is accessible for judge evaluation.
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/submission')}
          >
            <Text style={styles.actionButtonText}>Edit Project Submission</Text>
            <ArrowRight size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Live Deadline Countdown Card */}
        <View style={styles.countdownCard}>
          <View style={styles.countdownHeader}>
            <Clock size={16} color="#1d4ed8" />
            <Text style={styles.countdownTag}>EVALUATION ROUND 2 DEADLINE</Text>
          </View>
          <Text style={styles.countdownTime}>{timeLeft.label.toUpperCase()}</Text>
          <Text style={styles.countdownSub}>Active Round: Technical Prototype Review</Text>
        </View>

        {/* Status Snapshot */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Project Status:</Text>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={12} color="#16a34a" />
              <Text style={styles.statusBadgeText}>Submitted (Ready for Judges)</Text>
            </View>
          </View>

          <View style={[styles.statusRow, { marginTop: 8 }]}>
            <Text style={styles.statusLabel}>Team Join Code:</Text>
            <Text style={styles.joinCodeText}>CQ-7701 (Table 14)</Text>
          </View>
        </View>

        {/* Latest Announcement Card */}
        {latestAnnouncement && (
          <View style={styles.announcementCard}>
            <View style={styles.announcementHeader}>
              <Bell size={14} color="#1d4ed8" />
              <Text style={styles.announcementTag}>LATEST ANNOUNCEMENT</Text>
            </View>
            <Text style={styles.announcementTitle}>{latestAnnouncement.title}</Text>
            <Text style={styles.announcementMsg}>{latestAnnouncement.message}</Text>
            <TouchableOpacity
              style={styles.viewFeedButton}
              onPress={() => router.push('/(tabs)/announcements')}
            >
              <Text style={styles.viewFeedText}>View all event announcements →</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    padding: 16,
    gap: 12,
  },
  nextActionBanner: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    padding: 16,
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  countdownCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
    alignItems: 'center',
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownTag: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  countdownTime: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#1d4ed8',
    marginVertical: 4,
  },
  countdownSub: {
    fontSize: 11,
    color: '#64748b',
  },
  statusCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#16a34a',
  },
  joinCodeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  announcementCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  announcementTag: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  announcementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  announcementMsg: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  viewFeedButton: {
    marginTop: 8,
  },
  viewFeedText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#1d4ed8',
    fontWeight: '600',
  },
});

