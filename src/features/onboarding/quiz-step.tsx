import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { OnboardingProgress } from '@/features/onboarding/onboarding-progress';
import type {
  QuizLayout,
  QuizOption,
  QuizQuestion,
} from '@/features/onboarding/questions';
import { useTheme, useThemeName } from '@/hooks/use-theme';

type Props = {
  question: QuizQuestion;
  progressCurrent: number;
  progressTotal: number;
  selected: string[];
  onToggle: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
};

function questionAccent(layout: QuizLayout, theme: ReturnType<typeof useTheme>) {
  if (layout === 'sauna-access') return theme.ember;
  if (layout === 'nature-bands') return theme.aurora;
  if (layout === 'diet-balance') return theme.gold;
  return theme.frost;
}

function optionSurface(
  layout: QuizLayout,
  index: number,
  dark: boolean,
  surface: string,
) {
  if (layout === 'goal-grid') {
    const light = ['#DCEBFF', '#DFF7EC', '#F5E4EF', '#E9E4FA', '#F7EDCC'];
    const night = ['#172D49', '#173B2E', '#3B2635', '#2D2845', '#3A321E'];
    return (dark ? night : light)[index];
  }
  if (layout === 'nature-bands') {
    const light = ['#DDF6C7', '#D7ECFB', '#E9E3F2'];
    const night = ['#173B28', '#12344C', '#2A2638'];
    return (dark ? night : light)[index];
  }
  if (layout === 'sauna-access') {
    const light = ['#FBE8C9', '#F4E9D9', '#E8EDF3'];
    const night = ['#352615', '#302A22', '#202A36'];
    return (dark ? night : light)[index];
  }
  return surface;
}

