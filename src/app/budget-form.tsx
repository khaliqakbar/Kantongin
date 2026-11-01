import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { categoryIcon } from '@/components/app-icon';
import { Choice, Field, MonthSwitcher, PrimaryButton, Screen, styles } from '@/components/finance-ui';
import { getCategories } from '@/database/repository';
import { deleteBudget, getBudgets, saveBudget } from '@/database/planning-repository';
import { currentPeriod, parseRupiah, rupiah } from '@/database/format';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructiveAction } from '@/utils/confirm-destructive-action';
import { showMessage } from '@/utils/show-message';
import type { Category } from '@/database/types';

export default function BudgetForm() {
  const db = useSQLiteContext(), c = useTheme(), s = styles(c), params = useLocalSearchParams<{ id?: string; period?: string }>();
  const editId = params.id ? Number(params.id) : undefined;
  const [cats, setCats] = useState<Category[]>([]); const [category, setCategory] = useState(0); const [period, setPeriod] = useState(params.period ?? currentPeriod()); const [amount, setAmount] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  useEffect(() => {
    getCategories(db, 'expense').then(async (list) => {
      setCats(list);
      if (editId) {
        const existing = (await getBudgets(db, params.period ?? currentPeriod())).find((x) => x.id === editId);
        if (existing) { setCategory(existing.category_id); setAmount(String(existing.amount)); setPeriod(existing.period); }
      } else if (list[0]) setCategory(list[0].id);
    }).catch((e) => { if (__DEV__) console.error('[Kantongin] Load budget form failed', e); showMessage('Tidak dapat membuka anggaran', 'Coba kembali.'); });
  }, [db, editId, params.period]);
  const submit = async () => {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { await saveBudget(db, category, period, parseRupiah(amount), editId); router.back(); }
    catch (e) { if (__DEV__) console.error('[Kantongin] Save budget failed', e); showMessage('Anggaran belum tersimpan', e instanceof Error ? e.message : 'Terjadi kesalahan.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const remove = () => editId && confirmDestructiveAction('Hapus anggaran?', 'Riwayat transaksi tetap tersimpan.', async () => { await deleteBudget(db, editId); router.back(); }, (error) => { if (__DEV__) console.error('[Kantongin] Delete budget failed', error); });
  return <Screen variant="form" title={editId ? 'Edit Anggaran' : 'Buat Anggaran'} footer={<PrimaryButton label={busy ? 'Menyimpan…' : 'Simpan Anggaran'} onPress={submit} disabled={busy} />}>
    <Text style={s.label}>Periode</Text>
    <MonthSwitcher period={period} onChange={setPeriod} />
    <Field label="Batas anggaran" value={amount} onChangeText={(v) => setAmount(v.replace(/\D/g, ''))} keyboardType="numeric" placeholder="0" prefix="Rp" large />
    {amount ? <Text style={{ color: c.sageStrong, fontSize: 12, marginTop: -8, marginBottom: 12 }}>{rupiah(parseRupiah(amount))}</Text> : null}
    <Text style={s.label}>Kategori pengeluaran</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{cats.map((cat) => <Choice key={cat.id} label={cat.name} icon={categoryIcon(cat.icon)} selected={category === cat.id} onPress={() => setCategory(cat.id)} />)}</View>
    {editId ? <View style={{ marginTop: 16 }}><PrimaryButton label="Hapus Anggaran" icon="delete" danger onPress={remove} /></View> : null}
  </Screen>;
}
