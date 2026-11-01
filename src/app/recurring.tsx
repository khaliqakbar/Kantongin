import { useCallback, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { categoryIcon, IconTile } from '@/components/app-icon';
import { EmptyState, MochiImage, Panel, PrimaryButton, Screen, Segmented } from '@/components/finance-ui';
import { getRecurring, setRecurringActive, type RecurringRow } from '@/database/planning-repository';
import { formatDate, rupiah } from '@/database/format';
import { showMessage } from '@/utils/show-message';

const frequencyLabel = { daily: 'Setiap hari', weekly: 'Setiap minggu', monthly: 'Setiap bulan' };

export default function RecurringScreen() {
  const db = useSQLiteContext(), c = useTheme(); const [rows, setRows] = useState<RecurringRow[]>([]); const [tab, setTab] = useState<'active' | 'inactive'>('active'); const [loadError, setLoadError] = useState(false);
  const load = useCallback(() => { let active = true; getRecurring(db).then((data) => { if (active) { setRows(data); setLoadError(false); } }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Load recurring failed', error); if (active) setLoadError(true); }); return () => { active = false; }; }, [db]);
  useFocusEffect(load);
  const toggleActive = async (row: RecurringRow) => {
    try { await setRecurringActive(db, row.id, !row.is_active); load(); }
    catch (error) { if (__DEV__) console.error('[Kantongin] Update recurring status failed', error); showMessage('Status belum tersimpan', 'Coba kembali.'); }
  };
  const visible = rows.filter((row) => (tab === 'active') === Boolean(row.is_active));
  const add = () => router.push('/recurring-form');

  return <Screen variant="form" title="Transaksi Berulang" footer={<PrimaryButton label="Tambah Transaksi Berulang" icon="add" onPress={add} />}>
    <Segmented options={[{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Dijeda / Selesai' }]} value={tab} onChange={setTab} />
    {loadError ? <Text style={{ color: c.negative, fontSize: 12, marginBottom: 12 }}>Jadwal gagal dimuat. Coba buka kembali halaman.</Text> : null}
    {visible.length ? <Panel style={{ paddingVertical: 4 }}>{visible.map((row, index) => <View key={row.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: index === visible.length - 1 ? 0 : 1, borderBottomColor: c.line }}>
      <Pressable onPress={() => router.push({ pathname: '/recurring-form', params: { id: String(row.id) } })} accessibilityRole="button" accessibilityLabel={`Edit jadwal ${row.note || row.category_name}`} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile name={categoryIcon(row.category_icon)} size={42} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{row.note || row.category_name}</Text>
          <Text style={{ color: row.type === 'income' ? c.positive : c.text, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{row.type === 'income' ? '+' : '-'}{rupiah(row.amount)}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{frequencyLabel[row.frequency]} · {row.is_active ? `berikutnya ${formatDate(row.next_date)}` : row.wallet_name}</Text>
        </View>
      </Pressable>
      <Switch value={Boolean(row.is_active)} onValueChange={() => void toggleActive(row)} accessibilityLabel={row.is_active ? 'Jeda jadwal' : 'Aktifkan jadwal'} trackColor={{ false: c.border, true: c.forest }} thumbColor="#FFFFFF" />
    </View>)}</Panel>
      : !loadError ? <Panel><EmptyState title={tab === 'active' ? 'Belum ada jadwal aktif' : 'Tidak ada jadwal yang dijeda'} message={tab === 'active' ? 'Catat tagihan atau gaji rutin sekali, sisanya Mochi yang ingat.' : 'Jadwal yang kamu jeda atau yang sudah selesai akan muncul di sini.'} /></Panel> : null}
    <View style={{ alignItems: 'center', marginTop: 14 }}><MochiImage name="recurring" width={240} /></View>
  </Screen>;
}
