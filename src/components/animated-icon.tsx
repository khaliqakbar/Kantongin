import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { BrandSplash } from '@/components/brand-splash';
import { playSound } from '@/utils/sound';

/** How long the loading bar takes to fill, then how long the overlay takes to fade away. */
const LOADING_MS = 3000;
const FADE_MS = 800;

/** Takes over from the native splash (Mochi on cream), fills the loading bar slowly, then fades out. */
export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [started, setStarted] = useState(false);
  const opacity = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const fadeOut = useCallback(() => {
    opacity.set(withTiming(0, { duration: FADE_MS, easing: Easing.out(Easing.quad) }, (finished) => {
      'worklet';
      if (finished) scheduleOnRN(setVisible, false);
    }));
  }, [opacity]);
  if (!visible) return null;
  return <Animated.View
    style={[styles.overlay, fadeStyle]}
    onLayout={() => { if (!started) SplashScreen.hideAsync().finally(() => { setStarted(true); void playSound('startup'); }); }}>
    <BrandSplash loadingMs={started ? LOADING_MS : undefined} onLoaded={fadeOut} />
  </Animated.View>;
}

const styles = StyleSheet.create({ overlay: { ...StyleSheet.absoluteFill, zIndex: 1000 } });
