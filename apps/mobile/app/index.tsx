import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { goHome, hasSession } from '../src/lib/session';

export default function IndexScreen() {
  useEffect(() => {
    async function checkAuth() {
      if (await hasSession()) {
        await goHome();
      } else {
        router.replace('/login');
      }
    }
    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#1d4ed8" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

