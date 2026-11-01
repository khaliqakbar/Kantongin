import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { Easing, FadeIn, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { mochi, mochiAspect, mochiRun } from '@/constants/mochi';
import { useTheme } from '@/hooks/use-theme';

const loadingLines = ['Mochi menghitung koin…', 'Merapikan kantong…', 'Hampir siap!'];

/**
 * Full-screen brand layout shared by the splash overlay and the first loading screen.
 * Until `loadingMs` is set only Mochi shows, matching the native splash; then the title, tagline and loader slide
 * in one after another, the bar fills over that duration and `onLoaded` is called.
 */
export function BrandSplash({ status, loadingMs, onLoaded, name, streakDays = 0 }: { status?: string; loadingMs?: number; onLoaded?: () => void; name?: string; streakDays?: number }) {
  const c = useTheme();
  const live = loadingMs !== undefined;
  const blinking = useBlink(live);
  const lines = [status ?? loadingLines[0], ...loadingLines.slice(1)];
  const [line, setLine] = useState(0);
  useEffect(() => {
    if (!loadingMs) return;
    const timer = setInterval(() => setLine((current) => Math.min(current + 1, lines.length - 1)), loadingMs / lines.length);
    return () => clearInterval(timer);
  }, [loadingMs, lines.length]);
  // Mochi gives a small bounce when the overlay takes over, then floats gently; the glow behind breathes.
  const lift = useSharedValue(0); const pop = useSharedValue(1); const glow = useSharedValue(1);
  const mochiStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.get() }, { scale: pop.get() }] }));
  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: glow.get() }] }));
  useEffect(() => {
    if (!live) return;
    pop.set(withSequence(withTiming(1.06, { duration: 180 }), withSpring(1, { damping: 8 })));
    lift.set(withDelay(400, withRepeat(withSequence(withTiming(-8, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) })), -1)));
    glow.set(withRepeat(withSequence(withTiming(1.08, { duration: 1400, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) })), -1));
  }, [live, lift, pop, glow]);
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
    {/* Soft colour washes in the corners keep the cream background from feeling flat. */}
    <View style={[styles.wash, { top: -140, left: -120, backgroundColor: c.softYellow }]} />
    <View style={[styles.wash, { top: -60, right: -170, backgroundColor: c.softGreen }]} />
    <Leaf side="left" live={live} />
    <Leaf side="right" live={live} />
    <View style={styles.hero}>
      <Animated.View style={[styles.glow, { backgroundColor: c.softYellow }, glowStyle]} />
      {live ? floaters.map((item, index) => <Floater key={index} {...item} />) : null}
      <Animated.View style={mochiStyle}>
        <Image source={mochi.coin} contentFit="contain" style={{ width: 210, aspectRatio: mochiAspect.coin }} accessibilityLabel="Mochi memegang koin Rupiah" />
        {/* Both faces stay mounted so a blink never waits on an image load. */}
        <Image source={mochi.coinBlink} contentFit="contain" style={[StyleSheet.absoluteFill, { opacity: blinking ? 1 : 0 }]} />
      </Animated.View>
    </View>
    {/* Fixed-height slot, so Mochi stays put when the text below animates in. */}
    <View style={styles.below}>{live ? <>
      <Animated.View entering={FadeInDown.delay(150).duration(500)}><Text style={[styles.brand, { color: c.forest }]}>Kantongin</Text></Animated.View>
      <Animated.View entering={FadeInDown.delay(350).duration(500)}><Text style={[styles.tagline, { color: name ? c.text : c.textSecondary }, name && styles.greeting]}>{name ? greeting(name) : 'Uang Rapi, Hidup Lebih Pasti.'}</Text></Animated.View>
      <Animated.View entering={FadeIn.delay(550).duration(400)} style={styles.loader}>
        <Animated.View style={runnerStyle}><RunningMochi width={RunnerWidth} /></Animated.View>
        <View style={[styles.track, { backgroundColor: c.line }]}><Animated.View style={[styles.fill, { backgroundColor: c.forest }, barStyle]} /></View>
      </Animated.View>
      <Animated.View key={line} entering={FadeIn.duration(300)}><Text style={[styles.status, { color: c.textSecondary }]}>{lines[line]}</Text></Animated.View>
      {streakDays > 0 ? <Animated.View entering={ZoomIn.delay(900).springify()} style={[styles.streak, { backgroundColor: c.softOrange }]}><Text style={[styles.streakText, { color: c.text }]}>🔥 {streakDays} hari berturut-turut</Text></Animated.View> : null}
    </> : null}</View>
  </View>;
}

