import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Confetti } from 'react-native-fast-confetti';
import Animated, { FadeIn, FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { VikingDrumArt } from '@/components/viking-drum-art';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import type { RoDemoResult } from '@/features/onboarding/ro-demo-step';
import { RO_CONFETTI_COLORS } from '@/features/ro/session';
import { useTheme, useThemeName } from '@/hooks/use-theme';

export function RoRewardIntroStep({
  introductoryPrice,
  standardPrice,
  onBack,
  onContinue,
}: {
  introductoryPrice: string;
  standardPrice: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  return (
    <View
      style={[
        styles.safe,
        { paddingTop: insets.top + Spacing.two, paddingBottom: insets.bottom + Spacing.three },
      ]}>
      <View style={styles.topBar}>
        <BackButton label={t('common.back')} onPress={onBack} />
        <View style={[styles.soundPill, { backgroundColor: `${theme.frost}18` }]}>
          <SymbolView name="speaker.wave.2.fill" size={14} tintColor={theme.frost} />
          <ThemedText style={[Type.caption, { color: theme.frost }]}>{t('ro.soundOn')}</ThemedText>
        </View>
      </View>

      <View style={styles.introBody}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(320)}
          style={styles.drumStage}>
          <VikingDrumArt size={214} runeColor={theme.blood} />
          <View
            style={[
              styles.rewardSeal,
              {
                backgroundColor: themeName === 'dark' ? '#2E2614' : '#FFF2C2',
                borderColor: `${theme.gold}66`,
              },
            ]}>
            <SymbolView name="lock.open.fill" size={20} tintColor={theme.gold} />
            <ThemedText style={[styles.rewardValue, { color: theme.gold }]}>-20%</ThemedText>
          </View>
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(340).delay(70)}
          style={styles.introCopy}>
          <ThemedText style={[Type.caption, styles.kicker, { color: theme.gold }]}>
            {t('onboarding.reward.kicker')}
          </ThemedText>
          <ThemedText style={[Type.display, styles.center]}>{t('onboarding.reward.title')}</ThemedText>
          <ThemedText style={[Type.body, styles.center, { color: theme.textSecondary }]}>
            {t('onboarding.reward.body')}
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(320).delay(140)}
          style={[styles.rules, { backgroundColor: theme.surfaceHigh }]}>
          <Rule symbol="flame.fill" text={t('onboarding.reward.ruleWarmup')} />
          <Rule symbol="waveform.path" text={t('onboarding.reward.ruleHits')} />
          <Rule symbol="arrow.clockwise" text={t('onboarding.reward.ruleRetry')} />
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <UiButton
          label={t('onboarding.reward.cta')}
          variant="prominent"
          tintColor={theme.blood}
          fullWidth
          onPress={onContinue}
        />
        <ThemedText style={[Type.caption, styles.terms, { color: theme.textSecondary }]}>
          {t('onboarding.reward.terms', { introductoryPrice, standardPrice })}
        </ThemedText>
      </View>
    </View>
  );
}

function Rule({ symbol, text }: { symbol: 'flame.fill' | 'waveform.path' | 'arrow.clockwise'; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.rule}>
      <SymbolView name={symbol} size={17} tintColor={theme.gold} />
      <ThemedText style={[Type.caption, styles.ruleText]}>{text}</ThemedText>
    </View>
  );
}

export function RoRewardResultStep({
  result,
  canRetry,
  onRetry,
  onContinue,
}: {
  result: RoDemoResult;
  canRetry: boolean;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const percentage = Math.round(result.accuracy * 100);

  return (
    <View
      style={[
        styles.safe,
        styles.resultSafe,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.three },
      ]}>
      <View style={styles.resultBody}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(360)}
          style={[
            styles.resultSeal,
            {
              backgroundColor: result.unlocked
                ? themeName === 'dark'
                  ? '#302713'
                  : '#FFF1BB'
                : theme.surfaceHigh,
              borderColor: result.unlocked ? `${theme.gold}73` : theme.border,
            },
          ]}>
          <SymbolView
            name={result.unlocked ? 'lock.open.fill' : 'waveform.path'}
            size={44}
            tintColor={result.unlocked ? theme.gold : theme.frost}
          />
          <ThemedText style={[styles.resultValue, { color: result.unlocked ? theme.gold : theme.textPrimary }]}>
            {result.unlocked ? '-20%' : `${result.hits}/${result.judged}`}
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(340).delay(80)}
          style={styles.resultCopy}>
          <ThemedText style={[Type.display, styles.center]}>
            {t(result.unlocked ? 'onboarding.reward.successTitle' : 'onboarding.reward.missTitle')}
          </ThemedText>
          <ThemedText style={[Type.body, styles.center, { color: theme.textSecondary }]}>
            {t(
              result.unlocked
                ? 'onboarding.reward.successBody'
                : canRetry
                  ? 'onboarding.reward.retryBody'
                  : 'onboarding.reward.finalMissBody',
              { percentage },
            )}
          </ThemedText>
        </Animated.View>
      </View>

      <UiButton
        label={t(
          result.unlocked
            ? 'onboarding.reward.claim'
            : canRetry
              ? 'onboarding.reward.retry'
              : 'common.continue',
        )}
        variant="prominent"
        tintColor={result.unlocked ? theme.gold : theme.frost}
        fullWidth
        onPress={result.unlocked || !canRetry ? onContinue : onRetry}
      />

      {result.unlocked && !reducedMotion && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Confetti autoplay colors={RO_CONFETTI_COLORS} count={180} fadeOutOnEnd />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: ScreenPadding },
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soundPill: { minHeight: 34, borderRadius: Radius.pill, flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.three },
  introBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  drumStage: { width: 260, height: 232, alignItems: 'center', justifyContent: 'center' },
  rewardSeal: { position: 'absolute', right: 4, top: 4, minWidth: 86, height: 48, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, paddingHorizontal: Spacing.two },
  rewardValue: { fontFamily: Type.h1.fontFamily, fontSize: 20, lineHeight: 24 },
  introCopy: { maxWidth: 360, alignItems: 'center', gap: Spacing.two },
  kicker: { fontFamily: Type.h2.fontFamily },
  center: { textAlign: 'center' },
  rules: { alignSelf: 'stretch', borderRadius: Radius.control, paddingHorizontal: Spacing.three },
  rule: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  ruleText: { flex: 1 },
  footer: { gap: Spacing.two },
  terms: { textAlign: 'center', paddingHorizontal: Spacing.two },
  resultSafe: { alignItems: 'stretch' },
  resultBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  resultSeal: { width: 190, height: 190, borderRadius: 95, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  resultValue: { fontFamily: Type.display.fontFamily, fontSize: 46, lineHeight: 52 },
  resultCopy: { maxWidth: 360, alignItems: 'center', gap: Spacing.two },
});
