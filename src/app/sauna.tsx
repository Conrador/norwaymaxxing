import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { HealthSafetyNotice } from '@/components/health-safety-notice';
import { ModuleCard } from '@/components/module-card';
import { ScreenBackground } from '@/components/screen-background';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { isSaunaProtocolPremium } from '@/features/premium/access';
import { usePremium } from '@/hooks/use-premium';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { useProgress } from '@/stores/progress';

const PROTOCOLS = [
  {
    id: 'beginner',
    titleKey: 'sauna.protocols.beginner.title',
    subtitleKey: 'sauna.protocols.beginner.subtitle',
    rounds: '1-2',
    heatKey: 'sauna.ranges.beginnerHeat',
    coolKey: 'sauna.ranges.comfortCool',
    restKey: 'sauna.ranges.fullRecovery',
    creditedMinutes: 8,
  },
  {
    id: 'classic',
    titleKey: 'sauna.protocols.classic.title',
    subtitleKey: 'sauna.protocols.classic.subtitle',
    rounds: '2-3',
    heatKey: 'sauna.ranges.traditionalHeat',
    coolKey: 'sauna.ranges.comfortCool',
    restKey: 'sauna.ranges.fullRecovery',
    creditedMinutes: 20,
  },
  {
    id: 'contrast',
    titleKey: 'sauna.protocols.contrast.title',
    subtitleKey: 'sauna.protocols.contrast.subtitle',
    rounds: '1-2',
    heatKey: 'sauna.ranges.optionalContrastHeat',
    coolKey: 'sauna.ranges.optionalCoolShower',
    restKey: 'sauna.ranges.fullRecovery',
    creditedMinutes: 16,
  },
] as const;

export default function SaunaScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; taskIds?: string }>();
  const theme = useTheme();
  const themeName = useThemeName();
  const { isPremium, loading } = usePremium();
  const addXp = useProgress((s) => s.addXp);
  const completeTask = useProgress((s) => s.completeTask);
  const [selected, setSelected] = useState<(typeof PROTOCOLS)[number]['id']>('beginner');
  const [logged, setLogged] = useState(false);
  const protocol = PROTOCOLS.find((item) => item.id === selected) ?? PROTOCOLS[0];
  const protocolTaskIds = params.taskIds?.split(',').filter(Boolean) ?? [];

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <BackButton label={t('common.back')} onPress={() => router.back()} />

          <ModuleCard
            module="sauna"
            title={t('sauna.title')}
            subtitle={t('sauna.subtitle')}
            meta={t('common.xp', { count: 30 })}
          />

          <HealthSafetyNotice text={t('sauna.safetyNotice')} module="sauna" />

          <SectionHeader title={t('sauna.chooseProtocol')} />
          <View style={styles.protocols}>
            {PROTOCOLS.map((item) => {
              const active = selected === item.id;
              const locked = !loading && !isPremium && isSaunaProtocolPremium(item.id);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={locked ? `${t(item.titleKey)}. ${t('common.premium')}` : t(item.titleKey)}
                  onPress={() => {
                    if (locked) {
                      router.push('/paywall');
                      return;
                    }
                    setSelected(item.id);
                  }}
                  style={[
                    styles.protocol,
                    locked && styles.lockedProtocol,
                    {
                      backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface,
                      borderColor: active ? theme.ember : theme.border,
                    },
                  ]}>
                  <View style={styles.protocolText}>
                    <ThemedText style={Type.body}>{t(item.titleKey)}</ThemedText>
                    <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                      {t(item.subtitleKey)}
                    </ThemedText>
                  </View>
                  {locked ? (
                    <View style={[styles.lockBadge, { backgroundColor: `${theme.gold}18` }]}>
                      <SymbolView name="lock.fill" size={13} tintColor={theme.gold} />
                    </View>
                  ) : (
                    <ThemedText style={[Type.h2, { color: active ? theme.ember : theme.textSecondary }]}>
                      {item.rounds}x
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </View>

          <SectionHeader title={t('sauna.sessionMap')} meta={t('sauna.roundsRange', { range: protocol.rounds })} />
          <View style={styles.phaseRow}>
            <View style={[styles.phase, { backgroundColor: `${theme.ember}22` }]}>
              <ThemedText style={[Type.caption, { color: theme.ember }]}>{t('sauna.phaseHeat')}</ThemedText>
              <ThemedText style={Type.h2}>{t(protocol.heatKey)}</ThemedText>
            </View>
            <View style={[styles.phase, { backgroundColor: `${theme.frost}22` }]}>
              <ThemedText style={[Type.caption, { color: theme.frost }]}>{t('sauna.phaseCool')}</ThemedText>
              <ThemedText style={Type.h2}>{t(protocol.coolKey)}</ThemedText>
            </View>
            <View style={[styles.phase, { backgroundColor: `${theme.aurora}22` }]}>
              <ThemedText style={[Type.caption, { color: theme.aurora }]}>{t('sauna.phaseRest')}</ThemedText>
              <ThemedText style={Type.h2}>{t(protocol.restKey)}</ThemedText>
            </View>
          </View>

          <View style={[styles.guideCard, { backgroundColor: theme.surface }]}>
            <SectionHeader title={t('sauna.guideTitle')} />
            {['heat', 'cool', 'rest', 'repeat'].map((key) => (
              <View key={key} style={styles.guideRow}>
                <View style={[styles.guideDot, { backgroundColor: theme.ember }]} />
                <ThemedText style={[Type.body, { color: theme.textSecondary }]}>
                  {t(`sauna.guide.${key}`)}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={[styles.logCard, { backgroundColor: logged ? `${theme.aurora}18` : theme.surface }]}>
            <View style={[styles.logIcon, { backgroundColor: logged ? `${theme.aurora}24` : `${theme.ember}20` }]}>
              <ThemedText style={[Type.h2, { color: logged ? theme.aurora : theme.ember }]}>
                {logged ? '✓' : '+'}
              </ThemedText>
            </View>
            <View style={styles.logText}>
              <ThemedText style={Type.body}>{logged ? t('sauna.sessionLogged') : t('sauna.logSession')}</ThemedText>
              <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                {logged ? t('sauna.loggedMeta') : t('sauna.logExplanation')}
              </ThemedText>
            </View>
          </View>

          <UiButton
            label={logged ? t('sauna.sessionLogged') : t('sauna.logSession')}
            variant="prominent"
            tintColor={logged ? theme.aurora : theme.ember}
            onPress={() => {
              if (logged) return;
              if (params.date && protocolTaskIds.length > 0) {
                completeTask(
                  params.date,
                  {
                    id: 'sauna',
                    module: 'sauna',
                    titleKey: 'protocol.sauna',
                    metaKey: 'meta.minutes',
                    metaCount: protocol.creditedMinutes,
                    xp: 30,
                    minutes: protocol.creditedMinutes,
                    session: 'sauna',
                  },
                  protocolTaskIds,
                );
              } else {
                addXp(30, 'protocol.sauna');
              }
              setLogged(true);
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  protocols: {
    gap: Spacing.two,
  },
  protocol: {
    minHeight: 78,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  protocolText: {
    flex: 1,
    gap: 2,
  },
  lockedProtocol: {
    opacity: 0.58,
  },
  lockBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseRow: {
    gap: Spacing.two,
  },
  phase: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guideCard: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  guideDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 8,
  },
  logCard: {
    borderRadius: Radius.card,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logIcon: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logText: {
    flex: 1,
    gap: 2,
  },
});
