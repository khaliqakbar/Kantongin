import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AppTheme, MaxContentWidth } from '@/constants/theme';
import { mochi } from '@/constants/mochi';
import { useTheme } from '@/hooks/use-theme';
import { SurfaceCard } from '@/components/dashboard-ui';
import { categoryIcon, IconTile, walletIcon, walletTint, type IconName } from '@/components/app-icon';
import { EmptyState, ListRow, MochiImage, ProgressBar, SectionTitle, TabBarSpace } from '@/components/finance-ui';
import { formatDate, rupiah, todayISO } from '@/database/format';
import { getFinanceSummary, getTransactions, getWallets, walletTargetProgress } from '@/database/repository';
import { getProfilePhoto, getUserName } from '@/database/preferences';
import type { Transaction, Wallet } from '@/database/types';
import { ReceiptScanError, scanReceipt } from '@/utils/receipt-scan';
import { showMessage } from '@/utils/show-message';

export default function HomeScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [scanning, setScanning] = useState(false);
  const db = useSQLiteContext(); const c = useTheme(); const s = createStyles(c);

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([getFinanceSummary(db), getWallets(db), getTransactions(db, { limit: 5 }), getUserName(db), getProfilePhoto(db)]).then(([summaryRow, walletRows, transactionRows, userName, photoUri]) => {
      if (active) { setSummary(summaryRow); setWallets(walletRows); setTransactions(transactionRows); setName(userName); setPhoto(photoUri); setLoadError(false); }
    }).catch((error: unknown) => {
      if (__DEV__) console.error('[Kantongin] Failed to load dashboard data', error);
      if (active) setLoadError(true);
    });
    return () => { active = false; };
  }, [db]));

  const scan = async () => {
    if (scanning) return; setScanning(true);
    try {
      const draft = await scanReceipt();
      if (!draft) return;
      if (!draft.amount) showMessage('Total belum terbaca', 'Isi nominalnya manual, ya. Coba foto struk lebih dekat dan terang lain kali.');
      router.push({ pathname: '/transaction-form', params: { type: 'expense', scanned: '1', amount: draft.amount ? String(draft.amount) : undefined, date: draft.date, note: draft.note } });
    } catch (error) {
      if (error instanceof ReceiptScanError) showMessage(error.kind === 'permission' ? 'Kamera belum diizinkan' : 'Scan struk belum tersedia', error.message);
      else { if (__DEV__) console.error('[Kantongin] Receipt scan failed', error); showMessage('Struk gagal dibaca', 'Coba foto ulang, atau catat pengeluaran secara manual.'); }
    } finally { setScanning(false); }
  };

  const quickActions: { label: string; icon: IconName; onPress: () => void }[] = [
    { label: 'Pemasukan', icon: 'income', onPress: () => router.push({ pathname: '/transaction-form', params: { type: 'income' } }) },
    { label: 'Pengeluaran', icon: 'expense', onPress: () => router.push({ pathname: '/transaction-form', params: { type: 'expense' } }) },
    { label: 'Transfer', icon: 'transfer', onPress: () => router.push('/transfer-form') },
    { label: scanning ? 'Membaca…' : 'Scan Struk', icon: 'scan', onPress: scan },
  ];

  return <View style={s.root}>
    <StatusBar barStyle="light-content" />
    <ScrollView contentContainerStyle={{ paddingBottom: TabBarSpace }} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <SafeAreaView edges={['top']} style={s.heroInner}>
          <View style={s.greetingRow}>
            <Pressable onPress={() => router.navigate('/explore')} accessibilityRole="button" accessibilityLabel="Buka profil"><Image source={photo ? { uri: photo } : mochi.avatar} style={s.avatar} contentFit={photo ? 'cover' : 'contain'} /></Pressable>
            <View style={{ flex: 1,}}>
              <Text style={s.greeting} numberOfLines={1}>Hi, {name || 'Kamu'} 👋</Text>
              <Text style={s.date}>{formatDate(todayISO(), { weekday: true, fullMonth: true })}</Text>
            </View>
          </View>
          <View style={s.balanceCard}>
            <View style={s.balanceTop}>
              <Text style={s.balanceLabel}>Total Saldo</Text>
              <Pressable onPress={() => setBalanceVisible((v) => !v)} accessibilityRole="button" accessibilityLabel={balanceVisible ? 'Sembunyikan saldo' : 'Tampilkan saldo'} hitSlop={8} style={({ pressed }) => [s.eyeButton, pressed && { transform: [{ scale: 0.92 }] }]}><Image source={balanceVisible ? mochi.eyeOpen : mochi.eyeClosed} style={s.eyeImage} contentFit="contain" transition={120} /></Pressable>
            </View>
            <Text style={s.balanceValue}>{balanceVisible ? rupiah(summary.balance) : 'Rp ••••••••'}</Text>
            <View style={s.balanceFooter}>
              <Text style={s.balanceMeta}>↓ {balanceVisible ? rupiah(summary.income) : '••••'}  masuk</Text>
              <Text style={s.balanceMeta}>↑ {balanceVisible ? rupiah(summary.expense) : '••••'}  keluar</Text>
              <Text style={s.balanceMeta}>bulan ini</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <View style={s.content}>
        <SurfaceCard style={s.quickCard}>{quickActions.map((action) => <Pressable key={action.label} onPress={action.onPress} accessibilityRole="button" style={({ pressed }) => [s.quickAction, pressed && { opacity: 0.7 }]}>
          <IconTile name={action.icon} size={46} radius={16} /><Text style={s.quickLabel}>{action.label}</Text>
        </Pressable>)}</SurfaceCard>

        {loadError ? <Text style={s.error}>Data belum dapat dimuat. Periksa penyimpanan lokal lalu buka kembali halaman.</Text> : null}

        <SectionTitle title="Kantong Saya" action="Lihat Semua" onAction={() => router.navigate('/wallets')} />
        <View style={s.pocketGrid}>{wallets.slice(0, 4).map((wallet) => {
          const progress = walletTargetProgress(wallet); const tint = walletTint(wallet);
          return <Pressable key={wallet.id} onPress={() => router.push(`/wallet-detail/${wallet.id}`)} style={s.pocketCell} accessibilityRole="button">
            <SurfaceCard style={s.pocketCard}>
              <IconTile name={walletIcon(wallet.icon)} tint={tint} size={36} />
              <Text style={s.pocketName} numberOfLines={1}>{wallet.name}</Text>
              <Text style={s.pocketBalance} numberOfLines={1}>{rupiah(wallet.balance ?? wallet.initial_balance)}</Text>
              {progress ? <View style={{ marginTop: 8, gap: 5 }}><Text style={s.pocketTarget}>{Math.round(progress.ratio * 100)}% dari target</Text><ProgressBar ratio={progress.ratio} tint={tint} warnOver={wallet.kind === 'spending'} /></View> : null}
            </SurfaceCard>
          </Pressable>;
        })}</View>

        <View style={s.banner}>
          <View style={{ flex: 1 }}><Text style={s.bannerTitle}>Prioritaskan tujuan,{'\n'}bukan keinginan!</Text><Text style={s.bannerText}>Sisihkan dulu untuk tabungan sebelum belanja.</Text></View>
          <MochiImage name="banner" width={150} style={{ marginRight: -8, marginBottom: -12 }} />
        </View>

        <SectionTitle title="Transaksi Terbaru" action="Lihat Semua" onAction={() => router.navigate('/transactions')} />
        <SurfaceCard style={{ paddingHorizontal: 14, borderRadius: 20 }}>{transactions.length ? transactions.map((item, index) => <ListRow key={item.id} icon={categoryIcon(item.category_icon)} title={item.note || item.category_name} subtitle={`${item.category_name} · ${formatDate(item.transaction_date)}`} value={`${item.type === 'income' ? '+' : '-'}${rupiah(item.amount)}`} valueColor={item.type === 'income' ? c.positive : c.negative} onPress={() => router.push(`/transaction-detail/${item.id}`)} last={index === transactions.length - 1} />)
          : <EmptyState title="Belum ada transaksi" message="Tekan tombol + di bawah untuk mulai mencatat." />}</SurfaceCard>
      </View>
    </ScrollView>
  </View>;
}

