import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/text';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { walletIcon } from '@/components/app-icon';
import { Choice, Field, MochiImage, PrimaryButton, Screen, styles } from '@/components/finance-ui';
import { getWallets } from '@/database/repository';
import { claimNewlyReachedGoals, deleteGoal, getGoals, saveGoal } from '@/database/planning-repository';
import { formatThousands, parseRupiah, rupiah } from '@/database/format';
import { DateField } from '@/components/date-field';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructiveAction } from '@/utils/confirm-destructive-action';
import { showMessage } from '@/utils/show-message';
import { playSound } from '@/utils/sound';
import type { Wallet } from '@/database/types';

export default function SavingsGoalForm() {
  const db = useSQLiteContext(), c = useTheme(), s = styles(c), params = useLocalSearchParams<{ id?: string }>(); const editId = params.id ? Number(params.id) : undefined;
  const [wallets, setWallets] = useState<Wallet[]>([]); const [walletId, setWalletId] = useState(0); const [title, setTitle] = useState(''); const [target, setTarget] = useState(''); const [date, setDate] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  useEffect(() => {
    Promise.all([getWallets(db), getGoals(db)]).then(([ws, gs]) => {
      setWallets(ws);
      if (editId) { const g = gs.find((x) => x.id === editId); if (g) { setWalletId(g.wallet_id); setTitle(g.title); setTarget(String(g.target_amount)); setDate(g.target_date ?? ''); } }
      else { const taken = new Set(gs.map((g) => g.wallet_id)); setWalletId((ws.find((w) => w.kind === 'saving' && !taken.has(w.id)) ?? ws.find((w) => !taken.has(w.id)) ?? ws[0])?.id ?? 0); }
    }).catch((e) => { if (__DEV__) console.error('[Kantongin] Load goal form failed', e); showMessage('Tidak dapat membuka target', 'Coba kembali.'); });
  }, [db, editId]);
  const submit = async () => {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { await saveGoal(db, { wallet_id: walletId, title, target_amount: parseRupiah(target), target_date: date.trim() || null }, editId); void claimNewlyReachedGoals(db).then((reached) => reached.length ? playSound('celebration') : undefined).catch(() => {}); router.back(); }
    catch (e) { if (__DEV__) console.error('[Kantongin] Save goal failed', e); const message = e instanceof Error && /UNIQUE/i.test(e.message) ? 'Kantong ini sudah punya target. Pilih kantong lain.' : e instanceof Error ? e.message : 'Terjadi kesalahan.'; showMessage('Target belum tersimpan', message); }
    finally { lock.current = false; setBusy(false); }
  };
  const remove = () => editId && confirmDestructiveAction('Hapus target?', `Target “${title}” dihapus; transaksi dan saldo kantong tetap tersimpan.`, async () => { await deleteGoal(db, editId); router.back(); }, (error) => { if (__DEV__) console.error('[Kantongin] Delete goal failed', error); });
  const wallet = wallets.find((w) => w.id === walletId);
  return <Screen variant="form" title={editId ? 'Edit Target' : 'Target Tabungan'} footer={<PrimaryButton label={busy ? 'Menyimpan…' : editId ? 'Simpan Target' : 'Buat Target'} onPress={submit} disabled={busy} />}>
    <View style={{ alignItems: 'center', marginBottom: 8 }}><MochiImage name="savings" width={220} /></View>
    <Field label="Nama Target" value={title} onChangeText={setTitle} placeholder="Contoh: Laptop Baru" />
    <Field label="Target Nominal" value={formatThousands(target)} onChangeText={(v) => setTarget(v.replace(/\D/g, '').replace(/^0+/, ''))} keyboardType="numeric" placeholder="0" prefix="Rp" />
    <DateField label="Tanggal Target (opsional)" value={date} onChange={setDate} optional placeholder="Tanpa tenggat" />
    <Text style={s.label}>Dana tersimpan di kantong</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{wallets.map((w) => <Choice key={w.id} label={w.name} icon={walletIcon(w.icon)} selected={walletId === w.id} onPress={() => setWalletId(w.id)} />)}</View>
    {wallet ? <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>Saldo saat ini {rupiah(wallet.balance ?? wallet.initial_balance)}</Text> : null}
    {editId ? <View style={{ marginTop: 18 }}><PrimaryButton label="Hapus Target" icon="delete" danger onPress={remove} /></View> : null}
  </Screen>;
}
