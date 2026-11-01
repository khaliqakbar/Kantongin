import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { SurfaceCard } from '@/components/dashboard-ui';
import { AppTheme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { rupiah, todayISO } from '@/database/format';
import type { DailyExpense } from '@/database/analytics-repository';

const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BarArea = 84;

const weekday = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return weekdays[new Date(y, m - 1, d).getDay()]; };

/** Seven-day expense bars; tapping a bar shows that day's amount. Amounts follow the balance privacy toggle. */
export function WeeklySpending({ days, hidden }: { days: DailyExpense[]; hidden: boolean }) {
  const c = useTheme(); const s = createStyles(c);
  const today = todayISO();
  const [selected, setSelected] = useState<string | null>(null);
  const total = days.reduce((sum, day) => sum + day.amount, 0);
  const max = Math.max(...days.map((day) => day.amount), 1);
  const picked = days.find((day) => day.date === selected);
  const money = (amount: number) => (hidden ? 'Rp ••••' : rupiah(amount));

  return <SurfaceCard style={s.card}>
    <View style={s.header}>
      <View style={{ flex: 1 }}>
        <Text style={s.caption}>{picked ? (picked.date === today ? 'Hari ini' : weekday(picked.date)) : 'Total 7 hari'}</Text>
        <Text style={s.total}>{money(picked ? picked.amount : total)}</Text>
      </View>
      {!picked && total > 0 ? <Text style={s.caption}>rata-rata {money(Math.round(total / days.length))}/hari</Text> : null}
    </View>
    {total === 0 ? <Text style={s.empty}>Belum ada pengeluaran 7 hari ini. Hemat banget! 🎉</Text> : <View style={s.bars}>
      {days.map((day) => {
        const isToday = day.date === today; const active = selected ? day.date === selected : isToday;
        return <Pressable key={day.date} onPress={() => setSelected((current) => (current === day.date ? null : day.date))} accessibilityRole="button" accessibilityLabel={`${isToday ? 'Hari ini' : weekday(day.date)}, ${hidden ? 'disembunyikan' : rupiah(day.amount)}`} style={s.column}>
          <View style={s.barSlot}><View style={[s.bar, { height: day.amount ? Math.max(6, (day.amount / max) * BarArea) : 3, backgroundColor: active ? c.forest : c.line }]} /></View>
          <Text style={[s.day, active && s.dayActive]}>{isToday ? 'Ini' : weekday(day.date)}</Text>
        </Pressable>;
      })}
    </View>}
  </SurfaceCard>;
}

function createStyles(c: AppTheme) {
  return StyleSheet.create({
    card: { padding: 16, borderRadius: 20 },
    header: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 14 },
    caption: { color: c.textSecondary, fontSize: 11 },
    total: { color: c.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
    empty: { color: c.textSecondary, fontSize: 12, textAlign: 'center', paddingVertical: 18 },
    bars: { flexDirection: 'row', alignItems: 'flex-end' },
    column: { flex: 1, alignItems: 'center', gap: 6 },
    barSlot: { height: BarArea, justifyContent: 'flex-end' },
    bar: { width: 18, borderRadius: 6 },
    day: { color: c.textSecondary, fontSize: 10, fontWeight: '600' },
    dayActive: { color: c.text, fontWeight: '800' },
  });
}
