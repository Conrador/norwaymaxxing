import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { HealthSafetyNotice } from '@/components/health-safety-notice';
import { LinearProgress } from '@/components/linear-progress';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { COLD_PLAN_DAYS, coldDurationSeconds, isColdDayPremium } from '@/features/cold/plan';
import { usePremium } from '@/hooks/use-premium';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { dateKey } from '@/lib/dates';
import { useProgress } from '@/stores/progress';

const CHIP_SIZE = 46;
const CONNECTOR_WIDTH = 18;
const DAY_ITEM_WIDTH = 56;

export default function ColdPlanScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const router = useRouter();
  const { isPremium, loading } = usePremium();

  const cold30Day = useProgress((s) => s.cold30Day);
  const completed = useProgress((s) => s.cold30Completed);
  const coldLastCompletedDate = useProgress((s) => s.coldLastCompletedDate);

  const days = Array.from({ length: COLD_PLAN_DAYS }, (_, i) => i + 1);
  const completedCount = completed.length;
  const currentDone = completed.includes(cold30Day);
  const currentLocked = !loading && !isPremium && isColdDayPremium(cold30Day) && !currentDone;
  const currentSeconds = coldDurationSeconds(cold30Day);
  const completedToday = coldLastCompletedDate === dateKey();
  const planProgress = Math.max(completedCount, cold30Day - 1) / COLD_PLAN_DAYS;
  const heroDisabled = completedToday;

  const startCurrentDay = () => {
    if (currentLocked) {
      router.push('/paywall');
      return;
    }
    if (heroDisabled) return;
    router.push({ pathname: '/cold-session', params: { day: String(cold30Day) } });
  };

  // Wycentruj aktualny dzień w journey na starcie
  const journeyOffset = Math.max(
    0,
    (cold30Day - 1) * (DAY_ITEM_WIDTH + CONNECTOR_WIDTH) - DAY_ITEM_WIDTH * 2,
  );

  const heroGradient =
    themeName === 'dark'
      ? (['#1A3A5C', '#12263E', '#0E1A2E'] as const)
      : (['#C8E2F5', '#DEEDF9', '#EFF6FC'] as const);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <BackButton label={t('common.back')} onPress={() => router.back()} />

          <View style={styles.titleBlock}>
            <ThemedText style={[Type.caption, { color: theme.frost, letterSpacing: 1.4 }]}>
              {t('cold.title').toUpperCase()}
            </ThemedText>
            <ThemedText style={Type.display}>{t('cold.planTitle')}</ThemedText>
            <ThemedText style={[Type.body, { color: theme.textSecondary }]}>
              {t('cold.planSubtitle')}
            </ThemedText>
          </View>

          <HealthSafetyNotice text={t('cold.safetyNotice')} module="cold" />

          {/* Hero dzisiejszego dnia — patern QUITTR: jedna akcja, jeden postęp */}
          <Pressable
            disabled={heroDisabled}
            onPress={startCurrentDay}
            style={({ pressed }) => [styles.heroWrap, { opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={heroGradient} style={styles.hero}>
              <View style={styles.heroGlyph}>
                {Platform.OS === 'ios' ? (
                  <SymbolView
                    name="snowflake"
                    size={150}
                    tintColor={theme.frost}
                    style={styles.heroGlyphOpacity}
                  />
                ) : (
                  <Text style={styles.heroGlyphEmoji}>❄️</Text>
                )}
              </View>

              <View style={styles.heroKickerRow}>
                <View style={[styles.heroChip, { backgroundColor: `${theme.frost}26` }]}>
                  <ThemedText style={[Type.caption, { color: theme.frost }]}>
                    {t('practices.coldSubtitle', { count: cold30Day })}
                  </ThemedText>
                </View>
                <View style={[styles.heroChip, { backgroundColor: `${theme.frost}26` }]}>
                  <ThemedText style={[Type.caption, { color: theme.frost }]}>
                    {t('meta.seconds', { count: currentSeconds })}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.heroBottom}>
                <ThemedText style={Type.h1}>
                  {t('cold.startToday', { count: cold30Day })}
                </ThemedText>
                <View style={styles.heroProgressRow}>
                  <View style={styles.heroProgressBar}>
                    <LinearProgress value={planProgress} color={theme.frost} />
                  </View>
                  <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                    {completedCount}/{COLD_PLAN_DAYS} · {t('cold.daysCompleted')}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[
                    Type.caption,
                    { color: currentLocked ? theme.gold : theme.frost, letterSpacing: 1 },
                  ]}>
                  {(currentLocked
                    ? t('cold.dayLocked')
                    : completedToday
                      ? t('cold.returnTomorrow')
                      : t('common.start')
                  ).toUpperCase()}
                </ThemedText>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Journey — dni jako połączona ścieżka (patern Headway) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: journeyOffset, y: 0 }}
            contentContainerStyle={styles.journey}>
            {days.map((day, index) => {
              const done = completed.includes(day);
              const isCurrent = day === cold30Day && !done;
              const locked = !loading && !isPremium && isColdDayPremium(day) && !done;
              const isLast = index === days.length - 1;

              return (
                <View key={day} style={styles.journeyItem}>
                  <View style={styles.journeyColumn}>
                    <Pressable
                      disabled={!locked}
                      accessibilityRole={locked ? 'button' : undefined}
                      accessibilityLabel={locked ? t('common.premium') : undefined}
                      onPress={() => router.push('/paywall')}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: done
                            ? theme.aurora
                            : isCurrent
                              ? `${theme.frost}1F`
                              : themeName === 'dark'
                                ? `${theme.surfaceHigh}CC`
                                : theme.surfaceHigh,
                          borderColor: isCurrent ? theme.frost : 'transparent',
                        },
                      ]}>
                      {done ? (
                        Platform.OS === 'ios' ? (
                          <SymbolView name="checkmark" size={15} tintColor="#FFFFFF" />
                        ) : (
                          <Text style={styles.chipCheck}>✓</Text>
                        )
                      ) : locked && Platform.OS === 'ios' ? (
                        <SymbolView name="lock.fill" size={13} tintColor={theme.gold} />
                      ) : (
                        <ThemedText
                          style={[
                            Type.body,
                            styles.chipNumber,
                            {
                              color: locked
                                ? theme.gold
                                : isCurrent
                                  ? theme.frost
                                  : theme.textSecondary,
                            },
                          ]}>
                          {day}
                        </ThemedText>
                      )}
                    </Pressable>
                    <ThemedText style={[styles.chipMeta, { color: theme.textSecondary }]}>
                      {t('meta.seconds', { count: coldDurationSeconds(day) })}
                    </ThemedText>
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.connector,
                        {
                          backgroundColor: done
                            ? theme.aurora
                            : themeName === 'dark'
                              ? `${theme.surfaceHigh}CC`
                              : theme.surfaceHigh,
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Zasady — typograficzna lista numerowana, bez ikon */}
          <View
            style={[
              styles.guideCard,
              { backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface },
            ]}>
            <ThemedText style={Type.h2}>{t('cold.guideTitle')}</ThemedText>
            {(['shower', 'breathe', 'solo', 'exit'] as const).map((key, index) => (
              <View key={key} style={styles.guideRow}>
                <ThemedText style={[styles.guideNumber, { color: theme.frost }]}>
                  {String(index + 1).padStart(2, '0')}
                </ThemedText>
                <ThemedText style={[Type.body, styles.guideText, { color: theme.textSecondary }]}>
                  {t(`cold.guide.${key}`)}
                </ThemedText>
              </View>
            ))}
          </View>
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
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  titleBlock: {
    gap: Spacing.two,
  },
  heroWrap: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  hero: {
    minHeight: 190,
    padding: Spacing.four,
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  heroGlyph: {
    position: 'absolute',
    right: -18,
    top: -16,
  },
  heroGlyphOpacity: {
    opacity: 0.18,
  },
  heroGlyphEmoji: {
    fontSize: 110,
    opacity: 0.15,
  },
  heroKickerRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  heroChip: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  heroBottom: {
    gap: Spacing.two + Spacing.one,
  },
  heroProgressRow: {
    gap: Spacing.two,
  },
  heroProgressBar: {
    width: '68%',
  },
  journey: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.one,
  },
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  journeyColumn: {
    width: DAY_ITEM_WIDTH,
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  dayChip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: CHIP_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipNumber: {
    fontFamily: Type.h2.fontFamily,
    fontVariant: ['tabular-nums'],
  },
  chipCheck: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  chipMeta: {
    ...Type.caption,
    fontSize: 10,
    lineHeight: 13,
  },
  connector: {
    width: CONNECTOR_WIDTH,
    height: 2,
    borderRadius: 1,
    marginTop: CHIP_SIZE / 2 - 1,
    marginHorizontal: -1,
  },
  guideCard: {
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  guideNumber: {
    ...Type.caption,
    fontFamily: Type.h2.fontFamily,
    letterSpacing: 1,
    lineHeight: 22,
  },
  guideText: {
    flex: 1,
  },
});
