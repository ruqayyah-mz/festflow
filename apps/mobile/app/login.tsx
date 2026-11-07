import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { RoleType } from '@festflow/shared';
import { MobileStorage, DEMO_PROFILES } from '../src/lib/storage';
import { isLiveSupabase } from '../src/lib/supabase';
import { finishSignIn, goHome, signInWithEmail } from '../src/lib/session';

const PERSONAS: { role: RoleType; name: string; title: string; subtitle: string }[] = [
  {
    role: 'organizer',
    name: 'Alex Rivera',
    title: 'Lead Organizer',
    subtitle: 'Direct operations, post alerts & review metrics',
  },
  {
    role: 'volunteer',
    name: 'Sarah Chen',
    title: 'Volunteer Coordinator',
    subtitle: 'Floor logistics, Wi-Fi checks & shift tasks',
  },
  {
    role: 'sponsor',
    name: 'Elena Rostova',
    title: 'CloudNova DevRel Sponsor',
    subtitle: 'Track partnership deliverables & applications',
  },
  {
    role: 'participant',
    name: 'David Kim',
    title: 'Hacker / Team Lead',
    subtitle: 'Manage team, track deadlines & submit project',
  },
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Live builds: one-tap sign-in to the seeded demo accounts (supabase/seed.sql, password is public there).
  // Demo builds: pick a persona, everything stays on the phone.
  const handleSelectPersona = async (item: typeof PERSONAS[0]) => {
    if (isLiveSupabase) {
      setError(null);
      setBusy(true);
      try {
        await signInWithEmail(`${item.role}@festflow.dev`, 'festflow-demo');
        await goHome();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-in failed');
      } finally {
        setBusy(false);
      }
      return;
    }
    const profile = DEMO_PROFILES[item.role];
    await MobileStorage.setUser(profile);
    await MobileStorage.setActiveRole(item.role);
    await MobileStorage.setUserRoles(['organizer', 'volunteer', 'sponsor', 'participant']);
    await finishSignIn(profile.id);
    await goHome();
  };

  const handleEmailSignIn = async () => {
    if (!isLiveSupabase) {
      setError('This build has no Supabase keys, so only the demo roles above work.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signInWithEmail(email, password);
      await goHome();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>FF</Text>
          </View>
          <Text style={styles.title}>FestFlow Mobile</Text>
          <Text style={styles.subtitle}>Event & Hackathon Operating System</Text>
        </View>

        {/* Quick Persona Selector */}
        <>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT ROLE TO ENTER DASHBOARD:</Text>
          <View style={styles.personaGrid}>
            {PERSONAS.map((item) => (
              <TouchableOpacity
                key={item.role}
                style={styles.personaCard}
                activeOpacity={0.8}
                disabled={busy}
                onPress={() => handleSelectPersona(item)}
              >
                <View style={styles.personaHeader}>
                  <Text style={styles.personaRole}>{item.role.toUpperCase()}</Text>
                  <Text style={styles.personaName}>{item.name}</Text>
                </View>
                <Text style={styles.personaTitle}>{item.title}</Text>
                <Text style={styles.personaSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SIGN IN WITH EMAIL</Text>
          <View style={styles.dividerLine} />
        </View>
        </>

        {/* Manual Form */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Work Email</Text>
          <TextInput
            style={styles.input}
            placeholder="volunteer@festflow.dev"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.signInButton, busy && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={handleEmailSignIn}
            disabled={busy}
          >
            <Text style={styles.signInButtonText}>{busy ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logoBadge: {
    width: 44,
    height: 44,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  personaGrid: {
    gap: 10,
  },
  personaCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  personaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  personaRole: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  personaName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  personaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  personaSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  formSection: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  signInButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 10,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

