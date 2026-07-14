import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { UiButton } from '@/components/ui-button';
import { useTheme } from '@/hooks/use-theme';

/**
 * Welcome hook (onboarding_paywall.md §3): crossfade z pionowym slajdem —
 * stara linia fade-out + slide w GÓRĘ, nowa fade-in + slide z DOŁU na to samo
 * miejsce. Linie nałożone absolutnie w centrum, więc jedna zastępuje drugą.
 * „The World Cup ends," → „but your Norwegian lifestyle…" → „…never does."
 */
const SLIDE = 28;
const IN_MS = 520;
const OUT_MS = 360;
const HOLD_MS = 1800;
const FINAL_HOLD_MS = 1200;

type WelcomePhase = 0 | 1 | 2 | 3;

export function WelcomeStep({ onBegin }: { onBegin: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const finalLifestyle = t('onboarding.welcome2').replace(/…$/, '');
  // 0: linia 1, 1: linia 2, 2: finał, 3: pełny hook + CTA.
  const [phase, setPhase] = useState<WelcomePhase>(reducedMotion ? 3 : 0);

  useEffect(() => {
    if (reducedMotion || phase >= 3) return;
    const delay = phase === 2 ? FINAL_HOLD_MS : HOLD_MS;
    const id = setTimeout(() => setPhase((current) => (current + 1) as WelcomePhase), delay);
    return () => clearTimeout(id);
  }, [phase, reducedMotion]);

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <View style={styles.center}>
        <View style={styles.lineSlot}>
          {phase === 0 && (
            <Animated.View
              key="l1"
              entering={FadeInUp.duration(IN_MS).withInitialValues({
                opacity: 0,
                transform: [{ translateY: SLIDE }],
              })}
              exiting={FadeOutUp.duration(OUT_MS)}
              style={styles.lineAbs}>
              <ThemedText style={[Type.display, styles.line]}>{t('onboarding.welcome1')}</ThemedText>
            </Animated.View>
          )}
          {phase === 1 && (
            <Animated.View
              key="l2"
              entering={FadeInUp.duration(IN_MS).withInitialValues({
                opacity: 0,
                transform: [{ translateY: SLIDE }],
              })}
              exiting={FadeOutUp.duration(OUT_MS)}
              style={styles.lineAbs}>
              <ThemedText style={[Type.display, styles.line]}>{t('onboarding.welcome2')}</ThemedText>
            </Animated.View>
          )}
          {phase === 2 && (
            <Animated.View
              key="l3"
              entering={FadeInUp.duration(IN_MS + 120).withInitialValues({
                opacity: 0,
                transform: [{ translateY: SLIDE }],
              })}
              style={styles.lineAbs}>
              <ThemedText style={[Type.display, styles.finalLine]}>
                {t('onboarding.welcome3a')}
                <ThemedText style={[styles.accent, styles.accentLarge, { color: theme.frost }]}>
                  {t('onboarding.welcome3b')}
                </ThemedText>
                {t('onboarding.welcome3c')}
              </ThemedText>
            </Animated.View>
          )}
          {phase === 3 && (
            <Animated.View
              key="full-hook"
              entering={reducedMotion ? undefined : FadeInUp.duration(IN_MS).withInitialValues({ opacity: 0, transform: [{ translateY: SLIDE / 2 }] })}
              style={styles.fullHook}>
              <ThemedText style={[Type.display, styles.line]}>{t('onboarding.welcome1')}</ThemedText>
              <ThemedText style={[Type.display, styles.line]}>{finalLifestyle}</ThemedText>
              <ThemedText style={[Type.display, styles.finalLine]}>
                <ThemedText style={[styles.accent, styles.accentLarge, { color: theme.frost }]}>{t('onboarding.welcome3b')}</ThemedText>
                {t('onboarding.welcome3c')}
              </ThemedText>
            </Animated.View>
          )}
        </View>
      </View>

      {phase === 3 && (
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(360).delay(160)} style={styles.cta}>
          <UiButton
            label={t('onboarding.begin')}
            variant="prominent"
            tintColor={theme.frost}
            fullWidth
            onPress={onBegin}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
    paddingBottom: Spacing.four,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineSlot: {
    alignSelf: 'stretch',
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineAbs: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  line: {
    fontSize: 34,
    lineHeight: 42,
    textAlign: 'center',
  },
  finalLine: {
    fontSize: 38,
    lineHeight: 46,
    textAlign: 'center',
  },
  accent: {
    fontFamily: Fonts.accent,
    fontStyle: 'italic',
  },
  accentLarge: {
    fontSize: 54,
    lineHeight: 58,
  },
  fullHook: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
