import { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { DateField } from '@/components/date-field';
import { useTheme } from '@/hooks/use-theme';
import { categoryIcon, IconTile, icons, walletIcon } from '@/components/app-icon';
import { Choice, Field, Panel, PrimaryButton, Screen, Segmented, styles } from '@/components/finance-ui';
import { formatThousands, isValidISODate, parseRupiah, todayISO } from '@/database/format';
import { getCategories, getTransaction, getWallets, saveTransaction, TransactionSaveError } from '@/database/repository';
import type { Category, EntryType, Wallet } from '@/database/types';
import { showMessage } from '@/utils/show-message';
import { playMoneySound } from '@/utils/sound';
import { claimNewlyReachedGoals } from '@/database/planning-repository';

export default function TransactionFormScreen() {
  const db = useSQLiteContext(); const c = useTheme(); const s = styles(c); const params = useLocalSearchParams<{ id?: string; walletId?: string; type?: string; scanned?: string; amount?: string; date?: string; note?: string }>(); const editId = params.id ? Number(params.id) : undefined; const presetWalletId = params.walletId ? Number(params.walletId) : undefined; const presetType: EntryType = params.type === 'income' ? 'income' : 'expense';
  const [type, setType] = useState<EntryType>('expense'); const [amountText, setAmountText] = useState(params.amount?.replace(/\D/g, '') ?? ''); const [categoryId, setCategoryId] = useState<number>(); const [walletId, setWalletId] = useState<number>(); const [date, setDate] = useState(params.date && isValidISODate(params.date) ? params.date : todayISO()); const [note, setNote] = useState(params.note ?? ''); const scanned = params.scanned === '1' && !editId; const [categories, setCategories] = useState<Category[]>([]); const [wallets, setWallets] = useState<Wallet[]>([]); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(false); const [saving, setSaving] = useState(false); const saveInProgress = useRef(false); const categoryRequest = useRef(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([getCategories(db), getWallets(db), editId ? getTransaction(db, editId) : Promise.resolve(null)]).then(([allCategories, allWallets, transaction]) => {
      if (!active) return;
      categoryRequest.current += 1;
      const nextType = transaction?.type ?? presetType; setType(nextType); setCategories(allCategories.filter((cat) => cat.type === nextType)); setWallets(allWallets);
      if (transaction) { setAmountText(String(transaction.amount)); setCategoryId(transaction.category_id); setWalletId(transaction.wallet_id); setDate(transaction.transaction_date); setNote(transaction.note); }
      // A scanned receipt is most likely shopping, so start on Belanja when that category exists.
      else { const nextCategories = allCategories.filter((cat) => cat.type === nextType); setCategoryId((scanned && nextCategories.find((cat) => /belanja/i.test(cat.name))?.id) || nextCategories[0]?.id); setWalletId(presetWalletId ?? allWallets[0]?.id); }
      setLoadError(false); setLoading(false);
    }).catch((error: unknown) => {
      if (__DEV__) console.error('[Kantongin] Failed to load transaction form data', error);
      if (active) { setLoadError(true); setLoading(false); }
    });
    return () => { active = false; };
  }, [db, editId, presetWalletId, presetType, scanned]));
  const changeType = (next: EntryType) => {
    const request = ++categoryRequest.current;
    setType(next);
    setCategories([]);
    setCategoryId(undefined);
    getCategories(db, next).then((rows) => { if (request !== categoryRequest.current) return; setCategories(rows); setCategoryId(rows[0]?.id); }).catch((error: unknown) => {
      if (request !== categoryRequest.current) return;
      if (__DEV__) console.error('[Kantongin] Failed to load transaction categories', error);
      setLoadError(true);
    });
  };
  const submit = async () => {
    if (saveInProgress.current || loading) return;
    const amount = parseRupiah(amountText);
    if (amount <= 0) { showMessage('Nominal belum valid', 'Masukkan nominal yang lebih besar dari nol.'); return; }
    if (!categoryId || !walletId) { showMessage('Data belum lengkap', 'Pilih kategori dan kantong.'); return; }
    if (!isValidISODate(date)) { showMessage('Tanggal belum valid', 'Gunakan tanggal yang benar dengan format YYYY-MM-DD.'); return; }
    saveInProgress.current = true;
    setSaving(true);
    try {
      await saveTransaction(db, { type, amount, category_id: categoryId, wallet_id: walletId, transaction_date: date, note }, editId);
      void playMoneySound(() => claimNewlyReachedGoals(db));
      router.back();
    } catch (error) {
      if (__DEV__) console.error('[Kantongin] Failed to save transaction', { error, type, amount, categoryId, walletId, date, editId });
      let title = 'Kesalahan tidak dikenal';
      let message = error instanceof Error ? error.message : String(error);
      if (error instanceof TransactionSaveError) {
        if (error.kind === 'validation') title = 'Data transaksi tidak valid';
        else if (error.kind === 'category') title = 'Kategori transaksi bermasalah';
        else if (error.kind === 'wallet') title = 'Kantong transaksi bermasalah';
        else if (error.kind === 'foreign-key') title = 'Relasi data ditolak SQLite';
        else if (error.kind === 'database') title = 'Kesalahan database';
      }
      showMessage('Transaksi tidak tersimpan', `${title}: ${message}`);
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  };
  const title = editId ? 'Edit Transaksi' : 'Tambah Transaksi';
  return <Screen variant="form" title={title} footer={loading || loadError ? undefined : <PrimaryButton label={saving ? 'Menyimpan…' : 'Simpan'} onPress={submit} disabled={loading || saving} />}>
    {loadError ? <Panel><Text style={{ color: c.negative, textAlign: 'center' }}>Data transaksi gagal dimuat. Tutup form dan coba buka kembali.</Text></Panel> : loading ? <Panel><Text style={{ color: c.textSecondary, textAlign: 'center' }}>Memuat kategori dan kantong…</Text></Panel> : <>
      {scanned ? <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}><IconTile name="scan" size={36} /><Text style={{ flex: 1, color: c.textSecondary, fontSize: 12 }}>Diisi dari scan struk. Cek lagi nominal, tanggal, dan kategori sebelum menyimpan.</Text></Panel> : null}
      <Segmented options={[{ value: 'expense', label: 'Pengeluaran' }, { value: 'income', label: 'Pemasukan' }]} value={type} onChange={(next) => next !== type && changeType(next)} />
      <Field label="Jumlah" value={formatThousands(amountText)} onChangeText={(v) => setAmountText(v.replace(/\D/g, '').replace(/^0+/, ''))} placeholder="0" keyboardType="numeric" prefix="Rp" large />
      <Text style={s.label}>Kategori</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, marginHorizontal: -4 }}>{categories.map((cat) => {
        const selected = categoryId === cat.id; const icon = categoryIcon(cat.icon);
        return <Pressable key={cat.id} onPress={() => setCategoryId(cat.id)} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={cat.name} style={{ width: '20%', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 }}>
          <View style={{ borderRadius: 18, borderWidth: 2, borderColor: selected ? icons[icon].tint : 'transparent', padding: 2 }}><IconTile name={icon} size={44} radius={15} /></View>
          <Text style={{ color: selected ? c.text : c.textSecondary, fontSize: 10, fontWeight: selected ? '800' : '600', marginTop: 4 }} numberOfLines={1}>{cat.name}</Text>
        </Pressable>;
      })}</View>
      <Text style={s.label}>Kantong</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>{wallets.map((wallet) => <Choice key={wallet.id} label={wallet.name} icon={walletIcon(wallet.icon)} selected={walletId === wallet.id} onPress={() => setWalletId(wallet.id)} />)}</View>
      <DateField label="Tanggal" value={date} onChange={setDate} />
      <Field label="Catatan" value={note} onChangeText={setNote} placeholder="Contoh: Jajan kopi" />
    </>}
  </Screen>;
}
