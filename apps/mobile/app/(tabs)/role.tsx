import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Profile } from '@festflow/shared';
import { MobileStorage } from '../../src/lib/storage';
import { Shield, MapPin, Calendar, CheckSquare } from 'lucide-react-native';

export default function VolunteerRoleScreen() {
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadUser() {
      const u = await MobileStorage.getUser();
      setUser(u);
    }
    loadUser();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.badgeRow}>
            <Shield size={16} color="#1d4ed8" />
            <Text style={styles.badgeText}>OFFICIAL VOLUNTEER CREDENTIAL</Text>
          </View>
          <Text style={styles.name}>{user?.full_name || 'Sarah Chen'}</Text>
          <Text style={styles.roleTitle}>Logistics & Hacker Experience Lead</Text>
        </View>

        {/* Assigned Shift and Venue Scope */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionHeader}>ASSIGNMENT SCOPE & VENUE</Text>

          <View style={styles.row}>
            <MapPin size={16} color="#64748b" />
            <View style={styles.col}>
              <Text style={styles.label}>Venue Location</Text>
              <Text style={styles.val}>Grand Innovation Arena — Floor 3, Benches 1 to 20</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Calendar size={16} color="#64748b" />
            <View style={styles.col}>
              <Text style={styles.label}>Active Shift Rotation</Text>
              <Text style={styles.val}>Shift B: 14:00 PM — 22:00 PM (Dinner & Judging Escort)</Text>
            </View>
          </View>

          <View style={styles.row}>
            <CheckSquare size={16} color="#64748b" />
            <View style={styles.col}>
              <Text style={styles.label}>Core Directives</Text>
              <Text style={styles.val}>
                1. Assist hackathon judges with table navigation.{'\n'}
                2. Monitor Wi-Fi stability and power circuit health.{'\n'}
                3. Check off assigned duties using the mobile tasks screen or Android home widget.
              </Text>
            </View>
          </View>
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
  profileCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#64748b',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  val: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 18,
  },
});

