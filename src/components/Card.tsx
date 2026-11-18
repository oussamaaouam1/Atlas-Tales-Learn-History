import { StyleSheet, View, type ViewProps } from 'react-native';

import { tokens } from '../theme/tokens';

export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    ...tokens.shadow.card,
  },
});
