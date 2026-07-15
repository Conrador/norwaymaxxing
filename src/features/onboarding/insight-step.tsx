import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { VikingDrumArt } from '@/components/viking-drum-art';
import { ScreenPadding, Spacing, Type } from '@/constants/theme';
import { useTheme, useThemeName } from '@/hooks/use-theme';

export type InsightKind =
  | 'benefits'
  | 'sauna'
  | 'evidence'
  | 'nature'
  | 'diet'
  | 'community'
  | 'ro';

type Props = {
  kind: InsightKind;
  onBack: () => void;
  onContinue: () => void;
};

const PILLARS: { key: string; symbol: SFSymbol; color: 'frost' | 'ember' | 'aurora' | 'gold' }[] = [
  { key: 'cold', symbol: 'snowflake', color: 'frost' },
  { key: 'heat', symbol: 'flame.fill', color: 'ember' },
  { key: 'outside', symbol: 'tree.fill', color: 'aurora' },
  { key: 'food', symbol: 'fork.knife', color: 'gold' },
];

function stageColor(kind: InsightKind, dark: boolean) {
  const light = {
    benefits: '#E5F2FC',
    sauna: '#F9E7CA',
    evidence: '#E6F4ED',
    nature: '#DDF2D0',
    diet: '#F6EDCF',
    community: '#EAE5F6',
    ro: '#111A31',
  } as const;
  const night = {
    benefits: '#112B42',
    sauna: '#382713',
    evidence: '#143126',
    nature: '#173825',
    diet: '#352F1C',
    community: '#29243B',
    ro: '#070C1D',
  } as const;
  return (dark ? night : light)[kind];
}

function BenefitsVisual() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const positions = [styles.orbitItem0, styles.orbitItem1, styles.orbitItem2, styles.orbitItem3];

  return (
    <View style={styles.orbit}>
      <View style={[styles.orbitRing, { borderColor: `${theme.frost}42` }]} />
      <View style={[styles.orbitCore, { backgroundColor: theme.frost }]}>
        <ThemedText style={styles.orbitNumber}>4</ThemedText>
      </View>
      {PILLARS.map((item, index) => {
        const color = theme[item.color];
        return (
          <Animated.View
            key={item.key}
            entering={reducedMotion ? undefined : FadeIn.duration(280).delay(index * 65)}
            style={[styles.orbitItem, positions[index]]}>
            <SymbolView name={item.symbol} size={26} tintColor={color} />
            <ThemedText style={[Type.caption, styles.visualLabel]}>
              {t(`onboarding.insight.benefits.items.${item.key}`)}
            </ThemedText>
          </Animated.View>
        );
      })}
    </View>
  );
}

