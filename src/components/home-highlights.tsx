import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { Text } from '@/components/text';
import { SurfaceCard } from '@/components/dashboard-ui';
import { MochiImage, ProgressBar } from '@/components/finance-ui';
import { AppTheme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { rupiah } from '@/database/format';
import type { SpendingPace } from '@/database/analytics-repository';
import type { BudgetRow, GoalRow } from '@/database/planning-repository';

const masked = (hidden: boolean, amount: number) => (hidden ? 'Rp ••••' : rupiah(amount));

/** Budgets at 80% or more this month, worst first. */
export function riskyBudgets(budgets: BudgetRow[]) {
  return budgets.filter((b) => b.amount > 0 && b.spent / b.amount >= 0.8).sort((a, b) => b.spent / b.amount - a.spent / a.amount);
}

/**
 * Mochi's reaction to this month's budgets: happy while all are under 80%, worried when one is close, sad once one
 * is over. Renders nothing until the user has set a budget.
 */
export function BudgetMood({ budgets, hidden }: { budgets: BudgetRow[]; hidden: boolean }) {
  const c = useTheme(); const s = createStyles(c);
  const active = budgets.filter((b) => b.amount > 0);
  if (!active.length) return null;
  const risky = riskyBudgets(active);
  const top = risky[0];
  let face: 'faceHappy' | 'faceWorried' | 'faceSad'; let title: string; let detail: string; let ratio: number; let border: string;
  if (!top) {
    const spent = active.reduce((sum, b) => sum + b.spent, 0); const limit = active.reduce((sum, b) => sum + b.amount, 0);
    face = 'faceHappy'; ratio = spent / limit; border = c.positive;
    title = 'Semua anggaran aman!';
    detail = `Baru terpakai ${Math.round(ratio * 100)}% dari ${masked(hidden, limit)}. Mochi senang!`;
  } else {
    ratio = top.spent / top.amount;
    if (ratio >= 1) {
      face = 'faceSad'; border = c.negative;
      title = `Anggaran ${top.category_name} sudah lewat batas`;
      detail = `Lebih ${masked(hidden, top.spent - top.amount)} dari anggaran. Rem dulu, ya!`;
    } else {
      face = 'faceWorried'; border = c.accent;
      title = `Anggaran ${top.category_name} tinggal ${Math.max(0, Math.round((1 - ratio) * 100))}%`;
      detail = `Sisa ${masked(hidden, top.amount - top.spent)} untuk bulan ini. Hemat, ya!`;
    }
  }
  return <Pressable onPress={() => router.push('/budgets')} accessibilityRole="button" accessibilityHint="Buka halaman anggaran" style={({ pressed }) => pressed && { opacity: 0.8 }}>
    <SurfaceCard style={[s.alert, { borderColor: border }]}>
      <View style={s.alertRow}>
        <Animated.View key={face} entering={ZoomIn.springify()}><MochiImage name={face} width={56} /></Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={s.alertTitle}>{title}</Text>
          <Text style={s.alertText}>{detail}</Text>
        </View>
      </View>
      <View style={{ marginTop: 10 }}><ProgressBar ratio={ratio} warnOver tint={top ? undefined : c.positive} /></View>
      {risky.length > 1 ? <Text style={[s.alertText, { marginTop: 8 }]}>+{risky.length - 1} anggaran lain juga hampir habis</Text> : null}
    </SurfaceCard>
  </Pressable>;
}

type Tip = { id: string; title: string; text: string; href?: Href };

function buildTips({ pace, goals, spentToday, hidden }: { pace: SpendingPace; goals: GoalRow[]; spentToday: number; hidden: boolean }): Tip[] {
  const tips: Tip[] = [];
  if (pace.lastMonthSameDays > 0 && pace.thisMonth > 0) {
    const change = Math.round(((pace.thisMonth - pace.lastMonthSameDays) / pace.lastMonthSameDays) * 100);
    if (change >= 10) tips.push({ id: 'pace', title: `Pengeluaran naik ${change}%`, text: 'Dibanding periode yang sama bulan lalu. Yuk, rem sedikit!', href: '/reports' });
    else if (change <= -10) tips.push({ id: 'pace', title: `Lebih hemat ${-change}%!`, text: 'Dibanding periode yang sama bulan lalu. Pertahankan!', href: '/reports' });
  }
  const goal = goals.filter((g) => g.balance < g.target_amount).sort((a, b) => (a.target_amount - a.balance) - (b.target_amount - b.balance))[0];
  if (goal) tips.push({ id: 'goal', title: `Target ${goal.title}`, text: `Tinggal ${masked(hidden, goal.target_amount - goal.balance)} lagi. Semangat!`, href: '/savings-goals' });
  if (spentToday === 0) tips.push({ id: 'today', title: 'Belum ada jajan hari ini', text: 'Dompet aman, Mochi senang!' });
  tips.push({ id: 'default', title: 'Prioritaskan tujuan,\nbukan keinginan!', text: 'Sisihkan dulu untuk tabungan sebelum belanja.' });
  return tips;
}

const RotateMs = 6000;

/** The yellow Mochi banner: rotates through tips that fit the user's current numbers. */
export function TipBanner(props: { pace: SpendingPace; goals: GoalRow[]; spentToday: number; hidden: boolean }) {
  const c = useTheme(); const s = createStyles(c);
  const tips = buildTips(props);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (tips.length < 2) return;
    const timer = setInterval(() => setIndex((i) => i + 1), RotateMs);
    return () => clearInterval(timer);
  }, [tips.length]);
  const tip = tips[index % tips.length];
  const content = <View style={s.banner}>
    <View style={{ flex: 1 }}>
      <Animated.View key={tip.id} entering={FadeIn.duration(450)}>
        <Text style={s.bannerTitle}>{tip.title}</Text>
        <Text style={s.bannerText}>{tip.text}</Text>
      </Animated.View>
      {tips.length > 1 ? <View style={s.dots}>{tips.map((t, i) => <View key={t.id} style={[s.dot, i === index % tips.length && s.dotActive]} />)}</View> : <View style={{ height: 14 }} />}
    </View>
    <MochiImage name="banner" width={150} style={{ marginRight: -8, marginBottom: -12 }} />
  </View>;
  return tip.href ? <Pressable onPress={() => router.push(tip.href!)} accessibilityRole="button">{content}</Pressable> : content;
}

function createStyles(c: AppTheme) {
  return StyleSheet.create({
    alert: { padding: 14, borderRadius: 20, borderWidth: 1.5, marginTop: 14 },
    alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    alertTitle: { color: c.text, fontSize: 14, fontWeight: '800' },
    alertText: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.softYellow, borderRadius: 22, paddingLeft: 18, paddingTop: 14, marginTop: 18, overflow: 'hidden', minHeight: 112 },
    bannerTitle: { color: c.text, fontSize: 15, fontWeight: '800', lineHeight: 20 },
    bannerText: { color: c.textSecondary, fontSize: 11, marginTop: 4 },
    dots: { flexDirection: 'row', gap: 4, marginTop: 10, marginBottom: 14 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.text, opacity: 0.2 },
    dotActive: { width: 16, opacity: 0.6 },
  });
}
