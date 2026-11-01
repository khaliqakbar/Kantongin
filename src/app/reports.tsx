import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { categoryIcon } from '@/components/app-icon';
import { EmptyState, ListRow, MonthSwitcher, Panel, PrimaryButton, Screen, SectionTitle } from '@/components/finance-ui';
import { getFinanceReport, type FinanceReport } from '@/database/analytics-repository';
import { currentPeriod, rupiah } from '@/database/format';

export default function ReportsScreen() {
  const db = useSQLiteContext(); const c = useTheme();
  const [period, setPeriod] = useState(currentPeriod());
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loadError, setLoadError] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    getFinanceReport(db, period).then((data) => { if (active) { setReport(data); setLoadError(false); } }).catch((error: unknown) => {
      if (__DEV__) console.error('[Kantongin] Load report failed', error);
      if (active) setLoadError(true);
    });
    return () => { active = false; };
  }, [db, period]));

  const [year, month] = period.split('-').map(Number);
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const byDay = new Map((report?.days ?? []).map((day) => [Number(day.day), day.expense]));
  const bars = Array.from({ length: dayCount }, (_, i) => byDay.get(i + 1) ?? 0);
  const maxExpense = Math.max(1, ...bars);
  const expense = report?.expense ?? 0; const previous = report?.previousExpense ?? 0;
  const change = previous ? Math.round((expense - previous) / previous * 100) : null;

  return <Screen title="Laporan" back>
    <MonthSwitcher period={period} onChange={setPeriod} />
    {loadError ? <Panel><Text style={{ color: c.negative }}>Laporan gagal dimuat. Coba buka kembali halaman.</Text></Panel> : <>
      <Panel>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>Pengeluaran</Text>
        <Text style={{ color: c.text, fontSize: 26, fontWeight: '900', marginTop: 2 }}>{rupiah(expense)}</Text>
        {change !== null ? <Text style={{ color: change > 0 ? c.negative : c.positive, fontSize: 12, fontWeight: '700', marginTop: 3 }}>{change > 0 ? '↑' : '↓'} {Math.abs(change)}% dari bulan lalu</Text> : <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 3 }}>Belum ada pembanding bulan lalu</Text>}
        <View style={{ height: 130, flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 18 }} accessibilityLabel="Grafik pengeluaran harian">
          {bars.map((value, index) => <View key={index} style={{ flex: 1, height: `${value ? Math.max(4, value / maxExpense * 100) : 2}%`, backgroundColor: value ? c.forest : c.line, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />)}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>{[1, 7, 14, 21, 28].map((d) => <Text key={d} style={{ color: c.textSecondary, fontSize: 10 }}>{d}</Text>)}</View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1, backgroundColor: c.softGreen, padding: 12, borderRadius: 14 }}><Text style={{ color: c.textSecondary, fontSize: 11 }}>Pemasukan</Text><Text style={{ color: c.positive, fontWeight: '800', marginTop: 4 }}>{rupiah(report?.income ?? 0)}</Text></View>
          <View style={{ flex: 1, backgroundColor: c.softYellow, padding: 12, borderRadius: 14 }}><Text style={{ color: c.textSecondary, fontSize: 11 }}>Arus bersih</Text><Text style={{ color: (report?.net ?? 0) < 0 ? c.negative : c.text, fontWeight: '800', marginTop: 4 }}>{rupiah(report?.net ?? 0)}</Text></View>
        </View>
      </Panel>

      <SectionTitle title="Kategori Pengeluaran" />
      <Panel style={{ paddingVertical: 2, paddingHorizontal: 14 }}>{report?.expensesByCategory.length ? report.expensesByCategory.map((item, index, all) => <ListRow key={item.category_id} icon={categoryIcon(item.icon)} title={item.name} subtitle={`${item.count} transaksi · ${rupiah(item.amount)}`} value={`${expense ? Math.round(item.amount / expense * 100) : 0}%`} last={index === all.length - 1} />)
        : <EmptyState title="Belum ada pengeluaran" message="Pengeluaran bulan ini akan muncul di sini per kategori." />}</Panel>
      <View style={{ marginTop: 16 }}><PrimaryButton label="Lihat Insight Keuangan" icon="insight" secondary onPress={() => router.push('/insights')} /></View>
    </>}
  </Screen>;
}
