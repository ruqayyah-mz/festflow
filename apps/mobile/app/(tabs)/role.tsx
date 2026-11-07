import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Event, Profile } from '@festflow/shared';
import { MobileStorage } from '../../src/lib/storage';
import { supabase } from '../../src/lib/supabase';
import { getCachedMyTasks } from '../../src/lib/tasks';
import { Shield, MapPin, Calendar, CheckSquare } from 'lucide-react-native';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function VolunteerRoleScreen() {
  const [user, setUser] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [counts, setCounts] = useState({ todo: 0, in_progress: 0, done: 0 });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setUser(await MobileStorage.getUser());
        setEvent(await MobileStorage.getEvent());
        if (supabase) setEmail((await supabase.auth.getSession()).data.session?.user.email ?? null);
        const tasks = await getCachedMyTasks();
        setCounts({
          todo: tasks.filter((t) => t.status === 'todo').length,
          in_progress: tasks.filter((t) => t.status === 'in_progress').length,
          done: tasks.filter((t) => t.status === 'done').length,
        });
      })();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.badgeRow}>
            <Shield size={16} color="#1d4ed8" />
            <Text style={styles.badgeText}>VOLUNTEER</Text>
          </View>
          <Text style={styles.name}>{user?.full_name ?? '—'}</Text>
          {email ? <Text style={styles.roleTitle}>{email}</Text> : null}
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionHeader}>MY EVENT</Text>

          <View style={styles.row}>
            <Calendar size={16} color="#64748b" />
            <View style={styles.col}>
              <Text style={styles.label}>{event?.name ?? 'No event yet'}</Text>
              {event ? <Text style={styles.val}>{fmt(event.starts_at)} — {fmt(event.ends_at)}</Text> : null}
            </View>
          </View>

          {event?.venue ? (
            <View style={styles.row}>
              <MapPin size={16} color="#64748b" />
              <View style={styles.col}>
                <Text style={styles.label}>Venue</Text>
                <Text style={styles.val}>{event.venue}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.row}>
            <CheckSquare size={16} color="#64748b" />
            <View style={styles.col}>
              <Text style={styles.label}>My tasks</Text>
              <Text style={styles.val}>
                {counts.todo} to do · {counts.in_progress} in progress · {counts.done} done
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

