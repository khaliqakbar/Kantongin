import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { DateField } from '@/components/date-field';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon, categoryIcon, walletIcon } from '@/components/app-icon';
import { Choice, EmptyState, ListRow, Panel, Screen, Segmented, styles } from '@/components/finance-ui';
import { getTransactions, getWallets } from '@/database/repository';
import { formatDate, rupiah } from '@/database/format';
import type { EntryType, Transaction, Wallet } from '@/database/types';

const typeOptions: { value: 'all' | EntryType; label: string }[] = [{ value: 'all', label: 'Semua' }, { value: 'income', label: 'Pemasukan' }, { value: 'expense', label: 'Pengeluaran' }];

export default function TransactionsScreen() {
  const db = useSQLiteContext(); const c = useTheme(); const s = styles(c);
  const [filter, setFilter] = useState<'all' | EntryType>('all'); const [query, setQuery] = useState(''); const [showFilters, setShowFilters] = useState(false);
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [walletId, setWalletId] = useState<number | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]); const [wallets, setWallets] = useState<Wallet[]>([]); const [loadError, setLoadError] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([getTransactions(db, { type: filter === 'all' ? undefined : filter, query, from: from || undefined, to: to || undefined, walletId }), getWallets(db)]).then(([t, w]) => { if (active) { setTransactions(t); setWallets(w); setLoadError(false); } }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Failed to load transactions or wallets', error); if (active) setLoadError(true); });
    return () => { active = false; };
  }, [db, filter, query, from, to, walletId]));
  const groups = transactions.reduce<Record<string, Transaction[]>>((all, item) => { (all[item.transaction_date] ??= []).push(item); return all; }, {});
  const activeFilters = (walletId ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0);
  return <Screen title="Transaksi" tabBar>
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
      <View style={[s.inputBox, { flex: 1 }]}><AppIcon name="search" size={18} color={c.textSecondary} /><TextInput value={query} onChangeText={setQuery} placeholder="Cari transaksi…" placeholderTextColor={c.textSecondary} accessibilityLabel="Cari catatan atau kategori" style={s.input} /></View>
      <Pressable onPress={() => setShowFilters((v) => !v)} accessibilityRole="button" accessibilityLabel="Filter kantong dan tanggal" accessibilityState={{ expanded: showFilters }} style={{ width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: showFilters || activeFilters ? c.forest : c.surface, borderWidth: 1, borderColor: showFilters || activeFilters ? c.forest : c.border }}>
        <AppIcon name="filter" size={20} color={showFilters || activeFilters ? c.onForest : c.text} />
      </Pressable>
    </View>
    {showFilters ? <Panel style={{ marginBottom: 14 }}>
      <Text style={s.label}>Kantong</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}><Choice label="Semua kantong" selected={!walletId} onPress={() => setWalletId(undefined)} />{wallets.map((w) => <Choice key={w.id} label={w.name} icon={walletIcon(w.icon)} selected={walletId === w.id} onPress={() => setWalletId(w.id)} />)}</ScrollView>
      <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><DateField label="Dari" value={from} onChange={setFrom} optional placeholder="Semua" /></View><View style={{ flex: 1 }}><DateField label="Sampai" value={to} onChange={setTo} optional placeholder="Semua" /></View></View>
      {activeFilters ? <Pressable onPress={() => { setWalletId(undefined); setFrom(''); setTo(''); }} accessibilityRole="button"><Text style={{ color: c.sageStrong, fontSize: 12, fontWeight: '700' }}>Hapus filter</Text></Pressable> : null}
    </Panel> : null}
    <Segmented options={typeOptions} value={filter} onChange={setFilter} />
    {loadError ? <Panel><Text style={{ color: c.negative, textAlign: 'center', paddingVertical: 10 }}>Transaksi gagal dimuat. Periksa penyimpanan lokal, lalu coba ubah filter.</Text></Panel>
      : Object.keys(groups).length ? Object.entries(groups).map(([date, items]) => <View key={date} style={{ marginBottom: 14 }}>
        <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{formatDate(date, { weekday: true })}</Text>
        <Panel style={{ paddingVertical: 2, paddingHorizontal: 14 }}>{items.map((item, index) => <ListRow key={item.id} icon={categoryIcon(item.category_icon)} title={item.note || item.category_name} subtitle={`${item.category_name} · ${item.wallet_name}`} value={`${item.type === 'income' ? '+' : '-'}${rupiah(item.amount)}`} valueColor={item.type === 'income' ? c.positive : c.negative} onPress={() => router.push(`/transaction-detail/${item.id}`)} last={index === items.length - 1} />)}</Panel>
      </View>)
      : <Panel><EmptyState title={query || activeFilters || filter !== 'all' ? 'Tidak ada yang cocok' : 'Belum ada transaksi'} message={query || activeFilters || filter !== 'all' ? 'Coba ubah kata kunci atau filter.' : 'Tekan tombol + di bawah untuk mencatat transaksi pertamamu.'} /></Panel>}
  </Screen>;
}
