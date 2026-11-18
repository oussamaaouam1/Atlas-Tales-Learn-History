import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { tokens } from '../theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Center content vertically (onboarding, splash). */
  centered?: boolean;
  edges?: Edge[];
}

export function Screen({ children, scroll = false, centered = false, edges = ['top', 'bottom'] }: ScreenProps) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, centered && styles.centered]}>{children}</ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, centered && styles.centered]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background },
  fill: { flex: 1 },
  content: { paddingHorizontal: tokens.spacing.lg, paddingVertical: tokens.spacing.md, gap: tokens.spacing.md },
  centered: { flexGrow: 1, justifyContent: 'center' },
});
