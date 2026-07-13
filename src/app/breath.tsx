import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { BreathingCircle } from '@/components/breathing-circle';
import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { breathStepAtElapsed, guidedBreathSession } from '@/features/breath/session';
import { generateDailyProtocol } from '@/features/protocol/protocol';
import { useTheme } from '@/hooks/use-theme';
import { dateKey } from '@/lib/dates';
import { useProfile } from '@/stores/profile';
import { useProgress } from '@/stores/progress';

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function BreathScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ date?: string; taskId?: string; taskIds?: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  const profile = useProfile((state) => state.profile);
  const cold30Day = useProgress((state) => state.cold30Day);
  const completeTask = useProgress((state) => state.completeTask);
  const sessionDate = params.date ?? dateKey();
  const protocolTasks = useMemo(
    () => generateDailyProtocol(profile, cold30Day, new Date(`${sessionDate}T12:00:00`)),
    [cold30Day, profile, sessionDate],
  );
  const protocolTask = useMemo(
    () => protocolTasks.find((task) => task.id === params.taskId && task.module === 'breath'),
    [params.taskId, protocolTasks],
  );
  const protocolTaskIds = useMemo(
    () => params.taskIds?.split(',').filter(Boolean) ?? protocolTasks.map((task) => task.id),
    [params.taskIds, protocolTasks],
  );
  const session = useMemo(
    () => guidedBreathSession(params.taskId, protocolTask?.minutes),
    [params.taskId, protocolTask?.minutes],
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const complete = elapsedSeconds >= session.totalSeconds;
  const remainingSeconds = Math.max(session.totalSeconds - elapsedSeconds, 0);
  const { cycleSeconds, step, countdown } = breathStepAtElapsed(session, elapsedSeconds);
  const totalCycles = Math.ceil(session.totalSeconds / cycleSeconds);
  const currentCycle = Math.min(Math.floor(elapsedSeconds / cycleSeconds) + 1, totalCycles);
  const progress = Math.min(elapsedSeconds / session.totalSeconds, 1);
  const circleSize = Math.min(width - ScreenPadding * 4, height < 760 ? 226 : 274);
  const allowLeave = useRef(false);
  const previousPhase = useRef(step.phase);
  const completionHapticPlayed = useRef(false);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (complete || allowLeave.current) return;

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
  }, [complete, navigation, t]);

  useEffect(() => {
    if (paused || complete) return;
    const interval = setInterval(() => {
      setElapsedSeconds((value) => Math.min(value + 1, session.totalSeconds));
    }, 1000);
    return () => clearInterval(interval);
  }, [complete, paused, session.totalSeconds]);

  useEffect(() => {
    if (complete || previousPhase.current === step.phase) return;
    previousPhase.current = step.phase;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [complete, step.phase]);

  useEffect(() => {
    if (!complete || completionHapticPlayed.current) return;
    completionHapticPlayed.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [complete]);

  const finish = () => {
    if (protocolTask) {
      completeTask(sessionDate, protocolTask, protocolTaskIds);
    }
    allowLeave.current = true;
    router.back();
  };

  return (
    <LinearGradient colors={['#071827', '#0A1321', '#030812']} style={styles.fill}>
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top + Spacing.two,
            paddingBottom: Math.max(insets.bottom, Spacing.three),
          },
        ]}>
        <View style={styles.topBar}>
          <BackButton label={t('common.back')} onPress={() => router.back()} tintColor="#D7E8F7" />
          {!complete && (
            <View style={styles.topPill}>
              <ThemedText style={[Type.caption, styles.pillText]}>
                {t('breath.cycle', { current: currentCycle, total: totalCycles })}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.frost }]} />
        </View>

        {!complete ? (
          <View style={styles.content}>
            <View style={styles.heading}>
              <ThemedText style={[Type.h1, styles.title]}>
                {protocolTask ? t(protocolTask.titleKey) : t('breath.practiceTitle')}
              </ThemedText>
              <ThemedText style={[Type.caption, styles.caption]}>{t(session.subtitleKey)}</ThemedText>
            </View>

            <View style={styles.sessionSurface}>
              <BreathingCircle
                phase={step.phase}
                color={theme.frost}
                size={circleSize}
                durationSeconds={step.seconds}
              />
              <View style={styles.circleOverlay} pointerEvents="none">
                <ThemedText style={[Type.timer, styles.countdown]}>{countdown}</ThemedText>
              </View>
            </View>

            <View style={styles.phaseCopy}>
              <ThemedText style={[Type.h1, styles.instruction]}>{t(`session.${step.phase}`)}</ThemedText>
              <ThemedText style={[Type.caption, styles.remaining]}>
                {t('breath.timeRemaining', { time: formatSeconds(remainingSeconds) })}
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={[styles.doneMark, { backgroundColor: `${theme.aurora}22` }]}>
              <ThemedText style={[styles.doneGlyph, { color: theme.aurora }]}>✓</ThemedText>
            </View>
            <ThemedText style={[Type.display, styles.title]}>{t('breath.completeTitle')}</ThemedText>
            <ThemedText style={[Type.body, styles.caption]}>{t('breath.completeSubtitle')}</ThemedText>
            {protocolTask && (
              <ThemedText style={[Type.h2, { color: theme.aurora }]}>
                {t('common.xp', { count: protocolTask.xp })}
              </ThemedText>
            )}
          </View>
        )}

        <View style={styles.controls}>
          {complete ? (
            <UiButton label={t('common.done')} variant="prominent" onPress={finish} />
          ) : (
            <>
              <UiButton label={t('common.cancel')} onPress={() => router.back()} />
              <UiButton
                label={paused ? t('common.resume') : t('common.pause')}
                variant="prominent"
                onPress={() => setPaused((value) => !value)}
              />
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
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
  pillText: { color: '#D7E8F7' },
  progressTrack: {
    height: 4,
    marginTop: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  heading: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  title: {
    color: '#F5FAFF',
    textAlign: 'center',
  },
  sessionSurface: {
    width: '100%',
    minHeight: 290,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  circleOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    color: '#F5FAFF',
    fontSize: 58,
    lineHeight: 68,
  },
  phaseCopy: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  instruction: {
    color: '#F5FAFF',
    textAlign: 'center',
  },
  caption: {
    color: '#8CA3C3',
    textAlign: 'center',
  },
  remaining: {
    color: '#8CA3C3',
    fontVariant: ['tabular-nums'],
  },
  doneMark: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneGlyph: {
    fontSize: 58,
    lineHeight: 68,
    fontFamily: Type.h1.fontFamily,
  },
  controls: {
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
