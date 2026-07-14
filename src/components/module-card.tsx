import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { LinearProgress } from '@/components/linear-progress';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { moduleColor, moduleSymbol, type ProtocolModule } from '@/features/protocol/protocol';
import { useTheme, useThemeName } from '@/hooks/use-theme';

const MODULE_EMOJI: Record<ProtocolModule, string> = {
  cold: '❄️',
  breath: '🌬️',
  sauna: '🔥',
  nature: '🌲',
  diet: '🥩',
  ro: '🥁',
  music: '🎵',
};

export function moduleSurface(module: ProtocolModule) {
  switch (module) {
    case 'cold':
    case 'breath':
      return '#D7ECFB';
    case 'sauna':
      return '#FBE1B8';
    case 'nature':
      return '#DDF6C7';
    case 'diet':
      return '#F7E6B7';
    case 'ro':
      return '#F9D7DC';
    case 'music':
      return '#E8DFF8';
  }
}

export function moduleDarkSurface(module: ProtocolModule) {
  switch (module) {
    case 'cold':
    case 'breath':
      return '#12344C';
    case 'sauna':
      return '#442B14';
    case 'nature':
      return '#173B28';
    case 'diet':
      return '#3C3119';
    case 'ro':
      return '#471820';
    case 'music':
      return '#302041';
  }
}

type Props = {
  module: ProtocolModule;
  title: string;
  subtitle: string;
  href?: string;
  progress?: number;
  meta?: string;
  compact?: boolean;
  locked?: boolean;
  lockedLabel?: string;
  onPress?: () => void;
};

export function ModuleCard({
  module,
  title,
  subtitle,
  href,
  progress,
  meta,
  compact = false,
  locked = false,
  lockedLabel = 'Premium',
  onPress,
}: Props) {
  const router = useRouter();
  const theme = useTheme();
  const themeName = useThemeName();
  const accent = moduleColor(module, theme);

  return (
    <Pressable
      onPress={() => {
        if (onPress) onPress();
        else if (href) router.push(href as never);
      }}
      accessibilityRole="button"
      accessibilityLabel={locked ? `${title}. ${lockedLabel}` : title}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        {
          backgroundColor: themeName === 'dark' ? moduleDarkSurface(module) : moduleSurface(module),
          opacity: pressed ? 0.82 : 1,
        },
        themeName === 'light' && styles.lightShadow,
      ]}>
      <View style={styles.bgGlyph}>
        {Platform.OS === 'ios' ? (
          <SymbolView name={moduleSymbol(module)} size={compact ? 82 : 132} tintColor={accent} style={styles.faded} />
        ) : (
          <Text style={[styles.bgEmoji, { fontSize: compact ? 62 : 96 }]}>{MODULE_EMOJI[module]}</Text>
        )}
      </View>

      {locked ? (
        <View
          style={[
            styles.metaBadge,
            styles.lockMetaBadge,
            { backgroundColor: themeName === 'dark' ? `${accent}24` : '#FFFFFFB8' },
          ]}>
          {Platform.OS === 'ios' ? (
            <SymbolView name="lock.fill" size={13} tintColor={accent} />
          ) : (
            <Text style={styles.lockFallback}>🔒</Text>
          )}
        </View>
      ) : meta ? (
        <View style={[styles.metaBadge, { backgroundColor: themeName === 'dark' ? `${accent}24` : '#FFFFFFB8' }]}>
          <ThemedText style={[Type.caption, styles.metaText, { color: accent }]} numberOfLines={1}>
            {meta}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.body, locked && styles.lockedBody]}>
        <ThemedText style={compact ? Type.body : Type.h2} numberOfLines={compact ? 2 : 1}>
          {title}
        </ThemedText>
        <ThemedText style={[Type.caption, { color: theme.textSecondary }]} numberOfLines={compact ? 2 : 3}>
          {subtitle}
        </ThemedText>
        {typeof progress === 'number' ? (
          <View style={styles.progress}>
            <LinearProgress value={progress} color={accent} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 144,
    borderRadius: Radius.card,
    padding: Spacing.three,
    overflow: 'hidden',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  compact: {
    minHeight: 124,
    width: '48%',
    flexGrow: 1,
  },
  lightShadow: {
    boxShadow: '0 2px 8px rgba(14, 26, 43, 0.06)',
  },
  bgGlyph: {
    position: 'absolute',
    right: -22,
    bottom: -24,
  },
  faded: {
    opacity: 0.18,
  },
  bgEmoji: {
    opacity: 0.13,
  },
  body: {
    gap: Spacing.one,
    paddingRight: Spacing.five,
  },
  metaBadge: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    maxWidth: '48%',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  metaText: {
    fontSize: 11,
    lineHeight: 14,
  },
  lockMetaBadge: {
    width: 30,
    height: 30,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockFallback: {
    fontSize: 12,
  },
  progress: {
    width: '78%',
    marginTop: Spacing.one,
  },
  lockedBody: {
    opacity: 0.5,
  },
});
