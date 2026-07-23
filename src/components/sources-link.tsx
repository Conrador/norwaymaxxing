import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Type } from '@/constants/theme';
import type { SourceGroup } from '@/features/content/sources';
import { useTheme } from '@/hooks/use-theme';

/**
 * Easy-to-find link to the in-app Sources screen, shown next to the disclaimer
 * on every health/diet screen so citations are one tap from the guidance they
 * back (App Store guideline 1.4.1).
 */
export function SourcesLink({
  module,
  align = 'start',
}: {
  module?: SourceGroup['module'];
  align?: 'start' | 'center';
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() =>
        router.push(
          module ? { pathname: '/sources', params: { module } } : '/sources',
        )
      }
      style={[styles.link, align === 'center' && styles.centered]}
      hitSlop={8}
    >
      <SymbolView
        name="text.book.closed"
        size={14}
        tintColor={theme.frost}
      />
      <ThemedText style={[Type.caption, { color: theme.frost }]}>
        {t('sources.link')}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
  },
  centered: {
    alignSelf: 'center',
  },
});
