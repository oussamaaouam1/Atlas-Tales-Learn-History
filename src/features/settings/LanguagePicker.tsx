import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GREETINGS, NATIVE_NAMES, PICKER_ORDER, type Language } from '../../i18n/languages';
import { tokens } from '../../theme/tokens';

interface LanguagePickerProps {
  selected: Language | null;
  onSelect: (language: Language) => void;
}

/**
 * Language cards (design: Onboarding · Language): each name in its own script and font with a
 * greeting, and a radio circle at the end. No flags (§6). Grid order follows the reading direction.
 */
export function LanguagePicker({ selected, onSelect }: LanguagePickerProps) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {PICKER_ORDER.map((language) => {
        const isSelected = language === selected;
        const arabic = language === 'ar';
        return (
          <Pressable
            key={language}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, checked: isSelected }}
            accessibilityLabel={NATIVE_NAMES[language]}
            accessibilityLanguage={language}
            onPress={() => onSelect(language)}
            style={({ pressed }) => [styles.card, isSelected && styles.selected, pressed && styles.pressed]}
          >
            {/* Plain Text: each name uses its own script's font, not the current UI language. */}
            <View style={[styles.texts, arabic && styles.textsArabic]}>
              <Text style={[styles.name, arabic ? styles.nameArabic : styles.nameLatin]}>{NATIVE_NAMES[language]}</Text>
              <Text style={[styles.greeting, arabic ? styles.greetingArabic : styles.greetingLatin]}>{GREETINGS[language]}</Text>
            </View>
            <View style={[styles.radio, isSelected && styles.radioOn]}>{isSelected && <View style={styles.radioDot} />}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs + 2,
    paddingHorizontal: tokens.spacing.medium,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    ...tokens.shadow.card,
  },
  selected: { borderColor: tokens.color.primary },
  pressed: { transform: [{ scale: 0.96 }] },
  texts: { flex: 1 },
  textsArabic: { alignItems: 'flex-end' },
  name: { color: tokens.color.text, fontSize: 18 },
  nameLatin: { fontFamily: tokens.fontFace.latin[800], lineHeight: 23, writingDirection: 'ltr' },
  nameArabic: { fontFamily: tokens.fontFace.arabic[800], lineHeight: 27, writingDirection: 'rtl' },
  greeting: { color: tokens.color.textMuted, fontSize: 12 },
  greetingLatin: { fontFamily: tokens.fontFace.latin[500], lineHeight: 15, writingDirection: 'ltr' },
  greetingArabic: { fontFamily: tokens.fontFace.arabic[500], lineHeight: 18, writingDirection: 'rtl' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#B9CBE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: tokens.color.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: tokens.color.primary },
});
