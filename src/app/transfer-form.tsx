import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { DateField } from '@/components/date-field';
import { useTheme } from '@/hooks/use-theme';
import { walletIcon } from '@/components/app-icon';
import { Choice, EmptyState, Field, PrimaryButton, Screen, styles } from '@/components/finance-ui';
import { formatThousands, isValidISODate, parseRupiah, rupiah, todayISO } from '@/database/format';
import { getWallets, saveTransfer } from '@/database/repository';
import type { Wallet } from '@/database/types';
import { showMessage } from '@/utils/show-message';
import { playMoneySound } from '@/utils/sound';
import { claimNewlyReachedGoals } from '@/database/planning-repository';

export default function TransferFormScreen() {
  const db = useSQLiteContext(); const c = useTheme(); const s = styles(c); const params = useLocalSearchParams<{ fromWalletId?: string }>(); const presetFrom = params.fromWalletId ? Number(params.fromWalletId) : undefined;
  const [wallets, setWallets] = useState<Wallet[]>([]); const [fromId, setFromId] = useState<number>(); const [toId, setToId] = useState<number>(); const [amountText, setAmountText] = useState(''); const [date, setDate] = useState(todayISO()); const [note, setNote] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const saveInProgress = useRef(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    getWallets(db).then((rows) => {
      if (!active) return;
      const from = rows.find((w) => w.id === presetFrom) ?? rows[0];
      setWallets(rows); setFromId(from?.id); setToId(rows.find((w) => w.id !== from?.id)?.id); setLoading(false);
    }).catch((error: unknown) => {
      if (__DEV__) console.error('[Kantongin] Failed to load wallets for transfer', error);
      if (active) { setLoading(false); showMessage('Kantong gagal dimuat', 'Kembali lalu coba buka ulang form transfer.'); }
    });
    return () => { active = false; };
  }, [db, presetFrom]));
  const pickFrom = (id: number) => { setFromId(id); if (toId === id) setToId(wallets.find((w) => w.id !== id)?.id); };
  const submit = async () => {
    if (saveInProgress.current || loading) return;
    const amount = parseRupiah(amountText);
    if (amount <= 0) { showMessage('Nominal belum valid', 'Masukkan nominal yang lebih besar dari nol.'); return; }
    if (!fromId || !toId) { showMessage('Data belum lengkap', 'Pilih kantong asal dan tujuan.'); return; }
    if (!isValidISODate(date)) { showMessage('Tanggal belum valid', 'Gunakan tanggal yang benar dengan format YYYY-MM-DD.'); return; }
    saveInProgress.current = true; setSaving(true);
    try { await saveTransfer(db, { from_wallet_id: fromId, to_wallet_id: toId, amount, note, transfer_date: date }); void playMoneySound(() => claimNewlyReachedGoals(db)); router.back(); }
    catch (error) { if (__DEV__) console.error('[Kantongin] Failed to save transfer', error); showMessage('Transfer tidak tersimpan', error instanceof Error ? error.message : 'Silakan coba lagi.'); }
    finally { saveInProgress.current = false; setSaving(false); }
  };
  const from = wallets.find((w) => w.id === fromId);
  const blocked = wallets.length < 2 && !loading;
  return <Screen variant="form" title="Transfer" footer={blocked ? undefined : <PrimaryButton label={saving ? 'Menyimpan…' : 'Transfer'} icon="transfer" onPress={submit} disabled={saving || loading} />}>
    {blocked ? <EmptyState title="Butuh dua kantong" message="Buat minimal dua kantong untuk memindahkan saldo." action={<PrimaryButton label="Buat Kantong" onPress={() => router.replace('/wallet-form')} />} /> : <>
      <Field label="Jumlah" value={formatThousands(amountText)} onChangeText={(v) => setAmountText(v.replace(/\D/g, '').replace(/^0+/, ''))} keyboardType="numeric" placeholder="0" prefix="Rp" large />
      <Text style={s.label}>Dari kantong</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 2 }}>{wallets.map((w) => <Choice key={w.id} label={w.name} icon={walletIcon(w.icon)} selected={fromId === w.id} onPress={() => pickFrom(w.id)} />)}</View>
      {from ? <Text style={{ color: c.textSecondary, fontSize: 11, marginBottom: 14 }}>Saldo tersedia {rupiah(from.balance ?? from.initial_balance)}</Text> : null}
      <Text style={s.label}>Ke kantong</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>{wallets.filter((w) => w.id !== fromId).map((w) => <Choice key={w.id} label={w.name} icon={walletIcon(w.icon)} selected={toId === w.id} onPress={() => setToId(w.id)} />)}</View>
      <DateField label="Tanggal" value={date} onChange={setDate} />
      <Field label="Catatan" value={note} onChangeText={setNote} placeholder="Contoh: Sisihkan untuk tabungan" />
    </>}
  </Screen>;
}
