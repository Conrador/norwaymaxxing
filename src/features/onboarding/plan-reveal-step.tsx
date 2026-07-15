import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import type { Goal, Profile } from '@/stores/profile';

const METHOD_ITEMS: { key: string; symbol: SFSymbol }[] = [
  { key: 'clear', symbol: 'list.bullet.clipboard.fill' },
  { key: 'adaptive', symbol: 'slider.horizontal.3' },
  { key: 'feedback', symbol: 'chart.line.uptrend.xyaxis' },
];

const GOAL_KEYS: Record<Goal, string> = {
  energy: 'onboarding.goal.energy',
  resilience: 'onboarding.goal.resilience',
  calm: 'onboarding.goal.calm',
  sleep: 'onboarding.goal.sleep',
  physique: 'onboarding.goal.physique',
};

export function PlanFitStep({ profile, onContinue }: { profile: Profile; onContinue: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const goals = profile.goals.length > 0 ? profile.goals : (['energy'] as Goal[]);

  return (
    <View style={[styles.safe, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.three }]}>
      <ScrollView contentContainerStyle={styles.fitBody} showsVerticalScrollIndicator={false}>
        <Animated.View entering={reducedMotion ? undefined : FadeInUp.duration(340)} style={styles.fitCopy}>
          <ThemedText style={[Type.display, styles.fitTitle]}>{t('onboarding.result.title')}</ThemedText>
          <ThemedText style={[Type.body, { color: theme.textSecondary }]}>{t('onboarding.result.body')}</ThemedText>
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(360).delay(80)}
          style={[
            styles.focusBand,
            { backgroundColor: themeName === 'dark' ? '#142D43' : '#DCEFFC' },
          ]}>
          <SymbolView name="scope" size={36} tintColor={theme.frost} />
          <View style={styles.focusCopy}>
            <ThemedText style={[Type.caption, styles.bold, { color: theme.frost }]}>
              {t('onboarding.result.focus')}
            </ThemedText>
            <ThemedText style={[Type.h2, styles.goalSummary]}>
              {goals.map((goal) => t(GOAL_KEYS[goal])).join(' · ')}
            </ThemedText>
          </View>
        </Animated.View>

        <View style={styles.methodList}>
          {METHOD_ITEMS.map((item, index) => (
            <Animated.View
              key={item.key}
              entering={reducedMotion ? undefined : FadeInDown.duration(300).delay(130 + index * 70)}
              style={[styles.methodRow, index > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
              <View style={[styles.methodIcon, { backgroundColor: `${theme.aurora}18` }]}>
                <SymbolView name={item.symbol} size={20} tintColor={theme.aurora} />
              </View>
              <ThemedText style={[Type.body, styles.methodText]}>
                {t(`onboarding.result.items.${item.key}`)}
              </ThemedText>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <UiButton
        label={t('onboarding.result.cta')}
        variant="prominent"
        tintColor={theme.frost}
        fullWidth
        onPress={onContinue}
      />
    </View>
  );
}

export function ProtocolReadyStep({
  onContinue,
  roRewardUnlocked = false,
}: {
  onContinue: () => void;
  roRewardUnlocked?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  return (
    <View style={[styles.safe, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.three }]}>
      <View style={styles.readyBody}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(360)}
          style={[
            styles.readySeal,
            {
              backgroundColor: themeName === 'dark' ? '#153227' : '#DDF5E9',
              borderColor: `${theme.aurora}4D`,
            },
          ]}>
          <SymbolView name="checkmark.seal.fill" size={68} tintColor={theme.aurora} />
          <View style={styles.dayCount}>
            <ThemedText style={styles.dayNumber}>14</ThemedText>
            <ThemedText style={[Type.caption, styles.bold, { color: theme.textSecondary }]}>
              {t('onboarding.ready.days')}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={reducedMotion ? undefined : FadeInUp.duration(360).delay(90)} style={styles.readyCopy}>
          <ThemedText style={[Type.display, styles.readyTitle]}>{t('onboarding.ready.title')}</ThemedText>
          <ThemedText style={[Type.body, styles.readyText, { color: theme.textSecondary }]}>
            {t('onboarding.ready.body')}
          </ThemedText>
        </Animated.View>

        <Animated.View entering={reducedMotion ? undefined : FadeInUp.duration(320).delay(160)} style={styles.readyMeta}>
          {(['start', 'build', 'repeat'] as const).map((key, index) => (
            <View key={key} style={styles.readyMetaItem}>
              <View style={[styles.metaDot, { backgroundColor: index === 0 ? theme.frost : theme.surfaceHigh }]}>
                {index === 0 && <SymbolView name="checkmark" size={11} tintColor="#FFFFFF" />}
              </View>
              <ThemedText style={[Type.caption, styles.bold]}>{t(`onboarding.ready.items.${key}`)}</ThemedText>
            </View>
          ))}
        </Animated.View>

        {roRewardUnlocked && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(210)}
            style={[styles.rewardBand, { backgroundColor: `${theme.gold}18` }]}>
            <SymbolView name="lock.open.fill" size={18} tintColor={theme.gold} />
            <ThemedText style={[Type.caption, styles.bold, { color: theme.gold }]}>
              {t('onboarding.reward.ready')}
            </ThemedText>
          </Animated.View>
        )}
      </View>

      <UiButton
        label={t('onboarding.ready.cta')}
        variant="prominent"
        tintColor={theme.frost}
        fullWidth
        onPress={onContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: ScreenPadding },
  fitBody: { flexGrow: 1, justifyContent: 'center', gap: Spacing.four, paddingVertical: Spacing.four },
  fitCopy: { gap: Spacing.two },
  fitTitle: { maxWidth: 360 },
  focusBand: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.control },
  focusCopy: { flex: 1, gap: Spacing.one },
  goalSummary: { flexShrink: 1 },
  bold: { fontFamily: Type.h2.fontFamily },
  methodList: { paddingHorizontal: Spacing.one },
  methodRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  methodIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodText: { flex: 1 },
  readyBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  readySeal: { width: 230, height: 230, borderRadius: 115, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  dayCount: { alignItems: 'center' },
  dayNumber: { fontFamily: Type.display.fontFamily, fontSize: 54, lineHeight: 58 },
  readyCopy: { alignItems: 'center', gap: Spacing.two },
  readyTitle: { maxWidth: 360, textAlign: 'center' },
  readyText: { maxWidth: 350, textAlign: 'center' },
  readyMeta: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'center', gap: Spacing.three },
  readyMetaItem: { alignItems: 'center', gap: Spacing.two, minWidth: 76 },
  metaDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rewardBand: { minHeight: 44, borderRadius: Radius.control, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three },
});
