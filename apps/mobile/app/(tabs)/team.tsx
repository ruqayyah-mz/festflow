import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Users, Copy, Check } from 'lucide-react-native';

export default function ParticipantTeamScreen() {
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const team = {
    name: 'NeuralNomads',
    join_code: 'CQ-7701',
    table_number: 'Table 14',
    track: 'AI / ML Systems',
    members: [
      { id: '1', full_name: 'David Kim (Team Lead)' },
      { id: '2', full_name: 'Maya Lin (Full-stack Engineer)' },
      { id: '3', full_name: 'Liam Vance (ML Researcher)' },
    ],
  };

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (!joinCodeInput.trim()) return;
    setStatusMessage(`Joined team code ${joinCodeInput.trim().toUpperCase()} successfully!`);
    setJoinCodeInput('');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Team Banner */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.tag}>
              <Users size={12} color="#1d4ed8" />
              <Text style={styles.tagText}>ACTIVE SQUAD</Text>
            </View>
            <Text style={styles.tableNumber}>{team.table_number}</Text>
          </View>

          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.trackName}>Track: {team.track}</Text>

          {/* Join Code Box */}
          <View style={styles.joinCodeBox}>
            <View>
              <Text style={styles.joinCodeLabel}>TEAM JOIN CODE:</Text>
              <Text style={styles.joinCodeVal}>{team.join_code}</Text>
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              activeOpacity={0.7}
              onPress={handleCopyCode}
            >
              {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="#1d4ed8" />}
              <Text style={styles.copyText}>{copied ? 'COPIED' : 'COPY'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Member Roster */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>TEAM ROSTER ({team.members.length})</Text>
          <View style={styles.rosterList}>
            {team.members.map((m, idx) => (
              <View key={m.id} style={styles.memberRow}>
                <Text style={styles.memberIdx}>#{idx + 1}</Text>
                <Text style={styles.memberName}>{m.full_name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Join Other Team by Code */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>JOIN A DIFFERENT TEAM</Text>
          <Text style={styles.hint}>Enter the 6-character code provided by another team lead:</Text>

          {statusMessage ? <Text style={styles.statusSuccess}>{statusMessage}</Text> : null}

          <View style={styles.joinInputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. CQ-8822"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              value={joinCodeInput}
              onChangeText={setJoinCodeInput}
            />
            <TouchableOpacity
              style={styles.joinButton}
              activeOpacity={0.8}
              onPress={handleJoin}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
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
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  tableNumber: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  trackName: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  joinCodeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 12,
    marginTop: 6,
  },
  joinCodeLabel: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  joinCodeVal: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#1d4ed8',
    marginTop: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  copyText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  rosterList: {
    gap: 8,
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  memberIdx: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#94a3b8',
    width: 24,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  hint: {
    fontSize: 11,
    color: '#64748b',
  },
  joinInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  joinButton: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statusSuccess: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
  },
});

