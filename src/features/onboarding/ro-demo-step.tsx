import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Confetti } from 'react-native-fast-confetti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Drum } from '@/components/drum';
import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { ScreenPadding, Spacing, Type } from '@/constants/theme';
import { RoAudio } from '@/features/ro/audio';
import { RO_CONFETTI_COLORS, RO_CROWD_DELAY_MS, repIntervalsMs } from '@/features/ro/session';
import { useTheme } from '@/hooks/use-theme';

/** Skrócone demo RO! w onboardingu (onboarding_paywall.md §5): 5 repów, wolno,
 *  bez XP/store — user ma POCZUĆ apkę przed paywallem. */
const DEMO_TIER = { reps: 5, bpmStart: 34, bpmEnd: 70 };

export function RoDemoStep({ onFinish, onSkip }: { onFinish: () => void; onSkip: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const intervals = useMemo(() => repIntervalsMs(DEMO_TIER), []);

  const [rep, setRep] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [armed, setArmed] = useState(false);
  const [done, setDone] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);

  const audioRef = useRef<RoAudio | null>(null);
  const armedRef = useRef(false);
  const drumSize = Math.min(width - ScreenPadding * 2.4, height < 760 ? 220 : 250);

  useEffect(() => {
    const audio = new RoAudio();
    let active = true;
    audioRef.current = audio;
    audio
      .load()
      .then(() => {
        if (!active) return;
        setAudioAvailable(true);
        audio.play('horn');
      })
      .catch(() => {});
    return () => {
      active = false;
      audio.dispose();
    };
  }, []);

  const onHit = () => {
    if (done || rep >= DEMO_TIER.reps) return;
    audioRef.current?.play('drum');
    setTapCount((v) => v + 1);

    if (!armedRef.current) {
      armedRef.current = true;
      setArmed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    armedRef.current = false;
    setArmed(false);
    audioRef.current?.play('roShort', { delayMs: RO_CROWD_DELAY_MS, gain: 0.95 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextRep = rep + 1;
    setRep(nextRep);
    if (nextRep >= DEMO_TIER.reps) {
      setTimeout(() => {
        audioRef.current?.play('horn');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDone(true);
      }, 300);
    }
  };

  return (
    <View
      style={[
        styles.safe,
        {
          paddingTop: insets.top + Spacing.two,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}>
      <View style={styles.topBar}>
        <View />
        {!done && (
          <Pressable onPress={onSkip} hitSlop={12}>
            <ThemedText style={[Type.body, { color: theme.textSecondary }]}>{t('common.skip')}</ThemedText>
          </Pressable>
        )}
      </View>

      {!done ? (
        <View style={styles.body}>
          {audioAvailable && (
            <View style={styles.soundCue}>
              <SymbolView name="speaker.wave.2.fill" size={15} tintColor={theme.frost} />
              <ThemedText style={[Type.caption, { color: theme.frost }]}>
                {t('ro.soundOn')}
              </ThemedText>
            </View>
          )}
          <ThemedText style={[Type.h1, styles.title]}>{t('onboarding.roTitle')}</ThemedText>
          <ThemedText style={[Type.body, styles.caption, { color: theme.textSecondary }]}>
            {armed ? t('ro.again') : t('onboarding.roHint')}
          </ThemedText>
          <View style={styles.drum}>
            <Drum
              size={drumSize}
              hitCount={tapCount}
              rippleColor={armed ? theme.gold : theme.aurora}
              runeColor={theme.blood}
              guideColor={theme.frost}
              guideDurationMs={intervals[Math.min(rep, intervals.length - 1)]}
              guideActive={rep < DEMO_TIER.reps && !armed}
              guideIntensity={0.5}
              onHit={onHit}
            />
          </View>
          <View style={styles.pips}>
            {Array.from({ length: DEMO_TIER.reps }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.pip,
                  { backgroundColor: i < rep ? theme.blood : 'rgba(150,150,150,0.3)' },
                ]}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <ThemedText style={[styles.skol, { color: theme.textPrimary }]}>{t('ro.success')}</ThemedText>
          <ThemedText style={[Type.body, styles.caption, { color: theme.textSecondary }]}>
            {t('onboarding.roDone')}
          </ThemedText>
        </View>
      )}

      {done && (
        <View style={styles.doneFooter}>
          <UiButton
            label={t('common.continue')}
            variant="prominent"
            tintColor={theme.frost}
            fullWidth
            onPress={onFinish}
          />
        </View>
      )}

      {done && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Confetti autoplay colors={RO_CONFETTI_COLORS} count={160} fadeOutOnEnd />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
  },
  topBar: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  soundCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  caption: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  drum: {
    marginVertical: Spacing.three,
  },
  pips: {
    flexDirection: 'row',
    gap: 8,
  },
  pip: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  skol: {
    fontFamily: Type.display.fontFamily,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: 2,
  },
  doneFooter: {
    alignSelf: 'stretch',
  },
});
