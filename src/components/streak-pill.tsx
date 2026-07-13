import { Host, HStack, Image, Text } from '@expo/ui/swift-ui';
import { font, foregroundColor, frame, glassEffect, padding } from '@expo/ui/swift-ui/modifiers';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Pigułka streaka: na iOS liquid glass (expo/ui, iOS 26), na innych
 * platformach zwykła pigułka RN w kolorze ember.
 */
export function StreakPill({ streak, compact = false }: { streak: number; compact?: boolean }) {
  const theme = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <Host matchContents>
        <HStack
          spacing={6}
          modifiers={[
            padding({ horizontal: compact ? 9 : 14, vertical: compact ? 7 : 9 }),
            glassEffect({ glass: { variant: 'regular' }, shape: 'capsule' }),
          ]}>
          <Image
            systemName="flame.fill"
            size={compact ? 13 : 15}
            modifiers={[foregroundColor(theme.ember), frame({ width: compact ? 15 : 18, height: compact ? 15 : 18 })]}
          />
          <Text
            modifiers={[
              font({ size: compact ? 15 : 17, weight: 'bold', design: 'rounded' }),
              foregroundColor(theme.textPrimary),
            ]}>
            {String(streak)}
          </Text>
        </HStack>
      </Host>
    );
  }

  return (
    <View style={[styles.pill, compact && styles.compactPill, { backgroundColor: `${theme.ember}22` }]}> 
      <ThemedText style={[compact ? Type.caption : Type.h2, { color: theme.ember }]}>🔥 {streak}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  compactPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 7,
  },
});
