import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BREATH_PHASE_SECONDS, type BreathPhase } from '@/features/cold/plan';

type Props = {
  phase: BreathPhase;
  color: string;
  size?: number;
  durationSeconds?: number;
};

/**
 * Pulsujący okrąg box breathing (design.md §4.2): rośnie na wdechu,
 * trzyma rozmiar na zatrzymaniach, opada na wydechu.
 */
export function BreathingCircle({ phase, color, size = 220, durationSeconds = BREATH_PHASE_SECONDS }: Props) {
  const scale = useSharedValue(0.7);

  useEffect(() => {
    const duration = durationSeconds * 1000;
    if (phase === 'inhale') {
      scale.value = withTiming(1, { duration, easing: Easing.inOut(Easing.quad) });
    } else if (phase === 'exhale') {
      scale.value = withTiming(0.7, { duration, easing: Easing.inOut(Easing.quad) });
    }
    // hold phases keep the current scale
  }, [durationSeconds, phase, scale]);

  const outerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 0.72 }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}33` },
          outerStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          styles.inner,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}66` },
          innerStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
  inner: {},
});
