import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { categoryIcon, IconTile } from '@/components/app-icon';
import { Panel, PrimaryButton, Screen } from '@/components/finance-ui';
import { formatDate, rupiah } from '@/database/format';
import { deleteTransaction, getTransaction } from '@/database/repository';
import type { Transaction } from '@/database/types';
import { confirmDestructiveAction } from '@/utils/confirm-destructive-action';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const db = useSQLiteContext(); const c = useTheme(); const [item, setItem] = useState<Transaction | null>(null); const [loadError, setLoadError] = useState(false); const [loaded, setLoaded] = useState(false);
  useFocusEffect(useCallback(() => { let active = true; getTransaction(db, Number(id)).then((row) => { if (active) { setItem(row); setLoadError(false); setLoaded(true); } }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Failed to load transaction detail', { id, error }); if (active) { setLoadError(true); setLoaded(true); } }); return () => { active = false; }; }, [db, id]));
  const remove = () => confirmDestructiveAction('Hapus transaksi?', 'Transaksi akan dihapus dan saldo terkait akan dihitung ulang.', async () => { await deleteTransaction(db, Number(id)); router.back(); }, (error) => { if (__DEV__) console.error('[Kantongin] Failed to delete transaction', { id, error }); });
  if (!item) return <Screen variant="form" title="Detail Transaksi"><Text style={{ color: loadError ? c.negative : c.textSecondary }}>{loadError ? 'Detail transaksi gagal dimuat. Coba buka kembali.' : loaded ? 'Transaksi tidak ditemukan.' : 'Memuat…'}</Text></Screen>;
  const rows: [string, string][] = [['Kategori', item.category_name], ['Kantong', item.wallet_name], ['Jenis', item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'], ['Tanggal', formatDate(item.transaction_date, { weekday: true, fullMonth: true })], ['Catatan', item.note || '—']];
  return <Screen variant="form" title="Detail Transaksi" footer={<View style={{ gap: 8 }}><PrimaryButton label="Edit Transaksi" icon="edit" onPress={() => router.push({ pathname: '/transaction-form', params: { id: String(item.id) } })} /><PrimaryButton label="Hapus Transaksi" icon="delete" danger onPress={remove} /></View>}>
    <Panel>
      <View style={{ alignItems: 'center', paddingVertical: 14 }}>
        <IconTile name={categoryIcon(item.category_icon)} size={60} />
        <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 10 }}>{item.note || item.category_name}</Text>
        <Text style={{ color: item.type === 'income' ? c.positive : c.negative, fontSize: 28, fontWeight: '900', marginTop: 4 }}>{item.type === 'income' ? '+' : '-'}{rupiah(item.amount)}</Text>
      </View>
      {rows.map(([label, value]) => <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12, borderTopWidth: 1, borderColor: c.line }}><Text style={{ color: c.textSecondary, fontSize: 13 }}>{label}</Text><Text style={{ color: c.text, fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{value}</Text></View>)}
    </Panel>
  </Screen>;
}
