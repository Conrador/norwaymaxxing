import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { VikingDrumArt } from '@/components/viking-drum-art';

type Props = {
  size?: number;
  /** rośnie przy każdym fizycznym uderzeniu — bounce + flash */
  hitCount: number;
  /** kolor flashu ostatniego uderzenia (aurora = w tempie, blood = poza, gold = 1/2) */
  rippleColor: string;
  /** kolor runy w centrum bębna */
  runeColor: string;
  /** kolor poświaty-prowadnicy tempa */
  guideColor: string;
  /** ms do następnego uderzenia — poświata rośnie przez ten czas (peak = „uderz") */
  guideDurationMs: number;
  /** czy pokazywać prowadnicę tempa */
  guideActive: boolean;
  /** 0..1, rośnie wraz z accelerando */
  guideIntensity: number;
  onHit: () => void;
};

/**
 * Bęben RO! (ro-activity.md §5): cartoonowy asset wikiński (VikingDrumArt),
 * spring bounce na uderzenie, flash-feedback koloru trafienia i miękka
 * poświata rosnąca do rytmu zamiast klinicznego pierścienia.
 */
export function Drum({
  size = 260,
  hitCount,
  rippleColor,
  runeColor,
  guideColor,
  guideDurationMs,
  guideActive,
  guideIntensity,
  onHit,
}: Props) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const flashScale = useSharedValue(0.6);
  const flashOpacity = useSharedValue(0);
  // Poświata tempa: rośnie od małej do pełnej przez interwał, peak = moment uderzenia.
  const glowScale = useSharedValue(0.7);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (hitCount === 0) return;
    scale.value = withSequence(
      withTiming(0.93, { duration: 55, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 8, stiffness: 340 }),
    );
    flashScale.value = 0.7;
    flashOpacity.value = 0.5;
    flashScale.value = withTiming(1.28, { duration: 400, easing: Easing.out(Easing.cubic) });
    flashOpacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
  }, [hitCount, flashOpacity, flashScale, scale]);

  useEffect(() => {
    cancelAnimation(glowScale);
    cancelAnimation(glowOpacity);
    if (!guideActive) {
      glowOpacity.value = withTiming(0, { duration: 150 });
      return;
    }
    if (reducedMotion) {
      glowScale.value = 1.08;
      glowOpacity.value = Math.max(0.18, guideIntensity * 0.55);
      return;
    }

    const riseDuration = Math.max(140, guideDurationMs * 0.84);
    const resetDuration = Math.max(70, guideDurationMs * 0.16);
    glowScale.value = 0.74;
    glowOpacity.value = 0.06;
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: riseDuration, easing: Easing.in(Easing.quad) }),
        withTiming(0.74, { duration: resetDuration, easing: Easing.out(Easing.quad) }),
      ),
      -1,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(guideIntensity, { duration: riseDuration, easing: Easing.in(Easing.quad) }),
        withTiming(0.06, { duration: resetDuration, easing: Easing.out(Easing.quad) }),
      ),
      -1,
    );

    return () => {
      cancelAnimation(glowScale);
      cancelAnimation(glowOpacity);
    };
  }, [guideActive, guideDurationMs, guideIntensity, glowOpacity, glowScale, reducedMotion]);

  const drumStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    transform: [{ scale: flashScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const halo = (color: string, extra: object) => ({
    position: 'absolute' as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    ...extra,
  });

  return (
    <View style={[styles.container, { width: size * 1.4, height: size * 1.4 }]}>
      <Animated.View pointerEvents="none" style={[halo(guideColor, {}), glowStyle]} />
      <Animated.View pointerEvents="none" style={[halo(rippleColor, {}), flashStyle]} />
      <Animated.View style={drumStyle}>
        <Pressable onPressIn={onHit} hitSlop={16}>
          <VikingDrumArt size={size} runeColor={runeColor} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
