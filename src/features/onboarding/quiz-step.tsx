import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import type { QuizQuestion } from '@/features/onboarding/questions';
import { useTheme, useThemeName } from '@/hooks/use-theme';

type Props = {
  question: QuizQuestion;
  index: number;
  total: number;
  selected: string[];
  onToggle: (value: string) => void;
  onContinue: () => void;
};

export function QuizStep({ question, index, total, selected, onToggle, onContinue }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const canContinue = selected.length > 0;
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(index / total);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.get() * 100}%`,
  }));

  useEffect(() => {
    const target = (index + 1) / total;
    cancelAnimation(progress);
    progress.set(
      reducedMotion
        ? target
        : withTiming(target, {
            duration: 420,
            easing: Easing.out(Easing.cubic),
          }),
    );

    return () => cancelAnimation(progress);
  }, [index, progress, reducedMotion, total]);

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: insets.top + Spacing.two,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <View style={[styles.progressTrack, { backgroundColor: theme.surfaceHigh }]}> 
        <Animated.View
          style={[styles.progressFill, { backgroundColor: theme.frost }, progressStyle]}
        />
      </View>
      <View style={styles.body}>
        <ThemedText style={[Type.caption, { color: theme.frost, letterSpacing: 1.5 }]}>
          {t('onboarding.stepOf', { current: index + 1, total }).toUpperCase()}
        </ThemedText>
        <ThemedText style={[Type.h1, styles.question]}>{t(question.titleKey)}</ThemedText>

        <View style={styles.options}>
          {question.options.map((opt, i) => {
            const active = selected.includes(opt.value);
            return (
              <Animated.View key={opt.value} entering={FadeInDown.duration(360).delay(i * 45)}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    onToggle(opt.value);
                  }}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: active
                        ? theme.frost
                        : themeName === 'dark'
                          ? `${theme.surface}E6`
                          : theme.surface,
                      borderColor: active ? theme.frost : theme.border,
                    },
                  ]}>
                  <Text style={styles.emoji}>{opt.emoji}</Text>
                  <ThemedText
                    style={[
                      Type.body,
                      { fontFamily: Type.h2.fontFamily, color: active ? '#FFFFFF' : theme.textPrimary },
                    ]}>
                    {t(opt.labelKey)}
                  </ThemedText>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        {question.multi && (
          <ThemedText style={[Type.caption, styles.hint, { color: theme.textSecondary }]}>
            {t('onboarding.multiHint', { count: question.maxSelect ?? 3 })}
          </ThemedText>
        )}
        <UiButton
          label={t('common.continue')}
          variant={canContinue ? 'prominent' : 'glass'}
          tintColor={theme.frost}
          fullWidth
          onPress={canContinue ? onContinue : () => {}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  body: {
    flex: 1,
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  question: {
    marginBottom: Spacing.three,
  },
  options: {
    gap: Spacing.two + Spacing.one,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 16,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 22,
  },
  footer: {
    gap: Spacing.two,
    alignItems: 'stretch',
  },
  hint: {
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});
