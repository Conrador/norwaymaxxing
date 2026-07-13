import { type ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  open: boolean;
  children: ReactNode;
  maxHeight?: number;
};

export function AnimatedAccordion({ open, children, maxHeight = 360 }: Props) {
  const [contentHeight, setContentHeight] = useState(0);
  const reducedMotion = useReducedMotion();
  const height = useSharedValue(0);
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    const nextHeight = open && contentHeight > 0 ? Math.min(contentHeight, maxHeight) : 0;

    height.value = withTiming(nextHeight, {
      duration: reducedMotion ? 0 : open ? 260 : 180,
      easing: Easing.out(Easing.cubic),
    });
    progress.value = withTiming(open ? 1 : 0, {
      duration: reducedMotion ? 0 : open ? 220 : 150,
      easing: Easing.out(Easing.quad),
    });
  }, [contentHeight, height, maxHeight, open, progress, reducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: 0.35 + progress.value * 0.65,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * -8 }],
  }));

  return (
    <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.measurer, contentStyle]}>
        <View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            setContentHeight((currentHeight) => (Math.abs(currentHeight - nextHeight) > 1 ? nextHeight : currentHeight));
          }}>
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  measurer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
