import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { mochi, mochiAspect, mochiRun } from '@/constants/mochi';
import { useTheme } from '@/hooks/use-theme';

/**
 * Full-screen brand layout shared by the splash overlay and the first loading screen.
 * Once `loadingMs` is set, the bar fills over that duration and then calls `onLoaded`.
 */
export function BrandSplash({ status, loadingMs, onLoaded }: { status?: string; loadingMs?: number; onLoaded?: () => void }) {
  const c = useTheme();
  const progress = useSharedValue(0.08);
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  // The running Mochi's coin rides the tip of the bar, so the cat chases it as loading fills up.
  const runnerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.get() * TrackWidth - RunnerWidth * RunnerCoinX }] }));
  useEffect(() => {
    if (!loadingMs) return;
    progress.set(withTiming(1, { duration: loadingMs, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      'worklet';
      if (finished && onLoaded) scheduleOnRN(onLoaded);
    }));
  }, [loadingMs, onLoaded, progress]);
  return <View style={[styles.root, { backgroundColor: c.background }]}>
    <Image source={mochi.leafLeft} contentFit="contain" style={[styles.leaf, styles.leafLeft, { aspectRatio: mochiAspect.leafLeft }]} />
    <Image source={mochi.leafRight} contentFit="contain" style={[styles.leaf, styles.leafRight, { aspectRatio: mochiAspect.leafRight }]} />
    <Image source={mochi.coin} contentFit="contain" style={{ width: 210, aspectRatio: mochiAspect.coin }} accessibilityLabel="Mochi memegang koin Rupiah" />
    <Text style={[styles.brand, { color: c.forest }]}>Kantongin</Text>
    <Text style={[styles.tagline, { color: c.textSecondary }]}>Uang Rapi, Hidup Lebih Pasti.</Text>
    <View style={styles.loader}>
      <Animated.View style={runnerStyle}><RunningMochi width={RunnerWidth} /></Animated.View>
      <View style={[styles.track, { backgroundColor: c.line }]}><Animated.View style={[styles.fill, { backgroundColor: c.forest }, barStyle]} /></View>
    </View>
    {status ? <Text style={[styles.status, { color: c.textSecondary }]}>{status}</Text> : null}
  </View>;
}

const TrackWidth = 180;
const RunnerWidth = 60;
// Horizontal position of the coin inside a sprite frame, as a fraction of the frame width.
const RunnerCoinX = 0.78;

/** Mochi chasing a coin: steps through the sprite sheet by sliding it inside a one-frame window. */
function RunningMochi({ width }: { width: number }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((current) => (current + 1) % mochiRun.frames), mochiRun.frameMs);
    return () => clearInterval(timer);
  }, []);
  const height = width / mochiRun.frameAspect;
  return <View style={{ width, height, overflow: 'hidden' }} accessible accessibilityRole="image" accessibilityLabel="Mochi mengejar koin Rupiah">
    <Image source={mochi.runSheet} contentFit="fill" style={{ width: width * mochiRun.frames, height, transform: [{ translateX: -frame * width }] }} />
  </View>;
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  leaf: { position: 'absolute', bottom: -6, width: '58%', maxWidth: 320 },
  leafLeft: { left: -24 },
  leafRight: { right: -24 },
  brand: { fontSize: 38, fontWeight: '900', letterSpacing: -1, marginTop: 14 },
  tagline: { fontSize: 14, marginTop: 4 },
  loader: { width: TrackWidth, marginTop: 16 },
  track: { width: TrackWidth, height: 6, borderRadius: 3, marginTop: -4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  status: { fontSize: 12, marginTop: 12 },
});
