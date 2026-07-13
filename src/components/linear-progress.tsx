import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** 0..1 */
  value: number;
  color?: string;
};

/** RN/web fallback. iOS uses linear-progress.ios.tsx with SwiftUI ProgressView. */
export function LinearProgress({ value, color }: Props) {
  const theme = useTheme();
  const clamped = Math.min(Math.max(value, 0), 1);
  const barColor = color ?? theme.frost;

  return (
    <View style={[styles.track, { backgroundColor: theme.surfaceHigh }]}>
      <View
        style={[styles.fill, { backgroundColor: barColor, width: `${clamped * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
