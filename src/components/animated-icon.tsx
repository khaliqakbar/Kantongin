import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getUserName } from '@/database/preferences';
import { getRecordingStreak } from '@/database/analytics-repository';
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
  // A personal touch while loading: greet the user by name and show their recording streak.
  const db = useSQLiteContext(); const [name, setName] = useState(''); const [streakDays, setStreakDays] = useState(0);
  useEffect(() => {
    Promise.all([getUserName(db), getRecordingStreak(db)]).then(([userName, streak]) => { setName(userName); setStreakDays(streak.days); })
      .catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Could not load splash greeting', error); });
  }, [db]);
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
    <BrandSplash loadingMs={started ? LOADING_MS : undefined} onLoaded={fadeOut} name={name} streakDays={streakDays} />
  </Animated.View>;
}

const styles = StyleSheet.create({ overlay: { ...StyleSheet.absoluteFill, zIndex: 1000 } });