function createStyles(c: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    hero: { backgroundColor: c.forestDeep, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 56 },
    heroInner: { paddingHorizontal: 20, paddingTop: 8, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
    greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    greeting: { color: c.onForest, fontSize: 22, fontWeight: '800' },
    date: { color: c.onForestMuted, fontSize: 12, marginTop: 3 },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    balanceCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
    balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    // Negative vertical margin keeps the larger Mochi from pushing the balance down.
    eyeButton: { position: 'absolute', top: -10, right: -6, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
    eyeImage: { width: 52, height: 52 },
    balanceLabel: { color: c.onForestMuted, fontSize: 13 },
    balanceValue: { color: c.onForest, fontSize: 30, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
    balanceFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    balanceMeta: { color: c.onForestMuted, fontSize: 11 },
    content: { paddingHorizontal: 20, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', marginTop: -40 },
    quickCard: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 22 },
    quickAction: { flex: 1, alignItems: 'center', gap: 7 },
    quickLabel: { color: c.text, fontSize: 11, fontWeight: '600' },
    error: { color: c.negative, fontSize: 12, marginTop: 12 },
    pocketGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    pocketCell: { width: '47%', flexGrow: 1 },
    pocketCard: { padding: 14, borderRadius: 20, minHeight: 124 },
    pocketName: { color: c.textSecondary, fontSize: 12, marginTop: 10 },
    pocketBalance: { color: c.text, fontSize: 15, fontWeight: '800', marginTop: 2 },
    pocketTarget: { color: c.textSecondary, fontSize: 10 },
    banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.softYellow, borderRadius: 22, paddingLeft: 18, paddingTop: 14, marginTop: 18, overflow: 'hidden' },
    bannerTitle: { color: c.text, fontSize: 15, fontWeight: '800', lineHeight: 20 },
    bannerText: { color: c.textSecondary, fontSize: 11, marginTop: 4, marginBottom: 14 },
  });
}