/** "Selamat pagi, Rina! ☀️" — the part of the day follows the phone's clock. */
function greeting(name: string) {
  const hour = new Date().getHours();
  const [part, icon] = hour >= 4 && hour < 10 ? ['pagi', '☀️'] : hour < 15 && hour >= 10 ? ['siang', '🌤️'] : hour < 18 && hour >= 15 ? ['sore', '🌇'] : ['malam', '🌙'];
  return `Selamat ${part}, ${name}! ${icon}`;
}

/** True for a short moment every few seconds while the splash is animating, so Mochi blinks. */
function useBlink(active: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!active) return;
    let reopen: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => { setClosed(true); reopen = setTimeout(() => setClosed(false), 160); }, 2200);
    return () => { clearInterval(timer); clearTimeout(reopen); };
  }, [active]);
  return closed;
}

/** Coins and sparkles drifting around Mochi; x/y are offsets from the hero's centre. */
const floaters = [
  { kind: 'coin', x: -128, y: -70, size: 26, delay: 200, drift: 10, ms: 1700 },
  { kind: 'coin', x: 118, y: 40, size: 20, delay: 500, drift: 8, ms: 1500 },
  { kind: 'coin', x: -112, y: 70, size: 16, delay: 800, drift: 6, ms: 1300 },
  { kind: 'spark', x: 108, y: -92, size: 22, delay: 350, drift: 6, ms: 1200 },
  { kind: 'spark', x: -70, y: -118, size: 14, delay: 650, drift: 4, ms: 1000 },
  { kind: 'spark', x: 140, y: -20, size: 12, delay: 900, drift: 4, ms: 1100 },
] as const;

function Floater({ kind, x, y, size, delay, drift, ms }: (typeof floaters)[number]) {
  const offset = useSharedValue(0);
  useEffect(() => {
    offset.set(withDelay(delay, withRepeat(withSequence(withTiming(-drift, { duration: ms, easing: Easing.inOut(Easing.sin) }), withTiming(drift, { duration: ms, easing: Easing.inOut(Easing.sin) })), -1, true)));
  }, [offset, delay, drift, ms]);
  // Sparkles twinkle by shrinking at the bottom of each drift; coins just bob.
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }, { scale: kind === 'spark' ? 0.75 + 0.25 * ((offset.get() + drift) / (2 * drift)) : 1 }] }));
  return <Animated.View entering={FadeIn.delay(delay).duration(500)} pointerEvents="none" style={[styles.floater, { marginLeft: x - size / 2, marginTop: y - size / 2 }]}>
    <Animated.View style={style}>
      {kind === 'coin' ? <View style={[styles.coin, { width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(2, size / 10) }]}><Text style={{ color: '#9A6B00', fontSize: size * 0.38, fontWeight: '900' }}>Rp</Text></View>
        : <Text style={{ color: '#F4C542', fontSize: size, lineHeight: size * 1.2 }}>✦</Text>}
    </Animated.View>
  </Animated.View>;
}

/** A corner leaf that sways slowly from its bottom edge, as if in a breeze. */
function Leaf({ side, live }: { side: 'left' | 'right'; live: boolean }) {
  const sway = useSharedValue(0);
  useEffect(() => {
    if (!live) return;
    const lean = side === 'left' ? 2.5 : -2.5;
    sway.set(withRepeat(withSequence(withTiming(lean, { duration: 2200, easing: Easing.inOut(Easing.sin) }), withTiming(-lean / 2, { duration: 2200, easing: Easing.inOut(Easing.sin) })), -1));
  }, [live, side, sway]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.get()}deg` }] }));
  const left = side === 'left';
  return <Animated.View style={[styles.leaf, left ? styles.leafLeft : styles.leafRight, { transformOrigin: left ? '20% 100%' : '80% 100%' }, style]}>
    <Image source={left ? mochi.leafLeft : mochi.leafRight} contentFit="contain" style={{ width: '100%', aspectRatio: left ? mochiAspect.leafLeft : mochiAspect.leafRight }} />
  </Animated.View>;
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
  wash: { position: 'absolute', width: 360, height: 360, borderRadius: 180, opacity: 0.7 },
  hero: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 250, height: 250, borderRadius: 125 },
  floater: { position: 'absolute', left: '50%', top: '50%' },
  coin: { backgroundColor: '#F4C542', borderColor: '#E0A526', alignItems: 'center', justifyContent: 'center' },
  below: { height: 216, alignItems: 'center' },
  greeting: { fontWeight: '700' },
  streak: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  streakText: { fontSize: 12, fontWeight: '800' },
  brand: { fontSize: 38, fontWeight: '900', letterSpacing: -1, marginTop: 14 },
  tagline: { fontSize: 14, marginTop: 4 },
  loader: { width: TrackWidth, marginTop: 16 },
  track: { width: TrackWidth, height: 6, borderRadius: 3, marginTop: -4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  status: { fontSize: 12, marginTop: 12 },
});
