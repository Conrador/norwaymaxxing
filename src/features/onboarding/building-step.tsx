import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, ScreenPadding, Spacing, Type } from '@/constants/theme';
import type { SaunaAccess } from '@/stores/profile';
import { useTheme } from '@/hooks/use-theme';

type BuildingItem = {
  key: string;
  symbol: SFSymbol;
};

function ProtocolItem({
  item,
  accentColor,
  reducedMotion,
  visible,
}: {
  item: BuildingItem;
  accentColor: string;
  reducedMotion: boolean;
  visible: boolean;
}) {
  const { t } = useTranslation();
  const reveal = useSharedValue(reducedMotion ? 1 : 0);

  const revealStyle = useAnimatedStyle(() => {
    const value = reveal.get();
    return {
      opacity: value,
      transform: [{ translateY: (1 - value) * 14 }],
    };
  });

  useEffect(() => {
    cancelAnimation(reveal);
    reveal.set(
      !visible
        ? 0
        : reducedMotion
        ? 1
        : withDelay(
            60,
            withTiming(1, {
              duration: 280,
              easing: Easing.bezier(0.23, 1, 0.32, 1),
            })
          )
    );

    return () => cancelAnimation(reveal);
  }, [reducedMotion, reveal, visible]);

  return (
    <Animated.View
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      pointerEvents="none"
      style={[styles.row, revealStyle]}>
      <View style={[styles.itemIcon, { backgroundColor: `${accentColor}18` }]}>
        <SymbolView name={item.symbol} size={19} tintColor={accentColor} />
      </View>
      <ThemedText style={[Type.body, styles.rowLabel]}>{t(item.key)}</ThemedText>
      <SymbolView name="checkmark.circle.fill" size={23} tintColor={accentColor} />
    </Animated.View>
  );
}

/**
 * Building loader (onboarding_paywall.md §6): checklista odhaczająca się po
 * kolei, budująca commitment przed paywallem. Personalizowana pod odpowiedzi.
 */
export function BuildingStep({
  saunaAccess,
  onDone,
}: {
  saunaAccess: SaunaAccess;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const items = [
    { key: 'onboarding.build.cold', symbol: 'snowflake' as SFSymbol },
    { key: 'onboarding.build.nature', symbol: 'tree.fill' as SFSymbol },
    {
      key: saunaAccess === 'no' ? 'onboarding.build.breath' : 'onboarding.build.sauna',
      symbol: (saunaAccess === 'no' ? 'wind' : 'flame.fill') as SFSymbol,
    },
    { key: 'onboarding.build.score', symbol: 'gauge.with.dots.needle.50percent' as SFSymbol },
  ];

  const [done, setDone] = useState(0);
  const progress = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.get() * 100}%`,
  }));

  useEffect(() => {
    if (done >= items.length) {
      const id = setTimeout(onDone, 650);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setDone((d) => d + 1), 700);
    return () => clearTimeout(id);
  }, [done, items.length, onDone]);

  useEffect(() => {
    const nextValue = done / items.length;
    progress.set(
      reducedMotion
        ? nextValue
        : withTiming(nextValue, { duration: 460, easing: Easing.out(Easing.cubic) })
    );
  }, [done, items.length, progress, reducedMotion]);

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <View style={styles.body}>
        <ThemedText style={[styles.title]}>{t('onboarding.buildingTitle')}</ThemedText>
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceHigh }]}>
          <Animated.View style={[styles.progressFill, { backgroundColor: theme.frost }, progressStyle]} />
        </View>

        <View style={styles.list}>
          {items.map((item, index) => (
            <ProtocolItem
              key={item.key}
              item={item}
              accentColor={theme.aurora}
              reducedMotion={reducedMotion}
              visible={index < done}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  title: {
    fontFamily: Fonts.accent,
    fontStyle: 'italic',
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
  },
  progressTrack: {
    height: 5,
    marginHorizontal: Spacing.four,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  list: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
  },
});