function ChoiceGlyph({
  option,
  active,
  color,
  size = 23,
}: {
  option: QuizOption;
  active: boolean;
  color: string;
  size?: number;
}) {
  return (
    <View style={styles.glyphSlot}>
      <SymbolView name={option.symbol} size={size} tintColor={color} />
      {active && (
        <View style={styles.checkBadge}>
          <SymbolView name="checkmark" size={11} tintColor="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

export function QuizStep({
  question,
  progressCurrent,
  progressTotal,
  selected,
  onToggle,
  onContinue,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const canContinue = selected.length > 0;
  const accent = questionAccent(question.layout, theme);
  const compact = height < 740;

  const renderOption = (option: QuizOption, index: number) => {
    const active = selected.includes(option.value);
    const selectedText =
      themeName === 'light' &&
      (question.layout === 'goal-grid' || question.layout === 'cold-scale')
        ? '#FFFFFF'
        : '#0E1A2B';
    const foreground = active ? selectedText : theme.textPrimary;
    const backgroundColor = active
      ? accent
      : optionSurface(question.layout, index, themeName === 'dark', theme.surface);
    const commonPressableProps = {
      accessibilityRole: 'button' as const,
      accessibilityState: { selected: active },
      onPress: () => {
        Haptics.selectionAsync();
        onToggle(option.value);
      },
    };

    if (question.layout === 'goal-grid') {
      return (
        <Pressable
          {...commonPressableProps}
          style={({ pressed }) => [
            styles.goalCard,
            compact && styles.goalCardCompact,
            {
              backgroundColor,
              borderColor: active ? accent : theme.border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}>
          <SymbolView
            name={option.symbol}
            size={58}
            tintColor={active ? foreground : accent}
            style={styles.goalGlyph}
          />
          {active && (
            <View style={styles.goalCheck}>
              <SymbolView name="checkmark" size={12} tintColor="#FFFFFF" />
            </View>
          )}
          <ThemedText style={[Type.body, styles.optionLabel, { color: foreground }]}>
            {t(option.labelKey)}
          </ThemedText>
        </Pressable>
      );
    }

    if (question.layout === 'cold-scale') {
      return (
        <Pressable
          {...commonPressableProps}
          style={({ pressed }) => [
            styles.scaleRow,
            {
              backgroundColor,
              borderColor: active ? accent : theme.border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}>
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: active ? '#FFFFFF22' : theme.surfaceHigh },
            ]}>
            <ThemedText style={[Type.caption, { color: foreground }]}>{index + 1}</ThemedText>
          </View>
          <ThemedText style={[Type.body, styles.flexLabel, { color: foreground }]}>
            {t(option.labelKey)}
          </ThemedText>
          <ChoiceGlyph option={option} active={active} color={foreground} />
        </Pressable>
      );
    }

    if (question.layout === 'sauna-access') {
      return (
        <Pressable
          {...commonPressableProps}
          style={({ pressed }) => [
            styles.accessCard,
            {
              backgroundColor,
              borderColor: active ? accent : theme.border,
              opacity: pressed ? 0.82 : 1,
            },
          ]}>
          <SymbolView name={option.symbol} size={25} tintColor={active ? foreground : accent} />
          <ThemedText style={[Type.body, styles.accessLabel, { color: foreground }]}>
            {t(option.labelKey)}
          </ThemedText>
          <SymbolView
            name={active ? 'checkmark.circle.fill' : 'circle'}
            size={24}
            tintColor={active ? foreground : theme.textSecondary}
          />
        </Pressable>
      );
    }

    if (question.layout === 'nature-bands') {
      return (
        <Pressable
          {...commonPressableProps}
          style={({ pressed }) => [
            styles.natureBand,
            {
              backgroundColor,
              borderColor: active ? accent : 'transparent',
              opacity: pressed ? 0.82 : 1,
            },
          ]}>
          <ThemedText style={[Type.h2, styles.natureLabel, { color: foreground }]}>
            {t(option.labelKey)}
          </ThemedText>
          <SymbolView
            name={option.symbol}
            size={82}
            tintColor={active ? foreground : accent}
            style={styles.natureGlyph}
          />
          {active && (
            <View style={styles.natureCheck}>
              <SymbolView name="checkmark" size={13} tintColor="#FFFFFF" />
            </View>
          )}
        </Pressable>
      );
    }

    return (
      <Pressable
        {...commonPressableProps}
        style={({ pressed }) => [
          styles.dietRow,
          {
            backgroundColor: active ? `${accent}20` : 'transparent',
            borderBottomColor: theme.border,
            borderBottomWidth: index < question.options.length - 1 ? StyleSheet.hairlineWidth : 0,
            opacity: pressed ? 0.82 : 1,
          },
        ]}>
        <SymbolView name={option.symbol} size={24} tintColor={active ? accent : theme.textSecondary} />
        <ThemedText style={[Type.body, styles.dietLabel]}>{t(option.labelKey)}</ThemedText>
        <SymbolView
          name={active ? 'checkmark.circle.fill' : 'circle'}
          size={24}
          tintColor={active ? accent : theme.textSecondary}
        />
      </Pressable>
    );
  };

  const animatedOption = (
    option: QuizOption,
    index: number,
    style?: StyleProp<ViewStyle>,
  ) => (
    <Animated.View
      key={option.value}
      entering={reducedMotion ? undefined : FadeInDown.duration(320).delay(index * 45)}
      style={style}>
      {renderOption(option, index)}
    </Animated.View>
  );

  const renderOptions = () => {
    if (question.layout === 'goal-grid') {
      const rows = [];
      for (let index = 0; index < question.options.length; index += 2) {
        rows.push(question.options.slice(index, index + 2));
      }

      return (
        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={`goal-row-${rowIndex}`} style={styles.gridRow}>
              {row.map((option, columnIndex) =>
                animatedOption(option, rowIndex * 2 + columnIndex, styles.gridCell),
              )}
              {row.length === 1 && <View style={styles.gridCell} />}
            </View>
          ))}
        </View>
      );
    }

    if (question.layout === 'sauna-access') {
      return (
        <View style={styles.options}>
          {question.options.map((option, index) => animatedOption(option, index))}
        </View>
      );
    }

    if (question.layout === 'diet-balance') {
      return (
        <View style={[styles.dietPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {question.options.map((option, index) => animatedOption(option, index))}
        </View>
      );
    }

    return (
      <View style={styles.options}>
        {question.options.map((option, index) => animatedOption(option, index))}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: insets.top + Spacing.one,
          paddingBottom: insets.bottom + Spacing.three,
        },
      ]}>
      <OnboardingProgress
        current={progressCurrent}
        total={progressTotal}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, compact && styles.bodyCompact]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.copy}>
          <ThemedText style={[Type.h1, styles.question]}>{t(question.titleKey)}</ThemedText>
          <ThemedText style={[Type.body, { color: theme.textSecondary }]}>
            {t(question.hintKey)}
          </ThemedText>
        </View>

        {renderOptions()}
      </ScrollView>

      <View style={styles.footer}>
        {question.multi && (
          <ThemedText style={[Type.caption, styles.hint, { color: theme.textSecondary }]}>
            {t('onboarding.multiHint', { count: question.maxSelect ?? 3 })}
          </ThemedText>
        )}
        <UiButton
          label={t('common.continue')}
          variant="prominent"
          tintColor={theme.frost}
          fullWidth
          disabled={!canContinue}
          onPress={onContinue}
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
  scroll: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  bodyCompact: {
    justifyContent: 'flex-start',
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  copy: {
    gap: Spacing.two,
  },
  question: {
    maxWidth: 340,
  },
  options: {
    gap: Spacing.two + Spacing.one,
  },
  grid: {
    gap: Spacing.two + Spacing.one,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.two + Spacing.one,
  },
  gridCell: {
    flex: 1,
  },
  goalCard: {
    flex: 1,
    minHeight: 108,
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  goalCardCompact: {
    minHeight: 92,
  },
  goalGlyph: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    opacity: 0.2,
  },
  goalCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#0E1A2B',
  },
  glyphSlot: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -4,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1A2B',
  },
  optionLabel: {
    fontFamily: Type.h2.fontFamily,
  },
  scaleRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1.5,
  },
  levelBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexLabel: {
    flex: 1,
    fontFamily: Type.h2.fontFamily,
  },
  accessCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1.5,
  },
  accessLabel: {
    flex: 1,
    fontFamily: Type.h2.fontFamily,
  },
  natureBand: {
    minHeight: 94,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  natureLabel: {
    maxWidth: '72%',
    zIndex: 1,
  },
  natureGlyph: {
    position: 'absolute',
    right: -4,
    bottom: -14,
    opacity: 0.22,
  },
  natureCheck: {
    position: 'absolute',
    right: Spacing.three,
    top: Spacing.three,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1A2B',
  },
  dietRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  dietLabel: {
    flex: 1,
    fontFamily: Type.h2.fontFamily,
  },
  dietPanel: {
    overflow: 'hidden',
    borderRadius: Radius.control,
    borderWidth: 1,
  },
  footer: {
    gap: Spacing.two,
    alignItems: 'stretch',
  },
  hint: {
    textAlign: 'center',
  },
});
