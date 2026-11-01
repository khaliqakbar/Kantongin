import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { categoryIcon, IconTile, walletIcon, walletTint, type IconName } from '@/components/app-icon';
import { EmptyState, ListRow, MochiImage, Panel, PrimaryButton, ProgressBar, Screen, Segmented } from '@/components/finance-ui';
import { currentPeriod, formatDate, rupiah } from '@/database/format';
import { deleteTransfer, deleteWallet, getTransactions, getTransfers, getWallets, walletKindLabel, walletTargetProgress } from '@/database/repository';
import type { Transaction, Transfer, Wallet } from '@/database/types';
import { confirmDestructiveAction } from '@/utils/confirm-destructive-action';

type HistoryEntry = { kind: 'transaction'; date: string; item: Transaction } | { kind: 'transfer'; date: string; item: Transfer };

export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const db = useSQLiteContext(); const c = useTheme(); const walletId = Number(id);
  const [wallet, setWallet] = useState<Wallet | null>(null); const [history, setHistory] = useState<HistoryEntry[]>([]); const [loadError, setLoadError] = useState(false); const [tab, setTab] = useState<'history' | 'stats'>('history');
  const load = useCallback(() => {
    let active = true;
    Promise.all([getWallets(db), getTransactions(db, { walletId }), getTransfers(db, walletId)]).then(([rows, entries, transfers]) => {
      if (!active) return;
      const merged: HistoryEntry[] = [...entries.map((item) => ({ kind: 'transaction' as const, date: item.transaction_date, item })), ...transfers.map((item) => ({ kind: 'transfer' as const, date: item.transfer_date, item }))];
      merged.sort((a, b) => b.date.localeCompare(a.date) || b.item.created_at.localeCompare(a.item.created_at));
      setWallet(rows.find((item) => item.id === walletId) ?? null); setHistory(merged); setLoadError(false);
    }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Failed to load wallet detail', { walletId, error }); if (active) setLoadError(true); });
    return () => { active = false; };
  }, [db, walletId]);
  useFocusEffect(load);
  const remove = () => confirmDestructiveAction('Hapus kantong?', `Hapus kantong ${wallet?.name ?? ''}? Semua transaksi di dalamnya dan transfer yang melibatkan kantong ini juga akan dihapus, sehingga saldo kantong pasangannya ikut berubah.`, async () => { await deleteWallet(db, walletId); router.back(); }, (error) => { if (__DEV__) console.error('[Kantongin] Failed to delete wallet', { walletId, error }); });
  const removeTransfer = (transfer: Transfer) => confirmDestructiveAction('Hapus transfer?', `Saldo ${rupiah(transfer.amount)} akan kembali ke kantong ${transfer.from_wallet_name}.`, async () => { await deleteTransfer(db, transfer.id); load(); }, (error) => { if (__DEV__) console.error('[Kantongin] Failed to delete transfer', { id: transfer.id, error }); });

  if (!wallet) return <Screen variant="form" title="Kantong"><Text style={{ color: loadError ? c.negative : c.textSecondary }}>{loadError ? 'Detail kantong gagal dimuat. Coba buka kembali.' : 'Memuat kantong…'}</Text></Screen>;
  const progress = walletTargetProgress(wallet); const tint = walletTint(wallet);
  const month = currentPeriod();
  const monthExpenses = history.filter((e): e is Extract<HistoryEntry, { kind: 'transaction' }> => e.kind === 'transaction' && e.item.type === 'expense' && e.date.startsWith(month));
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.item.amount, 0);
  const byCategory = [...monthExpenses.reduce((map, e) => { const prev = map.get(e.item.category_id); map.set(e.item.category_id, { name: e.item.category_name, icon: e.item.category_icon, amount: (prev?.amount ?? 0) + e.item.amount, count: (prev?.count ?? 0) + 1 }); return map; }, new Map<number, { name: string; icon: string; amount: number; count: number }>()).entries()].sort((a, b) => b[1].amount - a[1].amount);
  const actions: { label: string; icon: IconName; onPress: () => void }[] = [
    { label: 'Tambah', icon: 'add', onPress: () => router.push({ pathname: '/transaction-form', params: { walletId: String(wallet.id) } }) },
    { label: 'Transfer', icon: 'transfer', onPress: () => router.push({ pathname: '/transfer-form', params: { fromWalletId: String(wallet.id) } }) },
    { label: 'Edit', icon: 'edit', onPress: () => router.push({ pathname: '/wallet-form', params: { id: String(wallet.id) } }) },
  ];

  return <Screen variant="form" title={`Kantong ${walletKindLabel[wallet.kind]}`}>
    <Panel style={{ overflow: 'hidden', paddingRight: 120, minHeight: 150 }}>
      <IconTile name={walletIcon(wallet.icon)} tint={tint} size={48} />
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '800', marginTop: 8 }}>{wallet.name}</Text>
      <Text style={{ color: c.text, fontSize: 24, fontWeight: '900', marginTop: 2 }}>{rupiah(wallet.balance ?? wallet.initial_balance)}</Text>
      {progress ? <View style={{ marginTop: 8, gap: 6 }}><Text style={{ color: wallet.kind === 'spending' && progress.ratio > 1 ? c.negative : c.textSecondary, fontSize: 11, fontWeight: '700' }}>{Math.round(progress.ratio * 100)}% dari target {rupiah(progress.target)}</Text><ProgressBar ratio={progress.ratio} tint={tint} warnOver={wallet.kind === 'spending'} /></View> : <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 6 }}>Saldo awal {rupiah(wallet.initial_balance)}</Text>}
      <MochiImage name="pocket" width={130} style={{ position: 'absolute', right: -4, bottom: -6 }} />
    </Panel>
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 }}>{actions.map((action) => <Pressable key={action.label} onPress={action.onPress} accessibilityRole="button" style={({ pressed }) => [{ alignItems: 'center', gap: 6, minWidth: 64 }, pressed && { opacity: 0.7 }]}><IconTile name={action.icon} size={46} radius={16} /><Text style={{ color: c.text, fontSize: 11, fontWeight: '600' }}>{action.label}</Text></Pressable>)}</View>
    <Segmented options={[{ value: 'history', label: 'Transaksi' }, { value: 'stats', label: 'Statistik' }]} value={tab} onChange={setTab} />
    {tab === 'history' ? (history.length ? <Panel style={{ paddingVertical: 4, paddingHorizontal: 14 }}>{history.map((entry, index) => {
      const heading = index === 0 || history[index - 1].date !== entry.date ? <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '700', marginTop: index ? 12 : 8 }}>{formatDate(entry.date, { weekday: true })}</Text> : null;
      const last = index === history.length - 1 || history[index + 1].date !== entry.date;
      if (entry.kind === 'transfer') {
        const transfer = entry.item; const incoming = transfer.to_wallet_id === walletId;
        return <View key={`tf-${transfer.id}`}>{heading}<ListRow icon="transfer" title={incoming ? `Transfer dari ${transfer.from_wallet_name}` : `Transfer ke ${transfer.to_wallet_name}`} subtitle={transfer.note || 'Transfer · ketuk untuk menghapus'} value={`${incoming ? '+' : '-'}${rupiah(transfer.amount)}`} valueColor={incoming ? c.positive : c.negative} onPress={() => removeTransfer(transfer)} accessibilityHint="Ketuk untuk menghapus transfer" last={last} /></View>;
      }
      const item = entry.item;
      return <View key={`tx-${item.id}`}>{heading}<ListRow icon={categoryIcon(item.category_icon)} title={item.note || item.category_name} subtitle={item.category_name} value={`${item.type === 'income' ? '+' : '-'}${rupiah(item.amount)}`} valueColor={item.type === 'income' ? c.positive : c.negative} onPress={() => router.push(`/transaction-detail/${item.id}`)} last={last} /></View>;
    })}</Panel> : <Panel><EmptyState title="Belum ada transaksi" message="Transaksi dan transfer kantong ini akan muncul di sini." /></Panel>)
      : <Panel style={{ paddingVertical: 4, paddingHorizontal: 14 }}>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 10 }}>Pengeluaran bulan ini</Text>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '900', marginBottom: 4 }}>{rupiah(monthTotal)}</Text>
        {byCategory.length ? byCategory.map(([categoryId, row], index) => <ListRow key={categoryId} icon={categoryIcon(row.icon)} title={row.name} subtitle={`${row.count} transaksi · ${rupiah(row.amount)}`} value={`${Math.round(row.amount / monthTotal * 100)}%`} last={index === byCategory.length - 1} />)
          : <Text style={{ color: c.textSecondary, fontSize: 12, paddingVertical: 14 }}>Belum ada pengeluaran bulan ini di kantong ini.</Text>}
      </Panel>}
    <View style={{ marginTop: 18 }}><PrimaryButton label="Hapus Kantong" icon="delete" danger onPress={remove} /></View>
  </Screen>;
}
