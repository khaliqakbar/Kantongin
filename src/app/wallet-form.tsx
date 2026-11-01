import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon, IconTile, walletColorChoices, walletIconChoices, walletIcon, walletTint, type IconName } from '@/components/app-icon';
import { Field, PrimaryButton, Screen, styles } from '@/components/finance-ui';
import { formatThousands, parseRupiah } from '@/database/format';
import { getWallets, saveWallet } from '@/database/repository';
import type { WalletKind } from '@/database/types';
import { showMessage } from '@/utils/show-message';
import { playSound } from '@/utils/sound';

const kindOptions: { value: WalletKind; title: string; hint: string; icon: IconName }[] = [
  { value: 'spending', title: 'Pengeluaran', hint: 'Untuk kebutuhan sehari-hari', icon: 'wallet' },
  { value: 'saving', title: 'Tabungan', hint: 'Untuk tujuan jangka panjang', icon: 'savings' },
];
const digits = (v: string) => v.replace(/\D/g, '').replace(/^0+/, '');

export default function WalletFormScreen() {
  const db = useSQLiteContext(); const c = useTheme(); const s = styles(c); const params = useLocalSearchParams<{ id?: string }>(); const editId = params.id ? Number(params.id) : undefined;
  const [name, setName] = useState(''); const [kind, setKind] = useState<WalletKind>('spending'); const [balance, setBalance] = useState(''); const [target, setTarget] = useState(''); const [icon, setIcon] = useState<IconName>(walletIconChoices[0]); const [color, setColor] = useState(walletColorChoices[0]); const [saving, setSaving] = useState(false);
  useFocusEffect(useCallback(() => { if (!editId) return; let active = true; getWallets(db).then((rows) => { const w = rows.find((item) => item.id === editId); if (active && w) { setName(w.name); setKind(w.kind); setBalance(w.initial_balance ? String(w.initial_balance) : ''); setTarget(w.target_amount ? String(w.target_amount) : ''); setIcon(walletIcon(w.icon)); setColor(walletTint(w)); } }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Failed to load wallet for editing', { editId, error }); if (active) showMessage('Kantong gagal dimuat', 'Kembali lalu coba buka ulang form edit.'); }); return () => { active = false; }; }, [db, editId]));
  const submit = async () => {
    if (saving) return;
    if (!name.trim()) { showMessage('Nama kantong diperlukan', 'Isi nama kantong terlebih dahulu.'); return; }
    const targetAmount = parseRupiah(target); setSaving(true);
    try { await saveWallet(db, { name, kind, target_amount: targetAmount > 0 ? targetAmount : null, initial_balance: parseRupiah(balance), icon, color }, editId); if (!editId) void playSound('pocket'); router.back(); }
    catch (error) { if (__DEV__) console.error('[Kantongin] Failed to save wallet', { editId, error }); showMessage('Kantong tidak tersimpan', error instanceof Error ? error.message : 'Silakan coba lagi.'); }
    finally { setSaving(false); }
  };
  return <Screen variant="form" title={editId ? 'Edit Kantong' : 'Buat Kantong'} footer={<PrimaryButton label={saving ? 'Menyimpan…' : editId ? 'Simpan Perubahan' : 'Buat Kantong'} onPress={submit} disabled={saving} />}>
    <Field label="Nama Kantong" value={name} onChangeText={setName} placeholder="Contoh: Hiburan" />
    <Text style={s.label}>Tipe Kantong</Text>
    <View style={{ gap: 8, marginBottom: 16 }}>{kindOptions.map((item) => {
      const selected = kind === item.value;
      return <Pressable key={item.value} onPress={() => setKind(item.value)} accessibilityRole="radio" accessibilityState={{ selected }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: selected ? c.forest : c.border, backgroundColor: c.surface }}>
        <IconTile name={item.icon} size={38} />
        <View style={{ flex: 1 }}><Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{item.title}</Text><Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>{item.hint}</Text></View>
        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? c.forest : c.border, alignItems: 'center', justifyContent: 'center' }}>{selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.forest }} /> : null}</View>
      </Pressable>;
    })}</View>
    <Text style={s.label}>Ikon & Warna</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>{walletIconChoices.map((item) => {
      const selected = icon === item;
      return <Pressable key={item} onPress={() => setIcon(item)} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`Ikon ${item}`} style={{ borderRadius: 16, borderWidth: 2, borderColor: selected ? color : 'transparent', padding: 2 }}><IconTile name={item} tint={selected ? color : c.textSecondary} size={42} /></Pressable>;
    })}</View>
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>{walletColorChoices.map((item) => {
      const selected = color === item;
      return <Pressable key={item} onPress={() => setColor(item)} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`Warna ${item}`} hitSlop={4} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: item, alignItems: 'center', justifyContent: 'center', borderWidth: selected ? 3 : 0, borderColor: c.surface }}>{selected ? <AppIcon name="check" size={16} color="#FFFFFF" /> : null}</Pressable>;
    })}</View>
    <Field label="Saldo Awal" value={formatThousands(balance)} onChangeText={(v) => setBalance(digits(v))} keyboardType="numeric" placeholder="0" prefix="Rp" />
    <Field label={kind === 'saving' ? 'Target Saldo (Opsional)' : 'Target Bulanan (Opsional)'} value={formatThousands(target)} onChangeText={(v) => setTarget(digits(v))} keyboardType="numeric" placeholder="Tanpa target" prefix="Rp" />
    <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: -6 }}>{kind === 'saving' ? 'Progres dihitung dari saldo kantong.' : 'Progres dihitung dari pengeluaran kantong bulan ini.'}</Text>
  </Screen>;
}
