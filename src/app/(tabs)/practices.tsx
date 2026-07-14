import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearProgress } from '@/components/linear-progress';
import { ModuleCard } from '@/components/module-card';
import { ScreenBackground } from '@/components/screen-background';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, CardGap, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { COLD_PLAN_DAYS } from '@/features/cold/plan';
import { usePremium } from '@/hooks/use-premium';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { useProgress } from '@/stores/progress';

export default function PracticesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const router = useRouter();
  const { isPremium, loading } = usePremium();
  const cold30Day = useProgress((s) => s.cold30Day);
  const roSessionsCompleted = useProgress((s) => s.roSessionsCompleted);
  const musicSessionsCompleted = useProgress((s) => s.musicSessionsCompleted ?? 0);
  const roLocked = !loading && !isPremium;

  const heroGradient =
    themeName === 'dark'
      ? (['#1A3A5C', '#12263E', '#0E1A2E'] as const)
      : (['#C8E2F5', '#DEEDF9', '#EFF6FC'] as const);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText style={Type.display}>{t('practices.title')}</ThemedText>

          <Pressable
            onPress={() => router.push('/cold')}
            style={({ pressed }) => [styles.heroWrap, { opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={heroGradient} style={styles.hero}>
              <View style={styles.heroGlyph}>
                {Platform.OS === 'ios' ? (
                  <SymbolView name="snowflake" size={150} tintColor={theme.frost} style={styles.heroGlyphOpacity} />
                ) : (
                  <Text style={styles.heroEmoji}>❄️</Text>
                )}
              </View>
              <View style={[styles.heroChip, { backgroundColor: `${theme.frost}26` }]}>
                <ThemedText style={[Type.caption, { color: theme.frost }]}>
                  {t('practices.coldSubtitle', { count: cold30Day })}
                </ThemedText>
              </View>
              <View style={styles.heroBottom}>
                <ThemedText style={Type.h1}>{t('practices.cold')}</ThemedText>
                <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                  {t('cold.planSubtitle')}
                </ThemedText>
                <View style={styles.heroProgress}>
                  <LinearProgress value={(cold30Day - 1) / COLD_PLAN_DAYS} color={theme.frost} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          <SectionHeader title={t('practices.library')} meta={t('practices.libraryMeta')} />

          <View style={styles.grid}>
            <ModuleCard
              compact
              module="sauna"
              href="/sauna"
              title={t('practices.sauna')}
              subtitle={t('practices.saunaSubtitle')}
              meta="3"
            />
            <ModuleCard
              compact
              module="breath"
              href="/breath"
              title={t('practices.breath')}
              subtitle={t('practices.breathSubtitle')}
              meta="4 min"
            />
            <ModuleCard
              compact
              module="nature"
              href="/nature"
              title={t('nature.title')}
              subtitle={t('nature.subtitle')}
              meta="8"
            />
            <ModuleCard
              compact
              module="diet"
              href="/diet"
              title={t('practices.diet')}
              subtitle={t('practices.dietSubtitle')}
              meta={t('diet.planMeta')}
            />
            <ModuleCard
              compact
              module="ro"
              title={t('ro.taskTitle')}
              subtitle={t('practices.roSubtitle')}
              meta={roSessionsCompleted > 0 ? String(roSessionsCompleted) : t('practices.roNew')}
              locked={roLocked}
              lockedLabel={t('common.premium')}
              onPress={() => router.push(roLocked ? '/paywall' : '/ro-session')}
            />
            <ModuleCard
              compact
              module="music"
              title={t('music.taskTitle')}
              subtitle={t('practices.musicSubtitle')}
              meta={musicSessionsCompleted > 0 ? String(musicSessionsCompleted) : t('practices.musicNew')}
              onPress={() => router.push('/kygo-jo')}
            />
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  heroWrap: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  hero: {
    minHeight: 172,
    padding: Spacing.four,
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  heroGlyph: {
    position: 'absolute',
    right: -18,
    bottom: -22,
  },
  heroGlyphOpacity: {
    opacity: 0.18,
  },
  heroEmoji: {
    fontSize: 110,
    opacity: 0.14,
  },
  heroChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one + 2,
    borderRadius: 999,
  },
  heroBottom: {
    gap: Spacing.one,
  },
  heroProgress: {
    marginTop: Spacing.two,
    width: '70%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CardGap,
  },
});
