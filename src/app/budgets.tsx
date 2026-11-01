import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { categoryIcon, IconTile, icons } from '@/components/app-icon';
import { EmptyState, IconButton, MonthSwitcher, Panel, PrimaryButton, ProgressBar, Screen } from '@/components/finance-ui';
import { getBudgets, type BudgetRow } from '@/database/planning-repository';
import { currentPeriod, rupiah } from '@/database/format';

export default function BudgetsScreen() {
  const db = useSQLiteContext(), c = useTheme();
  const [period, setPeriod] = useState(currentPeriod());
  const [rows, setRows] = useState<BudgetRow[]>([]); const [loadError, setLoadError] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    getBudgets(db, period).then((data) => { if (active) { setRows(data); setLoadError(false); } }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Load budgets failed', error); if (active) setLoadError(true); });
    return () => { active = false; };
  }, [db, period]));
  const total = rows.reduce((sum, row) => sum + row.amount, 0); const spent = rows.reduce((sum, row) => sum + row.spent, 0);
  const add = () => router.push({ pathname: '/budget-form', params: { period } });

  return <Screen title="Anggaran" back action={<IconButton icon="add" label="Buat anggaran" tone="filled" onPress={add} />}>
    <MonthSwitcher period={period} onChange={setPeriod} />
    {loadError ? <Text style={{ color: c.negative, fontSize: 12, marginBottom: 12 }}>Anggaran gagal dimuat. Coba buka kembali halaman.</Text> : null}
    {rows.length ? <>
      <Panel style={{ marginBottom: 14 }}>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>Total Anggaran</Text>
        <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginTop: 2 }}>{rupiah(total)}</Text>
        <Text style={{ color: spent > total ? c.negative : c.textSecondary, fontSize: 12, marginTop: 2, marginBottom: 10 }}>{Math.round(spent / total * 100)}% terpakai · sisa {rupiah(Math.max(0, total - spent))}</Text>
        <ProgressBar ratio={spent / total} warnOver />
      </Panel>
      <Panel style={{ paddingVertical: 4 }}>{rows.map((row, index) => {
        const ratio = row.spent / row.amount; const icon = categoryIcon(row.icon);
        return <Pressable key={row.id} onPress={() => router.push({ pathname: '/budget-form', params: { id: String(row.id), period } })} accessibilityRole="button" accessibilityLabel={`Edit anggaran ${row.category_name}`} style={({ pressed }) => [{ paddingVertical: 12, borderBottomWidth: index === rows.length - 1 ? 0 : 1, borderBottomColor: c.line }, pressed && { opacity: 0.7 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconTile name={icon} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{row.category_name}</Text><Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 3 }}>{rupiah(row.spent)} / {rupiah(row.amount)}</Text></View>
            <Text style={{ color: ratio > 1 ? c.negative : c.text, fontSize: 13, fontWeight: '800' }}>{Math.round(ratio * 100)}%</Text>
          </View>
          <View style={{ marginTop: 10, marginLeft: 52 }}><ProgressBar ratio={ratio} tint={icons[icon].tint} warnOver /></View>
        </Pressable>;
      })}</Panel>
    </> : !loadError ? <Panel><EmptyState title="Belum ada anggaran" message="Tetapkan batas pengeluaran per kategori untuk bulan ini." action={<PrimaryButton label="Buat Anggaran" onPress={add} />} /></Panel> : null}
  </Screen>;
}
