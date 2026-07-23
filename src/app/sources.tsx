import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ScreenBackground } from '@/components/screen-background';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import {
  SOURCE_GROUPS,
  sourceGroupsForModule,
  type SourceEntry,
  type SourceGroup,
} from '@/features/content/sources';
import { useTheme } from '@/hooks/use-theme';

export default function SourcesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ module?: string }>();

  // When opened from a specific protocol screen, lead with that module's
  // references but still show the full list below, so the user always reaches
  // every citation from one place.
  const focused = params.module
    ? sourceGroupsForModule(params.module as SourceGroup['module'])
    : [];
  const rest = SOURCE_GROUPS.filter((group) => !focused.includes(group));
  const orderedGroups = [...focused, ...rest];

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <BackButton label={t('common.back')} onPress={() => router.back()} />

          <ThemedText style={[Type.h1, styles.title]}>
            {t('sources.title')}
          </ThemedText>
          <ThemedText style={[Type.body, { color: theme.textSecondary }]}>
            {t('sources.intro')}
          </ThemedText>

          {orderedGroups.map((group) => (
            <View key={group.module} style={styles.group}>
              <SectionHeader title={t(group.titleKey)} />
              {group.entries.map((entry) => (
                <SourceRow key={entry.url} entry={entry} />
              ))}
            </View>
          ))}

          <ThemedText
            style={[Type.caption, styles.footnote, { color: theme.textSecondary }]}
          >
            {t('sources.footnote')}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function SourceRow({ entry }: { entry: SourceEntry }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${entry.title}. ${entry.publisher}.`}
      onPress={() => void Linking.openURL(entry.url)}
      style={[styles.row, { borderColor: theme.border }]}
    >
      <View style={styles.rowBody}>
        <ThemedText style={[Type.body, { color: theme.text }]}>
          {entry.title}
        </ThemedText>
        <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
          {entry.publisher}
        </ThemedText>
      </View>
      <SymbolView
        name="arrow.up.right"
        size={16}
        tintColor={theme.textSecondary}
        style={styles.rowIcon}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  title: { marginTop: Spacing.two },
  group: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.control,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowBody: { flex: 1, gap: 2 },
  rowIcon: { flexShrink: 0 },
  footnote: { marginTop: Spacing.two },
});
