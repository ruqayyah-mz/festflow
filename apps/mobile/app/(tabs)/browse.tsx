import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { DEMO_EVENT } from '../../src/lib/storage';
import { router } from 'expo-router';
import { DollarSign, MapPin, Calendar } from 'lucide-react-native';

export default function SponsorBrowseScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PARTNER OPPORTUNITIES</Text>
          <Text style={styles.headerSub}>Public hackathons and tech festivals actively seeking sponsors</Text>
        </View>

        <View style={styles.eventCard}>
          <View style={styles.badgeRow}>
            <View style={styles.sponsorBadge}>
              <DollarSign size={12} color="#1d4ed8" />
              <Text style={styles.sponsorBadgeText}>SEEKING SPONSORS</Text>
            </View>
            <Text style={styles.statusOpen}>ACCEPTING PROPOSALS</Text>
          </View>

          <Text style={styles.eventName}>{DEMO_EVENT.name}</Text>
          <Text style={styles.eventDesc}>{DEMO_EVENT.description}</Text>

          <View style={styles.metaRow}>
            <MapPin size={12} color="#64748b" />
            <Text style={styles.metaText}>{DEMO_EVENT.venue}</Text>
          </View>

          <View style={styles.metaRow}>
            <Calendar size={12} color="#64748b" />
            <Text style={styles.metaText}>36-Hour Hackathon • AI, Web3, Systems</Text>
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/applications')}
          >
            <Text style={styles.applyButtonText}>View Active Sponsorship Application →</Text>
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
  header: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  eventCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sponsorBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  statusOpen: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#16a34a',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  eventDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  applyButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});

