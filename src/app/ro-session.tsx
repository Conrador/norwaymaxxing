import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Confetti } from 'react-native-fast-confetti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Drum } from '@/components/drum';
import { ThemedText } from '@/components/themed-text';
import { VikingDrumArt } from '@/components/viking-drum-art';
import { ScreenPadding, Spacing, Type } from '@/constants/theme';
import { RoAudio } from '@/features/ro/audio';
import {
  judgeRep,
  repIntervalsMs,
  RO_CONFETTI_COLORS,
  RO_CROWD_DELAY_MS,
  RO_ENERGY_THRESHOLD,
  RO_WARMUP_REPS,
  RO_XP_FULL,
  RO_XP_PARTIAL,
  roTier,
  type RoBeatJudgement,
} from '@/features/ro/session';
import { generateDailyProtocol } from '@/features/protocol/protocol';
import { usePremium } from '@/hooks/use-premium';
import { useTheme } from '@/hooks/use-theme';
import { dateKey } from '@/lib/dates';
import { useProfile } from '@/stores/profile';
import { useProgress } from '@/stores/progress';

type Phase = 'intro' | 'row' | 'done';

function GameButton({
  label,
  color,
  shadowColor,
  disabled = false,
  onPress,
}: {
  label: string;
  color: string;
  shadowColor: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.gameButtonShell}>
      <View style={[styles.gameButtonShadow, { backgroundColor: shadowColor }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={({ pressed }) => [
          styles.gameButton,
          {
            backgroundColor: color,
            opacity: disabled ? 0.48 : 1,
            transform: [{ translateY: pressed ? 5 : 0 }],
          },
        ]}>
        <ThemedText style={styles.gameButtonLabel}>{label}</ThemedText>
      </Pressable>
    </View>
  );
}

function ResultStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.resultStat, { borderColor: `${color}A6` }]}>
      <ThemedText style={[styles.resultValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.resultLabel}>{label.toUpperCase()}</ThemedText>
    </View>
  );
}

