import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { BreathingCircle } from '@/components/breathing-circle';
import { ProgressRing } from '@/components/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import {
  COLD_BREATH_PHASES,
  COLD_BREATH_ROUNDS,
  coldDurationSeconds,
} from '@/features/cold/plan';
import { generateDailyProtocol } from '@/features/protocol/protocol';
import { useTheme } from '@/hooks/use-theme';
import { dateKey } from '@/lib/dates';
import { useProfile } from '@/stores/profile';
import { useProgress } from '@/stores/progress';

type SessionPhase = 'breath' | 'cold' | 'done';

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ColdSessionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ day?: string; date?: string }>();
  const day = Math.min(Math.max(Number(params.day) || 1, 1), 30);
  const sessionDate = params.date ?? dateKey();
  const coldSeconds = coldDurationSeconds(day);

  const profile = useProfile((s) => s.profile);
  const completeTask = useProgress((s) => s.completeTask);
  const completeColdDay = useProgress((s) => s.completeColdDay);

  const [phase, setPhase] = useState<SessionPhase>('breath');

  // --- breath state ---
  const [breathTick, setBreathTick] = useState(0);
  const breathCycleSeconds = COLD_BREATH_PHASES.reduce((total, item) => total + item.seconds, 0);
  const breathCycleTick = breathTick % breathCycleSeconds;
  const coldBreathPhase = breathCycleTick < COLD_BREATH_PHASES[0].seconds
    ? COLD_BREATH_PHASES[0]
    : COLD_BREATH_PHASES[1];
  const breathPhaseElapsed = coldBreathPhase.phase === 'inhale'
    ? breathCycleTick
    : breathCycleTick - COLD_BREATH_PHASES[0].seconds;
  const breathRound = Math.floor(breathTick / breathCycleSeconds) + 1;
  const breathCountdown = coldBreathPhase.seconds - breathPhaseElapsed;
  const breathTotal = breathCycleSeconds * COLD_BREATH_ROUNDS;

  // --- cold state ---
  const [remaining, setRemaining] = useState(coldSeconds);
  const [paused, setPaused] = useState(false);
  const ringSize = Math.min(width - ScreenPadding * 4, height < 760 ? 222 : 258);

  const prevBreathPhase = useRef(coldBreathPhase.phase);
  const allowLeave = useRef(false);

  // Ten sam guard co w /breath: przypadkowy swipe/back w trakcie sesji pyta o potwierdzenie.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (phase === 'done' || allowLeave.current) return;

      event.preventDefault();
      Alert.alert(t('breath.leaveTitle'), t('breath.leaveMessage'), [
        { text: t('breath.stay'), style: 'cancel' },
        {
          text: t('breath.leave'),
          style: 'destructive',
          onPress: () => {
            allowLeave.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });
  }, [navigation, phase, t]);

  useEffect(() => {
    if (phase !== 'breath') return;
    const id = setInterval(() => setBreathTick((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'breath') return;
    if (breathTick >= breathTotal) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const id = setTimeout(() => setPhase('cold'), 0);
      return () => clearTimeout(id);
    }
    if (prevBreathPhase.current !== coldBreathPhase.phase) {
      prevBreathPhase.current = coldBreathPhase.phase;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [breathTick, breathTotal, coldBreathPhase.phase, phase]);

  useEffect(() => {
    if (phase !== 'cold' || paused) return;
    const id = setInterval(() => setRemaining((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [phase, paused]);

  useEffect(() => {
    if (phase === 'cold' && remaining <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const id = setTimeout(() => setPhase('done'), 0);
      return () => clearTimeout(id);
    }
  }, [phase, remaining]);

  const claim = () => {
    const tasks = generateDailyProtocol(profile, day, new Date(`${sessionDate}T12:00:00`));
    const coldTask = tasks.find((task) => task.id === 'cold');
    if (coldTask) completeTask(sessionDate, coldTask, tasks.map((task) => task.id));
    // Challenge progression is tied to the actual local day, not a calendar
    // date selected elsewhere in the app.
    completeColdDay(day, dateKey());
    router.back();
  };

  return (
    <LinearGradient colors={['#061827', '#0A1321', '#030812']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <BackButton label={t('common.back')} onPress={() => router.back()} tintColor="#D7E8F7" />
          <View style={styles.topPill}>
            <ThemedText style={[Type.caption, styles.pillText]}>
              {phase === 'breath'
                ? t('session.round', { current: Math.min(breathRound, COLD_BREATH_ROUNDS), total: COLD_BREATH_ROUNDS })
                : t('common.day', { count: day })}
            </ThemedText>
          </View>
        </View>
        {phase === 'breath' && (
          <View style={styles.content}>
            <ThemedText style={[Type.h1, styles.titleText]}>
              {t('session.breatheTitle')}
            </ThemedText>

            <View style={styles.sessionSurface}>
              <BreathingCircle
                phase={coldBreathPhase.phase}
                color={theme.frost}
                size={ringSize}
                durationSeconds={coldBreathPhase.seconds}
              />
              <View style={styles.circleOverlay} pointerEvents="none">
                <ThemedText style={[Type.timer, styles.timerText, { fontSize: 56, lineHeight: 66 }]}>
                  {breathCountdown}
                </ThemedText>
              </View>
            </View>

            <ThemedText style={[Type.h2, styles.phaseText]}>
              {t(`session.${coldBreathPhase.phase}`)}
            </ThemedText>
          </View>
        )}

        {phase === 'cold' && (
          <View style={styles.content}>
            <ThemedText style={[Type.h1, styles.titleText]}>
              {t('session.coldTitle')}
            </ThemedText>

            <View style={styles.sessionSurface}>
              <ProgressRing
                size={ringSize}
                strokeWidth={14}
                progress={remaining / coldSeconds}
                color={theme.frost}
                trackColor="rgba(255,255,255,0.12)">
                <ThemedText style={[Type.timer, styles.timerText, { fontSize: ringSize < 240 ? 52 : 60, lineHeight: 70 }]}>
                  {formatSeconds(Math.max(remaining, 0))}
                </ThemedText>
              </ProgressRing>
            </View>
            <ThemedText style={[Type.caption, styles.caption]}>{t('session.coldSafetyHint')}</ThemedText>
          </View>
        )}

        {phase === 'done' && (
          <View style={styles.content}>
            <View style={styles.sessionSurface}>
              <ThemedText style={styles.doneEmoji}>❄️</ThemedText>
            </View>
            <ThemedText style={[Type.display, styles.titleText]}>
              {t('session.finishedTitle', { count: day })}
            </ThemedText>
            <ThemedText style={[Type.body, styles.caption]}>
              {t('session.finishedSubtitle')}
            </ThemedText>
            <ThemedText style={[Type.h2, { color: theme.aurora }]}>
              {t('common.xp', { count: 30 })}
            </ThemedText>
          </View>
        )}
        <View style={styles.controls}>
          {phase === 'breath' ? (
            <UiButton label={t('session.skipBreathing')} onPress={() => setPhase('cold')} />
          ) : phase === 'cold' ? (
            <>
              <UiButton
                label={paused ? t('common.resume') : t('common.pause')}
                onPress={() => setPaused((p) => !p)}
              />
              <UiButton label={t('session.abort')} variant="destructive" onPress={() => router.back()} />
            </>
          ) : (
            <UiButton label={t('session.claim')} variant="prominent" onPress={claim} />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  topBar: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  topPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillText: {
    color: '#D7E8F7',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  titleText: {
    color: '#F5FAFF',
    textAlign: 'center',
  },
  sessionSurface: {
    width: '100%',
    minHeight: 280,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  circleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#F5FAFF',
    textAlign: 'center',
  },
  phaseText: {
    color: '#F5FAFF',
    textAlign: 'center',
  },
  caption: {
    color: '#8CA3C3',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  doneEmoji: {
    fontSize: 96,
    lineHeight: 120,
  },
});