function SaunaVisual() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const phases = [
    { key: 'heat', symbol: 'flame.fill' as SFSymbol, color: theme.ember },
    { key: 'cool', symbol: 'drop.fill' as SFSymbol, color: theme.frost },
    { key: 'rest', symbol: 'bed.double.fill' as SFSymbol, color: theme.aurora },
  ];

  return (
    <View style={styles.saunaVisual}>
      <SymbolView name="flame.fill" size={168} tintColor={theme.ember} style={styles.heroGlyph} />
      <View style={styles.timeline}>
        <View style={[styles.timelineLine, { backgroundColor: `${theme.textPrimary}22` }]} />
        {phases.map((phase, index) => (
          <Animated.View
            key={phase.key}
            entering={reducedMotion ? undefined : FadeInDown.duration(280).delay(index * 75)}
            style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: phase.color }]}>
              <SymbolView name={phase.symbol} size={18} tintColor="#FFFFFF" />
            </View>
            <ThemedText style={[Type.caption, styles.timelineLabel]} numberOfLines={3}>
              {t(`onboarding.insight.sauna.items.${phase.key}`)}
            </ThemedText>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function EvidenceVisual() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const sources = ['guidance', 'research', 'safety'];

  return (
    <View style={styles.evidenceVisual}>
      <SymbolView name="checkmark.seal.fill" size={82} tintColor={theme.aurora} />
      <View style={styles.evidenceList}>
        {sources.map((source, index) => (
          <Animated.View
            key={source}
            entering={reducedMotion ? undefined : FadeInUp.duration(280).delay(index * 65)}
            style={styles.evidenceRow}>
            <SymbolView name="checkmark" size={14} tintColor={theme.aurora} />
            <ThemedText style={[Type.caption, styles.evidenceText]}>
              {t(`onboarding.insight.evidence.items.${source}`)}
            </ThemedText>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function NatureVisual() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const items = [
    { key: 'nearby', symbol: 'location.fill' as SFSymbol },
    { key: 'weather', symbol: 'cloud.sun.fill' as SFSymbol },
    { key: 'care', symbol: 'leaf.fill' as SFSymbol },
  ];

  return (
    <View style={styles.natureVisual}>
      <SymbolView name="tree.fill" size={210} tintColor={theme.aurora} style={styles.natureTree} />
      <View style={styles.natureList}>
        {items.map((item, index) => (
          <Animated.View
            key={item.key}
            entering={reducedMotion ? undefined : FadeInDown.duration(280).delay(index * 70)}
            style={styles.natureLine}>
            <SymbolView name={item.symbol} size={17} tintColor={theme.aurora} />
            <ThemedText style={[Type.caption, styles.natureText]}>
              {t(`onboarding.insight.nature.items.${item.key}`)}
            </ThemedText>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function DietVisual() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const rows = [
    { key: 'plants', color: theme.aurora },
    { key: 'grains', color: theme.gold },
    { key: 'protein', color: theme.frost },
  ];

  return (
    <View style={styles.dietVisual}>
      <View style={[styles.plate, { borderColor: `${theme.textPrimary}18` }]}>
        <View style={[styles.plateHalf, { backgroundColor: `${theme.aurora}70` }]} />
        <View style={[styles.plateQuarterTop, { backgroundColor: `${theme.gold}75` }]} />
        <View style={[styles.plateQuarterBottom, { backgroundColor: `${theme.frost}68` }]} />
        <SymbolView name="fork.knife" size={34} tintColor={theme.textPrimary} />
      </View>
      <View style={styles.foodLegend}>
        {rows.map((row, index) => (
          <Animated.View
            key={row.key}
            entering={reducedMotion ? undefined : FadeInUp.duration(280).delay(index * 65)}
            style={styles.foodLegendRow}>
            <View style={[styles.legendDot, { backgroundColor: row.color }]} />
            <ThemedText style={[Type.caption, styles.foodLegendText]}>
              {t(`onboarding.insight.diet.items.${row.key}`)}
            </ThemedText>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function CommunityVisual() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const done = [true, true, false, true, false, false, false];

  return (
    <View style={styles.communityVisual}>
      <SymbolView name="person.3.fill" size={72} tintColor={theme.frost} />
      <View style={styles.weekDays}>
        {done.map((complete, index) => (
          <View key={index} style={styles.dayColumn}>
            <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
              {t(`onboarding.insight.community.days.${index}`)}
            </ThemedText>
            <View style={[styles.dayDot, { backgroundColor: complete ? theme.aurora : `${theme.textPrimary}16` }]}>
              {complete && <SymbolView name="checkmark" size={11} tintColor="#FFFFFF" />}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.communityList}>
        {(['different', 'daily', 'visible'] as const).map((key, index) => (
          <Animated.View
            key={key}
            entering={reducedMotion ? undefined : FadeInUp.duration(280).delay(index * 65)}
            style={styles.communityRow}>
            <View style={[styles.communityMarker, { backgroundColor: theme.frost }]} />
            <ThemedText style={[Type.caption, styles.communityText]}>
              {t(`onboarding.insight.community.items.${key}`)}
            </ThemedText>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function RoVisual() {
  const { t } = useTranslation();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <View style={styles.roVisual}>
      <Animated.View entering={reducedMotion ? undefined : FadeInUp.duration(380)}>
        <VikingDrumArt size={206} runeColor={theme.blood} />
      </Animated.View>
      <View style={[styles.soundCue, { backgroundColor: `${theme.frost}20` }]}>
        <SymbolView name="speaker.wave.2.fill" size={17} tintColor={theme.frost} />
        <ThemedText style={[Type.caption, styles.bold, { color: theme.frost }]}>
          {t('onboarding.insight.ro.sound')}
        </ThemedText>
      </View>
    </View>
  );
}

function InsightVisual({ kind }: { kind: InsightKind }) {
  if (kind === 'benefits') return <BenefitsVisual />;
  if (kind === 'sauna') return <SaunaVisual />;
  if (kind === 'evidence') return <EvidenceVisual />;
  if (kind === 'nature') return <NatureVisual />;
  if (kind === 'diet') return <DietVisual />;
  if (kind === 'community') return <CommunityVisual />;
  return <RoVisual />;
}

export function InsightStep({ kind, onBack, onContinue }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const dark = themeName === 'dark';

  return (
    <View style={[styles.safe, { paddingTop: insets.top + Spacing.one, paddingBottom: insets.bottom + Spacing.three }]}>
      <View style={styles.topBar}>
        <BackButton label={t('common.back')} onPress={onBack} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(300)}
          style={[styles.stage, { backgroundColor: stageColor(kind, dark) }]}>
          <InsightVisual kind={kind} />
        </Animated.View>

        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(340)}
          style={styles.copy}>
          <ThemedText style={[Type.display, styles.title]}>
            {t(`onboarding.insight.${kind}.title`)}
          </ThemedText>
          <ThemedText style={[Type.body, styles.subtitle, { color: theme.textSecondary }]}>
            {t(`onboarding.insight.${kind}.body`)}
          </ThemedText>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <UiButton
          label={kind === 'ro' ? t('onboarding.insight.ro.cta') : t('common.continue')}
          variant="prominent"
          tintColor={kind === 'ro' ? theme.blood : theme.frost}
          fullWidth
          onPress={onContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { minHeight: 44, paddingHorizontal: ScreenPadding },
  scroll: { flex: 1 },
  body: { flexGrow: 1, justifyContent: 'center', paddingBottom: Spacing.four },
  stage: { minHeight: 316, overflow: 'hidden', justifyContent: 'center' },
  copy: { gap: Spacing.two, paddingHorizontal: ScreenPadding, paddingTop: Spacing.four },
  title: { maxWidth: 360 },
  subtitle: { maxWidth: 370 },
  footer: { paddingHorizontal: ScreenPadding },
  bold: { fontFamily: Type.h2.fontFamily },
  visualLabel: { fontFamily: Type.h2.fontFamily, textAlign: 'center', maxWidth: 100 },
  orbit: { height: 316, alignItems: 'center', justifyContent: 'center' },
  orbitRing: { width: 180, height: 180, borderRadius: 90, borderWidth: 1.5 },
  orbitCore: { position: 'absolute', width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  orbitNumber: { fontFamily: Type.display.fontFamily, fontSize: 42, lineHeight: 46, color: '#FFFFFF' },
  orbitItem: { position: 'absolute', alignItems: 'center', gap: Spacing.one },
  orbitItem0: { left: ScreenPadding + 10, top: 46 },
  orbitItem1: { right: ScreenPadding + 10, top: 46 },
  orbitItem2: { left: ScreenPadding + 10, bottom: 40 },
  orbitItem3: { right: ScreenPadding + 10, bottom: 40 },
  saunaVisual: { height: 316, justifyContent: 'flex-end', paddingHorizontal: ScreenPadding, paddingBottom: Spacing.four },
  heroGlyph: { position: 'absolute', alignSelf: 'center', top: 10, opacity: 0.24 },
  timeline: { flexDirection: 'row', position: 'relative' },
  timelineLine: { position: 'absolute', height: 2, left: '16%', right: '16%', top: 22 },
  timelineStep: { flex: 1, alignItems: 'center', gap: Spacing.two },
  timelineDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  timelineLabel: { textAlign: 'center', fontFamily: Type.h2.fontFamily, paddingHorizontal: Spacing.one },
  evidenceVisual: { minHeight: 316, alignItems: 'center', justifyContent: 'center', gap: Spacing.four, paddingHorizontal: ScreenPadding + Spacing.two },
  evidenceList: { alignSelf: 'stretch', gap: Spacing.three },
  evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  evidenceText: { flex: 1, fontFamily: Type.h2.fontFamily },
  natureVisual: { minHeight: 316, justifyContent: 'flex-end', paddingHorizontal: ScreenPadding, paddingBottom: Spacing.four },
  natureTree: { position: 'absolute', right: -20, top: -18, opacity: 0.36 },
  natureList: { gap: Spacing.three },
  natureLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, maxWidth: 310 },
  natureText: { flex: 1, fontFamily: Type.h2.fontFamily },
  dietVisual: { minHeight: 316, flexDirection: 'row', alignItems: 'center', gap: Spacing.four, paddingHorizontal: ScreenPadding },
  plate: { width: 142, height: 142, borderRadius: 71, borderWidth: 9, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  plateHalf: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' },
  plateQuarterTop: { position: 'absolute', right: 0, top: 0, width: '50%', height: '50%' },
  plateQuarterBottom: { position: 'absolute', right: 0, bottom: 0, width: '50%', height: '50%' },
  foodLegend: { flex: 1, gap: Spacing.four },
  foodLegendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  foodLegendText: { flex: 1, fontFamily: Type.h2.fontFamily },
  communityVisual: { minHeight: 316, alignItems: 'center', justifyContent: 'center', gap: Spacing.four, paddingHorizontal: ScreenPadding },
  weekDays: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between' },
  dayColumn: { alignItems: 'center', gap: Spacing.one },
  dayDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  communityList: { alignSelf: 'stretch', gap: Spacing.two },
  communityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  communityMarker: { width: 6, height: 6, borderRadius: 3 },
  communityText: { flex: 1, fontFamily: Type.h2.fontFamily },
  roVisual: { minHeight: 316, alignItems: 'center', justifyContent: 'center' },
  soundCue: { position: 'absolute', bottom: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
