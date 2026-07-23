import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedAccordion } from '@/components/animated-accordion';
import { BackButton } from '@/components/back-button';
import { ScreenBackground } from '@/components/screen-background';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { HEALTH_SAFETY_URL, PRIVACY_POLICY_URL, TERMS_URL } from '@/config/legal';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { usePremium } from '@/hooks/use-premium';
import { LANGUAGES, type Language, type ThemeMode, useSettings } from '@/stores/settings';
import { useProfile } from '@/stores/profile';

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];
const THEME_SYMBOLS: Record<ThemeMode, SFSymbol> = {
  system: 'circle.lefthalf.filled',
  light: 'sun.max.fill',
  dark: 'moon.fill',
};

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  no: 'Norsk',
  pl: 'Polski',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  sv: 'Svenska',
  da: 'Dansk',
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const themeName = useThemeName();
  const themeMode = useSettings((s) => s.themeMode);
  const language = useSettings((s) => s.language);
  const setThemeMode = useSettings((s) => s.setThemeMode);
  const setLanguage = useSettings((s) => s.setLanguage);
  const resetProfile = useProfile((s) => s.reset);
  const { resetPremium } = usePremium();
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageLabel = language ? LANGUAGE_LABELS[language] : t('settings.device');

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <BackButton label={t('common.back')} onPress={() => router.back()} />

          <ThemedText style={Type.display}>{t('you.settings')}</ThemedText>

          <SectionHeader title={t('you.theme')} meta={t('settings.themeMeta')} />
          <View style={[styles.selectorCard, { backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface }]}>
            {THEME_MODES.map((mode) => (
              <ThemeModeRow
                key={mode}
                mode={mode}
                selected={themeMode === mode}
                highlight={themeName === 'dark' ? `${theme.frost}1F` : `${theme.frost}10`}
                onPress={() => setThemeMode(mode)}
              />
            ))}
          </View>

          <SectionHeader title={t('you.language')} meta={languageLabel} />
          <View style={[styles.selectorCard, { backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface }]}>
            <Pressable
              onPress={() => setLanguageOpen((value) => !value)}
              style={styles.accordionHeader}>
              <View style={[styles.languageCode, { backgroundColor: language === null ? theme.frost : theme.surfaceHigh }]}>
                <ThemedText style={[Type.caption, { color: language === null ? '#FFFFFF' : theme.textSecondary }]}>
                  {language ? language.toUpperCase() : 'Aa'}
                </ThemedText>
              </View>
              <View style={styles.optionText}>
                <ThemedText style={Type.body}>{languageLabel}</ThemedText>
                <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                  {languageOpen ? t('settings.languageOpen') : t('settings.languageClosed')}
                </ThemedText>
              </View>
              <Chevron open={languageOpen} color={theme.textSecondary} />
            </Pressable>
            <AnimatedAccordion open={languageOpen} maxHeight={850}>
              <View style={styles.accordionBody}>
                <Pressable
                  onPress={() => {
                    setLanguage(null);
                    setLanguageOpen(false);
                  }}
                  style={[
                    styles.optionRow,
                    language === null && { backgroundColor: themeName === 'dark' ? `${theme.frost}1F` : `${theme.frost}10` },
                  ]}>
                  <View style={[styles.languageCode, { backgroundColor: theme.surfaceHigh }]}>
                    <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>Aa</ThemedText>
                  </View>
                  <View style={styles.optionText}>
                    <ThemedText style={Type.body}>{t('settings.device')}</ThemedText>
                    <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                      {t('settings.followDevice')}
                    </ThemedText>
                  </View>
                  {language === null ? <Check color={theme.frost} /> : null}
                </Pressable>
                {LANGUAGES.map((item: Language) => {
                  const selected = language === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setLanguage(item);
                        setLanguageOpen(false);
                      }}
                      style={[
                        styles.optionRow,
                        selected && { backgroundColor: themeName === 'dark' ? `${theme.frost}1F` : `${theme.frost}10` },
                      ]}>
                      <View style={[styles.languageCode, { backgroundColor: selected ? theme.frost : theme.surfaceHigh }]}>
                        <ThemedText style={[Type.caption, { color: selected ? '#FFFFFF' : theme.textSecondary }]}>
                          {item.toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={styles.optionText}>
                        <ThemedText style={Type.body}>{LANGUAGE_LABELS[item]}</ThemedText>
                      </View>
                      {selected ? <Check color={theme.frost} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </AnimatedAccordion>
          </View>

          <SectionHeader title={t('settings.legal')} meta={t('settings.legalMeta')} />
          <View
            style={[
              styles.selectorCard,
              { backgroundColor: themeName === 'dark' ? `${theme.surface}E6` : theme.surface },
            ]}>
            <LegalRow
              symbol="hand.raised.fill"
              title={t('settings.privacyPolicy')}
              description={t('settings.privacyPolicyMeta')}
              url={PRIVACY_POLICY_URL}
            />
            <LegalRow
              symbol="doc.text.fill"
              title={t('settings.termsConditions')}
              description={t('settings.termsConditionsMeta')}
              url={TERMS_URL}
            />
            <LegalRow
              symbol="cross.case.fill"
              title={t('settings.healthSafety')}
              description={t('settings.healthSafetyMeta')}
              url={HEALTH_SAFETY_URL}
              emphasis
            />
            <LegalRow
              symbol="text.book.closed.fill"
              title={t('sources.title')}
              description={t('sources.settingsMeta')}
              onPress={() => router.push('/sources')}
            />
          </View>

          {__DEV__ && (
            <>
              <SectionHeader title={t('settings.developer')} />
              <Pressable
                onPress={() => {
                  resetPremium();
                  resetProfile();
                }}
                style={({ pressed }) => [
                  styles.card,
                  styles.switchCard,
                  { backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 },
                ]}>
                <View style={styles.switchText}>
                  <ThemedText style={[Type.body, { color: theme.blood }]}>
                    {t('settings.resetOnboarding')}
                  </ThemedText>
                  <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                    {t('settings.resetOnboardingMeta')}
                  </ThemedText>
                </View>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function LegalRow({
  symbol,
  title,
  description,
  url,
  onPress,
  emphasis = false,
}: {
  symbol: SFSymbol;
  title: string;
  description: string;
  /** External link opened in the browser. Omit when using `onPress`. */
  url?: string;
  /** In-app navigation instead of an external link. */
  onPress?: () => void;
  emphasis?: boolean;
}) {
  const theme = useTheme();
  const isInternal = Boolean(onPress);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}. ${description}`}
      onPress={() => {
        if (onPress) {
          onPress();
        } else if (url) {
          void Linking.openURL(url);
        }
      }}
      style={({ pressed }) => [
        styles.legalRow,
        {
          backgroundColor: emphasis ? `${theme.blood}0D` : 'transparent',
          opacity: pressed ? 0.65 : 1,
        },
      ]}>
      <View
        style={[
          styles.optionIcon,
          { backgroundColor: emphasis ? `${theme.blood}1A` : theme.surfaceHigh },
        ]}>
        <SymbolView
          name={symbol}
          size={18}
          tintColor={emphasis ? theme.blood : theme.frost}
        />
      </View>
      <View style={styles.optionText}>
        <ThemedText style={Type.body}>{title}</ThemedText>
        <ThemedText style={[Type.caption, styles.optionDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
      <SymbolView
        name={isInternal ? 'chevron.right' : 'arrow.up.right'}
        size={15}
        tintColor={theme.textSecondary}
      />
    </Pressable>
  );
}

function Check({ color }: { color: string }) {
  if (Platform.OS !== 'ios') {
    return <ThemedText style={[Type.h2, { color }]}>✓</ThemedText>;
  }
  return <SymbolView name="checkmark.circle.fill" size={22} tintColor={color} />;
}

/**
 * Wiersz wyboru motywu z płynną animacją stanu aktywnego: tło i kółko ikony
 * interpolują kolor, check wchodzi springiem. Wysokość rośnie z tekstem —
 * opis nigdy się nie klipuje.
 */
function ThemeModeRow({
  mode,
  selected,
  highlight,
  onPress,
}: {
  mode: ThemeMode;
  selected: boolean;
  highlight: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, selected]);

  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', highlight]),
  }));
  const iconStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.surfaceHigh, theme.frost]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: withSpring(selected ? 1 : 0.5, { damping: 14, stiffness: 220 }) }],
  }));

  return (
    <AnimatedPressable onPress={onPress} style={[styles.optionRow, rowStyle]}>
      <Animated.View style={[styles.optionIcon, iconStyle]}>
        {Platform.OS === 'ios' ? (
          <SymbolView
            name={THEME_SYMBOLS[mode]}
            size={18}
            tintColor={selected ? '#FFFFFF' : theme.textSecondary}
          />
        ) : null}
      </Animated.View>
      <View style={styles.optionText}>
        <ThemedText style={Type.body}>
          {t(`you.theme${mode[0].toUpperCase()}${mode.slice(1)}`)}
        </ThemedText>
        <ThemedText style={[Type.caption, styles.optionDescription, { color: theme.textSecondary }]}>
          {t(`settings.themeDescriptions.${mode}`)}
        </ThemedText>
      </View>
      <Animated.View style={checkStyle}>
        <Check color={theme.frost} />
      </Animated.View>
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Chevron({ open, color }: { open: boolean; color: string }) {
  const rotation = useSharedValue(open ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(open ? 180 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  if (Platform.OS !== 'ios') {
    return (
      <Animated.View style={chevronStyle}>
        <ThemedText style={[Type.h2, { color }]}>⌄</ThemedText>
      </Animated.View>
    );
  }
  return (
    <Animated.View style={chevronStyle}>
      <SymbolView name="chevron.down" size={16} tintColor={color} />
    </Animated.View>
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
  card: {
    borderRadius: Radius.card,
    padding: Spacing.three,
  },
  selectorCard: {
    borderRadius: Radius.card,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  accordionHeader: {
    minHeight: 66,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  optionRow: {
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  legalRow: {
    minHeight: 72,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  optionDescription: {
    flexShrink: 1,
  },
  accordionBody: {
    gap: Spacing.one,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.one,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  languageCode: {
    width: 42,
    height: 34,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
});
