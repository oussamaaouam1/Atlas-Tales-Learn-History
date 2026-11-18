import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { tokens } from '../theme/tokens';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  /** Optional icon shown at the end of the label (after it in reading order). */
  endIcon?: React.ReactNode;
}

/** Pressed / disabled / loading states come from code, never from extra images (§19.2). */
export function Button({ label, variant = 'primary', loading = false, disabled, endIcon, ...rest }: ButtonProps) {
  const isDisabled = disabled === true || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? tokens.color.textOnPrimary : tokens.color.primary} />
      ) : (
        <View style={styles.content}>
          <AppText bold variant="bodyLarge" color={variant === 'primary' ? 'textOnPrimary' : 'primary'}>
            {label}
          </AppText>
          {endIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  primary: { backgroundColor: tokens.color.primary },
  secondary: { backgroundColor: tokens.color.surface, borderWidth: 1.5, borderColor: tokens.color.primary },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
