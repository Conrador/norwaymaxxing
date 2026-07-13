import { Host, ProgressView } from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** 0..1 */
  value: number;
  color?: string;
};

/**
 * Native SwiftUI ProgressView on iOS. Host must fill its parent width and take
 * a fixed height — `matchContents` collapses the linear bar to its intrinsic
 * (near-zero) size, so the bar reads as empty.
 */
export function LinearProgress({ value, color }: Props) {
  const theme = useTheme();
  const clamped = Math.min(Math.max(value, 0), 1);
  const barColor = color ?? theme.frost;

  return (
    <Host style={styles.host}>
      <ProgressView value={clamped} modifiers={[tint(barColor)]} />
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    width: '100%',
    height: 10,
    justifyContent: 'center',
  },
});
