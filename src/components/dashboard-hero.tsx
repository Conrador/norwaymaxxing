import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenPadding, Spacing } from '@/constants/theme';
import { useThemeName } from '@/hooks/use-theme';

type Props = {
  children: ReactNode;
};

export function DashboardHero({ children }: Props) {
  const themeName = useThemeName();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={
          themeName === 'dark'
            ? ['#10263A', '#0D1A2B', '#08111F']
            : ['#BFDDE4', '#DCE8ED', '#F3F1F7']
        }
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={
          themeName === 'dark'
            ? ['rgba(61, 220, 151, 0.28)', 'rgba(94, 200, 242, 0.10)', 'rgba(8, 17, 31, 0)']
            : ['rgba(14, 127, 184, 0.15)', 'rgba(255, 255, 255, 0.16)', 'rgba(243, 241, 247, 0)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topWash}
      />
      <LinearGradient
        pointerEvents="none"
        colors={
          themeName === 'dark'
            ? ['rgba(8, 17, 31, 0)', 'rgba(8, 17, 31, 0.62)', 'rgba(8, 17, 31, 0.94)']
            : ['rgba(246, 243, 250, 0)', 'rgba(246, 243, 250, 0.58)', 'rgba(246, 243, 250, 0.96)']
        }
        style={styles.bottomGradient}
      />
      <View style={[styles.content, { paddingTop: insets.top + Spacing.three }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 548,
    marginHorizontal: -ScreenPadding,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  topWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '72%',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '74%',
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: ScreenPadding,
    paddingBottom: Spacing.five,
  },
});
