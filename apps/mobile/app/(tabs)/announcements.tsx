import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Announcement, RoleType } from '@festflow/shared';
import { MobileStorage, onActiveEventChange } from '../../src/lib/storage';
import { postAnnouncement, syncAnnouncements } from '../../src/lib/events';
import { refreshAllWidgets } from '../../widgets/widgetManager';
import { Send, BellRing } from 'lucide-react-native';

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [role, setRole] = useState<RoleType>('volunteer');
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'participants' | 'volunteers' | 'sponsors'>('all');
  const [isPosting, setIsPosting] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setRole(await MobileStorage.getActiveRole());
    const id = (await MobileStorage.getEvent())?.id ?? null;
    setEventId(id);
    const cached = await MobileStorage.getAnnouncements();
    setAnnouncements(id ? cached.filter((a) => a.event_id === id) : []);
    if (!id) return;
    try {
      setAnnouncements(await syncAnnouncements(id));
      setNotice(null);
    } catch {
      setNotice('Offline. Showing saved announcements.');
    }
  }, []);

  useEffect(() => {
    loadData();
    return onActiveEventChange(loadData);
  }, [loadData]);

  const handlePost = async () => {
    if (!newTitle.trim() || !newMessage.trim() || !eventId) return;

    try {
      await postAnnouncement({ event_id: eventId, audience, title: newTitle.trim(), message: newMessage.trim() });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not post announcement');
      return;
    }
    await loadData();
    await refreshAllWidgets();

    setNewTitle('');
    setNewMessage('');
    setIsPosting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Organizer Compose Panel */}
        {role === 'organizer' && (
          <View style={styles.composeCard}>
            <TouchableOpacity
              style={styles.composeHeader}
              onPress={() => setIsPosting(!isPosting)}
              activeOpacity={0.8}
            >
              <Text style={styles.composeHeaderTitle}>
                {isPosting ? '▲ HIDE COMPOSE' : '+ COMPOSE BROADCAST ANNOUNCEMENT'}
              </Text>
            </TouchableOpacity>

            {isPosting && (
              <View style={styles.formBody}>
                {/* Audience Selector */}
                <Text style={styles.label}>Audience:</Text>
                <View style={styles.audienceRow}>
                  {(['all', 'participants', 'volunteers', 'sponsors'] as const).map((aud) => (
                    <TouchableOpacity
                      key={aud}
                      style={[styles.audBadge, audience === aud && styles.audBadgeActive]}
                      onPress={() => setAudience(aud)}
                    >
                      <Text style={[styles.audBadgeText, audience === aud && styles.audBadgeTextActive]}>
                        {aud.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.titleInput}
                  placeholder="Headline / Title"
                  placeholderTextColor="#94a3b8"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                <TextInput
                  style={styles.messageInput}
                  placeholder="Write message to broadcast..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  value={newMessage}
                  onChangeText={setNewMessage}
                />

                <TouchableOpacity
                  style={styles.broadcastButton}
                  activeOpacity={0.85}
                  onPress={handlePost}
                >
                  <Send size={14} color="#ffffff" />
                  <Text style={styles.broadcastButtonText}>Broadcast Alert</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Feed List */}
        <View style={styles.feedHeader}>
          <BellRing size={16} color="#1d4ed8" />
          <Text style={styles.feedHeaderTitle}>LIVE EVENT FEED</Text>
        </View>

        {notice ? <Text style={styles.timestamp}>{notice}</Text> : null}
        {announcements.length === 0 ? (
          <Text style={styles.cardMessage}>No announcements for this event yet.</Text>
        ) : null}

        {announcements.map((item) => (
          <View key={item.id} style={styles.announcementCard}>
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.badge,
                  item.audience === 'all'
                    ? styles.badgeAll
                    : item.audience === 'participants'
                    ? styles.badgePart
                    : styles.badgeVol,
                ]}
              >
                {item.audience.toUpperCase()}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
            <Text style={styles.cardMessage}>{item.message}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  composeCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  composeHeader: {
    padding: 12,
    backgroundColor: '#eff6ff',
  },
  composeHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  formBody: {
    padding: 12,
    gap: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  audienceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  audBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  audBadgeActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#1d4ed8',
  },
  audBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#475569',
  },
  audBadgeTextActive: {
    color: '#ffffff',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  broadcastButton: {
    backgroundColor: '#1d4ed8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  broadcastButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  feedHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  announcementCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeAll: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
  },
  badgePart: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
  },
  badgeVol: {
    borderColor: '#e9d5ff',
    backgroundColor: '#faf5ff',
    color: '#9333ea',
  },
  timestamp: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
});

