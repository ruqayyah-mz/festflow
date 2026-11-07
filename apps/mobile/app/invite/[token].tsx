import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MobileStorage } from '../../src/lib/storage';
import { goHome } from '../../src/lib/session';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react-native';

export default function InviteOnboardingScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [isValidating, setIsValidating] = useState(true);
  const [roleAssigned, setRoleAssigned] = useState<'volunteer' | 'participant' | null>(null);

  useEffect(() => {
    async function processInvite() {
      // Simulate invite validation via RPC / token check
      await new Promise((r) => setTimeout(r, 600));

      if (token && token.startsWith('vol-')) {
        setRoleAssigned('volunteer');
        await MobileStorage.setActiveRole('volunteer');
        const user = await MobileStorage.getUser();
        if (!user) {
          await MobileStorage.setUser({
            id: '00000000-0000-0000-0000-000000000002',
            full_name: 'Sarah Chen (Invited Volunteer)',
          });
        }
      } else {
        setRoleAssigned('participant');
        await MobileStorage.setActiveRole('participant');
      }
      setIsValidating(false);
    }
    processInvite();
  }, [token]);

  if (isValidating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#1d4ed8" />
          <Text style={styles.loadingText}>Validating invitation credential...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <CheckCircle2 size={16} color="#16a34a" />
            <Text style={styles.badgeText}>INVITATION VERIFIED</Text>
          </View>

          <Text style={styles.title}>Welcome to FestFlow</Text>
          <Text style={styles.sub}>
            You have joined <strong style={{ color: '#0f172a' }}>National Builder HackFest 2026</strong> as an official{' '}
            <strong style={{ color: '#1d4ed8' }}>{roleAssigned?.toUpperCase()}</strong>.
          </Text>

          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>TOKEN IDENTIFIER:</Text>
            <Text style={styles.tokenVal}>{token}</Text>
          </View>

          <TouchableOpacity
            style={styles.enterButton}
            activeOpacity={0.85}
            onPress={goHome}
          >
            <Text style={styles.enterButtonText}>Open Role Dashboard</Text>
            <ArrowRight size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 24,
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#16a34a',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  sub: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  tokenBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 10,
    marginVertical: 4,
  },
  tokenLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#64748b',
    fontWeight: '700',
  },
  tokenVal: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1d4ed8',
    fontWeight: '700',
    marginTop: 2,
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    marginTop: 8,
  },
  enterButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});

