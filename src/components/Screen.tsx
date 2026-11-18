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
  /** Limit content width and center it (onboarding, forms) so lines stay readable in landscape. */
  narrow?: boolean;
}

// Landscape app: the notch / camera cutout is on a side, so protect all four edges by default.
const ALL_EDGES: Edge[] = ['top', 'bottom', 'left', 'right'];

export function Screen({ children, scroll = false, centered = false, edges = ALL_EDGES, narrow = false }: ScreenProps) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, centered && styles.centered, narrow && styles.narrow]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, centered && styles.centered, narrow && styles.narrow]}>{children}</View>
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
  narrow: { width: '100%', maxWidth: 640, alignSelf: 'center' },
});
