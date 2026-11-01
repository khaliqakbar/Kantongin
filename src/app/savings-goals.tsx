import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { IconTile, walletIcon, walletTint } from '@/components/app-icon';
import { EmptyState, IconButton, MochiImage, Panel, PrimaryButton, ProgressBar, Screen } from '@/components/finance-ui';
import { getGoals, type GoalRow } from '@/database/planning-repository';
import { formatDate, rupiah, todayISO } from '@/database/format';

function daysUntil(date: string) {
  const [y, m, d] = date.split('-').map(Number); const [ty, tm, td] = todayISO().split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000);
}

export default function SavingsGoals() {
  const db = useSQLiteContext(), c = useTheme(); const [rows, setRows] = useState<GoalRow[]>([]); const [loadError, setLoadError] = useState(false);
  useFocusEffect(useCallback(() => { let active = true; getGoals(db).then((data) => { if (active) { setRows(data); setLoadError(false); } }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Load goals failed', error); if (active) setLoadError(true); }); return () => { active = false; }; }, [db]));
  const add = () => router.push('/savings-goal-form');

  return <Screen title="Target Tabungan" back action={<IconButton icon="add" label="Buat target" tone="filled" onPress={add} />}>
    <View style={{ alignItems: 'center', marginBottom: 6 }}><MochiImage name="savings" width={210} /></View>
    {loadError ? <Text style={{ color: c.negative, fontSize: 12, marginBottom: 12 }}>Target gagal dimuat. Coba buka kembali halaman.</Text> : null}
    {rows.map((goal) => {
      const ratio = Math.max(0, goal.balance) / goal.target_amount; const tint = walletTint({ icon: goal.icon, color: goal.color }); const left = goal.target_date ? daysUntil(goal.target_date) : null;
      return <Pressable key={goal.id} onPress={() => router.push({ pathname: '/savings-goal-form', params: { id: String(goal.id) } })} accessibilityRole="button" accessibilityLabel={`Edit target ${goal.title}`} style={({ pressed }) => [{ marginBottom: 10 }, pressed && { opacity: 0.8 }]}><Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile name={walletIcon(goal.icon)} tint={tint} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>{goal.title}</Text><Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 3 }} numberOfLines={1}>Kantong {goal.wallet_name}{goal.target_date ? ` · ${formatDate(goal.target_date)}` : ''}</Text></View>
          <Text style={{ color: ratio >= 1 ? c.positive : c.text, fontSize: 14, fontWeight: '800' }}>{Math.min(999, Math.round(ratio * 100))}%</Text>
        </View>
        <View style={{ marginTop: 12 }}><ProgressBar ratio={ratio} tint={tint} /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>{rupiah(Math.max(0, goal.balance))} dari {rupiah(goal.target_amount)}</Text>
          {ratio >= 1 ? <Text style={{ color: c.positive, fontSize: 11, fontWeight: '700' }}>Tercapai 🎉</Text> : left !== null ? <Text style={{ color: left < 0 ? c.negative : c.textSecondary, fontSize: 11 }}>{left < 0 ? 'Lewat tenggat' : left === 0 ? 'Hari ini' : `${left} hari lagi`}</Text> : null}
        </View>
      </Panel></Pressable>;
    })}
    {!rows.length && !loadError ? <Panel><EmptyState title="Belum ada target" message="Pilih kantong tabungan dan tetapkan nominal yang ingin dicapai." action={<PrimaryButton label="Buat Target" onPress={add} />} /></Panel> : null}
    {rows.length ? <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 6, textAlign: 'center' }}>Progres mengikuti saldo kantong. Tambah saldo lewat pemasukan atau transfer ke kantong target.</Text> : null}
  </Screen>;
}
