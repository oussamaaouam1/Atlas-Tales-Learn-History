import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components/AppText';
import { Icon } from '../../components/icons';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';
import { guideExplorer } from '../onboarding/onboardingArt';
import { formatClock } from './readerLogic';

interface NarrationCardProps {
  playing: boolean;
  loading: boolean;
  chapter: number;
  chapterCount: number;
  elapsedSec: number;
  totalSec: number;
  /** 0–1 story progress for the fill and the guide knob. */
  progress: number;
  /** 0–1 positions of the chapter starts. */
  marks: readonly number[];
  onTogglePlay: () => void;
}

/**
 * Top-centre narration bar (design 7D): play/pause, chapter, clock and a progress bar whose knob is
 * the guide. Progress fills in reading direction (right to left in Arabic).
 */
export function NarrationCard({ playing, loading, chapter, chapterCount, elapsedSec, totalSec, progress, marks, onTogglePlay }: NarrationCardProps) {
  const { t } = useLanguage();
  // 'start' is measured from the right in Arabic, so the bar fills in reading direction by itself.
  const at = (fraction: number) => ({ start: `${fraction * 100}%` }) as const;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? t('reader.pause') : t('reader.play')}
          onPress={onTogglePlay}
          hitSlop={8}
          style={({ pressed }) => [styles.play, loading && styles.loading, pressed && styles.pressed]}
        >
          <Icon name={playing ? 'pause' : 'play'} size={22} color={loading ? tokens.color.secondary : '#FFFFFF'} />
        </Pressable>
        <View style={styles.texts}>
          <AppText variant="caption" bold>
            {t('reader.chapterOf', { n: chapter, total: chapterCount })}
          </AppText>
          {/* Clock in Western digits, always left-to-right (§8). */}
          <AppText variant="caption" color="textMuted" style={styles.clock}>
            {formatClock(elapsedSec)} / {formatClock(totalSec)}
          </AppText>
        </View>
        <Icon name="wave" size={26} color={playing ? tokens.color.primary : '#9FB4D6'} />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { start: 0, width: `${progress * 100}%` }]} />
        {marks.slice(1).map((m) => (
          <View key={m} style={[styles.mark, at(m)]} />
        ))}
        <View style={[styles.knob, at(progress)]}>
          <Image source={guideExplorer.wave[1]} style={styles.knobFace} contentFit="cover" contentPosition="top" accessibilityIgnoresInvertColors />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.medium,
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...tokens.shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  play: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.secondary,
  },
  loading: { backgroundColor: '#FFE7DB', borderWidth: 3, borderColor: tokens.color.secondary },
  pressed: { transform: [{ scale: 0.96 }] },
  texts: { flex: 1 },
  clock: { writingDirection: 'ltr', textAlign: 'auto' },
  track: { height: 6, marginTop: tokens.spacing.sm, borderRadius: 3, backgroundColor: '#DCE7FB', justifyContent: 'center' },
  fill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3, backgroundColor: tokens.color.primary },
  mark: {
    position: 'absolute',
    width: 10,
    height: 10,
    marginStart: -5,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#9FB4D6',
    backgroundColor: '#FFFFFF',
  },
  knob: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginStart: -12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tokens.color.accent,
    backgroundColor: '#FFE9A8',
    overflow: 'hidden',
  },
  knobFace: { width: 40, height: 46, marginStart: -8, marginTop: -2 },
});
