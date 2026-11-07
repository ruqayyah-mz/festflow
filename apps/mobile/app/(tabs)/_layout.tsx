import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { Tabs, router } from 'expo-router';
import { RoleType } from '@festflow/shared';
import { MobileStorage } from '../../src/lib/storage';
import { CheckSquare, Bell, User, Globe, FileText, Home, Users, Upload, LayoutDashboard, Settings } from 'lucide-react-native';

export default function TabsLayout() {
  const [currentRole, setCurrentRole] = useState<RoleType>('volunteer');
  const [availableRoles, setAvailableRoles] = useState<RoleType[]>([]);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      const role = await MobileStorage.getActiveRole();
      const roles = await MobileStorage.getUserRoles();
      setCurrentRole(role);
      setAvailableRoles(roles);
    }
    loadRoles();
  }, []);

  const handleSwitchRole = async (newRole: RoleType) => {
    setCurrentRole(newRole);
    await MobileStorage.setActiveRole(newRole);
    setIsRoleModalVisible(false);

    // Route to home tab of selected role
    if (newRole === 'volunteer') {
      router.push('/(tabs)/tasks');
    } else if (newRole === 'sponsor') {
      router.push('/(tabs)/browse');
    } else if (newRole === 'participant') {
      router.push('/(tabs)/home');
    } else if (newRole === 'organizer') {
      router.push('/(tabs)/overview');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar with Event Name, Role Switcher and Widget Guide */}
      <View style={styles.topBar}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName} numberOfLines={1}>
            National Builder HackFest 2026
          </Text>
          <TouchableOpacity
            style={styles.roleBadge}
            activeOpacity={0.7}
            onPress={() => setIsRoleModalVisible(true)}
          >
            <Text style={styles.roleBadgeText}>
              ROLE: {currentRole.toUpperCase()} ▾
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.widgetButton}
          onPress={() => router.push('/settings/widgets')}
          activeOpacity={0.7}
        >
          <Settings size={18} color="#1d4ed8" />
        </TouchableOpacity>
      </View>

      {/* Role Switcher Modal */}
      <Modal
        visible={isRoleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRoleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsRoleModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SWITCH ACTIVE ROLE</Text>
            {availableRoles.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleOption, r === currentRole && styles.roleOptionActive]}
                onPress={() => handleSwitchRole(r)}
              >
                <Text style={[styles.roleOptionText, r === currentRole && styles.roleOptionTextActive]}>
                  {r.toUpperCase()}
                </Text>
                {r === currentRole && <Text style={styles.activeCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Dynamic Tab Navigation configured based on Role */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#1d4ed8',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        {/* Volunteer Tabs */}
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'My Tasks',
            href: currentRole === 'volunteer' || currentRole === 'sponsor' || currentRole === 'organizer' ? '/(tabs)/tasks' : null,
            tabBarIcon: ({ color }) => <CheckSquare size={18} color={color} />,
          }}
        />
        <Tabs.Screen
          name="announcements"
          options={{
            title: 'Announcements',
            href: '/(tabs)/announcements',
            tabBarIcon: ({ color }) => <Bell size={18} color={color} />,
          }}
        />
        <Tabs.Screen
          name="role"
          options={{
            title: 'My Role',
            href: currentRole === 'volunteer' ? '/(tabs)/role' : null,
            tabBarIcon: ({ color }) => <User size={18} color={color} />,
          }}
        />

        {/* Sponsor Tabs */}
        <Tabs.Screen
          name="browse"
          options={{
            title: 'Browse Events',
            href: currentRole === 'sponsor' ? '/(tabs)/browse' : null,
            tabBarIcon: ({ color }) => <Globe size={18} color={color} />,
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Applications',
            href: currentRole === 'sponsor' ? '/(tabs)/applications' : null,
            tabBarIcon: ({ color }) => <FileText size={18} color={color} />,
          }}
        />

        {/* Participant Tabs */}
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            href: currentRole === 'participant' ? '/(tabs)/home' : null,
            tabBarIcon: ({ color }) => <Home size={18} color={color} />,
          }}
        />
        <Tabs.Screen
          name="team"
          options={{
            title: 'Team',
            href: currentRole === 'participant' ? '/(tabs)/team' : null,
            tabBarIcon: ({ color }) => <Users size={18} color={color} />,
          }}
        />
        <Tabs.Screen
          name="submission"
          options={{
            title: 'Submission',
            href: currentRole === 'participant' ? '/(tabs)/submission' : null,
            tabBarIcon: ({ color }) => <Upload size={18} color={color} />,
          }}
        />

        {/* Organizer Tab */}
        <Tabs.Screen
          name="overview"
          options={{
            title: 'Overview',
            href: currentRole === 'organizer' ? '/(tabs)/overview' : null,
            tabBarIcon: ({ color }) => <LayoutDashboard size={18} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  roleBadge: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#1d4ed8',
  },
  widgetButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    height: 56,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 16,
  },
  modalTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#64748b',
    marginBottom: 12,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  roleOptionActive: {
    backgroundColor: '#eff6ff',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  roleOptionTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  activeCheck: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
});

