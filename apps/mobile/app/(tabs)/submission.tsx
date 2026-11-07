import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { CheckCircle2, Save, ExternalLink } from 'lucide-react-native';

export default function ParticipantSubmissionScreen() {
  const [title, setTitle] = useState('PulseAI: Emergency Medical Dispatcher Copilot');
  const [description, setDescription] = useState(
    'Low-latency acoustic emotion and symptom detection agent for emergency call centers with automated triage triage scoring.'
  );
  const [repoUrl, setRepoUrl] = useState('https://github.com/festflow-builders/pulse-ai');
  const [demoUrl, setDemoUrl] = useState('https://pulseai.demo.festflow.dev');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSave = () => {
    setStatusMessage('Project submission saved and synchronized with judging terminal!');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.badge}>
              <CheckCircle2 size={12} color="#16a34a" />
              <Text style={styles.badgeText}>SUBMITTED FOR ROUND 2 EVALUATION</Text>
            </View>
            <Text style={styles.tableRef}>Table 14</Text>
          </View>
          <Text style={styles.note}>
            Judges evaluate your project using this repository and demo link. Updates save live.
          </Text>
        </View>

        {statusMessage ? (
          <View style={styles.alertSuccess}>
            <Text style={styles.alertSuccessText}>{statusMessage}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.label}>PROJECT TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ChainAudit"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.label, { marginTop: 10 }]}>PROJECT DESCRIPTION & ARCHITECTURE</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Brief explanation of your solution, novelty and tech stack..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.label, { marginTop: 10 }]}>GITHUB REPOSITORY URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://github.com/..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="url"
            value={repoUrl}
            onChangeText={setRepoUrl}
          />

          <Text style={[styles.label, { marginTop: 10 }]}>LIVE DEMO / PROTOTYPE URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="url"
            value={demoUrl}
            onChangeText={setDemoUrl}
          />

          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.85}
            onPress={handleSave}
          >
            <Save size={14} color="#ffffff" />
            <Text style={styles.saveButtonText}>Save Submission Details</Text>
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
    gap: 12,
  },
  statusCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 14,
    gap: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#16a34a',
  },
  tableRef: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  note: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  alertSuccess: {
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    padding: 10,
  },
  alertSuccessText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  formCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    marginTop: 2,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#1d4ed8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 14,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});

