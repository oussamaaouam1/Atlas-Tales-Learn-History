import { ConvexProvider } from 'convex/react';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bootstrap, type BootState } from './src/bootstrap';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LanguageProvider } from './src/providers/LanguageProvider';
import { SessionProvider } from './src/providers/SessionProvider';
import { convexClient } from './src/services/convex';
import { useAppFonts } from './src/theme/fonts';
import { tokens } from './src/theme/tokens';

export default function App() {
  const fontsReady = useAppFonts();
  const [boot, setBoot] = useState<BootState | null>(null);

  useEffect(() => {
    void bootstrap().then((state) => {
      if (state) setBoot(state);
    });
  }, []);

  if (!convexClient) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Atlas Tales: EXPO_PUBLIC_CONVEX_URL is not set.</Text>
      </View>
    );
  }

  if (!fontsReady || !boot) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.color.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ConvexProvider client={convexClient}>
          <LanguageProvider initialLanguage={boot.language}>
            <SessionProvider initialAgeBand={boot.ageBand}>
              <RootNavigator onboardingComplete={boot.onboardingComplete} splashIcon={boot.splashIcon} />
              {/* Immersive landscape app: no status bar (battery, notifications). */}
              <StatusBar hidden />
            </SessionProvider>
          </LanguageProvider>
        </ConvexProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.background },
  error: { color: tokens.color.danger, textAlign: 'center', paddingHorizontal: tokens.spacing.lg },
});
