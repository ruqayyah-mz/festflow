// Volunteer home: the events I'm on. Tapping one makes it the active event and opens its tasks.
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import type { Event, Task } from '@festflow/shared';
import { MobileStorage } from '../../src/lib/storage';
import { refreshMyEvents } from '../../src/lib/events';
import { fetchOpenTasks, getCachedMyTasks, syncMyTasks } from '../../src/lib/tasks';
import { Calendar, MapPin, ChevronRight } from 'lucide-react-native';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function phase(e: Event, now = Date.now()) {
  if (Date.parse(e.ends_at) < now) return 'ENDED';
  if (Date.parse(e.starts_at) <= now) return 'LIVE NOW';
  return 'UPCOMING';
}

export default function MyEventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setEvents(await MobileStorage.getEvents()); // cache first
    setTasks(await getCachedMyTasks());
    setActiveId((await MobileStorage.getEvent())?.id ?? null);
    try {
      const fresh = await refreshMyEvents();
      setEvents(fresh);
      setTasks(await syncMyTasks());
      setActiveId((await MobileStorage.getEvent())?.id ?? null);
      const counts = await Promise.all(fresh.map(async (e) => [e.id, (await fetchOpenTasks(e.id)).length] as const));
      setOpenCounts(Object.fromEntries(counts));
      setNotice(null);
    } catch {
      setNotice('Offline. Showing saved events.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const open = async (e: Event) => {
    await MobileStorage.setEvent(e);
    router.push('/(tabs)/tasks');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <Text style={styles.heading}>MY EVENTS</Text>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        {events.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.title}>You're not on any event yet</Text>
            <Text style={styles.meta}>
              Apply to volunteer on the FestFlow website. Once the organizer accepts you, the event shows up here.
            </Text>
          </View>
        ) : (
          events.map((e) => {
            const mine = tasks.filter((t) => t.event_id === e.id);
            const done = mine.filter((t) => t.status === 'done').length;
            const openCount = openCounts[e.id] ?? 0;
            return (
              <TouchableOpacity
                key={e.id}
                style={[styles.card, e.id === activeId && styles.cardActive]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Open ${e.name}`}
                onPress={() => open(e)}
              >
                <View style={styles.row}>
                  <Text style={styles.phase}>{phase(e)}</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </View>
                <Text style={styles.title}>{e.name}</Text>
                <View style={styles.row}>
                  <Calendar size={13} color="#64748b" />
                  <Text style={styles.meta}>
                    {fmt(e.starts_at)} — {fmt(e.ends_at)}
                  </Text>
                </View>
                {e.venue ? (
                  <View style={styles.row}>
                    <MapPin size={13} color="#64748b" />
                    <Text style={styles.meta} numberOfLines={1}>
                      {e.venue}
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.stats}>
                  {mine.length - done} to do · {done} done{openCount ? ` · ${openCount} open to take up` : ''}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 16, gap: 12 },
  heading: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  notice: { fontSize: 12, color: '#b45309' },
  card: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', padding: 14, gap: 6 },
  cardActive: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-start' },
  phase: { flex: 1, fontSize: 10, fontWeight: '700', color: '#1d4ed8', letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b', flexShrink: 1 },
  stats: { fontSize: 12, fontWeight: '600', color: '#0f172a', marginTop: 4 },
});
