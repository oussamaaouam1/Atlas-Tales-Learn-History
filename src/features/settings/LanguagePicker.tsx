import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LANGUAGES, NATIVE_NAMES, type Language } from '../../i18n/languages';
import { tokens } from '../../theme/tokens';

interface LanguagePickerProps {
  selected: Language | null;
  onSelect: (language: Language) => void;
}

/** Each language shown in its own script and font; no flags (§6). */
export function LanguagePicker({ selected, onSelect }: LanguagePickerProps) {
  return (
    <View style={styles.list}>
      {LANGUAGES.map((language) => {
        const isSelected = language === selected;
        return (
          <Pressable
            key={language}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(language)}
            style={({ pressed }) => [styles.option, isSelected && styles.selected, pressed && styles.pressed]}
          >
            {/* Plain Text: the name's font follows its own script, not the current UI language. */}
            <Text style={[styles.label, language === 'ar' ? styles.arabic : styles.latin]}>
              {NATIVE_NAMES[language]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: tokens.spacing.sm },
  option: {
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
  },
  selected: { borderColor: tokens.color.primary, backgroundColor: tokens.color.surfaceMuted },
  pressed: { opacity: 0.85 },
  label: {
    fontSize: tokens.fontSize.bodyLarge,
    lineHeight: tokens.lineHeight.bodyLarge,
    color: tokens.color.text,
    textAlign: 'center',
  },
  arabic: { fontFamily: tokens.fontFamily.arabicRegular, writingDirection: 'rtl' },
  latin: { writingDirection: 'ltr' },
});
