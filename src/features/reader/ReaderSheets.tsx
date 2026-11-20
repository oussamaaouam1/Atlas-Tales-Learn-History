import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/icons';
import { NATIVE_NAMES, PICKER_ORDER, type Language } from '../../i18n/languages';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';
import { TEXT_SCALES, type TextScale } from './readerLogic';

function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} supportedOrientations={['landscape']}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheetWrap} pointerEvents="box-none">
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="title" bold>
              {title}
            </AppText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={8} style={styles.close}>
              <Icon name="close" size={20} color={tokens.color.text} />
            </Pressable>
          </View>
          {children}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export interface ChapterRow {
  number: number;
  title: string;
  minutes: number;
  state: 'finished' | 'current' | 'upcoming';
  /** Page inside the chapter and chapter page count (current chapter only). */
  pageInChapter?: number;
  chapterPages?: number;
}

/** Design 7H: finished, now playing, not started. Tapping a chapter jumps to its first page. */
export function ChaptersSheet({ visible, rows, onPick, onClose }: { visible: boolean; rows: ChapterRow[]; onPick: (chapter: number) => void; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <Sheet visible={visible} title={t('reader.chapters')} onClose={onClose}>
      <View style={styles.list}>
        {rows.map((row) => {
          const status =
            row.state === 'finished'
              ? t('reader.finished')
              : row.state === 'current'
                ? t('reader.nowPlaying', { page: row.pageInChapter ?? 1, count: row.chapterPages ?? 1 })
                : null;
          return (
            <Pressable
              key={row.number}
              accessibilityRole="button"
              onPress={() => onPick(row.number)}
              style={({ pressed }) => [styles.chapter, row.state === 'current' && styles.chapterCurrent, pressed && styles.pressed]}
            >
              <View style={[styles.badge, row.state === 'finished' && styles.badgeDone, row.state === 'current' && styles.badgeNow]}>
                {row.state === 'finished' ? (
                  <Icon name="check" size={16} color="#FFFFFF" />
                ) : row.state === 'current' ? (
                  <Icon name="pause" size={12} color="#FFFFFF" />
                ) : (
                  <AppText variant="caption" bold color="primary">
                    {row.number}
                  </AppText>
                )}
              </View>
              <View style={styles.chapterTexts}>
                <AppText bold numberOfLines={1}>
                  {t('reader.chapterN', { n: row.number })} · {row.title}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {t('reader.minutes', { n: row.minutes })}
                  {status ? ` · ${status}` : ''}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

interface TextSheetProps {
  visible: boolean;
  scale: TextScale;
  showText: boolean;
  storyLanguage: Language;
  onScale: (scale: TextScale) => void;
  onShowText: (show: boolean) => void;
  onLanguage: (language: Language) => void;
  onClose: () => void;
}

/** Design 7I: text size changes the card live behind the sheet; story language keeps the page. */
export function TextLanguageSheet({ visible, scale, showText, storyLanguage, onScale, onShowText, onLanguage, onClose }: TextSheetProps) {
  const { t } = useLanguage();
  return (
    <Sheet visible={visible} title={t('reader.textAndLanguage')} onClose={onClose}>
      <View style={styles.settingRow}>
        <AppText style={styles.settingLabel}>{t('reader.textSize')}</AppText>
        <View style={styles.segment}>
          {(Object.keys(TEXT_SCALES) as TextScale[]).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected: key === scale }}
              onPress={() => onScale(key)}
              style={[styles.segmentItem, key === scale && styles.segmentOn]}
            >
              <Text style={[styles.aa, { fontSize: 16 * TEXT_SCALES[key] }, key === scale && styles.aaOn]}>Aa</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.settingRow}>
        <AppText style={styles.settingLabel}>{t('reader.showTextLabel')}</AppText>
        <Switch
          value={showText}
          onValueChange={onShowText}
          trackColor={{ true: tokens.color.primary, false: '#C9D6EE' }}
          thumbColor="#FFFFFF"
          accessibilityLabel={t('reader.showTextLabel')}
        />
      </View>
      <View style={styles.settingRow}>
        <AppText style={styles.settingLabel}>{t('reader.language')}</AppText>
        <View style={styles.chips}>
          {PICKER_ORDER.map((language) => (
            <Pressable
              key={language}
              accessibilityRole="radio"
              accessibilityState={{ selected: language === storyLanguage }}
              onPress={() => onLanguage(language)}
              style={[styles.chip, language === storyLanguage && styles.chipOn]}
            >
              <Text
                style={[
                  styles.chipText,
                  { fontFamily: language === 'ar' ? tokens.fontFace.arabic[700] : tokens.fontFace.latin[700] },
                  language === storyLanguage && styles.chipTextOn,
                ]}
              >
                {NATIVE_NAMES[language]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, backgroundColor: tokens.color.overlay },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '70%',
    maxWidth: 620,
    padding: tokens.spacing.md,
    paddingTop: tokens.spacing.xs,
    gap: tokens.spacing.sm,
    borderTopStartRadius: tokens.radius.lg,
    borderTopEndRadius: tokens.radius.lg,
    backgroundColor: tokens.color.surface,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: tokens.color.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.surfaceMuted },
  list: { gap: tokens.spacing.sm },
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.medium,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.color.border,
  },
  chapterCurrent: { borderColor: tokens.color.primary, backgroundColor: '#E8F0FF' },
  pressed: { opacity: 0.85 },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1EAFB' },
  badgeDone: { backgroundColor: tokens.color.success },
  badgeNow: { backgroundColor: tokens.color.primary },
  chapterTexts: { flex: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, minHeight: 44 },
  settingLabel: { width: 110 },
  segment: { flex: 1, flexDirection: 'row', padding: 4, borderRadius: tokens.radius.pill, backgroundColor: '#E1EAFB' },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: tokens.radius.pill },
  segmentOn: { backgroundColor: tokens.color.surface },
  aa: { fontFamily: tokens.fontFace.latin[700], color: tokens.color.textMuted },
  aaOn: { color: tokens.color.primary },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  chip: { paddingHorizontal: tokens.spacing.medium, paddingVertical: 6, borderRadius: tokens.radius.pill, backgroundColor: '#EEF3FC' },
  chipOn: { backgroundColor: tokens.color.primary },
  chipText: { color: tokens.color.text, fontSize: 15 },
  chipTextOn: { color: '#FFFFFF' },
});
