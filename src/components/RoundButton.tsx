import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { tokens } from '../theme/tokens';

interface RoundButtonProps {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  size?: number;
  /** Small purple "PRO" tag under the button (design 7D). */
  pro?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/** Round floating control over the art (design: Sunny, Voyage blue, Palm, Cloud buttons). */
export function RoundButton({ children, onPress, accessibilityLabel, color = tokens.color.surface, size = 52, pro, disabled, style }: RoundButtonProps) {
  return (
    <View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: disabled === true }}
        disabled={disabled}
        onPress={onPress}
        hitSlop={6}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        {children}
      </Pressable>
      {pro && (
        <View style={styles.pro} pointerEvents="none">
          <AppText variant="caption" bold color="textOnPrimary" style={styles.proText}>
            PRO
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF', ...tokens.shadow.card },
  pressed: { transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.5 },
  pro: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    paddingHorizontal: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.pro,
  },
  proText: { fontSize: 10, lineHeight: 14 },
});