export default function RoSessionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const params = useLocalSearchParams<{ date?: string; taskIds?: string }>();
  const sessionDate = params.date ?? dateKey();

  const profile = useProfile((s) => s.profile);
  const { isPremium, loading } = usePremium();
  const cold30Day = useProgress((s) => s.cold30Day);
  const completeTask = useProgress((s) => s.completeTask);
  const completeRoSession = useProgress((s) => s.completeRoSession);
  // RO! jest wyłącznie premium — w każdym kontekście (protokół i biblioteka).
  const premiumLocked = !loading && !isPremium;

  const tier = useMemo(() => roTier(cold30Day), [cold30Day]);
  const intervals = useMemo(() => repIntervalsMs(tier), [tier]);

  const [phase, setPhase] = useState<Phase>('intro');
  const [audioReady, setAudioReady] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [rep, setRep] = useState(0);
  /** rośnie przy KAŻDYM fizycznym uderzeniu (obydwu w repie) — napędza bounce bębna */
  const [tapCount, setTapCount] = useState(0);
  const [countdownMs, setCountdownMs] = useState(1000);
  const [targetWaitMs, setTargetWaitMs] = useState(1000);
  /** true = pierwsze uderzenie repa wykonane, czekamy na drugie */
  const [armed, setArmed] = useState(false);
  const [hits, setHits] = useState(0);
  const [lastJudgement, setLastJudgement] = useState<RoBeatJudgement>('hit');

  const audioRef = useRef<RoAudio | null>(null);
  const armedRef = useRef(false);
  const lastPairAt = useRef(0);
  const nextFirstAt = useRef(0);
  const pendingJudgement = useRef<RoBeatJudgement>('hit');

  const drumSize = Math.min(width - ScreenPadding * 2.8, height < 760 ? 212 : 248);
  const introDrumSize = Math.min(width * 0.5, height < 760 ? 164 : 194);
  const judgedReps = Math.max(1, tier.reps - RO_WARMUP_REPS);
  const energy = Math.min(1, hits / judgedReps);
  const accuracy = rep > RO_WARMUP_REPS ? hits / Math.min(judgedReps, rep - RO_WARMUP_REPS) : 1;
  const tempoProgress = tier.reps > 1 ? rep / (tier.reps - 1) : 1;
  const currentInterval = intervals[Math.min(rep, intervals.length - 1)] ?? 1000;
  const currentBpm = Math.round(60_000 / currentInterval);
  const finalSprint = tempoProgress >= 0.68;
  const judgedCount = Math.max(0, rep - RO_WARMUP_REPS);
  const struggling = judgedCount >= 3 && accuracy < RO_ENERGY_THRESHOLD;

  // Metronom wizualny: "RO!" pulsuje w tempie targetu następnego repa
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    if (premiumLocked) router.replace('/paywall');
  }, [premiumLocked, router]);

  useEffect(() => {
    cancelAnimation(pulse);
    if (phase !== 'row' || armed || reducedMotion) {
      pulse.set(1);
      return;
    }

    const riseDuration = Math.max(110, targetWaitMs * 0.82);
    const resetDuration = Math.max(70, targetWaitMs * 0.18);
    pulse.set(withRepeat(
      withSequence(
        withTiming(finalSprint ? 1.3 : 1.2, {
          duration: riseDuration,
          easing: Easing.in(Easing.quad),
        }),
        withTiming(1, { duration: resetDuration, easing: Easing.out(Easing.quad) }),
      ),
      -1,
    ));

    return () => cancelAnimation(pulse);
  }, [armed, finalSprint, phase, pulse, reducedMotion, targetWaitMs]);

  useEffect(() => {
    if (phase !== 'row' || armed) return;
    const id = setInterval(() => {
      setCountdownMs(Math.max(0, nextFirstAt.current - Date.now()));
    }, 50);
    return () => clearInterval(id);
  }, [armed, phase, rep]);

  useEffect(() => {
    if (premiumLocked) return;
    const audio = new RoAudio();
    audioRef.current = audio;
    audio
      .load()
      .then(() => {
        setAudioAvailable(true);
        setAudioReady(true);
        audio.play('horn');
      })
      .catch(() => setAudioReady(true)); // sesja działa też bez audio — haptyka niesie rytm
    return () => audio.dispose();
  }, [premiumLocked]);

  if (premiumLocked) return null;

  const onHit = () => {
    if (phase !== 'row' || rep >= tier.reps) return;
    const now = Date.now();

    // Bęben + haptyka na KAŻDE uderzenie (oba w repie).
    audioRef.current?.play('drum');
    setTapCount((v) => v + 1);

    // Pierwsze uderzenie zamyka countdown. Dopiero teraz prosimy o drugi hit.
    if (!armedRef.current) {
      let judgement: RoBeatJudgement = 'hit';
      if (lastPairAt.current > 0 && rep >= RO_WARMUP_REPS) {
        const targetRest = intervals[Math.min(rep, intervals.length - 1)];
        judgement = judgeRep(now - lastPairAt.current, targetRest);
      }

      pendingJudgement.current = judgement;
      armedRef.current = true;
      setArmed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    // Drugie uderzenie (...-dun) — dopiero teraz odpowiada tłum „RUUU!".
    armedRef.current = false;
    setArmed(false);
    audioRef.current?.play('roShort', { delayMs: RO_CROWD_DELAY_MS, gain: 0.95 });
    const nextRep = rep + 1;
    Haptics.impactAsync(
      nextRep % 4 === 0 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium,
    );

    // Timing oceniamy na pierwszym uderzeniu, ale zaliczamy dopiero pełną parę.
    const judgement = pendingJudgement.current;
    setLastJudgement(judgement);
    if (rep >= RO_WARMUP_REPS && judgement === 'hit') setHits((v) => v + 1);

    lastPairAt.current = now;
    if (nextRep < tier.reps) {
      const nextWait = intervals[Math.min(nextRep, intervals.length - 1)];
      nextFirstAt.current = now + nextWait;
      setTargetWaitMs(nextWait);
      setCountdownMs(nextWait);
    }

    setRep(nextRep);
    if (nextRep >= tier.reps) {
      setTimeout(() => {
        audioRef.current?.play('roRoar');
        audioRef.current?.play('horn', { delayMs: 500, gain: 0.8 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('done');
      }, 300);
    }
  };

  const startRow = () => {
    const firstWait = intervals[0] ?? 1800;
    const now = Date.now();
    armedRef.current = false;
    lastPairAt.current = 0;
    nextFirstAt.current = now + firstWait;
    pendingJudgement.current = 'hit';
    setArmed(false);
    setCountdownMs(firstWait);
    setTargetWaitMs(firstWait);
    setPhase('row');
  };

  const claim = () => {
    const tasks = generateDailyProtocol(profile, cold30Day, new Date(`${sessionDate}T12:00:00`));
    const taskIds = params.taskIds ? params.taskIds.split(',') : tasks.map((task) => task.id);
    const roTask = tasks.find((task) => task.id === 'ro');
    const earnedXp = energy >= RO_ENERGY_THRESHOLD ? RO_XP_FULL : RO_XP_PARTIAL;
    if (roTask) completeTask(sessionDate, { ...roTask, xp: earnedXp }, taskIds);
    completeRoSession(Math.round(accuracy * 100));
    router.back();
  };

  const fullEnergy = energy >= RO_ENERGY_THRESHOLD;
  const drumFeedbackColor = armed
    ? theme.gold
    : lastJudgement === 'hit'
      ? theme.aurora
      : theme.blood;
  const coachKey = armed
    ? 'double'
    : struggling
      ? 'losing'
      : lastJudgement === 'slow'
        ? 'faster'
        : lastJudgement === 'fast'
          ? 'slower'
          : finalSprint
            ? 'sprint'
            : 'onBeat';
  const coachColor = armed
    ? theme.gold
    : struggling || lastJudgement === 'slow' || finalSprint
      ? theme.blood
      : lastJudgement === 'fast'
        ? theme.frost
        : theme.aurora;
  const countdownDue = !armed && countdownMs <= 25;
  const countdownText = armed
    ? '2 / 2'
    : countdownDue
      ? t('ro.now')
      : `${(Math.ceil(countdownMs / 100) / 10).toFixed(1)} s`;

  return (
    <LinearGradient colors={['#061426', '#12152D', '#280B19']} style={styles.fill}>
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top + Spacing.two,
            paddingBottom: Math.max(insets.bottom, Spacing.three),
          },
        ]}>
        <View style={styles.topBar}>
          <BackButton label={t('common.back')} onPress={() => router.back()} tintColor="#F5D7DC" />
          {phase === 'row' && (
            <ThemedText style={[Type.caption, styles.pillText]}>
              {t('ro.beat', { current: Math.min(rep + 1, tier.reps), total: tier.reps })}
            </ThemedText>
          )}
        </View>

        {phase === 'intro' && (
          <View style={styles.phaseLayout}>
            <View style={styles.introBody}>
              <View style={styles.introStatusRow}>
                <ThemedText style={styles.kicker}>{t('ro.readyKicker').toUpperCase()}</ThemedText>
                {audioAvailable && (
                  <View style={[styles.soundBadge, { backgroundColor: `${theme.aurora}1F` }]}>
                    <SymbolView name="speaker.wave.2.fill" size={14} tintColor={theme.aurora} />
                    <ThemedText style={[styles.soundBadgeText, { color: theme.aurora }]}>
                      {t('ro.soundOn').toUpperCase()}
                    </ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.introArt}>
                <View style={[styles.artHalo, { backgroundColor: `${theme.blood}25` }]} />
                <VikingDrumArt size={introDrumSize} runeColor={theme.blood} />
              </View>
              <ThemedText style={styles.introTitle}>{t('ro.intro')}</ThemedText>

              <View style={styles.sequenceBubble}>
                <View style={styles.sequencePart}>
                  <ThemedText style={styles.sequenceLabel}>{t('ro.you').toUpperCase()}</ThemedText>
                  <ThemedText style={styles.sequenceBeat}>DUN · DUN</ThemedText>
                </View>
                <ThemedText style={styles.sequenceArrow}>→</ThemedText>
                <View style={styles.sequencePart}>
                  <ThemedText style={styles.sequenceLabel}>{t('ro.crowd').toUpperCase()}</ThemedText>
                  <ThemedText style={[styles.sequenceBeat, { color: theme.blood }]}>RO!</ThemedText>
                </View>
              </View>

              <ThemedText style={[Type.body, styles.caption]}>{t('ro.introHint')}</ThemedText>
              <View style={styles.readyMeta}>
                <View style={styles.readyMetric}>
                  <ThemedText style={styles.readyMetricValue}>{tier.reps}</ThemedText>
                  <ThemedText style={styles.readyMetricLabel}>{t('ro.rows').toUpperCase()}</ThemedText>
                </View>
                <View style={styles.readyDivider} />
                <View style={styles.readyMetric}>
                  <ThemedText style={styles.readyMetricValue}>{tier.bpmStart}–{tier.bpmEnd}</ThemedText>
                  <ThemedText style={styles.readyMetricLabel}>BPM</ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.bottomCta}>
              <GameButton
                label={audioReady ? t('common.start').toUpperCase() : '…'}
                color={theme.blood}
                shadowColor="#7B1D31"
                disabled={!audioReady}
                onPress={startRow}
              />
            </View>
          </View>
        )}

        {phase === 'row' && (
          <View style={styles.liveLayout}>
            <View style={styles.sessionProgressTrack}>
              <View
                style={[
                  styles.sessionProgressFill,
                  { backgroundColor: theme.blood, width: `${Math.min(rep / tier.reps, 1) * 100}%` },
                ]}
              />
            </View>

            <View style={styles.liveHeader}>
              <View style={styles.beatHeaderRow}>
                <Animated.View style={pulseStyle}>
                  <ThemedText style={[styles.roCall, { color: theme.blood }]}>RO!</ThemedText>
                </Animated.View>
                <View
                  style={[
                    styles.countdownBadge,
                    {
                      borderColor: countdownDue ? theme.blood : `${theme.gold}A6`,
                      backgroundColor: countdownDue ? `${theme.blood}20` : `${theme.gold}14`,
                    },
                  ]}>
                  <ThemedText
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                    numberOfLines={1}
                    style={styles.countdownLabel}>
                    {t(armed ? 'ro.hitAgain' : 'ro.nextHit').toUpperCase()}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.countdownValue,
                      { color: countdownDue ? theme.blood : theme.gold },
                    ]}>
                    {countdownText}
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.speechBubble, { borderColor: `${coachColor}A6` }]}>
                <ThemedText style={[styles.coachText, { color: coachColor }]}>
                  {t(`ro.coach.${coachKey}`)}
                </ThemedText>
                <ThemedText style={styles.tempoText}>{t('ro.tempo', { count: currentBpm })}</ThemedText>
              </View>
            </View>

            <Drum
              size={drumSize}
              hitCount={tapCount}
              rippleColor={drumFeedbackColor}
              runeColor={drumFeedbackColor}
              guideColor={finalSprint ? theme.blood : theme.frost}
              guideDurationMs={targetWaitMs}
              guideActive={rep < tier.reps && !armed}
              guideIntensity={0.28 + tempoProgress * 0.34}
              onHit={onHit}
            />

            <View style={styles.liveFooter}>
              <View style={styles.liveStats}>
                <View style={styles.liveStat}>
                  <ThemedText style={styles.liveStatValue}>{Math.max(0, tier.reps - rep)}</ThemedText>
                  <ThemedText style={styles.liveStatLabel}>{t('ro.rowsLeft').toUpperCase()}</ThemedText>
                </View>
                <View style={styles.liveStatDivider} />
                <View style={styles.liveStat}>
                  <ThemedText style={[styles.liveStatValue, { color: struggling ? theme.blood : theme.aurora }]}>
                    {Math.round(accuracy * 100)}%
                  </ThemedText>
                  <ThemedText style={styles.liveStatLabel}>{t('ro.rhythm').toUpperCase()}</ThemedText>
                </View>
              </View>
              <View style={styles.crowdBarHeader}>
                <ThemedText style={styles.crowdBarLabel}>{t('ro.energy').toUpperCase()}</ThemedText>
                <ThemedText style={styles.crowdBarValue}>{Math.round(energy * 100)}%</ThemedText>
              </View>
              <View style={styles.crowdBarTrack}>
                <View
                  style={[
                    styles.crowdBarFill,
                    {
                      backgroundColor: struggling ? theme.blood : theme.ember,
                      width: `${energy * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {phase === 'done' && (
          <View style={styles.phaseLayout}>
            <View style={styles.resultBody}>
              <ThemedText style={styles.kicker}>{t('ro.resultKicker').toUpperCase()}</ThemedText>
              <View style={styles.resultArt}>
                <View style={[styles.resultBurst, { backgroundColor: `${theme.aurora}20` }]} />
                <VikingDrumArt size={height < 760 ? 138 : 166} runeColor={theme.aurora} />
              </View>
              <ThemedText style={styles.skol}>{t('ro.success')}</ThemedText>
              <ThemedText style={[Type.body, styles.caption]}>
                {t(fullEnergy ? 'ro.successMeta' : 'ro.successMetaPartial', {
                  accuracy: Math.round(accuracy * 100),
                })}
              </ThemedText>
              <View style={styles.resultStats}>
                <ResultStat
                  label="XP"
                  value={`+${fullEnergy ? RO_XP_FULL : RO_XP_PARTIAL}`}
                  color={theme.gold}
                />
                <ResultStat
                  label={t('ro.rhythm')}
                  value={`${Math.round(accuracy * 100)}%`}
                  color={fullEnergy ? theme.aurora : theme.ember}
                />
                <ResultStat label={t('ro.rows')} value={`${tier.reps}`} color={theme.frost} />
              </View>
            </View>
            <View style={styles.bottomCta}>
              <GameButton
                label={t('ro.claim')}
                color={theme.blood}
                shadowColor="#7B1D31"
                onPress={claim}
              />
            </View>
          </View>
        )}
      </View>

      {phase === 'done' && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Confetti autoplay colors={RO_CONFETTI_COLORS} count={220} fadeOutOnEnd />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: ScreenPadding,
  },
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  phaseLayout: {
    flex: 1,
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  introBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  kicker: {
    ...Type.caption,
    color: '#F0B8C3',
    letterSpacing: 1.6,
  },
  introStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  soundBadge: {
    minHeight: 28,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  soundBadgeText: {
    ...Type.caption,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.7,
  },
  pillText: {
    color: '#F5D7DC',
    fontVariant: ['tabular-nums'],
  },
  introArt: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  artHalo: {
    position: 'absolute',
    width: '118%',
    aspectRatio: 1,
    borderRadius: 999,
  },
  introTitle: {
    ...Type.display,
    color: '#F5FAFF',
    textAlign: 'center',
  },
  caption: {
    color: '#D0B5BE',
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
  sequenceBubble: {
    alignSelf: 'stretch',
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sequencePart: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  sequenceLabel: {
    ...Type.caption,
    color: '#B9909B',
    letterSpacing: 1,
  },
  sequenceBeat: {
    ...Type.h2,
    color: '#FFFFFF',
  },
  sequenceArrow: {
    ...Type.h2,
    color: '#B9909B',
  },
  readyMeta: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: Spacing.two,
  },
  readyMetric: {
    minWidth: 112,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.three,
  },
  readyMetricValue: {
    fontFamily: Type.h1.fontFamily,
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  readyMetricLabel: {
    ...Type.caption,
    color: '#B9909B',
    letterSpacing: 1,
  },
  readyDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bottomCta: {
    paddingTop: Spacing.two,
  },
  gameButtonShell: {
    height: 62,
  },
  gameButtonShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    borderRadius: 17,
  },
  gameButton: {
    height: 56,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameButtonLabel: {
    fontFamily: Type.h2.fontFamily,
    fontSize: 17,
    lineHeight: 22,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  liveLayout: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  sessionProgressTrack: {
    alignSelf: 'stretch',
    height: 13,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  sessionProgressFill: {
    height: '100%',
    borderRadius: 7,
  },
  liveHeader: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.two,
  },
  beatHeaderRow: {
    alignSelf: 'stretch',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  roCall: {
    fontFamily: Type.display.fontFamily,
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: 2,
  },
  countdownBadge: {
    width: 136,
    minHeight: 68,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  countdownLabel: {
    ...Type.caption,
    color: '#D0B5BE',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
  },
  countdownValue: {
    fontFamily: Type.h1.fontFamily,
    fontSize: 24,
    lineHeight: 29,
    fontVariant: ['tabular-nums'],
  },
  speechBubble: {
    minWidth: '86%',
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: 'rgba(8, 14, 29, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  coachText: {
    ...Type.h2,
    textAlign: 'center',
  },
  tempoText: {
    ...Type.caption,
    color: '#D0B5BE',
    fontVariant: ['tabular-nums'],
  },
  liveFooter: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    paddingBottom: Spacing.one,
  },
  liveStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  liveStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  liveStatValue: {
    fontFamily: Type.h1.fontFamily,
    fontSize: 26,
    lineHeight: 32,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  liveStatLabel: {
    ...Type.caption,
    color: '#B9909B',
    letterSpacing: 1,
  },
  liveStatDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  crowdBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crowdBarLabel: {
    ...Type.caption,
    color: '#D0B5BE',
    letterSpacing: 1.2,
  },
  crowdBarValue: {
    ...Type.caption,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  crowdBarTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  crowdBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  resultBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  resultArt: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBurst: {
    position: 'absolute',
    width: '132%',
    aspectRatio: 1,
    borderRadius: 999,
  },
  skol: {
    fontFamily: Type.display.fontFamily,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  resultStats: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  resultStat: {
    flex: 1,
    minHeight: 82,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: Spacing.one,
  },
  resultValue: {
    fontFamily: Type.h1.fontFamily,
    fontSize: 24,
    lineHeight: 30,
    fontVariant: ['tabular-nums'],
  },
  resultLabel: {
    ...Type.caption,
    color: '#D0B5BE',
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
});
