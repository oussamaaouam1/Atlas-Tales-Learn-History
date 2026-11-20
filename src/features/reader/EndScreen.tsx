import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../../convex/_generated/api';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { DirectionalIcon } from '../../components/DirectionalIcon';
import { Icon } from '../../components/icons';
import { RoundButton } from '../../components/RoundButton';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSession } from '../../providers/SessionProvider';
import { tokens } from '../../theme/tokens';
import { quizMessageKey } from './quizLogic';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * End of story (design 9B): fun fact, a 3-question quiz (no penalty, just a score and a friendly
 * message), sources and the next story. The stamp award (9A) arrives with the passport in Phase 6.
 */
export function EndScreen({ navigation, route }: RootScreenProps<'End'>) {
  const { slug } = route.params;
  const { language, t } = useLanguage();
  const { installToken } = useSession();
  const data = useQuery(api.stories.getStory, { slug });
  const { results } = usePaginatedQuery(api.stories.listForMap, {}, { initialNumItems: 20 });
  const saveResult = useMutation(api.quiz.saveResult);

  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<{ score: number; total: number } | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const story = data?.story;
  if (!story) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.color.primary} accessibilityLabel={t('common.loading')} />
      </View>
    );
  }

  const quiz = story.quiz;
  const q = quiz[question];
  const chosen = answers[question];
  const answered = chosen !== undefined;
  const nextStory = results.find((s) => s.slug !== slug);

  const choose = (index: number) => {
    if (answered) return;
    const next = [...answers];
    next[question] = index;
    setAnswers(next);
  };

  const advance = async () => {
    if (question < quiz.length - 1) {
      setQuestion(question + 1);
      return;
    }
    const local = { score: quiz.reduce((s, item, i) => s + (answers[i] === item.answerIndex ? 1 : 0), 0), total: quiz.length };
    setScore(local);
    if (installToken) saveResult({ installToken, slug, answers }).then(setScore).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.row}>
        <RoundButton accessibilityLabel={t('end.backToMap')} color={tokens.color.accent} onPress={() => navigation.popToTop()}>
          <Icon name="home" color={tokens.color.text} />
        </RoundButton>

        <ScrollView style={styles.column} contentContainerStyle={styles.columnContent}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
            <View style={styles.cardTitle}>
              <Icon name="bulb" size={18} color={tokens.color.primary} />
              <AppText variant="caption" bold color="primary">
                {t('end.didYouKnow')}
              </AppText>
            </View>
            <AppText>{story.didYouKnow[language]}</AppText>
            {story.sources.length > 0 && (
              <Pressable accessibilityRole="button" onPress={() => setSourcesOpen(true)} style={styles.link}>
                <Icon name="book" size={16} color={tokens.color.primary} />
                <AppText variant="caption" bold color="primary" style={styles.underline}>
                  {t('end.sources')}
                </AppText>
              </Pressable>
            )}
          </Animated.View>

          {nextStory && (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.replace('StoryCard', { slug: nextStory.slug })}
              style={({ pressed }) => [styles.card, styles.nextCard, pressed && styles.pressed]}
            >
              <Image source={{ uri: nextStory.coverImageUrl }} style={styles.cover} contentFit="cover" accessibilityIgnoresInvertColors />
              <View style={styles.flex}>
                <AppText variant="caption" color="textMuted">
                  {t('end.upNext')}
                </AppText>
                <AppText bold numberOfLines={2}>
                  {nextStory.title[language]}
                </AppText>
              </View>
              <View style={styles.playCircle}>
                <Icon name="play" size={18} color="#FFFFFF" />
              </View>
            </Pressable>
          )}
        </ScrollView>

        <View style={[styles.card, styles.quiz]}>
          {score ? (
            <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.scoreBox}>
              <AppText variant="display" align="center">
                {score.score}/{score.total}
              </AppText>
              <AppText variant="title" align="center">
                {t('end.score', { score: score.score, total: score.total })}
              </AppText>
              <AppText color="textMuted" align="center">
                {t(quizMessageKey(score.score, score.total))}
              </AppText>
              <Button label={t('end.backToMap')} onPress={() => navigation.popToTop()} />
            </Animated.View>
          ) : q ? (
            <>
              <View style={styles.quizHeader}>
                <AppText variant="caption" bold color="primary">
                  {t('end.quiz', { n: question + 1, total: quiz.length })}
                </AppText>
                <View style={styles.dots}>
                  {quiz.map((_, i) => (
                    <View key={i} style={[styles.dot, i < question && styles.dotDone, i === question && styles.dotNow]} />
                  ))}
                </View>
              </View>
              <AppText variant="bodyLarge" bold>
                {q.question[language]}
              </AppText>
              {q.options.map((option, i) => {
                const isRight = answered && i === q.answerIndex;
                const isWrong = answered && i === chosen && i !== q.answerIndex;
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: answered, selected: i === chosen }}
                    onPress={() => choose(i)}
                    style={[styles.option, isRight && styles.optionRight, isWrong && styles.optionWrong]}
                  >
                    <View style={[styles.letter, isRight && styles.letterRight, isWrong && styles.letterWrong]}>
                      {isRight ? (
                        <Icon name="check" size={16} color="#FFFFFF" />
                      ) : isWrong ? (
                        <Icon name="wrong" size={16} color="#FFFFFF" />
                      ) : (
                        <AppText variant="caption" bold color="primary">
                          {LETTERS[i]}
                        </AppText>
                      )}
                    </View>
                    <AppText bold style={styles.flex}>
                      {option[language]}
                    </AppText>
                    {/* Feedback uses an icon and a word, not only colour (design 9B). */}
                    {isRight && (
                      <AppText variant="caption" bold color="success">
                        {t('end.correct')}
                      </AppText>
                    )}
                    {isWrong && (
                      <AppText variant="caption" bold color="danger">
                        {t('end.wrong')}
                      </AppText>
                    )}
                  </Pressable>
                );
              })}
              {answered && (
                <View style={styles.nextRow}>
                  <Button
                    label={question < quiz.length - 1 ? t('end.nextQuestion') : t('end.finishQuiz')}
                    onPress={() => void advance()}
                    endIcon={<DirectionalIcon direction="forward" size={16} color={tokens.color.textOnPrimary} />}
                  />
                </View>
              )}
            </>
          ) : null}
        </View>
      </View>

      <Modal visible={sourcesOpen} transparent animationType="fade" onRequestClose={() => setSourcesOpen(false)} supportedOrientations={['landscape']}>
        <Pressable style={styles.scrim} onPress={() => setSourcesOpen(false)} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <View style={styles.sourcesCard}>
            <AppText variant="title" bold>
              {t('end.sources')}
            </AppText>
            {/* Titles only: external links open behind the parent gate in Phase 7 (§7.6). */}
            {story.sources.map((s) => (
              <AppText key={s.url} variant="caption" style={styles.ltrText}>
                • {s.title}
              </AppText>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.background },
  row: { flex: 1, flexDirection: 'row', gap: tokens.spacing.md, padding: tokens.spacing.md },
  column: { flex: 1, maxWidth: 340 },
  columnContent: { gap: tokens.spacing.medium },
  card: { padding: tokens.spacing.md, gap: tokens.spacing.sm, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.surface, ...tokens.shadow.card },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  underline: { textDecorationLine: 'underline' },
  nextCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.medium },
  pressed: { opacity: 0.85 },
  cover: { width: 56, height: 56, borderRadius: tokens.radius.sm, backgroundColor: tokens.color.surfaceMuted },
  flex: { flex: 1 },
  playCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.primary },
  quiz: { flex: 1.3, gap: tokens.spacing.sm },
  quizHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 22, height: 5, borderRadius: 3, backgroundColor: '#DCE7FB' },
  dotDone: { backgroundColor: tokens.color.success },
  dotNow: { backgroundColor: tokens.color.primary },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.medium,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.medium,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.color.border,
  },
  optionRight: { borderColor: tokens.color.success, backgroundColor: '#E2F4EA' },
  optionWrong: { borderColor: tokens.color.danger, backgroundColor: '#FBE4E4' },
  letter: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1EAFB' },
  letterRight: { backgroundColor: tokens.color.success },
  letterWrong: { backgroundColor: tokens.color.danger },
  nextRow: { alignItems: 'flex-end' },
  scoreBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.sm },
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.overlay },
  sourcesCard: { width: '60%', maxWidth: 520, gap: tokens.spacing.sm, padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.surface },
  ltrText: { writingDirection: 'ltr' },
});
