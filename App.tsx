import { ConvexProvider, useQuery } from 'convex/react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { api } from './convex/_generated/api';
import { convexClient } from './src/services/convex';

// Phase 0 shell: proves the app runs and reaches Convex. Replaced by navigation in Phase 1.

export function ConvexStatus() {
  const ping = useQuery(api.health.ping);
  if (ping === undefined) return <Text style={styles.status}>Convex: connecting…</Text>;
  return <Text style={styles.status}>Convex: connected ({ping.service})</Text>;
}

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atlas Tales</Text>
      {convexClient ? (
        <ConvexProvider client={convexClient}>
          <ConvexStatus />
        </ConvexProvider>
      ) : (
        <Text style={styles.status}>Convex: EXPO_PUBLIC_CONVEX_URL is not set</Text>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  status: { fontSize: 16, textAlign: 'center' },
});
