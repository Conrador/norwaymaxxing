import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ModuleCard } from '@/components/module-card';
import { ScreenBackground } from '@/components/screen-background';
import { StatsCard } from '@/components/stats-card';
import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { CardGap, Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { challengeById, dailyNatureChallenges } from '@/features/content/challenges';
import { isNatureChallengePremium } from '@/features/premium/access';
import { usePremium } from '@/hooks/use-premium';
import { useTheme } from '@/hooks/use-theme';
import { dateKey } from '@/lib/dates';
import { useProgress } from '@/stores/progress';

const EMPTY_IDS: string[] = [];

export default function ChallengeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = challengeById(id);
  const todayKey = dateKey();
  const todayIds = dailyNatureChallenges().map((item) => item.id);
  const availableToday = todayIds.includes(id ?? '');
  const { isPremium, loading } = usePremium();
  const locked = !loading && !isPremium && isNatureChallengePremium(id) && !availableToday;
  const done = useProgress((s) => (s.natureDailyDone?.[todayKey] ?? EMPTY_IDS).includes(id ?? ''));
  const completeNatureChallenge = useProgress((s) => s.completeNatureChallenge);

  if (!challenge) {
    return (
      <ScreenBackground>
        <SafeAreaView style={[styles.safeArea, styles.notFound]}>
          <ThemedText style={Type.h1}>{t('challenge.notFound')}</ThemedText>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <BackButton label={t('common.back')} onPress={() => router.back()} />
          <ModuleCard
            module={challenge.module}
            title={t(challenge.titleKey)}
            subtitle={t(challenge.subtitleKey)}
            meta={
              locked
                ? t('common.premium')
                : done
                  ? t('common.done')
                  : availableToday
                    ? t('common.xp', { count: challenge.xp })
                    : t('nature.libraryOnly')
            }
            progress={done ? 1 : 0}
            locked={locked}
            lockedLabel={t('common.premium')}
          />
          <View style={styles.statsRow}>
            <StatsCard label={t('challenge.minutes')} value={`${challenge.minutes}`} accent={theme.frost} />
            <StatsCard label={t('challenge.reward')} value={`${challenge.xp}`} accent={theme.aurora} />
          </View>
          <View style={[styles.detail, { backgroundColor: theme.surface }]}>
            <ThemedText style={Type.h2}>{t('challenge.protocol')}</ThemedText>
            <ThemedText style={[Type.body, { color: theme.textSecondary }]}>
              {t(challenge.detailKey)}
            </ThemedText>
          </View>
          {!availableToday ? (
            <View style={[styles.detail, { backgroundColor: `${theme.frost}16` }]}>
              <ThemedText style={Type.h2}>{t('challenge.libraryTitle')}</ThemedText>
              <ThemedText style={[Type.body, { color: theme.textSecondary }]}>
                {t('challenge.libraryMeta')}
              </ThemedText>
            </View>
          ) : null}
          {locked ? (
            <UiButton
              label={t('common.premium')}
              variant="prominent"
              tintColor={theme.gold}
              onPress={() => router.push('/paywall')}
            />
          ) : availableToday ? (
            <UiButton
              label={done ? t('common.done') : t('challenge.complete')}
              variant="prominent"
              tintColor={theme.aurora}
              onPress={() => {
                if (!done) {
                  completeNatureChallenge(todayKey, challenge);
                }
                router.back();
              }}
            />
          ) : (
            <UiButton label={t('common.back')} onPress={() => router.back()} />
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    gap: Spacing.four,
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  notFound: {
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: CardGap,
  },
  detail: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
