import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { categoryIcon, walletIcon } from '@/components/app-icon';
import { Choice, Field, PrimaryButton, Screen, Segmented, styles } from '@/components/finance-ui';
import { getCategories, getWallets } from '@/database/repository';
import { deleteRecurring, getRecurring, saveRecurring, type RecurringRow } from '@/database/planning-repository';
import { formatThousands, parseRupiah, todayISO } from '@/database/format';
import { DateField } from '@/components/date-field';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructiveAction } from '@/utils/confirm-destructive-action';
import { showMessage } from '@/utils/show-message';
import type { Category, EntryType, Wallet } from '@/database/types';

type Frequency = RecurringRow['frequency'];

export default function RecurringForm() {
  const db = useSQLiteContext(), c = useTheme(), s = styles(c), params = useLocalSearchParams<{ id?: string }>(); const editId = params.id ? Number(params.id) : undefined;
  const [type, setType] = useState<EntryType>('expense'); const [cats, setCats] = useState<Category[]>([]); const [wallets, setWallets] = useState<Wallet[]>([]); const [category, setCategory] = useState(0); const [walletId, setWalletId] = useState(0); const [amount, setAmount] = useState(''); const [note, setNote] = useState(''); const [frequency, setFrequency] = useState<Frequency>('monthly'); const [nextDate, setNextDate] = useState(todayISO()); const [endDate, setEndDate] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  useEffect(() => {
    Promise.all([getCategories(db, 'expense'), getWallets(db), getRecurring(db)]).then(([cs, ws, rs]) => {
      setCats(cs); setWallets(ws); if (ws[0]) setWalletId(ws[0].id); if (cs[0]) setCategory(cs[0].id);
      if (editId) { const r = rs.find((x) => x.id === editId); if (r) { setType(r.type); setCategory(r.category_id); setWalletId(r.wallet_id); setAmount(String(r.amount)); setNote(r.note); setFrequency(r.frequency); setNextDate(r.next_date); setEndDate(r.end_date ?? ''); } }
    }).catch((e) => { if (__DEV__) console.error('[Kantongin] Load recurring form failed', e); showMessage('Tidak dapat membuka jadwal', 'Coba kembali.'); });
  }, [db, editId]);
  useEffect(() => {
    getCategories(db, type).then((list) => { setCats(list); if (!list.some((x) => x.id === category)) setCategory(list[0]?.id ?? 0); }).catch((e) => { if (__DEV__) console.error('[Kantongin] Load matching categories failed', e); });
  }, [db, type, category]);
  const submit = async () => {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { await saveRecurring(db, { type, wallet_id: walletId, category_id: category, amount: parseRupiah(amount), note, frequency, next_date: nextDate, end_date: endDate.trim() || null }, editId); router.back(); }
    catch (e) { if (__DEV__) console.error('[Kantongin] Save recurring failed', e); showMessage('Jadwal belum tersimpan', e instanceof Error ? e.message : 'Terjadi kesalahan.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const remove = () => editId && confirmDestructiveAction('Hapus jadwal?', 'Transaksi yang sudah tercatat tetap tersimpan.', async () => { await deleteRecurring(db, editId); router.back(); }, (error) => { if (__DEV__) console.error('[Kantongin] Delete recurring failed', error); });
  return <Screen variant="form" title={editId ? 'Edit Jadwal' : 'Jadwal Baru'} footer={<PrimaryButton label={busy ? 'Menyimpan…' : 'Simpan Jadwal'} onPress={submit} disabled={busy} />}>
    <Segmented options={[{ value: 'expense', label: 'Pengeluaran' }, { value: 'income', label: 'Pemasukan' }]} value={type} onChange={setType} />
    <Field label="Jumlah" value={formatThousands(amount)} onChangeText={(v) => setAmount(v.replace(/\D/g, '').replace(/^0+/, ''))} keyboardType="numeric" placeholder="0" prefix="Rp" large />
    <Field label="Nama / catatan" value={note} onChangeText={setNote} placeholder="Contoh: WiFi Rumah" />
    <Text style={s.label}>Kategori</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>{cats.map((x) => <Choice key={x.id} label={x.name} icon={categoryIcon(x.icon)} selected={category === x.id} onPress={() => setCategory(x.id)} />)}</View>
    <Text style={s.label}>Kantong</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>{wallets.map((w) => <Choice key={w.id} label={w.name} icon={walletIcon(w.icon)} selected={walletId === w.id} onPress={() => setWalletId(w.id)} />)}</View>
    <Text style={s.label}>Frekuensi</Text>
    <Segmented options={[{ value: 'daily', label: 'Harian' }, { value: 'weekly', label: 'Mingguan' }, { value: 'monthly', label: 'Bulanan' }]} value={frequency} onChange={setFrequency} />
    <DateField label="Tanggal berikutnya" value={nextDate} onChange={setNextDate} />
    <DateField label="Tanggal akhir (opsional)" value={endDate} onChange={setEndDate} optional placeholder="Tanpa batas" />
    <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: -4 }}>Transaksi dicatat otomatis saat aplikasi dibuka pada atau setelah tanggal jadwal.</Text>
    {editId ? <View style={{ marginTop: 18 }}><PrimaryButton label="Hapus Jadwal" icon="delete" danger onPress={remove} /></View> : null}
  </Screen>;
}
