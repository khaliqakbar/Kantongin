import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { IconTile, walletIcon, walletTint } from '@/components/app-icon';
import { EmptyState, IconButton, Panel, PrimaryButton, ProgressBar, Screen, Segmented } from '@/components/finance-ui';
import { rupiah } from '@/database/format';
import { getWallets, walletKindLabel, walletTargetProgress } from '@/database/repository';
import type { Wallet, WalletKind } from '@/database/types';

const filters: { value: WalletKind | 'all'; label: string }[] = [{ value: 'all', label: 'Semua' }, { value: 'spending', label: 'Pengeluaran' }, { value: 'saving', label: 'Tabungan' }];

export default function WalletsScreen() {
  const db = useSQLiteContext(); const c = useTheme(); const [wallets, setWallets] = useState<Wallet[]>([]); const [filter, setFilter] = useState<WalletKind | 'all'>('all'); const [loadError, setLoadError] = useState(false);
  useFocusEffect(useCallback(() => { let active = true; getWallets(db).then((rows) => { if (active) { setWallets(rows); setLoadError(false); } }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Failed to load wallets', error); if (active) setLoadError(true); }); return () => { active = false; }; }, [db]));
  const visible = filter === 'all' ? wallets : wallets.filter((wallet) => wallet.kind === filter);
  const total = visible.reduce((sum, wallet) => sum + (wallet.balance ?? wallet.initial_balance), 0);
  return <Screen title="Kantong" tabBar action={<IconButton icon="transfer" label="Transfer antar kantong" onPress={() => router.push('/transfer-form')} />}>
    <Segmented options={filters} value={filter} onChange={setFilter} />
    <Panel style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
      <View style={{ flex: 1 }}><Text style={{ color: c.textSecondary, fontSize: 12 }}>Total Kantong</Text><Text style={{ color: c.text, fontSize: 22, fontWeight: '900', marginTop: 3 }}>{rupiah(total)}</Text></View>
      <Pressable onPress={() => router.push('/wallet-form')} accessibilityRole="button" style={({ pressed }) => [{ backgroundColor: c.forest, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 }, pressed && { opacity: 0.8 }]}><Text style={{ color: c.onForest, fontSize: 12, fontWeight: '800' }}>+ Buat Kantong</Text></Pressable>
    </Panel>
    {loadError ? <Text style={{ color: c.negative, fontSize: 12, marginBottom: 12 }}>Kantong gagal dimuat. Coba buka kembali halaman.</Text> : null}
    {visible.map((wallet) => {
      const progress = walletTargetProgress(wallet); const tint = walletTint(wallet);
      return <Pressable key={wallet.id} onPress={() => router.push(`/wallet-detail/${wallet.id}`)} accessibilityRole="button" style={({ pressed }) => [{ marginBottom: 10 }, pressed && { opacity: 0.8 }]}><Panel style={{ paddingVertical: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile name={walletIcon(wallet.icon)} tint={tint} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>{wallet.name}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 3 }} numberOfLines={1}>{progress ? `${rupiah(progress.current)} / ${rupiah(progress.target)}` : walletKindLabel[wallet.kind]}</Text>
          </View>
          {progress ? <Text style={{ color: wallet.kind === 'spending' && progress.ratio > 1 ? c.negative : c.text, fontSize: 13, fontWeight: '800' }}>{Math.round(progress.ratio * 100)}%</Text> : <Text style={{ color: c.text, fontSize: 13, fontWeight: '800' }}>{rupiah(wallet.balance ?? wallet.initial_balance)}</Text>}
        </View>
        {progress ? <View style={{ marginTop: 12 }}><ProgressBar ratio={progress.ratio} tint={tint} warnOver={wallet.kind === 'spending'} /><Text style={{ color: c.textSecondary, fontSize: 10, marginTop: 6 }}>Saldo {rupiah(wallet.balance ?? wallet.initial_balance)} · {wallet.kind === 'saving' ? 'target tabungan' : 'terpakai bulan ini'}</Text></View> : null}
      </Panel></Pressable>;
    })}
    {!visible.length && !loadError ? <Panel><EmptyState title={filter === 'all' ? 'Belum ada kantong' : `Belum ada kantong ${walletKindLabel[filter].toLowerCase()}`} message="Buat kantong untuk memisahkan uang sesuai kebutuhan." action={<PrimaryButton label="Buat Kantong" onPress={() => router.push('/wallet-form')} />} /></Panel> : null}
  </Screen>;
}
