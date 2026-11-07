import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { MobileStorage } from '../src/lib/storage';

export default function IndexScreen() {
  useEffect(() => {
    async function checkAuth() {
      const user = await MobileStorage.getUser();
      if (user) {
        router.replace('/(tabs)');
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

