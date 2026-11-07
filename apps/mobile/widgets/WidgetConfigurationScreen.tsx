// Opens when any FestFlow widget is added (or long-press → reconfigure): pick which event this widget shows.
// Runs in its own Android activity, outside expo-router, so it only uses storage and plain components.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
import type { Event } from '@festflow/shared';
import { MobileStorage } from '../src/lib/storage';
import { buildAnnouncementsWidget, buildProgressWidget, buildTasksWidget } from './widgetManager';

export function WidgetConfigurationScreen({ widgetInfo, renderWidget, setResult }: WidgetConfigurationScreenProps) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [current, setCurrent] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      setEvents(await MobileStorage.getEvents());
      setCurrent((await MobileStorage.getWidgetEvents())[widgetInfo.widgetId]);
    })();
  }, [widgetInfo, setResult]);

  const choose = async (eventId: string | null) => {
    await MobileStorage.setWidgetEvent(widgetInfo.widgetId, eventId);
    const { widgetName, widgetId, width, height } = widgetInfo;
    renderWidget(
      widgetName === 'OrganizerProgressWidget'
        ? await buildProgressWidget(widgetId)
        : widgetName === 'ParticipantAnnouncementsWidget'
        ? await buildAnnouncementsWidget(height, widgetId)
        : await buildTasksWidget(width, 'ok', widgetId)
    );
    setResult('ok');
  };

  if (!events) return <View style={styles.safe} />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Which event should this widget show?</Text>

        {events.length === 0 ? (
          <Text style={styles.hint}>
            Sign in to the FestFlow app first so it knows your events. You can change this later: long-press the
            widget and choose reconfigure.
          </Text>
        ) : (
          events.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.option, e.id === current && styles.optionActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: e.id === current }}
              onPress={() => choose(e.id)}
            >
              <Text style={[styles.optionText, e.id === current && styles.optionTextActive]}>{e.name}</Text>
              {e.venue ? <Text style={styles.hint}>{e.venue}</Text> : null}
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.option} accessibilityRole="button" onPress={() => choose(null)}>
          <Text style={styles.optionText}>Follow the event open in the app</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancel} accessibilityRole="button" onPress={() => setResult('cancel')}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { padding: 20, gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  hint: { fontSize: 12, color: '#64748b', marginTop: 2 },
  option: { borderWidth: 1, borderColor: '#e2e8f0', padding: 14 },
  optionActive: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  optionTextActive: { color: '#1d4ed8' },
  cancel: { padding: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, color: '#b91c1c', fontWeight: '600' },
});
