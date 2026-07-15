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
import {
  judgeRep,
  repIntervalsMs,
  RO_CONFETTI_COLORS,
  RO_CROWD_DELAY_MS,
  RO_ENERGY_THRESHOLD,
  type RoBeatJudgement,
} from '@/features/ro/session';
import { useTheme } from '@/hooks/use-theme';

/** Short onboarding challenge using the same timing model as the premium session. */
const DEMO_TIER = { reps: 8, bpmStart: 34, bpmEnd: 70 };
const DEMO_WARMUP_REPS = 1;
export const RO_REWARD_REQUIRED_HITS = 5;
export const RO_REWARD_JUDGED_REPS = DEMO_TIER.reps - DEMO_WARMUP_REPS;

export type RoDemoResult = {
  hits: number;
  judged: number;
  accuracy: number;
  unlocked: boolean;
  attempt: number;
};

export function RoDemoStep({
  onFinish,
  onSkip,
  rewardEnabled = false,
  attempt = 1,
}: {
  onFinish: (result: RoDemoResult) => void;
  onSkip: () => void;
  rewardEnabled?: boolean;
  attempt?: number;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const intervals = useMemo(() => repIntervalsMs(DEMO_TIER), []);
  const initialWaitMs = intervals[0] ?? 1800;

  const [rep, setRep] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [armed, setArmed] = useState(false);
  const [done, setDone] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [countdownMs, setCountdownMs] = useState(initialWaitMs);
  const [targetWaitMs, setTargetWaitMs] = useState(initialWaitMs);
  const [hits, setHits] = useState(0);
  const [lastJudgement, setLastJudgement] = useState<RoBeatJudgement>('hit');
  const [finalResult, setFinalResult] = useState<RoDemoResult | null>(null);

  const audioRef = useRef<RoAudio | null>(null);
  const armedRef = useRef(false);
  const lastPairAt = useRef(0);
  const nextFirstAt = useRef(0);
  const pendingJudgement = useRef<RoBeatJudgement>('hit');
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const drumSize = Math.min(width - ScreenPadding * 2.8, height < 760 ? 184 : 218);
  const tempoProgress = DEMO_TIER.reps > 1 ? rep / (DEMO_TIER.reps - 1) : 1;
  const currentInterval = intervals[Math.min(rep, intervals.length - 1)] ?? 1000;
  const currentBpm = Math.round(60_000 / currentInterval);
  const finalSprint = tempoProgress >= 0.68;
  const judgedCount = Math.max(0, rep - DEMO_WARMUP_REPS);
  const accuracy = judgedCount > 0 ? hits / judgedCount : 1;
  const struggling = judgedCount >= 2 && accuracy < RO_ENERGY_THRESHOLD;
  const countdownDue = !armed && countdownMs <= 25;
  const countdownText = armed
    ? '2 / 2'
    : countdownDue
      ? t('ro.now')
      : `${(Math.ceil(countdownMs / 100) / 10).toFixed(1)} s`;
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
  const coachColor =
    armed || lastJudgement === 'slow' || struggling || finalSprint
      ? theme.blood
      : lastJudgement === 'fast'
        ? theme.frost
        : theme.aurora;
  const drumFeedbackColor = armed
    ? theme.gold
    : lastJudgement === 'hit'
      ? theme.aurora
      : theme.blood;

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

  useEffect(() => {
    const id = setTimeout(() => {
      nextFirstAt.current = Date.now() + initialWaitMs;
      setCountdownMs(initialWaitMs);
      setTargetWaitMs(initialWaitMs);
    }, 0);
    return () => clearTimeout(id);
  }, [initialWaitMs]);

  useEffect(() => {
    if (done || armed) return;
    const id = setInterval(() => {
      setCountdownMs(Math.max(0, nextFirstAt.current - Date.now()));
    }, 50);
    return () => clearInterval(id);
  }, [armed, done, rep]);

  useEffect(() => {
    if (!rewardEnabled || !finalResult) return;
    const id = setTimeout(() => onFinishRef.current(finalResult), 650);
    return () => clearTimeout(id);
  }, [finalResult, rewardEnabled]);

  const onHit = () => {
    if (done || rep >= DEMO_TIER.reps) return;
    const now = Date.now();
    audioRef.current?.play('drum');
    setTapCount((value) => value + 1);

    if (!armedRef.current) {
      let judgement: RoBeatJudgement = 'hit';
      if (lastPairAt.current > 0 && rep >= DEMO_WARMUP_REPS) {
        const targetRest = intervals[Math.min(rep, intervals.length - 1)] ?? targetWaitMs;
        judgement = judgeRep(now - lastPairAt.current, targetRest);
      }
      pendingJudgement.current = judgement;
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
    const judgement = pendingJudgement.current;
    setLastJudgement(judgement);
    const scoredHit = rep >= DEMO_WARMUP_REPS && judgement === 'hit';
    const nextHits = hits + (scoredHit ? 1 : 0);
    if (scoredHit) setHits(nextHits);

    lastPairAt.current = now;
    if (nextRep < DEMO_TIER.reps) {
      const nextWait = intervals[Math.min(nextRep, intervals.length - 1)] ?? 1000;
      nextFirstAt.current = now + nextWait;
      setTargetWaitMs(nextWait);
      setCountdownMs(nextWait);
    }
    setRep(nextRep);

    if (nextRep >= DEMO_TIER.reps) {
      const judged = RO_REWARD_JUDGED_REPS;
      const result: RoDemoResult = {
        hits: nextHits,
        judged,
        accuracy: judged > 0 ? nextHits / judged : 0,
        unlocked: rewardEnabled && nextHits >= RO_REWARD_REQUIRED_HITS,
        attempt,
      };
      setTimeout(() => {
        audioRef.current?.play('horn');
        Haptics.notificationAsync(
          !rewardEnabled || result.unlocked
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
        setFinalResult(result);
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
        {!done ? (
          <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
            {t('ro.beat', { current: Math.min(rep + 1, DEMO_TIER.reps), total: DEMO_TIER.reps })}
          </ThemedText>
        ) : (
          <View />
        )}
        {!done && (
          <Pressable onPress={onSkip} hitSlop={12}>
            <ThemedText style={[Type.body, { color: theme.textSecondary }]}>{t('common.skip')}</ThemedText>
          </Pressable>
        )}
      </View>

      {!done ? (
        <View style={styles.body}>
          <View style={[styles.sessionProgressTrack, { backgroundColor: theme.surfaceHigh }]}>
            <View
              style={[
                styles.sessionProgressFill,
                { backgroundColor: theme.blood, width: `${Math.min(rep / DEMO_TIER.reps, 1) * 100}%` },
              ]}
            />
          </View>

          {rewardEnabled && (
            <View style={styles.rewardProgress}>
              <View style={styles.rewardProgressCopy}>
                <SymbolView name="lock.open.fill" size={15} tintColor={theme.gold} />
                <ThemedText style={[Type.caption, styles.rewardProgressLabel]}>
                  {t('onboarding.reward.progress', {
                    current: Math.min(hits, RO_REWARD_REQUIRED_HITS),
                    total: RO_REWARD_REQUIRED_HITS,
                  })}
                </ThemedText>
              </View>
              <View style={styles.rewardPips}>
                {Array.from({ length: RO_REWARD_REQUIRED_HITS }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.rewardPip,
                      { backgroundColor: index < hits ? theme.gold : theme.surfaceHigh },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <ThemedText style={[Type.h2, styles.title]}>{t('onboarding.roTitle')}</ThemedText>
              {audioAvailable && (
                <View style={styles.soundCue}>
                  <SymbolView name="speaker.wave.2.fill" size={14} tintColor={theme.frost} />
                  <ThemedText style={[Type.caption, { color: theme.frost }]}>{t('ro.soundOn')}</ThemedText>
                </View>
              )}
            </View>
          </View>

          <View style={styles.liveHeader}>
            <ThemedText style={[styles.roCall, { color: theme.blood }]}>RO!</ThemedText>
            <View
              style={[
                styles.countdownBadge,
                {
                  borderColor: countdownDue ? theme.blood : `${theme.gold}A6`,
                  backgroundColor: countdownDue ? `${theme.blood}18` : `${theme.gold}12`,
                },
              ]}>
              <ThemedText
                adjustsFontSizeToFit
                minimumFontScale={0.76}
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

          <View
            style={[
              styles.coachBubble,
              { borderColor: `${coachColor}A6`, backgroundColor: theme.surface },
            ]}>
            <ThemedText style={[styles.coachText, { color: coachColor }]}>
              {t(`ro.coach.${coachKey}`)}
            </ThemedText>
            <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
              {t('ro.tempo', { count: currentBpm })}
            </ThemedText>
          </View>

          <View style={styles.drum}>
            <Drum
              size={drumSize}
              hitCount={tapCount}
              rippleColor={drumFeedbackColor}
              runeColor={drumFeedbackColor}
              guideColor={finalSprint ? theme.blood : theme.frost}
              guideDurationMs={targetWaitMs}
              guideActive={rep < DEMO_TIER.reps && !armed}
              guideIntensity={0.3 + tempoProgress * 0.3}
              onHit={onHit}
            />
          </View>

          <View style={styles.liveStats}>
            <View style={styles.liveStat}>
              <ThemedText style={styles.liveStatValue}>{Math.max(0, DEMO_TIER.reps - rep)}</ThemedText>
              <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                {t('ro.rowsLeft').toUpperCase()}
              </ThemedText>
            </View>
            <View style={[styles.liveStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.liveStat}>
              <ThemedText
                style={[
                  styles.liveStatValue,
                  { color: struggling ? theme.blood : theme.aurora },
                ]}>
                {Math.round(accuracy * 100)}%
              </ThemedText>
              <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                {t('ro.rhythm').toUpperCase()}
              </ThemedText>
            </View>
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

      {done && !rewardEnabled && (
        <View style={styles.doneFooter}>
          <UiButton
            label={t('common.continue')}
            variant="prominent"
            tintColor={theme.frost}
            fullWidth
            onPress={() => {
              if (finalResult) onFinish(finalResult);
            }}
          />
        </View>
      )}

      {done && (!rewardEnabled || finalResult?.unlocked) && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Confetti autoplay colors={RO_CONFETTI_COLORS} count={160} fadeOutOnEnd />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: ScreenPadding },
  topBar: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  title: { flexShrink: 1 },
  titleRow: { alignSelf: 'stretch', minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  titleCopy: { flex: 1, gap: Spacing.one },
  soundCue: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  caption: { textAlign: 'center', paddingHorizontal: Spacing.four },
  sessionProgressTrack: { alignSelf: 'stretch', height: 9, borderRadius: 5, overflow: 'hidden' },
  sessionProgressFill: { height: '100%', borderRadius: 5 },
  rewardProgress: { alignSelf: 'stretch', gap: Spacing.two },
  rewardProgressCopy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  rewardProgressLabel: { fontFamily: Type.h2.fontFamily },
  rewardPips: { flexDirection: 'row', gap: Spacing.one },
  rewardPip: { flex: 1, height: 5, borderRadius: 3 },
  liveHeader: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  roCall: { fontFamily: Type.display.fontFamily, fontSize: 42, lineHeight: 48, letterSpacing: 2 },
  countdownBadge: { width: 132, minHeight: 64, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  countdownLabel: { ...Type.caption, fontSize: 10, lineHeight: 13, color: '#7A8799', letterSpacing: 0.8 },
  countdownValue: { fontFamily: Type.h1.fontFamily, fontSize: 24, lineHeight: 29, fontVariant: ['tabular-nums'] },
  coachBubble: { alignSelf: 'stretch', minHeight: 56, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  coachText: { ...Type.body, fontFamily: Type.h2.fontFamily, textAlign: 'center' },
  drum: { marginVertical: -Spacing.three },
  liveStats: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'stretch' },
  liveStat: { flex: 1, alignItems: 'center', gap: Spacing.one },
  liveStatValue: { fontFamily: Type.h1.fontFamily, fontSize: 24, lineHeight: 29, fontVariant: ['tabular-nums'] },
  liveStatDivider: { width: StyleSheet.hairlineWidth },
  skol: { fontFamily: Type.display.fontFamily, fontSize: 48, lineHeight: 56, letterSpacing: 2 },
  doneFooter: { alignSelf: 'stretch' },
});
