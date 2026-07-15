import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function OnboardingProgress({
  current,
  total,
  onBack,
}: {
  current: number;
  total: number;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(Math.max(0, (current - 1) / total));
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.get() * 100}%`,
  }));

  useEffect(() => {
    const target = Math.min(1, Math.max(0, current / total));
    cancelAnimation(progress);
    progress.set(
      reducedMotion
        ? target
        : withTiming(target, {
            duration: 440,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
    );
    return () => cancelAnimation(progress);
  }, [current, progress, reducedMotion, total]);

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <BackButton label={t('common.back')} onPress={onBack} />
        <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
          {t('onboarding.stepOf', { current, total })}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.surfaceHigh }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: theme.frost }, progressStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
  },
  headerRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
