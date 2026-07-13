import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { moduleDarkSurface, moduleSurface } from '@/components/module-card';
import { Radius, Spacing, Type } from '@/constants/theme';
import { moduleColor, moduleSymbol, type ProtocolTask } from '@/features/protocol/protocol';
import { useTheme, useThemeName } from '@/hooks/use-theme';

const MODULE_EMOJI: Record<ProtocolTask['module'], string> = {
  cold: '❄️',
  breath: '🌬️',
  sauna: '🔥',
  nature: '🌲',
  diet: '🥩',
  ro: '🥁',
  music: '🎵',
};

type Props = {
  task: ProtocolTask;
  done: boolean;
  onPress: () => void;
};

export function TaskCard({ task, done, onPress }: Props) {
  const theme = useTheme();
  const themeName = useThemeName();
  const { t } = useTranslation();
  const accent = moduleColor(task.module, theme);

  return (
    <Pressable
      disabled={done}
      onPress={() => {
        if (task.session || task.module === 'breath') {
          Haptics.selectionAsync();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: themeName === 'dark' ? moduleDarkSurface(task.module) : moduleSurface(task.module),
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        themeName === 'light' && styles.lightShadow,
        done && { opacity: 0.65 },
      ]}>
      <View style={styles.bgGlyph}>
        {Platform.OS === 'ios' ? (
          <SymbolView name={moduleSymbol(task.module)} size={96} tintColor={accent} style={styles.faded} />
        ) : (
          <Text style={styles.bgEmoji}>{MODULE_EMOJI[task.module]}</Text>
        )}
      </View>

      <View style={styles.body}>
        <ThemedText
          style={[
            Type.body,
            { fontFamily: Type.h2.fontFamily },
            done && { textDecorationLine: 'line-through', color: theme.textSecondary },
          ]}>
          {t(task.titleKey)}
        </ThemedText>
        <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
          {task.metaKey ? `${t(task.metaKey, { count: task.metaCount })}  ·  ` : ''}
          {t('common.xp', { count: task.xp })}
        </ThemedText>
      </View>

      <View
        style={[
          styles.check,
          done
            ? { backgroundColor: theme.aurora, borderColor: theme.aurora }
            : {
                borderColor:
                  themeName === 'dark' ? `${theme.textSecondary}55` : `${theme.textPrimary}22`,
                backgroundColor: themeName === 'dark' ? 'transparent' : '#FFFFFF66',
              },
        ]}>
        {done && <Text style={styles.checkMark}>✓</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 18,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  lightShadow: {
    boxShadow: '0 2px 8px rgba(14, 26, 43, 0.06)',
  },
  bgGlyph: {
    position: 'absolute',
    right: -16,
    bottom: -22,
  },
  faded: {
    opacity: 0.16,
  },
  bgEmoji: {
    fontSize: 76,
    opacity: 0.12,
  },
  body: {
    flex: 1,
    gap: 3,
    paddingRight: Spacing.two,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
