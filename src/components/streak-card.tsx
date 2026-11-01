import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/text';
import { SurfaceCard } from '@/components/dashboard-ui';
import { MochiImage, PrimaryButton } from '@/components/finance-ui';
import { AppTheme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RecordingStreak } from '@/database/analytics-repository';

/** Streak levels: the day each one starts, Mochi's pose and the name shown when the user reaches it. */
const levels = [
  { from: 1, image: 'streak1', name: 'Pencatat Pemula' },
  { from: 7, image: 'streak2', name: 'Pencatat Semangat' },
  { from: 30, image: 'streak3', name: 'Juragan Koin' },
  { from: 100, image: 'streak4', name: 'Raja Kantong' },
] as const;

/** 1–4 for an active streak, 0 when there is none. */
export const streakLevel = (days: number) => levels.filter((level) => days >= level.from).length;

/** Home card: Mochi's pose grows with the streak, and the text nudges the user to keep it going. */
export function StreakCard({ streak }: { streak: RecordingStreak }) {
  const c = useTheme(); const s = createStyles(c);
  const level = streakLevel(streak.days);
  const next = levels[level];
  const title = streak.days ? `🔥 ${streak.days} hari berturut-turut mencatat!` : 'Mulai streak mencatatmu!';
  const detail = !streak.days ? 'Catat satu transaksi hari ini, Mochi temani setiap harinya.'
    : !streak.recordedToday ? 'Belum mencatat hari ini. Catat sekarang supaya streak tidak putus!'
    : next ? `${next.from - streak.days} hari lagi menuju ${next.name}.` : 'Kamu Raja Kantong! Pertahankan, ya.';
  return <Pressable onPress={() => !streak.recordedToday && router.push('/transaction-form')} disabled={streak.recordedToday} accessibilityRole="button" accessibilityHint={streak.recordedToday ? undefined : 'Catat transaksi'} style={({ pressed }) => pressed && { opacity: 0.8 }}>
    <SurfaceCard style={[s.card, !streak.recordedToday && streak.days > 0 && { borderColor: c.accent }]}>
      <MochiImage name={levels[Math.max(level, 1) - 1].image} width={64} style={!streak.days && { opacity: 0.6 }} />
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.detail}>{detail}</Text>
      </View>
    </SurfaceCard>
  </Pressable>;
}

/** Full-screen congratulations shown once when the streak reaches a new level. */
export function StreakCelebration({ days, onClose }: { days: number; onClose: () => void }) {
  const c = useTheme(); const s = createStyles(c);
  const level = levels[streakLevel(days) - 1];
  return <Modal transparent animationType="fade" visible onRequestClose={onClose} statusBarTranslucent>
    <View style={s.backdrop}>
      <View style={s.dialog}>
        <Animated.View entering={ZoomIn.springify().delay(150)}><MochiImage name={level.image} width={210} /></Animated.View>
        <Text style={s.levelUp}>LEVEL BARU</Text>
        <Text style={s.dialogTitle}>{level.name}</Text>
        <Text style={s.dialogText}>🔥 {days} hari berturut-turut mencatat keuangan. Mochi bangga sama kamu!</Text>
        <View style={{ alignSelf: 'stretch', marginTop: 18 }}><PrimaryButton label="Mantap!" onPress={onClose} /></View>
      </View>
    </View>
  </Modal>;
}

function createStyles(c: AppTheme) {
  return StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingRight: 14, borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent', marginTop: 14 },
    title: { color: c.text, fontSize: 14, fontWeight: '800' },
    detail: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    dialog: { width: '100%', maxWidth: 340, backgroundColor: c.surface, borderRadius: 28, padding: 22, alignItems: 'center' },
    levelUp: { color: c.forest, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
    dialogTitle: { color: c.text, fontSize: 22, fontWeight: '900', marginTop: 2 },
    dialogText: { color: c.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  });
}
