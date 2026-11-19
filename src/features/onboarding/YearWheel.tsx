import { useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { AppText } from '../../components/AppText';
import { tokens } from '../../theme/tokens';

export const ITEM_HEIGHT = 46;
const VISIBLE = 5;

interface YearWheelProps {
  years: readonly number[];
  value: number;
  onChange: (year: number) => void;
  accessibilityLabel: string;
}

/** Index of the year centred in the wheel for a scroll offset. */
export function indexAtOffset(offsetY: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(offsetY / ITEM_HEIGHT)));
}

/**
 * Neutral year wheel (design: Onboarding · Age): plain years in Western digits, no hints.
 * Snaps to a year; tapping a year also selects it.
 */
export function YearWheel({ years, value, onChange, accessibilityLabel }: YearWheelProps) {
  const list = useRef<FlatList<number>>(null);
  const selectedIndex = Math.max(0, years.indexOf(value));

  useEffect(() => {
    list.current?.scrollToOffset({ offset: selectedIndex * ITEM_HEIGHT, animated: false });
    // Only on mount: later changes come from the user's own scrolling.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const year = years[indexAtOffset(event.nativeEvent.contentOffset.y, years.length)];
    if (year !== undefined && year !== value) onChange(year);
  };

  return (
    <View
      style={styles.wheel}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const next = years[selectedIndex + (e.nativeEvent.actionName === 'increment' ? 1 : -1)];
        if (next !== undefined) {
          onChange(next);
          list.current?.scrollToOffset({ offset: years.indexOf(next) * ITEM_HEIGHT, animated: true });
        }
      }}
    >
      <View pointerEvents="none" style={styles.highlight} />
      <FlatList
        ref={list}
        data={years}
        keyExtractor={(year) => String(year)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        contentContainerStyle={styles.padding}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        renderItem={({ item, index }) => {
          const distance = Math.abs(index - selectedIndex);
          return (
            <Pressable
              style={styles.item}
              onPress={() => {
                onChange(item);
                list.current?.scrollToOffset({ offset: index * ITEM_HEIGHT, animated: true });
              }}
              importantForAccessibility="no"
            >
              {/* Years are Western digits in every language (§8). */}
              <AppText
                variant={distance === 0 ? 'title' : 'bodyLarge'}
                color={distance === 0 ? 'text' : 'textMuted'}
                align="center"
                style={{ opacity: distance === 0 ? 1 : distance === 1 ? 0.9 : 0.55 }}
              >
                {String(item)}
              </AppText>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    width: 150,
    height: ITEM_HEIGHT * VISIBLE,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    ...tokens.shadow.card,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    start: 8,
    end: 8,
    height: ITEM_HEIGHT,
    borderRadius: tokens.radius.md,
    backgroundColor: '#DCE7FB',
  },
  padding: { paddingVertical: ITEM_HEIGHT * 2 },
  item: { height: ITEM_HEIGHT, justifyContent: 'center' },
});
