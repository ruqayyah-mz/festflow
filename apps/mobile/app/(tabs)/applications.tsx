import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { CheckCircle2, Clock } from 'lucide-react-native';

export default function SponsorApplicationsScreen() {
  const application = {
    company: 'CloudNova Labs',
    tier: 'Gold Partner ($5,000)',
    status: 'confirmed' as const,
    perks: '$20,000 in GPU cloud credits for all participants + fast-track recruiting.',
    requirements: 'Primary foyer booth space (10x10) + 30-min technical keynote slot.',
    applied_at: '2026-11-04T10:00:00Z',
  };

  const steps = [
    { key: 'applied', label: '1. Applied', completed: true },
    { key: 'under_review', label: '2. Under Review', completed: true },
    { key: 'confirmed', label: '3. Confirmed Partner', completed: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SPONSORSHIP PIPELINE</Text>
          <Text style={styles.headerSub}>Live tracking of your partnership proposal and deliverables</Text>
        </View>

        {/* Application Card */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.companyName}>{application.company}</Text>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={12} color="#16a34a" />
              <Text style={styles.statusBadgeText}>STATUS: CONFIRMED</Text>
            </View>
          </View>

          <Text style={styles.tierText}>{application.tier}</Text>

          {/* Stepper */}
          <View style={styles.stepperContainer}>
            {steps.map((s, idx) => (
              <View key={s.key} style={styles.stepItem}>
                <View style={[styles.stepDot, s.completed && styles.stepDotCompleted]}>
                  {s.completed ? (
                    <Text style={styles.stepDotCheck}>✓</Text>
                  ) : (
                    <Clock size={10} color="#64748b" />
                  )}
                </View>
                <Text style={[styles.stepLabel, s.completed && styles.stepLabelCompleted]}>
                  {s.label}
                </Text>
                {idx < steps.length - 1 && <View style={styles.stepLine} />}
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Agreed Perks & Credits:</Text>
            <Text style={styles.detailValue}>{application.perks}</Text>

            <Text style={[styles.detailLabel, { marginTop: 10 }]}>Logistical Requirements:</Text>
            <Text style={styles.detailValue}>{application.requirements}</Text>
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
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
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
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#16a34a',
  },
  tierText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepDotCompleted: {
    borderColor: '#16a34a',
    backgroundColor: '#16a34a',
  },
  stepDotCheck: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#94a3b8',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#0f172a',
    fontWeight: '700',
  },
  stepLine: {
    position: 'absolute',
    top: 11,
    right: -25,
    width: 50,
    height: 1,
    backgroundColor: '#16a34a',
    zIndex: -1,
  },
  detailSection: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  detailValue: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
});

